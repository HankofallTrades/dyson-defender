export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Velocity {
  x: number;
  y: number;
  z: number;
}

export interface Renderable {
  modelId: string;  // Identifier for the model to render
  scale: number;    // Scale of the model
  color: number;    // Color in hex format
}

export interface AutoRotate {
  speedX: number;
  speedY: number;
  speedZ: number;
}

export interface Rotation {
  x: number;
  y: number;
  z: number;
}

export interface Health {
  current: number;
  max: number;
}

export interface Shield {
  current: number;
  max: number;
}

export interface InputReceiver {
  // Marker component; could add data like control scheme later
}

export interface Transform {
  position: Position;
  rotation: Rotation;
  scale: number;
}

export interface Camera {
  offset: Position;  // Offset from the parent entity (ship)
  fov: number;      // Field of view
  near: number;     // Near clipping plane
  far: number;      // Far clipping plane
}

export interface MouseLook {
  sensitivity: number;  // Mouse movement sensitivity
  pitchMin: number;     // Minimum pitch angle (looking up)
  pitchMax: number;     // Maximum pitch angle (looking down)
  yaw: number;         // Current yaw angle (left/right)
  pitch: number;       // Current pitch angle (up/down)
}

export interface CameraMount {
  parentEntity: number;  // ID of the entity this camera is mounted to
}

export interface Projectile {
  speed: number;
  damage: number;
  lifetime: number;  // How long the projectile exists in seconds
  timeAlive: number; // Current time the projectile has been alive
  ownerEntity: number; // ID of the entity that created this projectile
}

export interface LaserCooldown {
  current: number;  // Current cooldown time in seconds
  max: number;      // Maximum cooldown time in seconds
  canFire: boolean; // Whether the entity can fire
}

export interface Collider {
  type: string;     // 'sphere' or 'box'
  radius?: number;  // For sphere colliders
  width?: number;   // For box colliders
  height?: number;  // For box colliders
  depth?: number;   // For box colliders
  isTrigger: boolean; // Whether this is a trigger collider (doesn't cause physical response)
  layer: string;    // Collision layer (e.g., 'player', 'enemy', 'projectile')
}

export interface Enemy {
  targetEntity: number; // Entity ID of the target (usually Dyson Sphere)
  type: string;         // Type of enemy ('squidAlien', etc.)
  speed: number;        // Movement speed
  damage: number;       // Damage dealt on collision with target
  attackCooldown: number; // Time between attacks in seconds
  currentCooldown: number; // Current cooldown timer
  inSiegeMode: boolean;   // Whether enemy is in siege mode (attacking Dyson Sphere)
  laserCooldown: number;  // Cooldown for laser shots in seconds
  currentLaserCooldown: number; // Current laser cooldown timer
}

export interface WaveInfo {
  currentWave: number;
  enemiesRemaining: number;
  totalEnemies: number;
  nextWaveTimer: number;
  isActive: boolean;
}

// UI-related components
export interface UIDisplay {
  visible: boolean;
}

export interface HealthDisplay {
  entity: number;  // Reference to the entity whose health we're displaying
}

export interface ScoreDisplay {
  score: number;
}

export interface MessageDisplay {
  message: string;
  duration: number;  // How long to display the message
  timeRemaining: number;
}

export interface DysonSphereStatus {
  shieldPercentage: number;
  healthPercentage: number;
  criticalThreshold: number;  // Percentage at which to show warning
}

export interface DamageEffect {
  active: boolean;       // Whether the effect is currently active
  duration: number;      // How long the effect should last in seconds
  intensity: number;     // Intensity of the effect (0-1)
  timeRemaining: number; // Time left for the effect
}

// Game state UI components
export interface GameStateDisplay {
  currentState: 'not_started' | 'playing' | 'paused' | 'game_over';
}

export interface GameOverStats {
  finalScore: number;
  survivalTime: number;
  enemiesDefeated: number;
}

export interface Reticle {
  visible: boolean;     // Whether the reticle is currently visible
  style: string;        // Style of reticle (e.g., 'default', 'sniper', 'lock-on')
  size: number;         // Size of the reticle (1 is default)
  color: string;        // Color of the reticle (hex or CSS color)
  pulsating: boolean;   // Whether the reticle should pulsate
}

export interface FloatingScore {
  value: number;         // Score value to display
  lifetime: number;      // How long it should live in seconds
  timeRemaining: number; // Time left before it disappears
  color: string;         // Color of the text
  initialPosition: {     // Initial world position where the enemy was destroyed
    x: number;
    y: number;
    z: number;
  };
  opacity: number;       // Current opacity for fade-out effect
}

// Boost component for player ship
export interface Boost {
  active: boolean;       // Whether boost is currently active
  remaining: number;     // Remaining boost time in seconds (max 3 seconds)
  maxTime: number;       // Maximum boost time (3 seconds)
  cooldown: number;      // Cooldown time remaining (5 seconds when depleted)
  speedMultiplier: number; // Speed multiplier when boost is active (1.75)
}
