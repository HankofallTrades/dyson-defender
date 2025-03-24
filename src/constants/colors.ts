// src/constants/colors.ts
// Centralized color definitions for the game

export const COLORS = {
  // Environment colors
  SPACE_BACKGROUND: 0x000011,
  
  // Player colors
  PLAYER_BASE: 0x00ff00,
  PLAYER_ACCENT: 0x88ff88,
  
  // Enemy colors - Grunt (formerly squid alien)
  GRUNT_BASE: 0x6600cc, // Deep purple for the main body and tentacles
  GRUNT_GLOW: 0x9900ff, // Brighter purple for the outer glow effect
  GRUNT_EYES: 0x33ff00, // Bright green for the eyes
  GRUNT_EYES_EMISSIVE: 0x116600, // Darker green for the eye emissive glow
  GRUNT_EYES_SIEGE: 0xff0000, // Pure red for eyes in siege mode
  GRUNT_EYES_SIEGE_EMISSIVE: 0xff0000, // Bright red glow for eyes in siege mode
  
  // Projectile colors
  LASER_GREEN: 0x00ff00,
  
  // Dyson sphere colors
  DYSON_PRIMARY: 0x3388ff,
  DYSON_SECONDARY: 0x0055aa,
  DYSON_EMISSIVE: 0x112244,
  
  // UI colors
  UI_TEXT: 0xffffff,
  UI_HEALTH: 0x00ff00,
  UI_WARNING: 0xff0000
}; 