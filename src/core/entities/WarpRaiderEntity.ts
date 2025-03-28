import { World } from '../World';
import * as THREE from 'three';
import type { Position, Renderable, Velocity, Rotation, Health, Collider, Animation, Enemy, HealthBarComponent } from '../components';
import { COLORS } from '../../constants/colors';

export function createWarpRaider(
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
    type: 'warpRaider',
    speed: 25, // Units per second - faster than grunt (which is 10)
    damage: 15, // More damage than grunt (which is 10)
    attackCooldown: 1.5, // Seconds between attacks - faster than grunt
    currentCooldown: 0,
    inSiegeMode: false, // Start in normal mode
    laserCooldown: 2.0, // Fire a laser every 2 seconds - faster than grunt
    currentLaserCooldown: 0,
    canMove: true, 
    canShoot: false // Enemy can't shoot until the shooting timer completes
  });
  
  // Add health component - 30 hit points as specified
  world.addComponent(entity, 'Health', { 
    current: 30, 
    max: 30 
  });
  
  // Add health bar component that only shows when damaged
  world.addComponent(entity, 'HealthBarComponent', {
    entity: entity,
    offsetY: 7, // Position above the entity
    width: 40,
    height: 4,
    visible: false, // Start invisible
    showWhenDamaged: true // Only show when damaged
  });
  
  // Add renderable component with initial small scale
  const renderable = {
    modelId: 'warpRaider',
    scale: 0.1, // Start with a small scale
    color: COLORS.WARP_RAIDER_BASE,
    isVisible: true
  };
  world.addComponent(entity, 'Renderable', renderable);
  
  // Add collider for collision detection
  world.addComponent(entity, 'Collider', {
    type: 'sphere',
    radius: 5.0, // Slightly smaller than grunt for a sleeker profile
    isTrigger: false,
    layer: 'enemy'
  });
  
  // Add velocity component (initialized to zero, will be set by EnemySystem)
  world.addComponent(entity, 'Velocity', { 
    x: 0, 
    y: 0, 
    z: 0 
  });
  
  // Add a growth animation component that matches the wormhole's timing
  world.addComponent(entity, 'Animation', {
    type: 'growth',
    progress: 0,
    duration: 3.5, // 70% of the 5-second wormhole animation (growing + stable phases)
    isComplete: false,
    data: {
      finalScale: 5.0 // Target scale to grow to
    }
  });
  
  return entity;
}

export function disposeWarpRaider(world: World, entity: number) {
  world.removeEntity(entity);
} 