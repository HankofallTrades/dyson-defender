import * as THREE from 'three';

/**
 * Input Management System
 * 
 * Purpose:
 * Handles all input-related concerns, including keyboard and mouse input,
 * while keeping input handling separate from rendering and game logic.
 * 
 * Responsibilities:
 * - Manages keyboard input state
 * - Handles mouse movement and pointer lock
 * - Provides clean input state interface to game systems
 * - Manages input event listeners
 * 
 * This class follows the separation-of-concerns.mdc rule by keeping all input
 * handling isolated from rendering and game logic.
 */
export class InputManager {
  private static instance: InputManager | null = null;
  private container: HTMLElement;
  
  // Input state
  private inputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: false,
    boost: false,  // Added boost state for shift key
    toggleDevMode: false // Toggle for developer mode
  };
  
  private mouseState = {
    movementX: 0,
    movementY: 0,
    isPointerLocked: false
  };

  private pressedKeys: Set<string> = new Set();
  private mousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private mousePressed: boolean = false;

  // Add mobile input state
  private joystickDirection: { x: number; y: number } = { x: 0, y: 0 };
  private joystickMagnitude: number = 0;
  private isMobileFiring: boolean = false;

  private constructor(container: HTMLElement | HTMLCanvasElement) {
    this.container = container;
    this.initInputHandling();
  }

  public static getInstance(container: HTMLElement | HTMLCanvasElement): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager(container);
    } else {
      // Update the container reference if it has changed
      InputManager.instance.container = container;
      InputManager.instance.initInputHandling();
    }
    return InputManager.instance;
  }

  private initInputHandling(): void {
    // Keyboard input handling
    const keydownHandler = (event: KeyboardEvent) => {
      this.pressedKeys.add(event.code);
      switch (event.code) {
        case 'KeyW': this.inputState.forward = true; break;
        case 'KeyS': this.inputState.backward = true; break;
        case 'KeyA': this.inputState.left = true; break;
        case 'KeyD': this.inputState.right = true; break;
        case 'KeyE': this.inputState.up = true; break;
        case 'KeyQ': this.inputState.down = true; break;
        case 'Space': this.inputState.shoot = true; break;
        case 'ShiftLeft':
        case 'ShiftRight': 
          this.inputState.boost = true; 
          break;
        case 'KeyP': 
          this.inputState.toggleDevMode = true; 
          event.preventDefault();
          break;
      }
    };

    const keyupHandler = (event: KeyboardEvent) => {
      this.pressedKeys.delete(event.code);
      switch (event.code) {
        case 'KeyW': this.inputState.forward = false; break;
        case 'KeyS': this.inputState.backward = false; break;
        case 'KeyA': this.inputState.left = false; break;
        case 'KeyD': this.inputState.right = false; break;
        case 'KeyE': this.inputState.up = false; break;
        case 'KeyQ': this.inputState.down = false; break;
        case 'Space': this.inputState.shoot = false; break;
        case 'ShiftLeft':
        case 'ShiftRight': 
          this.inputState.boost = false; 
          break;
        case 'KeyP': 
          this.inputState.toggleDevMode = false; 
          event.preventDefault();
          break;
      }
    };

    window.removeEventListener('keydown', keydownHandler);
    window.removeEventListener('keyup', keyupHandler);
    window.addEventListener('keydown', keydownHandler);
    window.addEventListener('keyup', keyupHandler);

    // Mouse input handling - use mousedown for reliable interaction
    const clickHandler = (event: MouseEvent) => {
      if (!this.mouseState.isPointerLocked) {
        try {
          this.container.requestPointerLock();
        } catch (e) {
          // Silently handle errors
        }
      } else if (event.button === 0) { // Left mouse button
        this.inputState.shoot = true;
        
        // Reset shoot state after a short delay (we want it to be a single shot per click)
        setTimeout(() => {
          this.inputState.shoot = false;
        }, 100);
      }
    };
    
    this.container.removeEventListener('mousedown', clickHandler);
    this.container.addEventListener('mousedown', clickHandler);
    
    const pointerLockChangeHandler = () => {
      this.mouseState.isPointerLocked = document.pointerLockElement === this.container;
    };

    document.removeEventListener('pointerlockchange', pointerLockChangeHandler);
    document.addEventListener('pointerlockchange', pointerLockChangeHandler);

    // Mouse movement handling
    const mouseMoveHandler = (event: MouseEvent) => {
      if (this.mouseState.isPointerLocked) {
        this.mouseState.movementX = event.movementX;
        this.mouseState.movementY = event.movementY;
      }
    };

    document.removeEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mousemove', mouseMoveHandler);
  }

  public getInputState(): typeof this.inputState {
    return { ...this.inputState };
  }

  public getMouseState(): typeof this.mouseState {
    const state = { ...this.mouseState };
    // Reset movement values after reading
    this.mouseState.movementX = 0;
    this.mouseState.movementY = 0;
    return state;
  }

  /**
   * Exits pointer lock if it's currently active
   */
  public exitPointerLock(): void {
    if (document.pointerLockElement === this.container) {
      document.exitPointerLock();
    }
  }

  /**
   * Explicitly requests pointer lock on the container element
   */
  public requestPointerLock(): void {
    // Don't request pointer lock on mobile devices
    if (this.isMobileDevice()) return;

    if (this.container.requestPointerLock) {
      this.container.requestPointerLock();
    }
  }

  public dispose(): void {
    // Exit pointer lock if active
    this.exitPointerLock();
    
    // Clear singleton instance
    InputManager.instance = null;
  }

  // Add mobile input methods
  public updateJoystick(x: number, y: number, magnitude: number): void {
    // Store raw joystick values for reference
    this.joystickDirection.x = x;
    this.joystickDirection.y = y;
    this.joystickMagnitude = Math.min(magnitude, 1);
    
    // Fix threshold to be more responsive on mobile
    const threshold = 0.1; // Lower threshold for more responsive controls
    
    // Reset all directional inputs first
    this.inputState.forward = false;
    this.inputState.backward = false;
    this.inputState.left = false;
    this.inputState.right = false;
    
    // Map joystick Y-axis to forward/backward
    // Y is positive when joystick is pushed UP (away from player) = W key
    if (y > threshold) {
      this.inputState.forward = true;
    } else if (y < -threshold) {
      this.inputState.backward = true;
    }
    
    // Map joystick X-axis to left/right
    // X is positive when joystick is pushed RIGHT = D key
    // X is negative when joystick is pushed LEFT = A key
    if (x < -threshold) {
      this.inputState.left = true;
    } else if (x > threshold) {
      this.inputState.right = true;
    }
    
    console.log(`Joystick → WASD: W=${this.inputState.forward}, S=${this.inputState.backward}, A=${this.inputState.left}, D=${this.inputState.right}`);
  }

  public setMobileFiring(firing: boolean): void {
    this.isMobileFiring = firing;
  }

  public resetJoystick(): void {
    this.joystickDirection.x = 0;
    this.joystickDirection.y = 0;
    this.joystickMagnitude = 0;
    
    // Also reset the directional input states that were set by the joystick
    // But don't reset keyboard inputs if keys are still being pressed
    if (!this.pressedKeys.has('KeyW')) this.inputState.forward = false;
    if (!this.pressedKeys.has('KeyS')) this.inputState.backward = false;
    if (!this.pressedKeys.has('KeyA')) this.inputState.left = false;
    if (!this.pressedKeys.has('KeyD')) this.inputState.right = false;
  }

  // Update existing methods to incorporate mobile input
  public getMovementInput(): { x: number; y: number; magnitude: number } {
    // Check keyboard input first (digital input)
    const x = (this.inputState.right ? 1 : 0) - (this.inputState.left ? 1 : 0);
    const y = (this.inputState.forward ? 1 : 0) - (this.inputState.backward ? 1 : 0);
    
    // Calculate a vector based on keyboard inputs, clamped to magnitude 1
    if (x !== 0 || y !== 0) {
      // For keyboard, use a fixed magnitude of 1.0 (digital control)
      const magnitude = 1.0;
      
      // But if we also have joystick input, use that magnitude for analog control
      if (this.joystickMagnitude > 0) {
        return { 
          x: x, // Still use WASD direction
          y: y, // Still use WASD direction
          magnitude: this.joystickMagnitude // But use joystick magnitude for analog control
        };
      }
      
      return { x, y, magnitude };
    }
    
    // No keyboard input, check if we have joystick input (which is now mapped to WASD)
    if (this.joystickMagnitude > 0) {
      // We need to derive directional values from the input state since joystick
      // has been mapped to boolean WASD keys
      const joyX = (this.inputState.right ? 1 : 0) - (this.inputState.left ? 1 : 0);
      const joyY = (this.inputState.forward ? 1 : 0) - (this.inputState.backward ? 1 : 0);
      
      console.log(`Joystick movement: x=${joyX}, y=${joyY}, mag=${this.joystickMagnitude}`);
      
      return {
        x: joyX,
        y: joyY,
        magnitude: this.joystickMagnitude // Use joystick magnitude for analog control
      };
    }
    
    // No input at all
    return { x: 0, y: 0, magnitude: 0 };
  }

  public isFiring(): boolean {
    return this.inputState.shoot || this.isMobileFiring;
  }

  public isPressed(key: string): boolean {
    return this.pressedKeys.has(key);
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
} 