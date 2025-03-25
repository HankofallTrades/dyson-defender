import { World } from '../World';
import * as THREE from 'three';
import { Position, Renderable, Velocity, Rotation, Health, Collider, Animation, WormholeAnimationData } from '../components';
import { COLORS } from '../../constants/colors';

export function createGrunt(
  world: World,
  position: { x: number, y: number, z: number },
  targetEntity: number // The Dyson Sphere entity ID that this enemy will target
): number {
  const entity = world.createEntity();
  
  // Get target (Dyson Sphere) position for reference
  const dysonPosition = world.getComponent<Position>(targetEntity, 'Position');
  if (!dysonPosition) return entity;
  
  // Add position component - start at the specified spawn position
  world.addComponent(entity, 'Position', { 
    x: position.x, 
    y: position.y, 
    z: position.z 
  });
  
  // Add rotation component
  world.addComponent(entity, 'Rotation', { 
    x: 0, 
    y: 0, 
    z: 0 
  });
  
  // Add enemy-specific component to track target and behavior
  world.addComponent(entity, 'Enemy', {
    targetEntity: targetEntity,
    type: 'grunt',
    speed: 10, // Units per second
    damage: 10,
    attackCooldown: 2, // Seconds between attacks
    currentCooldown: 0,
    inSiegeMode: false, // Start in normal mode
    laserCooldown: 3.0, // Fire a laser every 3 seconds
    currentLaserCooldown: 0,
    canMove: true, // Enemy can move right away
    canShoot: false // Enemy can't shoot until animation completes
  });
  
  // Add health component
  world.addComponent(entity, 'Health', { 
    current: 10, 
    max: 10 
  });
  
  // Add renderable component
  const renderable = {
    modelId: 'grunt',
    scale: 0.1, // Start with a small but visible scale (will be animated by AnimationSystem)
    color: COLORS.GRUNT_BASE,
    isVisible: true // Explicitly set to true
  };
  world.addComponent(entity, 'Renderable', renderable);
  console.log(`Created grunt entity ${entity} with renderable:`, renderable);
  
  // Add collider for collision detection
  world.addComponent(entity, 'Collider', {
    type: 'sphere',
    radius: 6.0, // Increased radius from 3.0 to 6.0 (2x bigger)
    isTrigger: false,
    layer: 'enemy'
  });
  
  // Add velocity component (initialized to zero, will be set by EnemySystem)
  world.addComponent(entity, 'Velocity', { 
    x: 0, 
    y: 0, 
    z: 0 
  });

  // Add wormhole animation component
  world.addComponent(entity, 'Animation', {
    type: 'wormhole',
    progress: 0,
    duration: 5.0, // Increased to 5 seconds for better visibility
    isComplete: false,
    data: {
      targetPosition: { ...dysonPosition },
      spawnPosition: { ...position }, // Store the initial spawn position
      scale: 0,
      rotation: 0,
      opacity: 0,
      phase: 'growing'
    } as WormholeAnimationData
  });
  
  return entity;
} 