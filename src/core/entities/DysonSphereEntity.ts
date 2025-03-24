import { World } from '../World';
import { Position, Renderable, Health, AutoRotate, Rotation, Collider } from '../components';

export function createDysonSphere(world: World): number {
  const entity = world.createEntity();
  console.log('Creating Dyson Sphere entity:', entity);

  world.addComponent(entity, 'Position', { x: 0, y: 0, z: 0 });
  world.addComponent(entity, 'Rotation', { x: 0, y: 0, z: 0 });
  world.addComponent(entity, 'Renderable', { 
    modelId: 'dysonSphere',
    scale: 1.0,
    color: 0x3388ff
  });
  world.addComponent(entity, 'Health', { current: 100, max: 100 });
  world.addComponent(entity, 'AutoRotate', { speedX: 0, speedY: 0.05, speedZ: 0 });
  
  // Add collider for collision detection
  world.addComponent(entity, 'Collider', {
    type: 'sphere',
    radius: 50, // Match the radius of the Dyson Sphere model
    isTrigger: false,
    layer: 'dysonSphere'
  });

  console.log('Dyson Sphere components added');
  return entity;
} 