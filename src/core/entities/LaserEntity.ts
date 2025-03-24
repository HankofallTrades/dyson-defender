import { World } from '../World';
import * as THREE from 'three';

export function createLaser(
  world: World,
  scene: THREE.Scene,
  position: { x: number, y: number, z: number },
  direction: { x: number, y: number, z: number }
) {
  const entity = world.createEntity();
  
  // Add position component
  world.addComponent(entity, 'Position', { 
    x: position.x, 
    y: position.y, 
    z: position.z 
  });
  
  // Add velocity component (based on direction)
  const laserSpeed = 200; // Units per second - doubled for faster projectiles
  const normalizedDir = new THREE.Vector3(direction.x, direction.y, direction.z).normalize();
  
  world.addComponent(entity, 'Velocity', { 
    x: normalizedDir.x * laserSpeed, 
    y: normalizedDir.y * laserSpeed, 
    z: normalizedDir.z * laserSpeed 
  });
  
  // Add rotation component (aligned with direction)
  // Calculate rotation to face direction
  const euler = new THREE.Euler();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1), // Default forward
    normalizedDir // Target direction
  );
  euler.setFromQuaternion(quaternion);
  
  world.addComponent(entity, 'Rotation', { 
    x: euler.x, 
    y: euler.y, 
    z: euler.z 
  });
  
  // Add renderable component
  world.addComponent(entity, 'Renderable', {
    modelId: 'laser',
    scale: 0.5,
    color: 0x00ff00 // Green color for lasers
  });
  
  // Add projectile component
  world.addComponent(entity, 'Projectile', {
    speed: laserSpeed,
    damage: 10,
    lifetime: 6, // 6 seconds lifetime - doubled to allow lasers to travel further
    timeAlive: 0
  });
  
  return entity;
} 