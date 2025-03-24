// src/core/entities/PlayerShipEntity.ts
import { World } from '../World';
import { Position, Velocity, Renderable, InputReceiver, Rotation, MouseLook, LaserCooldown, Collider, Health } from '../components';
import { COLORS } from '../../constants/colors';

export function createPlayerShip(world: World): number {
  const entity = world.createEntity();

  // Add components
  world.addComponent(entity, 'Position', { x: 80, y: 0, z: 0 }); // Position far to the side to be visible
  world.addComponent(entity, 'Velocity', { x: 0, y: 0, z: 0 });
  
  // Set initial rotation to face the Dyson Sphere at origin
  // Since we're at (80,0,0) and the Dyson Sphere is at (0,0,0),
  // we need to rotate 90 degrees (PI/2) around the Y axis to face it
  world.addComponent(entity, 'Rotation', { x: 0, y: Math.PI/2, z: 0 });
  
  world.addComponent(entity, 'Renderable', { 
    modelId: 'playerShip',
    scale: 2.0, // Increased size for better visibility
    color: COLORS.PLAYER_BASE
  });
  world.addComponent(entity, 'InputReceiver', {});
  world.addComponent(entity, 'MouseLook', {
    sensitivity: 0.005, // Reduced sensitivity for more precise control
    pitchMin: -Math.PI / 2.5, // Limit looking up
    pitchMax: Math.PI / 2.5,  // Limit looking down
    yaw: Math.PI/2,    // Initial yaw should match the ship's rotation      
    pitch: 0
  });
  
  // Add health component
  world.addComponent(entity, 'Health', {
    current: 100,
    max: 100
  });
  
  // Add weapon cooldown component
  world.addComponent(entity, 'LaserCooldown', {
    current: 0,
    max: 0.25, // 4 shots per second
    canFire: true
  });
  
  // Add collider for collision detection
  world.addComponent(entity, 'Collider', {
    type: 'box',
    width: 6.0, // Match the ship's model dimensions
    height: 1.5,
    depth: 4.0,
    isTrigger: false,
    layer: 'player'
  });

  return entity;
}