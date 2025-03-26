import { World } from '../World';
import * as THREE from 'three';
import { Position, Animation, WormholeAnimationData } from '../components';

/**
 * Creates a wormhole entity that will animate independently from any enemy
 * The wormhole goes through growing, stable, and shrinking phases over its lifetime
 * 
 * @param world - The ECS world
 * @param position - Position where the wormhole will appear
 * @param targetEntity - Entity that the wormhole is targeting (usually the Dyson Sphere)
 * @returns The entity ID of the created wormhole
 */
export function createWormhole(
  world: World,
  position: { x: number, y: number, z: number },
  targetEntity: number
): number {
  const entity = world.createEntity();
  
  // Get target (Dyson Sphere) position for reference
  const targetPosition = world.getComponent<Position>(targetEntity, 'Position');
  if (!targetPosition) return entity;
  
  // Add position component - fixed at the spawn location
  world.addComponent(entity, 'Position', { 
    x: position.x, 
    y: position.y, 
    z: position.z 
  });
  
  // Add wormhole animation component
  world.addComponent(entity, 'Animation', {
    type: 'wormhole',
    progress: 0,
    duration: 5.0, // 5 seconds for the full animation cycle
    isComplete: false,
    data: {
      targetPosition: { ...targetPosition },
      spawnPosition: { ...position },
      scale: 0,
      rotation: 0,
      opacity: 0,
      phase: 'growing'
    } as WormholeAnimationData
  });
  
  return entity;
} 