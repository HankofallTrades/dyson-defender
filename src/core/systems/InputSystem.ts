// src/core/systems/InputSystem.ts
import * as THREE from 'three';
import { World, System } from '../World';
import { Velocity, InputReceiver, MouseLook, Rotation } from '../components';
import { InputManager } from '../input/InputManager';
import { SceneManager } from '../../rendering/SceneManager';

/**
 * Input System
 * 
 * Purpose:
 * Processes input state and updates entity components accordingly.
 * Handles keyboard input for movement and mouse input for rotation.
 * 
 * Responsibilities:
 * - Processes keyboard input for movement
 * - Processes mouse input for rotation
 * - Updates entity velocities and rotations based on input
 * - Maintains input state consistency
 */
export class InputSystem implements System {
  private world: World;
  private inputManager: InputManager;
  private sceneManager: SceneManager;
  private readonly BASE_SPEED = 20.0; // Base movement speed

  constructor(world: World, sceneManager: SceneManager) {
    this.world = world;
    this.sceneManager = sceneManager;
    
    // Get the renderer DOM element for input handling
    const rendererElement = sceneManager.getRendererDomElement();
    this.inputManager = InputManager.getInstance(rendererElement);
  }

  update(deltaTime: number): void {
    // Get input states
    const inputState = this.inputManager.getInputState();
    const mouseState = this.inputManager.getMouseState();

    // Get all entities with InputReceiver and Velocity components
    const entities = this.world.getEntitiesWith(['InputReceiver', 'Velocity', 'Rotation', 'MouseLook']);

    for (const entity of entities) {
      const velocity = this.world.getComponent<Velocity>(entity, 'Velocity');
      const rotation = this.world.getComponent<Rotation>(entity, 'Rotation');
      const mouseLook = this.world.getComponent<MouseLook>(entity, 'MouseLook');

      if (!velocity || !rotation || !mouseLook) continue;

      // Handle mouse movement for rotation only
      if (mouseState.isPointerLocked) {
        // Horizontal mouse movement (left/right) updates yaw (looking left/right)
        mouseLook.yaw -= mouseState.movementX * mouseLook.sensitivity;
        
        // Vertical mouse movement (up/down) updates pitch (looking up/down)
        mouseLook.pitch -= mouseState.movementY * mouseLook.sensitivity;
        
        // Constrain pitch to prevent camera flipping
        mouseLook.pitch = Math.max(mouseLook.pitchMin, Math.min(mouseLook.pitchMax, mouseLook.pitch));
        
        // Apply rotation to entity
        rotation.x = mouseLook.pitch;
        rotation.y = mouseLook.yaw;
        rotation.z = 0;
      }

      // Calculate movement direction based on input
      const direction = new THREE.Vector3(0, 0, 0);
      
      // Create forward vector based on where the camera is looking (includes pitch and yaw)
      const forward = new THREE.Vector3(0, 0, -1);
      const pitchMatrix = new THREE.Matrix4().makeRotationX(rotation.x);
      const yawMatrix = new THREE.Matrix4().makeRotationY(rotation.y);
      
      // Apply both rotations to get the true forward direction
      forward.applyMatrix4(pitchMatrix);
      forward.applyMatrix4(yawMatrix);
      
      // Apply right vector (perpendicular to forward, no pitch)
      const right = new THREE.Vector3(1, 0, 0);
      right.applyMatrix4(yawMatrix); // Only apply yaw to right vector
      
      // Set up/down direction directly
      const up = new THREE.Vector3(0, 1, 0);

      // Apply inputs to direction
      if (inputState.forward) {
        direction.add(forward);
      }
      if (inputState.backward) {
        direction.sub(forward);
      }
      if (inputState.right) {
        direction.add(right);
      }
      if (inputState.left) {
        direction.sub(right);
      }
      if (inputState.up) {
        direction.add(up);
      }
      if (inputState.down) {
        direction.sub(up);
      }

      // If moving, normalize direction to maintain consistent speed
      if (direction.lengthSq() > 0) {
        direction.normalize();
        
        // Apply velocity
        velocity.x = direction.x * this.BASE_SPEED;
        velocity.y = direction.y * this.BASE_SPEED;
        velocity.z = direction.z * this.BASE_SPEED;
      } else {
        // No input, stop all movement
        velocity.x = 0;
        velocity.y = 0;
        velocity.z = 0;
      }
    }
  }
}