import * as THREE from 'three';

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
    lightning?: import('./effects/Lightning').Lightning;
  };
}

export interface KeyState {
  [key: string]: boolean;
}
