// src/core/systems/InputSystem.ts
import * as THREE from 'three';
import { World, System } from '../World';
import { Velocity, InputReceiver, MouseLook, Rotation, LaserCooldown } from '../components';
import { InputManager } from '../input/InputManager';
import { JoystickStateHolder } from '../input/JoystickStateHolder';
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
  private sceneManager: SceneManager;
  private readonly BASE_SPEED = 40.0;
  private readonly JOYSTICK_SPEED_MULTIPLIER = 1.0;

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
  }

  update(deltaTime: number): void {
    // Get keyboard/mouse input states
    const inputState = this.inputManager.getInputState();
    const mouseState = this.inputManager.getMouseState();
    
    // Get joystick state directly
    const joystick = this.joystickStateHolder;

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
        inputY = -joystick.y;
        inputVertical = 0;
        inputMagnitude = 1.0;
        console.log(`[InputSystem] Using Joystick: x=${inputX.toFixed(3)}, y=${inputY.toFixed(3)}, FORCING mag=1.0 (raw mag was ${joystick.magnitude.toFixed(3)})`);
      } else {
        // Use Keyboard input
        const keyX = (inputState.right ? 1 : 0) - (inputState.left ? 1 : 0);
        const keyY = (inputState.forward ? 1 : 0) - (inputState.backward ? 1 : 0);
        inputVertical = (inputState.up ? 1 : 0) - (inputState.down ? 1 : 0);

        if (keyX !== 0 || keyY !== 0 || inputVertical !== 0) {
          inputSource = 'keyboard';
          const keyHorizontalVec = new THREE.Vector2(keyX, keyY);
          if (keyHorizontalVec.lengthSq() > 0.001) {
            keyHorizontalVec.normalize();
          }
          inputX = keyHorizontalVec.x;
          inputY = keyHorizontalVec.y;
          inputMagnitude = 1.0;
          console.log(`[InputSystem] Using Keyboard: x=${inputX.toFixed(3)}, y=${inputY.toFixed(3)}, vert=${inputVertical.toFixed(3)}`);
        } else {
          inputSource = 'none';
          // console.log(`[InputSystem] No input detected.`); // Reduce noise
        }
      }

      // Calculate movement based on determined input
      if (inputSource !== 'none') {
        // --- DIAGNOSTIC LOG --- 
        console.log(`[InputSystem] Entity ${entity}, Rotation Y: ${rotation.y.toFixed(3)}`);
        // ----------------------
        
        const shipQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotation.y, 0));
        const worldForward = new THREE.Vector3(0, 0, -1).applyQuaternion(shipQuaternion);
        const worldRight = new THREE.Vector3(1, 0, 0).applyQuaternion(shipQuaternion);
        const worldUp = new THREE.Vector3(0, 1, 0);

        // --- DIAGNOSTIC LOG --- 
        console.log(`[InputSystem] worldForward: (${worldForward.x.toFixed(2)}, ${worldForward.y.toFixed(2)}, ${worldForward.z.toFixed(2)}), worldRight: (${worldRight.x.toFixed(2)}, ${worldRight.y.toFixed(2)}, ${worldRight.z.toFixed(2)})`);
        // ----------------------

        const finalVelocity = new THREE.Vector3(0, 0, 0);

        // Apply movement relative to ship orientation
        finalVelocity.addScaledVector(worldRight, inputX);
        finalVelocity.addScaledVector(worldForward, inputY);
        
        // Only apply world vertical movement for keyboard Q/E
        if (inputSource === 'keyboard') {
          finalVelocity.addScaledVector(worldUp, inputVertical);
        }

        console.log(`[InputSystem] Processing movement. Input: x=${inputX.toFixed(3)}, y=${inputY.toFixed(3)}, vert=${inputVertical.toFixed(3)}`);
        
        const beforeLength = finalVelocity.length();
        // console.log(`[InputSystem] Final velocity before normalization: length=${beforeLength.toFixed(3)}`); // Reduce noise
        
        if (beforeLength > 0.001) {
          finalVelocity.normalize();
          const speedMultiplier = inputSource === 'joystick' ? this.JOYSTICK_SPEED_MULTIPLIER : 1.0;
          const speed = this.BASE_SPEED * inputMagnitude * speedMultiplier;
          velocity.x = finalVelocity.x * speed;
          velocity.y = finalVelocity.y * speed;
          velocity.z = finalVelocity.z * speed;
          console.log(`[Movement] Final: speed=${speed.toFixed(1)}, velocity=(${velocity.x.toFixed(2)},${velocity.y.toFixed(2)},${velocity.z.toFixed(2)})`);
        } else {
          velocity.x = 0; velocity.y = 0; velocity.z = 0;
          // console.log('[Movement] No movement - velocity zeroed due to small length'); // Reduce noise
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