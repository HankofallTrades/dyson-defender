import { World } from '../World';
import { Camera, InputReceiver, MouseLook, Position, Rotation, Velocity } from '../components';

export function createDevCamera(world: World, initialPosition: Position, initialRotation: Rotation): number {
  const entity = world.createEntity();

  // Position and velocity components
  world.addComponent(entity, 'Position', { ...initialPosition });
  world.addComponent(entity, 'Velocity', { x: 0, y: 0, z: 0 });
  world.addComponent(entity, 'Rotation', { ...initialRotation });

  // Input components for free movement
  world.addComponent(entity, 'InputReceiver', {});
  world.addComponent(entity, 'MouseLook', {
    sensitivity: 0.002, // Lower sensitivity for more precise movement
    pitchMin: -Math.PI / 2 + 0.1, // Slightly above straight down
    pitchMax: Math.PI / 2 - 0.1,  // Slightly below straight up
    yaw: initialRotation.y,
    pitch: initialRotation.x
  });

  // Camera component
  world.addComponent(entity, 'Camera', {
    offset: { x: 0, y: 0, z: 0 },
    fov: 75,
    near: 0.1,
    far: 2000
  });

  return entity;
} 