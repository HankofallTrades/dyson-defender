import { World } from '../World';
import * as THREE from 'three';
import { Position, Renderable, Velocity, Rotation, Health, Collider } from '../components';
import { COLORS } from '../../constants/colors';

export function createGrunt(
  world: World,
  position: { x: number, y: number, z: number },
  targetEntity: number // The Dyson Sphere entity ID that this enemy will target
): number {
  const entity = world.createEntity();
  
  // Add position component
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
    currentLaserCooldown: 0
  });
  
  // Add health component
  world.addComponent(entity, 'Health', { 
    current: 10, 
    max: 10 
  });
  
  // Add renderable component
  world.addComponent(entity, 'Renderable', { 
    modelId: 'grunt',
    scale: 6.0, // Increased scale from 3.0 to 6.0 (2x bigger)
    color: COLORS.GRUNT_BASE
  });
  
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
  
  return entity;
} 