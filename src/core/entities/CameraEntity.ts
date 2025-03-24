import { World } from '../World';
import { Camera, CameraMount, Position } from '../components';

export function createCamera(world: World, parentEntity: number): number {
  const entity = world.createEntity();

  // Add camera components
  world.addComponent(entity, 'Camera', {
    offset: { x: 0, y: 0, z: 0 }, // Position camera at the ship's center for first-person view
    fov: 75,
    near: 0.1,
    far: 1000
  });

  world.addComponent(entity, 'CameraMount', {
    parentEntity: parentEntity
  });

  return entity;
} 