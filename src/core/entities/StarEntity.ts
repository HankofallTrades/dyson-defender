import { World } from '../World';
import { Position, Renderable, AutoRotate, Rotation } from '../components';
import { COLORS } from '../../constants/colors';

/**
 * Creates a glowing star entity at the center of the Dyson Sphere
 * that serves as the primary light source for the scene
 */
export function createCentralStar(world: World): number {
  const entity = world.createEntity();

  // Position at the center (same as Dyson Sphere)
  world.addComponent(entity, 'Position', { x: 0, y: 0, z: 0 });
  
  // Slow rotation for visual effect
  world.addComponent(entity, 'AutoRotate', { 
    speedX: 0.001, 
    speedY: 0.002, 
    speedZ: 0.001 
  });
  
  // Zero rotation initially
  world.addComponent(entity, 'Rotation', { x: 0, y: 0, z: 0 });
  
  // Add the renderable component for the star
  world.addComponent(entity, 'Renderable', { 
    modelId: 'centralStar',
    scale: 18.0, // Increased scale for better visibility while still inside the Dyson Sphere
    color: COLORS.STAR_CORE, // Use the color constant
    isVisible: true
  });

  return entity;
} 