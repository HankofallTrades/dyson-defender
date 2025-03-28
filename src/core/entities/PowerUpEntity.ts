import { World } from '../World';
import * as THREE from 'three';
import { Position } from '../components';
import { COLORS } from '../../constants/colors';

/**
 * Returns a random power-up type
 */
export function getRandomPowerUpType(): 'fireRate' | 'speed' | 'health' {
  const types = ['fireRate', 'speed', 'health'];
  const randomIndex = Math.floor(Math.random() * types.length);
  return types[randomIndex] as 'fireRate' | 'speed' | 'health';
}

/**
 * Creates a fire rate power-up entity that appears as a glowing red orb
 * When collected, doubles the player's fire rate for 3 seconds
 */
export function createFireRatePowerUp(
  world: World,
  position: Position
): number {
  const entity = world.createEntity();
  
  // Create a fresh copy of the position to avoid any reference issues
  const powerUpPosition = {
    x: position.x,
    y: position.y,
    z: position.z
  };
  
  // Add position component - use the fresh copy
  world.addComponent(entity, 'Position', powerUpPosition);
  
  // Add power-up component with lifetime property
  world.addComponent(entity, 'PowerUp', {
    type: 'fireRate',
    duration: 3.0, // Effect lasts 3 seconds when collected
    timeRemaining: 0,
    active: false,
    lifetime: 7.0 // Time before the power-up disappears if not collected
  });
  
  // Add renderable component with custom model for power-up
  world.addComponent(entity, 'Renderable', {
    modelId: 'powerUpOrb',
    scale: 3.0, // Increased from 1.0 to 3.0 to make it 3 times larger
    color: COLORS.POWERUP_FIRE_RATE // Use color constant
  });
  
  // Add auto-rotate for visual effect
  world.addComponent(entity, 'AutoRotate', {
    speedX: 0,
    speedY: 1.0, // Rotate around Y axis
    speedZ: 0
  });
  
  // Add collider component for collision detection
  world.addComponent(entity, 'Collider', {
    type: 'sphere',
    radius: 10.0, // Increased to a very large radius for easier collection
    isTrigger: true,
    layer: 'powerUp'
  });
  
  return entity;
}

/**
 * Creates a speed boost power-up entity that appears as a glowing green orb
 * When collected, increases the player's movement speed by 1.5x for 3 seconds
 */
export function createSpeedPowerUp(
  world: World,
  position: Position
): number {
  const entity = world.createEntity();
  
  // Create a fresh copy of the position to avoid any reference issues
  const powerUpPosition = {
    x: position.x,
    y: position.y,
    z: position.z
  };
  
  // Add position component - use the fresh copy
  world.addComponent(entity, 'Position', powerUpPosition);
  
  // Add power-up component with lifetime property
  world.addComponent(entity, 'PowerUp', {
    type: 'speed',
    duration: 3.0, // Effect lasts 3 seconds when collected
    timeRemaining: 0,
    active: false,
    lifetime: 7.0 // Time before the power-up disappears if not collected
  });
  
  // Add renderable component with custom model for power-up
  world.addComponent(entity, 'Renderable', {
    modelId: 'powerUpOrb',
    scale: 3.0, // Increased from 1.0 to 3.0 to make it 3 times larger
    color: COLORS.POWERUP_SPEED // Use color constant
  });
  
  // Add auto-rotate for visual effect
  world.addComponent(entity, 'AutoRotate', {
    speedX: 0,
    speedY: 1.0, // Rotate around Y axis
    speedZ: 0
  });
  
  // Add collider component for collision detection
  world.addComponent(entity, 'Collider', {
    type: 'sphere',
    radius: 10.0, // Increased to a very large radius for easier collection
    isTrigger: true,
    layer: 'powerUp'
  });
  
  return entity;
}

/**
 * Creates a health power-up entity that appears as a glowing green orb with a heart icon
 * When collected, gives the player 20 hit points
 */
export function createHealthPowerUp(
  world: World,
  position: Position
): number {
  const entity = world.createEntity();
  
  // Create a fresh copy of the position to avoid any reference issues
  const powerUpPosition = {
    x: position.x,
    y: position.y,
    z: position.z
  };
  
  // Add position component - use the fresh copy
  world.addComponent(entity, 'Position', powerUpPosition);
  
  // Add power-up component with lifetime property
  world.addComponent(entity, 'PowerUp', {
    type: 'health',
    duration: 0.1, // Almost instant effect (health is added immediately)
    timeRemaining: 0,
    active: false,
    lifetime: 7.0 // Time before the power-up disappears if not collected
  });
  
  // Add renderable component with custom model for power-up
  world.addComponent(entity, 'Renderable', {
    modelId: 'powerUpOrb',
    scale: 3.0, // Keep the same size as other power-ups
    color: COLORS.POWERUP_HEALTH // Use green color for health
  });
  
  // Add auto-rotate for visual effect
  world.addComponent(entity, 'AutoRotate', {
    speedX: 0,
    speedY: 1.0, // Rotate around Y axis
    speedZ: 0
  });
  
  // Add collider component for collision detection
  world.addComponent(entity, 'Collider', {
    type: 'sphere',
    radius: 10.0, // Increased to a very large radius for easier collection
    isTrigger: true,
    layer: 'powerUp'
  });
  
  return entity;
} 