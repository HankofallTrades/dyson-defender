// src/core/systems/InputSystem.ts
import * as THREE from 'three';
import { World, System } from '../World';
import { Velocity, InputReceiver, MouseLook, Rotation, LaserCooldown } from '../components';
import { InputManager } from '../input/InputManager';
import { JoystickStateHolder } from '../input/JoystickStateHolder';
import { AimingJoystickStateHolder } from '../input/AimingJoystickStateHolder';
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
  private joystickStateHolder: JoystickStateHolder;
  private aimingJoystickStateHolder: AimingJoystickStateHolder;
  private sceneManager: SceneManager;
  private readonly BASE_SPEED = 40.0;
  private readonly JOYSTICK_SPEED_MULTIPLIER = 1.0;
  private readonly AIM_ROTATION_SPEED = Math.PI * 0.2; // Radians per second - Significantly reduced sensitivity

  constructor(world: World, sceneManager: SceneManager) {
    this.world = world;
    this.sceneManager = sceneManager;
    
    // Get the renderer DOM element for input handling
    const rendererElement = sceneManager.getRendererDomElement();
    if (!rendererElement) {
      throw new Error('Renderer DOM element not available');
    }
    this.inputManager = InputManager.getInstance(rendererElement);
    this.joystickStateHolder = JoystickStateHolder.getInstance();
    this.aimingJoystickStateHolder = AimingJoystickStateHolder.getInstance();
  }

  update(deltaTime: number): void {
    // Get keyboard/mouse input states
    const inputState = this.inputManager.getInputState();
    const mouseState = this.inputManager.getMouseState();
    
    // Get joystick state directly
    const joystick = this.joystickStateHolder;
    const aimingJoystick = this.aimingJoystickStateHolder;

    // Get all entities with InputReceiver and Velocity components
    const entities = this.world.getEntitiesWith(['InputReceiver', 'Velocity', 'Rotation']);
    
    // First, process entities with MouseLook for camera rotation
    const cameraEntities = entities.filter(entity => this.world.hasComponent(entity, 'MouseLook'));
    
    for (const entity of cameraEntities) {
      const rotation = this.world.getComponent<Rotation>(entity, 'Rotation');
      const mouseLook = this.world.getComponent<MouseLook>(entity, 'MouseLook');

      if (!rotation || !mouseLook) {
        continue;
      }

      const aimingThreshold = 0.1;
      if (aimingJoystick.active && aimingJoystick.magnitude > aimingThreshold) {
        // --- Aiming Joystick Rotation (Velocity-Based) ---
        const aimX = aimingJoystick.x;
        const aimY = aimingJoystick.y;

        // --- Yaw Control (Left/Right Rotation) ---
        // Positive X = turn right, so negate aimX to get correct direction
        const angularVelocityYaw = -aimX * this.AIM_ROTATION_SPEED;
        rotation.y += angularVelocityYaw * deltaTime;

        // --- Pitch Control (Up/Down Rotation) ---
        // Positive Y = joystick pushed up = pitch up (non-inverted)
        // Negative Y = joystick pulled down = pitch down (non-inverted)
        // Use direct aimY value for non-inverted pitch control
        const angularVelocityPitch = aimY * this.AIM_ROTATION_SPEED; // Removed negative sign
        rotation.x += angularVelocityPitch * deltaTime;

        // --- Clamp Pitch ---
        // Ensure pitch stays within the limits defined in MouseLook component
        if (mouseLook) { // Make sure mouseLook component exists for limits
          rotation.x = Math.max(mouseLook.pitchMin, Math.min(mouseLook.pitchMax, rotation.x));
        }
        
        // Keep roll level
        rotation.z = 0;

      } else if (mouseState.isPointerLocked) {
        mouseLook.yaw -= mouseState.movementX * mouseLook.sensitivity;
        mouseLook.pitch -= mouseState.movementY * mouseLook.sensitivity;
        
        mouseLook.pitch = Math.max(mouseLook.pitchMin, Math.min(mouseLook.pitchMax, mouseLook.pitch));
        
        rotation.x = mouseLook.pitch;
        rotation.y = mouseLook.yaw;
        rotation.z = 0;
      } else {
        // This block is intentionally empty now, as no rotation update occurs if neither joystick nor locked mouse is active.
      }
    }

    // Now process input for movement (combining joystick and keyboard)
    for (const entity of entities) {
      const velocity = this.world.getComponent<Velocity>(entity, 'Velocity');
      const rotation = this.world.getComponent<Rotation>(entity, 'Rotation');
      
      if (!velocity || !rotation) continue;

      // Determine input source and values
      let inputX = 0;
      let inputY = 0;
      let inputVertical = 0;
      let inputMagnitude = 0;
      let inputSource: 'joystick' | 'keyboard' | 'none' = 'none';

      const joystickThreshold = 0.05;
      if (joystick.active && joystick.magnitude > joystickThreshold) {
        // Use Joystick input
        inputSource = 'joystick';
        inputX = joystick.x;
        inputY = joystick.y;
        inputVertical = 0;
        inputMagnitude = 1.0;
      } else {
        // Use Keyboard input
        const keyX = (inputState.right ? 1 : 0) - (inputState.left ? 1 : 0);
        const keyY = (inputState.forward ? 1 : 0) - (inputState.backward ? 1 : 0);
        inputVertical = (inputState.up ? 1 : 0) - (inputState.down ? 1 : 0);

        if (keyX !== 0 || keyY !== 0 || inputVertical !== 0) {
          inputSource = 'keyboard';
          inputX = keyX;
          inputY = keyY;
          inputMagnitude = 1.0;
        } else {
          inputSource = 'none';
        }
      }

      // Calculate movement based on determined input
      if (inputSource !== 'none') {
        // Ensure Euler order matches camera ('YXZ') for consistent forward vector
        const shipEuler = new THREE.Euler(rotation.x, rotation.y, rotation.z, 'YXZ'); 
        const shipQuaternion = new THREE.Quaternion().setFromEuler(shipEuler);
        
        const worldForward = new THREE.Vector3(0, 0, -1).applyQuaternion(shipQuaternion);
        const worldRight = new THREE.Vector3(1, 0, 0).applyQuaternion(shipQuaternion);
        const worldUp = new THREE.Vector3(0, 1, 0); // Keep world up for Q/E strafing

        const finalVelocity = new THREE.Vector3(0, 0, 0);

        // Apply movement relative to ship orientation
        finalVelocity.addScaledVector(worldRight, inputX);
        finalVelocity.addScaledVector(worldForward, inputY);
        
        // Only apply world vertical movement for keyboard Q/E
        if (inputSource === 'keyboard') {
          finalVelocity.addScaledVector(worldUp, inputVertical);
        }

        const beforeLength = finalVelocity.length();
        
        if (beforeLength > 0.001) {
          finalVelocity.normalize();
          const speedMultiplier = inputSource === 'joystick' ? this.JOYSTICK_SPEED_MULTIPLIER : 1.0;
          const speed = this.BASE_SPEED * inputMagnitude * speedMultiplier;
          velocity.x = finalVelocity.x * speed;
          velocity.y = finalVelocity.y * speed;
          velocity.z = finalVelocity.z * speed;
        } else {
          velocity.x = 0; velocity.y = 0; velocity.z = 0;
        }
      } else {
        // No input, stop all movement
        velocity.x = 0; velocity.y = 0; velocity.z = 0;
      }
    }
    
    // Handle firing
    const playerEntities = this.world.getEntitiesWith(['InputReceiver', 'LaserCooldown']);
    for (const entity of playerEntities) {
      const cooldown = this.world.getComponent<LaserCooldown>(entity, 'LaserCooldown');
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