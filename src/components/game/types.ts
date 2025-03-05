import * as THREE from 'three';

// Define the complete set of color constants
export interface Colors {
  DYSON_SPHERE: number;
  DYSON_SPHERE_EMISSIVE: number;
  CORE: number;
  CORE_EMISSIVE: number;
  CORE_GLOW: number;
  PLAYER_LASER: number;
  ENEMY_LASER: number;
  ENEMY_BASE: number;
  ENEMY_GLOW: number;
  ENEMY_EYES: number;
  ENEMY_EYES_EMISSIVE: number;
  LIGHTNING_CORE: number;
  LIGHTNING_GLOW: number;
  LIGHTNING_AURA: number;
  ENEMY_EYES_SIEGE: number;
  ENEMY_EYES_SIEGE_EMISSIVE: number;
}

export interface GameState {
  started: boolean;
  over: boolean;
  score: number;
  dysonsphereHealth: number;
  dysonsphereShield: number;
  dysonsphereMaxShield: number;
  lastHitTime: number;
  level: number;
  playerPosition: THREE.Vector3;
  playerRotation: THREE.Euler;
  pointerLocked: boolean;
  boostActive: boolean;
  boostRemaining: number;
  boostCooldown: number;
}

export interface Laser {
  mesh: THREE.Mesh;
  direction: THREE.Vector3;
}

export interface Enemy extends THREE.Group {
  userData: {
    health: number;
    speed: number;
    fireTimer: number;
    pulseDirection: number;
    pulseValue: number;
    isFiringMode: boolean;
    attackDistance: number;
    firingRange: number;  // Required property: Distance at which normal firing begins (18-22 units)
    lightning?: import('./effects/Lightning').Lightning;
  };
}

export interface KeyState {
  [key: string]: boolean;
}
