// Game settings
export const INITIAL_HEALTH = 500;
export const INITIAL_SHIELD = 200;
export const POINTS_PER_KILL = 10;
export const POINTS_PER_LEVEL = 100;

// Enemy settings
export const BASE_ENEMY_SPEED = 0.03;
export const SPEED_INCREASE_PER_LEVEL = 0.005;
export const BASE_SPAWN_TIME = 3;
export const MIN_SPAWN_TIME = 0.5;

// Weapon settings
export const LASER_SPEED = 0.5;
export const ENEMY_LASER_SPEED = 0.3;

// Damage values
export const ENEMY_CRASH_DAMAGE = 20;
export const ENEMY_LASER_DAMAGE = 5;

// Game boundaries
export const MAX_DISTANCE_FROM_CENTER = 40;
export const ENEMY_SPAWN_DISTANCE = 20;

// Colors
export const COLORS = {
  DYSON_SPHERE: 0x0088ff,
  DYSON_SPHERE_EMISSIVE: 0x0044aa,
  CORE: 0xffffff,
  CORE_EMISSIVE: 0xccffff,
  CORE_GLOW: 0xaaddff,
  PLAYER_LASER: 0x00ff00,
  ENEMY_LASER: 0xff6600,
  ENEMY_BASE: 0x6600cc,
  ENEMY_GLOW: 0x9900ff,
  ENEMY_EYES: 0x33ff00,
  ENEMY_EYES_EMISSIVE: 0x116600,
  LIGHTNING_CORE: 0xff00ff, // Brighter purple
  LIGHTNING_GLOW: 0xff66ff, // Lighter purple for glow
  LIGHTNING_BRANCH: 0xff99ff, // Even lighter for branches
};

// Lightning settings
export const LIGHTNING_SEGMENTS = 8; // Fewer segments for more dramatic zaps
export const LIGHTNING_BRANCH_PROBABILITY = 0.4; // More branches
export const LIGHTNING_UPDATE_INTERVAL = 50; // ms - Faster updates
export const LIGHTNING_WIDTH = 0.1; // Thicker lines
export const LIGHTNING_LENGTH = 3; // Longer branches
