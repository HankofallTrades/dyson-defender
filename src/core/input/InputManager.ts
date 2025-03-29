import * as THREE from 'three';

/**
 * Input Management System (Keyboard/Mouse ONLY)
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
  
  // Input state (Keyboard/Mouse)
  private inputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: false,
    boost: false,
    toggleDevMode: false
  };
  
  private mouseState = {
    movementX: 0,
    movementY: 0,
    isPointerLocked: false
  };

  private pressedKeys: Set<string> = new Set();
  
  // NO joystick state here anymore
  
  // Add back mobile firing controls
  private isMobileFiring: boolean = false;
  private isMobileBoosting: boolean = false;

  private constructor(container: HTMLElement | HTMLCanvasElement) {
    this.container = container;
    this.initInputHandling();
  }

  public static getInstance(container: HTMLElement | HTMLCanvasElement): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager(container);
    } else {
      if (InputManager.instance.container !== container) {
         InputManager.instance.container = container;
         // Avoid calling this again if listeners are on window/document
         // this.initInputHandling(); 
      }
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
        case 'ShiftLeft': case 'ShiftRight': this.inputState.boost = true; break;
        case 'KeyP': this.inputState.toggleDevMode = true; event.preventDefault(); break;
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
        case 'ShiftLeft': case 'ShiftRight': this.inputState.boost = false; break;
        case 'KeyP': this.inputState.toggleDevMode = false; event.preventDefault(); break;
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

  // isFiring now checks BOTH keyboard/mouse AND mobile firing state
  public isFiring(): boolean {
    return this.inputState.shoot || this.isMobileFiring;
  }

  // Added method to check combined boost state
  public isBoosting(): boolean {
    return this.inputState.boost || this.isMobileBoosting;
  }

  public isPressed(key: string): boolean {
    return this.pressedKeys.has(key);
  }

  // isMobileDevice remains the same
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  public setMobileFiring(firing: boolean): void {
    this.isMobileFiring = firing;
  }

  public setMobileBoosting(boosting: boolean): void {
    this.isMobileBoosting = boosting;
  }
} 