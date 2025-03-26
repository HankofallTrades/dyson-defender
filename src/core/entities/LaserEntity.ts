import { World } from '../World';
import * as THREE from 'three';
import { COLORS } from '../../constants/colors';

export function createLaser(
  world: World,
  scene: THREE.Scene,
  position: { x: number, y: number, z: number },
  direction: { x: number, y: number, z: number },
  ownerEntity: number, // Entity that created this laser
  color: number = COLORS.LASER_GREEN // Optional color parameter with default green
) {
  const entity = world.createEntity();
  
  // Add position component
  world.addComponent(entity, 'Position', { 
    x: position.x, 
    y: position.y, 
    z: position.z 
  });
  
  // Add velocity component (based on direction)
  const laserSpeed = 400; // Units per second - doubled for faster projectiles
  const normalizedDir = new THREE.Vector3(direction.x, direction.y, direction.z).normalize();
  
  world.addComponent(entity, 'Velocity', { 
    x: normalizedDir.x * laserSpeed, 
    y: normalizedDir.y * laserSpeed, 
    z: normalizedDir.z * laserSpeed 
  });
  
  // Add rotation component (aligned with direction of travel)
  // Create a temporary object and use lookAt to get the proper rotation
  const tempObj = new THREE.Object3D();
  tempObj.position.set(position.x, position.y, position.z);
  
  // Calculate a point in front of the starting position, along the direction vector
  const targetPoint = new THREE.Vector3(
    position.x + normalizedDir.x,
    position.y + normalizedDir.y,
    position.z + normalizedDir.z
  );
  
  // Look at the target point
  tempObj.lookAt(targetPoint);
  
  // Extract the resulting rotation (yaw, pitch, roll)
  const euler = new THREE.Euler().setFromQuaternion(tempObj.quaternion, 'YXZ');
  
  world.addComponent(entity, 'Rotation', { 
    x: euler.x, 
    y: euler.y, 
    z: euler.z 
  });
  
  // Add renderable component
  world.addComponent(entity, 'Renderable', {
    modelId: 'laser',
    scale: 0.5,
    color: color // Use the provided color
  });
  
  // Add projectile component
  world.addComponent(entity, 'Projectile', {
    speed: laserSpeed,
    damage: 10,
    lifetime: 6, // 6 seconds lifetime - doubled to allow lasers to travel further
    timeAlive: 0,
    ownerEntity: ownerEntity // Store the owner entity ID
  });
  
  // Add collider component for collision detection
  world.addComponent(entity, 'Collider', {
    type: 'box',
    width: 0.25,
    height: 0.25,
    depth: 5,
    isTrigger: true,
    layer: 'projectile'
  });
  
  return entity;
} 