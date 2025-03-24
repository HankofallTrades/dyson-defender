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
    shoot: false
  };
  
  private mouseState = {
    movementX: 0,
    movementY: 0,
    isPointerLocked: false
  };

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

  public dispose(): void {
    // Exit pointer lock if active
    if (document.pointerLockElement === this.container) {
      document.exitPointerLock();
    }
    
    // Clear singleton instance
    InputManager.instance = null;
  }
} 