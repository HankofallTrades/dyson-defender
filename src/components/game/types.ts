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
  level: number;
  currentWave: number;
  totalEnemiesInWave: number;
  enemiesRemainingInWave: number;
  waveCooldown: boolean;
  waveCooldownTimer: number;
  waveActive: boolean;
  dysonsphereHealth: number;
  dysonsphereShield: number;
  dysonsphereMaxShield: number;
  playerHealth: number;
  lastHitTime: number;
  playerPosition?: THREE.Vector3;
  playerRotation?: THREE.Euler;
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
    // Animation properties
    isExploding?: boolean;
    explosionStartTime?: number;
    explosionDuration?: number;
    originalScale?: THREE.Vector3;
  };
}

export interface KeyState {
  [key: string]: boolean;
}

export interface Explosion {
  update: () => void;
  addToScene: (scene: THREE.Scene) => void;
  removeFromScene: () => void;
  isFinished: () => boolean;
}
