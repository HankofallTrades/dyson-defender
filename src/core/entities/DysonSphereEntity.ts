import { World } from '../World';
import type { Position, Renderable, Health, AutoRotate, Rotation, Collider, Shield } from '../components';
import { COLORS } from '../../constants/colors';

export function createDysonSphere(world: World): number {
  const entity = world.createEntity();

  // Add components
  world.addComponent(entity, 'Position', { x: 0, y: 0, z: 0 });
  world.addComponent(entity, 'Rotation', { x: 0, y: 0, z: 0 });
  
  const renderableComponent = { 
    modelId: 'dysonSphere',
    scale: 1.0,
    color: COLORS.DYSON_PRIMARY
  };
  world.addComponent(entity, 'Renderable', renderableComponent);
  
  // Add both shield and health components
  world.addComponent(entity, 'Shield', {
    current: 100,
    max: 100,
    lastHitTime: 0,
    regenDelay: 3,      // 3 seconds before regeneration starts
    regenRate: 10,      // 10 shield points per second
    isRegenerating: false
  });
  world.addComponent(entity, 'Health', { current: 500, max: 500 });
  
  world.addComponent(entity, 'AutoRotate', { speedX: 0, speedY: 0.05, speedZ: 0 });
  
  // Add collider for collision detection
  world.addComponent(entity, 'Collider', {
    type: 'sphere',
    radius: 50, // Match the radius of the Dyson Sphere model
    isTrigger: false,
    layer: 'dysonSphere'
  });

  return entity;
} 