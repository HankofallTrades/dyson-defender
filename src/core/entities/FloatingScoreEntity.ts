import { World } from '../World';
import { Position } from '../components';

/**
 * Creates a floating score entity at the specified position
 * 
 * @param world The World instance
 * @param position The 3D position where the entity will be created
 * @param value The score value to display
 * @param color Optional color for the score text (defaults to purple)
 * @returns The entity ID
 */
export function createFloatingScore(
  world: World, 
  position: Position, 
  value: number, 
  color: string = '#ff00ff'
): number {
  const entity = world.createEntity();
  
  // Add position component (for tracking in 3D space)
  world.addComponent(entity, 'Position', { 
    x: position.x,
    y: position.y,
    z: position.z
  });
  
  // Add the floating score component
  world.addComponent(entity, 'FloatingScore', {
    value,
    lifetime: 1.5,  // 1.5 seconds lifetime
    timeRemaining: 1.5,
    color,
    initialPosition: {
      x: position.x,
      y: position.y,
      z: position.z
    },
    opacity: 1.0
  });
  
  return entity;
} 