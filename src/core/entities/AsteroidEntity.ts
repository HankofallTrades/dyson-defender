import { World } from '../World';
import * as THREE from 'three';
import type { Position, Renderable, Velocity, Rotation, Collider, Enemy, Health, HealthBarComponent } from '../components';
import { COLORS } from '../../constants/colors';

export function createAsteroid(
  world: World,
  position: { x: number, y: number, z: number },
  targetEntity: number // The Dyson Sphere entity ID that this asteroid will target
): number {
  const entity = world.createEntity();
  
  // Get target (Dyson Sphere) position for reference
  const dysonPosition = world.getComponent<Position>(targetEntity, 'Position');
  if (!dysonPosition) return entity;
  
  // Calculate direction toward the Dyson Sphere
  const direction = new THREE.Vector3(
    dysonPosition.x - position.x,
    dysonPosition.y - position.y,
    dysonPosition.z - position.z
  ).normalize();
  
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
  
  // Add auto-rotate component for a slow tumbling effect
  world.addComponent(entity, 'AutoRotate', {
    speedX: 0.1 + Math.random() * 0.2, // Random rotation speed
    speedY: 0.1 + Math.random() * 0.2,
    speedZ: 0.1 + Math.random() * 0.2
  });
  
  // Add enemy-specific component to track target and behavior
  world.addComponent(entity, 'Enemy', {
    targetEntity: targetEntity,
    type: 'asteroid',
    speed: 40, // Units per second - faster than WarpRaider
    damage: 100, // Instant game over if it hits the Dyson Sphere
    attackCooldown: 0, // Instant damage on collision
    currentCooldown: 0,
    inSiegeMode: false, // Always moving
    laserCooldown: 0, // No lasers
    currentLaserCooldown: 0,
    canMove: true,
    canShoot: false // Asteroid doesn't shoot
  });
  
  // Add health component - more health than other enemies
  world.addComponent(entity, 'Health', { 
    current: 50, 
    max: 50 
  });
  
  // Add health bar component that only shows when damaged
  world.addComponent(entity, 'HealthBarComponent', {
    entity: entity,
    offsetY: 10, // Position above the entity
    width: 50,
    height: 5,
    visible: false, // Start invisible
    showWhenDamaged: true // Only show when damaged
  });
  
  // Add renderable component 
  const renderable = {
    modelId: 'asteroid',
    scale: 8.0, // Larger than other enemies
    color: COLORS.GRUNT_BASE || 0x888888, // Gray color if COLORS.GRUNT_BASE isn't defined
    isVisible: true
  };
  world.addComponent(entity, 'Renderable', renderable);
  
  // Add collider for collision detection
  world.addComponent(entity, 'Collider', {
    type: 'sphere',
    radius: 8.0, // Large collision radius
    isTrigger: false,
    layer: 'enemy'
  });
  
  // Add velocity component
  world.addComponent(entity, 'Velocity', { 
    x: direction.x * 40, // Set initial velocity toward the Dyson Sphere
    y: direction.y * 40,
    z: direction.z * 40
  });
  
  return entity;
}

export function disposeAsteroid(world: World, entity: number) {
  world.removeEntity(entity);
} 