// Game settings
export const INITIAL_HEALTH = 500;
export const INITIAL_SHIELD = 200;
export const INITIAL_PLAYER_HEALTH = 100;
export const POINTS_PER_KILL = 10;
export const POINTS_PER_LEVEL = 100;

// Wave-based level system
export const ENEMIES_PER_WAVE_BASE = 5; // Base number of enemies in wave 1 (5 for level 1)
export const ENEMIES_PER_WAVE_INCREASE = 3; // Additional enemies per wave
export const WAVE_COOLDOWN_DURATION = 3000; // 3 seconds between waves
export const MAX_ACTIVE_ENEMIES = 5; // Maximum enemies on screen at once

// Player settings
export const PLAYER_BASE_SPEED = 0.2;
export const PLAYER_BOOST_MULTIPLIER = 1.5; // 50% speed increase
export const PLAYER_MAX_BOOST_TIME = 1.0; // 1 second
export const PLAYER_BOOST_COOLDOWN = 3.0; // 3 seconds

// Enemy settings
export const BASE_ENEMY_SPEED = 0.06;
export const SPEED_INCREASE_PER_LEVEL = 0.015;
export const BASE_SPAWN_TIME = 3;
export const MIN_SPAWN_TIME = 0.4;
export const SPAWN_TIME_DECREASE_PER_LEVEL = 0.4;
export const BASE_ENEMY_HEALTH = 1;
export const ENEMY_HEALTH_INCREASE_LEVEL_THRESHOLD = 3; // Enemies get +1 health every 3 levels

// Weapon settings
export const LASER_SPEED = 1.0;
export const ENEMY_LASER_SPEED = 1.2;

// Damage values
export const ENEMY_CRASH_DAMAGE = 20;
export const ENEMY_LASER_DAMAGE = 5;
export const PLAYER_LASER_DAMAGE = 10;

// Game boundaries
export const MAX_DISTANCE_FROM_CENTER = 60;
export const ENEMY_SPAWN_DISTANCE = 25;

// Colors
import { Colors } from './types';

export const COLORS: Colors = {
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
  LIGHTNING_CORE: 0xff00ff, // Bright magenta core
  LIGHTNING_GLOW: 0x9900ff, // Deep purple glow
  LIGHTNING_AURA: 0x00ffff, // Cyan outer aura
  ENEMY_EYES_SIEGE: 0xff0000, // Pure red eyes
  ENEMY_EYES_SIEGE_EMISSIVE: 0xff0000, // Bright red glow
};

// Lightning settings
export const LIGHTNING_SEGMENTS = 8; // Fewer segments for more dramatic zaps
export const LIGHTNING_BRANCH_PROBABILITY = 0.4; // More branches
export const LIGHTNING_UPDATE_INTERVAL = 50; // ms - Faster updates
export const LIGHTNING_WIDTH = 0.2; // Much thicker lines for better visibility
export const LIGHTNING_LENGTH = 3; // Longer branches
