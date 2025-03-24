// src/core/entities/PlayerShipEntity.ts
import { World } from '../World';
import { Position, Velocity, Renderable, InputReceiver, Rotation } from '../components';

export function createPlayerShip(world: World): number {
  const entity = world.createEntity();

  // Add components
  world.addComponent(entity, 'Position', { x: 80, y: 0, z: 0 }); // Position far to the side to be visible
  world.addComponent(entity, 'Velocity', { x: 0, y: 0, z: 0 });
  world.addComponent(entity, 'Rotation', { x: 0, y: 0, z: 0 }); // No rotation initially
  world.addComponent(entity, 'Renderable', { 
    modelId: 'playerShip',
    scale: 2.0, // Increased size for better visibility
    color: 0x00ff00
  });
  world.addComponent(entity, 'InputReceiver', {});

  return entity;
}