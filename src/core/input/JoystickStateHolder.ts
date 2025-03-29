/**
 * A simple singleton class to hold the current state of the virtual joystick.
 * This allows the UI (MobileControls) to directly update the state,
 * and the InputSystem to directly read it, bypassing potential timing
 * issues with InputManager buffering.
 */
export class JoystickStateHolder {
  private static instance: JoystickStateHolder | null = null;

  public x: number = 0;
  public y: number = 0;
  public magnitude: number = 0;
  public active: boolean = false;

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
    this.x = x;
    this.y = y; // Assuming y is already mapped correctly (e.g., negative = forward)
    this.magnitude = Math.min(magnitude, 1);
    this.active = true;
     console.log(`[JoystickStateHolder] State updated: x=${this.x.toFixed(3)}, y=${this.y.toFixed(3)}, mag=${this.magnitude.toFixed(3)}, active=${this.active}`);
  }

  /**
   * Resets the joystick state. Called directly from UI event handlers.
   */
  public reset(): void {
    if (!this.active) return; // Avoid redundant logging if already reset
    this.x = 0;
    this.y = 0;
    this.magnitude = 0;
    this.active = false;
    console.log(`[JoystickStateHolder] State reset.`);
  }
} 