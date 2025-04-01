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
  isVisible?: boolean; // Whether the model is visible (optional, defaults to true)
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
  lastHitTime: number;     // Time when shield was last hit
  regenDelay: number;      // Delay before shield starts regenerating (in seconds)
  regenRate: number;       // Shield points regenerated per second
  isRegenerating: boolean; // Whether the shield is currently regenerating
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
  readyToFire?: boolean; // Whether the entity is ready to fire (set by InputSystem)
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
  canMove: boolean;     // Whether the enemy can move
  canShoot: boolean;    // Whether the enemy can shoot
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
  wavesCompleted: number;
}

export interface Reticle {
  visible: boolean;     // Whether the reticle is currently visible
  style: string;        // Style of reticle (e.g., 'default', 'sniper', 'lock-on')
  size: number;         // Size of the reticle (1 is default)
  color: string;        // Color of the reticle (hex or CSS color)
  pulsating: boolean;   // Whether the reticle should pulsate
}

export interface Radar {
  active: boolean;             // Whether the radar is currently active
  range: number;               // Maximum detection range
  refreshRate: number;         // How often to update in seconds
  timeUntilRefresh: number;    // Time remaining until next refresh
  trackedEntities: Array<{     // Array of entities currently being tracked
    entityId: number;          // The entity ID
    entityType: string;        // Type of entity ('grunt', 'bomber', 'asteroid', 'warpRaider', 'shieldGuardian', 'dysonSphere')
    distance: number;          // Distance from player to entity
    direction: {               // Direction vector from player to entity (normalized)
      x: number;               // Used for calculating radar blip position
      y: number;
      z: number;
    };
    threatLevel: number;       // Threat level (0-1) - for color intensity
  }>;
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

export interface ScreenPosition {
  x: number;
  y: number;
  isOnScreen: boolean; // Whether the entity is currently projected onto the screen viewport
}

// Boost component for player ship
export interface Boost {
  active: boolean;       // Whether boost is currently active
  remaining: number;     // Remaining boost time in seconds (max 3 seconds)
  maxTime: number;       // Maximum boost time (3 seconds)
  cooldown: number;      // Cooldown time remaining (5 seconds when depleted)
  speedMultiplier: number; // Speed multiplier when boost is active (1.75)
}

// Animation components
export interface Animation {
  type: 'wormhole' | 'explosion' | 'lightning' | 'growth';
  progress: number;      // 0 to 1
  duration: number;      // Total duration in seconds
  isComplete: boolean;   // Whether the animation has completed
  data: AnimationData;   // Type-specific animation data
}

// Type-specific animation data
export interface WormholeAnimationData {
  targetPosition: Position;  // Position the wormhole is targeting (usually Dyson sphere)
  spawnPosition: Position;   // Fixed position where the wormhole was spawned
  scale: number;            // Current scale of the wormhole effect
  rotation: number;         // Current rotation angle
  opacity: number;          // Current opacity
  phase: 'growing' | 'stable' | 'shrinking';  // Current animation phase
}

export interface ExplosionAnimationData {
  radius: number;           // Current explosion radius
  intensity: number;        // Current explosion intensity
  particleCount: number;    // Number of particles to emit
}

export interface LightningAnimationData {
  startPosition: Position;  // Start point of lightning
  endPosition: Position;    // End point of lightning
  arcCount: number;        // Number of lightning arcs
  intensity: number;       // Current lightning intensity
}

export interface GrowthAnimationData {
  finalScale: number;      // Target scale to grow to
}

// Union type for animation data
export type AnimationData = WormholeAnimationData | ExplosionAnimationData | LightningAnimationData | GrowthAnimationData;

export interface ShieldComponent {
  currentShield: number;  // Current hits remaining
  maxShield: number;      // Maximum hits
}

export interface ShieldBubbleComponent {
  guardian: number;       // Entity ID of the Shield Guardian
  radius: number;         // Radius of the shield
}

export interface ShieldBarComponent {
  entity: number;         // Entity to track for shield display
  offsetY: number;        // Vertical offset from entity position
  width: number;          // Width of the shield bar
  height: number;         // Height of the shield bar
  visible: boolean;       // Whether the shield bar is visible
}

export interface HealthBarComponent {
  entity: number;         // Entity to track for health display
  offsetY: number;        // Vertical offset from entity position
  width: number;          // Width of the health bar
  height: number;         // Height of the health bar
  visible: boolean;       // Whether the health bar is visible
  showWhenDamaged: boolean; // Only show health bar when entity is damaged
}

export interface Portal {
  type: 'entry' | 'exit';  // Whether this is an entry or exit portal
  label: string;          // Display label for the portal
  targetUrl: string;      // URL to redirect to when entering the portal
  isActive: boolean;      // Whether the portal is currently active
  radius: number;         // Radius of the portal's trigger area
  rotationSpeed: number;  // Speed at which the portal rotates
}

// Developer mode component for debugging and inspection
export interface DevMode {
  isActive: boolean;        // Whether dev mode is active
  originalCameraEntity: number; // Reference to the original camera entity
  devCameraEntity: number;  // Reference to the dev camera entity
}

export interface PowerUp {
  type: 'fireRate' | 'speed' | 'health';
  duration: number;
  timeRemaining: number;
  active: boolean;
  lifetime?: number; // Only used for uncollected power-ups
}

export interface ActivePowerUps {
  effects: {
    [key: string]: {
      timeRemaining: number;
      duration: number;
    }
  }
}

export interface StarfieldBackground {
  starCount: number;       // Number of stars
  galaxyCount: number;     // Number of distant galaxies 
  starSize: number;        // Size multiplier for stars
  galaxySize: number;      // Size multiplier for galaxies
  starfieldRadius: number; // Radius of the spherical starfield
  rotationSpeed: number;   // How fast the starfield rotates
}
