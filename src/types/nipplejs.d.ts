declare module 'nipplejs' {
  export interface JoystickManagerOptions {
    zone: HTMLElement;
    mode?: 'static' | 'dynamic' | 'semi';
    position?: { top: string | number; left: string | number };
    color?: string;
    size?: number;
    threshold?: number;
    fadeTime?: number;
    multitouch?: boolean;
    maxNumberOfNipples?: number;
    dataOnly?: boolean;
    restJoystick?: boolean | 'auto';
    restOpacity?: number;
    lockX?: boolean;
    lockY?: boolean;
    dynamicPage?: boolean;
  }

  export interface JoystickData {
    angle: {
      degree: number;
      radian: number;
    };
    direction: {
      x: 'left' | 'right' | null;
      y: 'up' | 'down' | null;
      angle: string;
    };
    distance: number;
    force: number;
    identifier: number;
    position: {
      x: number;
      y: number;
    };
    pressure: number;
  }

  export interface EventData {
    type: string;
    target: any;
  }

  export interface JoystickInstance {
    on(event: string, handler: (data: JoystickData) => void): void;
    off(event: string, handler: (data: JoystickData) => void): void;
    destroy(): void;
    removeOn(type: string): void;
    removeAllListeners(): void;
  }

  export interface JoystickManager {
    get(identifier?: number): JoystickInstance;
    destroy(): void;
  }

  export default function create(options: JoystickManagerOptions): JoystickManager;
} 