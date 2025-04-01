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
  
  // Check if the owner is a player (has InputReceiver component)
  const isPlayerLaser = world.hasComponent(ownerEntity, 'InputReceiver');
  
  // Check if the owner is a Warp Raider
  const enemy = world.getComponent<{ type: string }>(ownerEntity, 'Enemy');
  const isWarpRaider = enemy?.type === 'warpRaider';
  
  // Add position component
  world.addComponent(entity, 'Position', { 
    x: position.x, 
    y: position.y, 
    z: position.z 
  });
  
  // Add velocity component (based on direction)
  const laserSpeed = 500; // Units per second 
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
  
  // Add projectile component with damage based on owner type
  world.addComponent(entity, 'Projectile', {
    speed: laserSpeed,
    damage: isPlayerLaser ? 5 : isWarpRaider ? 15 : 10, // 5 for player, 15 for warp raider, 10 for other enemies
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