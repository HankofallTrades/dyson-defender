/**
 * A simple singleton class to hold the current state of the virtual joystick.
 * This allows the UI (MobileControls) to directly update the state,
 * and the InputSystem to directly read it, bypassing potential timing
 * issues with InputManager buffering.
 */
export class JoystickStateHolder {
  private static instance: JoystickStateHolder | null = null;

  private _x: number = 0;
  private _y: number = 0;
  private _magnitude: number = 0;
  private _active: boolean = false;

  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get magnitude(): number { return this._magnitude; }
  get active(): boolean { return this._active; }

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): JoystickStateHolder {
    if (!JoystickStateHolder.instance) {
      JoystickStateHolder.instance = new JoystickStateHolder();
    }
    return JoystickStateHolder.instance;
  }

  /**
   * Updates the joystick state. Called directly from UI event handlers.
   */
  public update(x: number, y: number, magnitude: number): void {
    this._x = x;
    this._y = y; // Assuming y is already mapped correctly (e.g., negative = forward)
    this._magnitude = Math.min(magnitude, 1);
    this._active = true;
  }

  /**
   * Resets the joystick state. Called directly from UI event handlers.
   */
  public reset(): void {
    if (!this._active) return; // Avoid redundant logging if already reset
    this._x = 0;
    this._y = 0;
    this._magnitude = 0;
    this._active = false;
  }
} 