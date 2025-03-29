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

  private constructor(container: HTMLElement) {
    this.container = container;
    this.initInputHandling();
  }

  public static getInstance(container: HTMLElement): InputManager {
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
      switch (event.key.toLowerCase()) {
        case 'w': this.inputState.forward = true; break;
        case 's': this.inputState.backward = true; break;
        case 'a': this.inputState.left = true; break;
        case 'd': this.inputState.right = true; break;
        case 'e': this.inputState.up = true; break;
        case 'q': this.inputState.down = true; break;
        case ' ': this.inputState.shoot = true; break; // Space bar for shooting
        case 'shift': this.inputState.boost = true; break; // Shift for boost
        case 'p': 
          this.inputState.toggleDevMode = true; 
          event.preventDefault();
          break;
      }
    };

    const keyupHandler = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 'w': this.inputState.forward = false; break;
        case 's': this.inputState.backward = false; break;
        case 'a': this.inputState.left = false; break;
        case 'd': this.inputState.right = false; break;
        case 'e': this.inputState.up = false; break;
        case 'q': this.inputState.down = false; break;
        case ' ': this.inputState.shoot = false; break; // Space bar for shooting
        case 'shift': this.inputState.boost = false; break; // Shift for boost
        case 'p': 
          this.inputState.toggleDevMode = false; 
          // Prevent browser's default behavior
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
    if (!this.mouseState.isPointerLocked) {
      try {
        this.container.requestPointerLock();
      } catch (e) {
        console.warn('Failed to request pointer lock:', e);
      }
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
    this.joystickDirection.x = x;
    this.joystickDirection.y = y;
    this.joystickMagnitude = Math.min(magnitude, 1); // Normalize to max of 1
  }

  public setMobileFiring(firing: boolean): void {
    this.isMobileFiring = firing;
  }

  public resetJoystick(): void {
    this.joystickDirection.x = 0;
    this.joystickDirection.y = 0;
    this.joystickMagnitude = 0;
  }

  // Update existing methods to incorporate mobile input
  public getMovementInput(): { x: number; y: number; magnitude: number } {
    // Check keyboard input first
    const x = (this.isPressed('KeyD') ? 1 : 0) - (this.isPressed('KeyA') ? 1 : 0);
    const y = (this.isPressed('KeyW') ? 1 : 0) - (this.isPressed('KeyS') ? 1 : 0);
    
    // If there's keyboard input, use that
    if (x !== 0 || y !== 0) {
      const magnitude = Math.min(Math.sqrt(x * x + y * y), 1);
      return { x, y, magnitude };
    }
    
    // Otherwise use joystick input
    return {
      x: this.joystickDirection.x,
      y: this.joystickDirection.y,
      magnitude: this.joystickMagnitude
    };
  }

  public isFiring(): boolean {
    return this.mousePressed || this.isMobileFiring;
  }

  public isPressed(key: string): boolean {
    return this.pressedKeys.has(key);
  }
} 