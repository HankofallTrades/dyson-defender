// src/constants/colors.ts
// Centralized color definitions for the game

export const COLORS = {
  // Environment colors
  SPACE_BACKGROUND: 0x000011,
  
  // Player colors
  PLAYER_BASE: 0x00ff00,
  PLAYER_ACCENT: 0x88ff88,
  
  // Central star colors
  STAR_CORE: 0xffeecc, // Warmer yellow-white for the star's core
  STAR_GLOW: 0xfff2dd, // Slightly warmer for the glow effect
  STAR_LIGHT: 0xfff5dd, // Warmer light color
  
  // Enemy colors - Grunt (formerly squid alien)
  GRUNT_BASE: 0x6600cc, // Deep purple for the main body and tentacles
  GRUNT_GLOW: 0x9900ff, // Brighter purple for the outer glow effect
  GRUNT_EYES: 0x33ff00, // Bright green for the eyes
  GRUNT_EYES_EMISSIVE: 0x116600, // Darker green for the eye emissive glow
  GRUNT_EYES_SIEGE: 0xff0000, // Pure red for eyes in siege mode
  GRUNT_EYES_SIEGE_EMISSIVE: 0xff0000, // Bright red glow for eyes in siege mode
  
  // Shield Guardian colors
  SHIELD_GUARDIAN_CRYSTAL: 0x00ccff, // Bright blue crystal body (changed from teal/cyan)
  SHIELD_GUARDIAN_SHARD: 0x66ddff,   // Lighter blue for crystal shards
  SHIELD_GUARDIAN_CORE: 0xffffff,    // Bright white core
  SHIELD_BUBBLE: 0x00ffff,           // Vibrant cyan for shield bubble (more electric blue)
  SHIELD_BUBBLE_INNER: 0x66ffff,     // Brighter cyan inner glow
  
  // Warp Raider colors
  WARP_RAIDER_BASE: 0x1a0026, // Very dark purple for the main body
  WARP_RAIDER_ACCENT: 0x4d0066, // Darker purple for accents
  WARP_RAIDER_ENGINE: 0x00ffff, // Bright cyan for engine glow
  WARP_RAIDER_LASER: 0x00ffff, // Bright cyan for its laser
  WARP_RAIDER_DETAIL: 0x330044, // Mid-dark purple for surface details
  
  // Projectile colors
  LASER_GREEN: 0x00ff00,
  
  // Dyson sphere colors
  DYSON_PRIMARY: 0x3388ff,
  DYSON_SECONDARY: 0x0055aa,
  DYSON_EMISSIVE: 0x112244,
  
  // Power-up colors
  POWERUP_FIRE_RATE: 0xff0000, // Bright red for fire rate power-up
  POWERUP_FIRE_RATE_GLOW: 0xff4444, // Lighter red for glow effect
  POWERUP_SPEED: 0xffff00, // Bright yellow for speed boost power-up (changed from green)
  POWERUP_SPEED_GLOW: 0xffff44, // Lighter yellow for glow effect (changed from green)
  POWERUP_HEALTH: 0x00ff00, // Bright green for health power-up
  POWERUP_HEALTH_GLOW: 0x44ff44, // Lighter green for glow effect
  
  // UI colors
  UI_TEXT: 0xffffff,
  UI_HEALTH: 0x00ff00,
  UI_WARNING: 0xff0000,
  
  // Wormhole colors
  WORMHOLE_RING: 0x9900ff,    // Bright purple for the outer ring
  WORMHOLE_SPIRAL: 0x6600cc,  // Deep purple for the spiral effect
  WORMHOLE_GLOW: 0xaa00ff     // Medium purple for the glow effect
}; 