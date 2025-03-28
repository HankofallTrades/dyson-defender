import { World } from '../World';
import * as THREE from 'three';
import { Position, Renderable, Velocity, Rotation, Health, Collider, Animation } from '../components';
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
    canShoot: false // Enemy can't shoot until the shooting timer completes
  });
  
  // Add health component
  world.addComponent(entity, 'Health', { 
    current: 10, 
    max: 10 
  });
  
  // Add renderable component with initial small scale
  const renderable = {
    modelId: 'grunt',
    scale: 0.1, // Start with a small scale as before
    color: COLORS.GRUNT_BASE,
    isVisible: true
  };
  world.addComponent(entity, 'Renderable', renderable);
  
  // Add collider for collision detection (keep full-size for gameplay consistency)
  world.addComponent(entity, 'Collider', {
    type: 'sphere',
    radius: 6.0,
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
  // The wormhole is in growing phase (0-30%) and stable phase (30-70%)
  // We'll make the enemy fully grown by the time the wormhole is stable (70%)
  world.addComponent(entity, 'Animation', {
    type: 'growth',
    progress: 0,
    duration: 3.5, // 70% of the 5-second wormhole animation (growing + stable phases)
    isComplete: false,
    data: {
      finalScale: 6.0 // Target scale to grow to
    }
  });
  
  return entity;
} 