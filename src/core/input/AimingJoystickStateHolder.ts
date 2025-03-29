/**
 * A simple singleton class to hold the current state of the virtual aiming joystick.
 * This allows the UI (MobileControls) to directly update the state,
 * and the InputSystem to directly read it.
 */
export class AimingJoystickStateHolder {
  private static instance: AimingJoystickStateHolder | null = null;

  private _x: number = 0;
  private _y: number = 0;
  private _magnitude: number = 0; // Represents how far the stick is pushed (0 to 1)
  private _active: boolean = false; // Is the joystick currently being touched?

  // Getters for read-only access
  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get magnitude(): number { return this._magnitude; }
  get active(): boolean { return this._active; }

  private constructor() {
    // Private constructor ensures singleton pattern
  }

  /**
   * Gets the singleton instance of the AimingJoystickStateHolder.
   */
  public static getInstance(): AimingJoystickStateHolder {
    if (!AimingJoystickStateHolder.instance) {
      AimingJoystickStateHolder.instance = new AimingJoystickStateHolder();
    }
    return AimingJoystickStateHolder.instance;
  }

  /**
   * Updates the aiming joystick state. Called directly from UI event handlers.
   * @param x - Horizontal position (-1 to 1)
   * @param y - Vertical position (-1 to 1)
   * @param magnitude - Distance from center (0 to 1)
   */
  public update(x: number, y: number, magnitude: number): void {
    this._x = x;
    this._y = y; // Raw Y value, interpretation (e.g., for pitch) happens in InputSystem
    this._magnitude = Math.min(magnitude, 1); // Clamp magnitude to 1
    this._active = true;
    // console.log(`Aiming Update: x=${this._x.toFixed(2)}, y=${this._y.toFixed(2)}, mag=${this._magnitude.toFixed(2)}`);
  }

  /**
   * Resets the aiming joystick state to inactive/neutral.
   * Called directly from UI event handlers when touch ends.
   */
  public reset(): void {
    // Avoid redundant resets if already inactive
    if (!this._active) return;

    this._x = 0;
    this._y = 0;
    this._magnitude = 0;
    this._active = false;
    // console.log('Aiming Reset');
  }
} 