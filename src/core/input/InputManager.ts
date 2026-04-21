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
  private isInitialized = false;
  
  // Input state (Keyboard/Mouse)
  private inputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: false,
    secondaryFire: false,
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

  private readonly keydownHandler = (event: KeyboardEvent) => {
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

  private readonly keyupHandler = (event: KeyboardEvent) => {
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

  private readonly mouseDownHandler = (event: MouseEvent) => {
    if (this.mouseState.isPointerLocked) {
      if (event.button === 0) {
        this.inputState.shoot = true;
      } else if (event.button === 2) {
        this.inputState.secondaryFire = true;
        event.preventDefault();
      }
    }
  };

  private readonly mouseUpHandler = (event: MouseEvent) => {
    if (event.button === 0) {
      this.inputState.shoot = false;
    } else if (event.button === 2) {
      this.inputState.secondaryFire = false;
      event.preventDefault();
    }
  };

  private readonly contextMenuHandler = (event: MouseEvent) => {
    if (this.mouseState.isPointerLocked) {
      event.preventDefault();
    }
  };

  private readonly pointerLockChangeHandler = () => {
    this.mouseState.isPointerLocked = document.pointerLockElement === this.container;
    if (!this.mouseState.isPointerLocked) {
      this.inputState.shoot = false;
      this.inputState.secondaryFire = false;
    }
  };

  private readonly mouseMoveHandler = (event: MouseEvent) => {
    if (this.mouseState.isPointerLocked) {
      this.mouseState.movementX = event.movementX;
      this.mouseState.movementY = event.movementY;
    }
  };

  private constructor(container: HTMLElement | HTMLCanvasElement) {
    this.container = container;
    this.initInputHandling();
  }

  public static getInstance(container: HTMLElement | HTMLCanvasElement): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager(container);
    } else {
      if (InputManager.instance.container !== container) {
         InputManager.instance.rebindContainer(container);
      }
    }
    return InputManager.instance;
  }

  private initInputHandling(): void {
    if (this.isInitialized) {
      return;
    }

    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
    document.addEventListener('pointerlockchange', this.pointerLockChangeHandler);
    document.addEventListener('mousemove', this.mouseMoveHandler);
    this.bindContainerListeners();
    this.isInitialized = true;
  }

  private bindContainerListeners(): void {
    this.container.addEventListener('mousedown', this.mouseDownHandler);
    this.container.addEventListener('mouseup', this.mouseUpHandler);
    this.container.addEventListener('contextmenu', this.contextMenuHandler);
  }

  private unbindContainerListeners(): void {
    this.container.removeEventListener('mousedown', this.mouseDownHandler);
    this.container.removeEventListener('mouseup', this.mouseUpHandler);
    this.container.removeEventListener('contextmenu', this.contextMenuHandler);
  }

  private rebindContainer(container: HTMLElement | HTMLCanvasElement): void {
    this.unbindContainerListeners();
    this.container = container;
    this.bindContainerListeners();
    this.pointerLockChangeHandler();
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
    const isLocked = document.pointerLockElement === this.container;
    console.log(`[InputManager] Exit pointer lock requested. Current lock state: ${isLocked ? 'locked' : 'unlocked'}`);
    
    if (isLocked) {
      try {
        document.exitPointerLock();
        console.log('[InputManager] Pointer lock exit requested successfully');
      } catch (e) {
        console.error('[InputManager] Error exiting pointer lock:', e);
      }
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
    this.unbindContainerListeners();
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);
    document.removeEventListener('pointerlockchange', this.pointerLockChangeHandler);
    document.removeEventListener('mousemove', this.mouseMoveHandler);
    this.pressedKeys.clear();
    this.inputState.shoot = false;
    this.inputState.secondaryFire = false;
    this.inputState.boost = false;
    
    // Clear singleton instance
    InputManager.instance = null;
    this.isInitialized = false;
  }

  // isFiring now checks BOTH keyboard/mouse AND mobile firing state
  public isFiring(): boolean {
    return this.inputState.shoot || this.isMobileFiring;
  }

  public isSecondaryFiring(): boolean {
    return this.inputState.secondaryFire;
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
