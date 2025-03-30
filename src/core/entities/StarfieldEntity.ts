import { World } from '../World';
import { Position, Rotation, Renderable, StarfieldBackground, AutoRotate } from '../components';

/**
 * Creates a starfield background entity with stars and galaxies
 * This creates a distant background that rotates slowly for visual effect
 */
export function createStarfieldBackground(world: World): number {
  const entity = world.createEntity();

  // Position at origin, will be rendered as a large sphere around the scene
  world.addComponent(entity, 'Position', { x: 0, y: 0, z: 0 });
  
  // Very slow auto-rotation for visual effect
  world.addComponent(entity, 'AutoRotate', { 
    speedX: 0.0, 
    speedY: 0.0001, 
    speedZ: 0.0 
  });
  
  // Zero rotation initially
  world.addComponent(entity, 'Rotation', { x: 0, y: 0, z: 0 });
  
  // Add the renderable component that identifies this as a starfield
  world.addComponent(entity, 'Renderable', { 
    modelId: 'starfield',
    scale: 1.0,
    color: 0xFFFFFF  // Base color (stars will have their own colors)
  });
  
  // Add the starfield component with configuration
  world.addComponent(entity, 'StarfieldBackground', {
    starCount: 2500,      // Slightly more stars
    galaxyCount: 7,      // Reduced number of galaxies (half of previous 25)
    starSize: 1.0,
    galaxySize: 150.0,    // Larger galaxies
    starfieldRadius: 900.0, // Very large radius to appear distant
    rotationSpeed: 0.0001
  });

  return entity;
} 