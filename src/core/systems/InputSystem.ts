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
  private readonly BASE_SPEED = 40.0; // Base movement speed (doubled from 20.0)

  constructor(world: World, sceneManager: SceneManager) {
    this.world = world;
    this.sceneManager = sceneManager;
    
    // Get the renderer DOM element for input handling
    const rendererElement = sceneManager.getRendererDomElement();
    if (!rendererElement) {
      throw new Error('Renderer DOM element not available');
    }
    this.inputManager = InputManager.getInstance(rendererElement);
  }

  update(deltaTime: number): void {
    // Get input states
    const inputState = this.inputManager.getInputState();
    const mouseState = this.inputManager.getMouseState();
    
    // Get movement input (handles both keyboard and joystick)
    const movementInput = this.inputManager.getMovementInput();

    // Get all entities with InputReceiver and Velocity components
    const entities = this.world.getEntitiesWith(['InputReceiver', 'Velocity', 'Rotation']);
    
    // First, process entities with MouseLook for camera rotation
    const cameraEntities = entities.filter(entity => this.world.hasComponent(entity, 'MouseLook'));
    
    for (const entity of cameraEntities) {
      const rotation = this.world.getComponent<Rotation>(entity, 'Rotation');
      const mouseLook = this.world.getComponent<MouseLook>(entity, 'MouseLook');

      if (!rotation || !mouseLook) continue;

      // Handle mouse movement for rotation
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
    }

    // Now process input for movement
    for (const entity of entities) {
      const velocity = this.world.getComponent<Velocity>(entity, 'Velocity');
      const rotation = this.world.getComponent<Rotation>(entity, 'Rotation');
      
      if (!velocity || !rotation) continue;

      // Create forward vector based on where the camera is looking (includes pitch and yaw)
      const forward = new THREE.Vector3(0, 0, -1);
      const pitchMatrix = new THREE.Matrix4().makeRotationX(rotation.x);
      const yawMatrix = new THREE.Matrix4().makeRotationY(rotation.y);
      
      // Apply both rotations to get the true forward direction
      forward.applyMatrix4(pitchMatrix);
      forward.applyMatrix4(yawMatrix);
      
      // Create a forward vector for movement that only uses yaw (no pitch)
      // This keeps joystick movement in the horizontal plane regardless of where player is looking
      const forwardMovement = new THREE.Vector3(0, 0, -1);
      forwardMovement.applyMatrix4(yawMatrix); // Only apply yaw rotation
      
      // Apply right vector (perpendicular to forward, no pitch)
      const right = new THREE.Vector3(1, 0, 0);
      right.applyMatrix4(yawMatrix); // Only apply yaw to right vector
      
      // Set up/down direction directly
      const up = new THREE.Vector3(0, 1, 0);

      // Calculate direction based on input
      const direction = new THREE.Vector3(0, 0, 0);
      
      // Get input state (now includes both keyboard and joystick mapped to WASD)
      if (inputState.forward) {
        direction.add(forwardMovement);
      }
      if (inputState.backward) {
        direction.sub(forwardMovement);
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
        
        // Apply velocity with magnitude for analog control
        // Use joystick magnitude if available, otherwise use full speed for keyboard
        const speedFactor = movementInput.magnitude > 0 ? 
          movementInput.magnitude : 1.0;
        
        velocity.x = direction.x * this.BASE_SPEED * speedFactor;
        velocity.y = direction.y * this.BASE_SPEED * speedFactor;
        velocity.z = direction.z * this.BASE_SPEED * speedFactor;
      } else {
        // No input, stop all movement
        velocity.x = 0;
        velocity.y = 0;
        velocity.z = 0;
      }
    }
    
    // Handle firing
    const playerEntities = this.world.getEntitiesWith(['InputReceiver', 'LaserCooldown']);
    for (const entity of playerEntities) {
      const cooldown = this.world.getComponent<any>(entity, 'LaserCooldown');
      if (!cooldown) continue;
      
      // Check firing input from keyboard, mouse, or mobile
      if (this.inputManager.isFiring() && cooldown.current <= 0) {
        // Handle firing logic...
        // This is likely handled in WeaponSystem, but we mark it as ready to fire
        cooldown.readyToFire = true;
      }
    }
  }
}