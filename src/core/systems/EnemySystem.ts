import { World, System } from '../World';
import { Enemy, Position, Velocity, Rotation, Collider, InputReceiver, Health, Renderable, Shield } from '../components';
import { createLaser } from '../entities/LaserEntity';
import * as THREE from 'three';
import { COLORS } from '../../constants/colors';

export class EnemySystem implements System {
  // The minimum distance grunts should maintain from the Dyson Sphere surface
  private readonly ATTACK_DISTANCE = 20;
  // Rotation speed in radians per second for smooth turning
  private readonly ROTATION_SPEED = 2.0;
  private scene: THREE.Scene;
  
  constructor(private world: World, scene: THREE.Scene) {
    this.scene = scene;
  }
  
  update(deltaTime: number): void {
    // Find the player entity for targeting
    const playerEntities = this.world.getEntitiesWith(['InputReceiver', 'Position']);
    let playerPosition: Position | null = null;
    let playerEntity: number = -1;
    
    if (playerEntities.length > 0) {
      playerEntity = playerEntities[0];
      const pos = this.world.getComponent<Position>(playerEntity, 'Position');
      if (pos) playerPosition = pos; // Only assign if defined
    }
    
    const enemies = this.world.getEntitiesWith(['Enemy', 'Position', 'Velocity']);
    
    for (const entity of enemies) {
      const enemy = this.world.getComponent<Enemy>(entity, 'Enemy');
      const position = this.world.getComponent<Position>(entity, 'Position');
      const velocity = this.world.getComponent<Velocity>(entity, 'Velocity');
      const rotation = this.world.getComponent<Rotation>(entity, 'Rotation');
      const renderable = this.world.getComponent<Renderable>(entity, 'Renderable');
      
      if (!enemy || !position || !velocity || !rotation || !renderable) continue;
      
      // Get target (Dyson Sphere) position and size
      const targetEntity = enemy.targetEntity;
      const targetPosition = this.world.getComponent<Position>(targetEntity, 'Position');
      const targetCollider = this.world.getComponent<Collider>(targetEntity, 'Collider');
      
      if (!targetPosition || !targetCollider) continue;
      
      // Get the radius of the Dyson Sphere
      const dysonSphereRadius = targetCollider.radius || 50; // Default to 50 if not specified
      
      // Calculate direction vector to target
      const directionToDyson = new THREE.Vector3(
        targetPosition.x - position.x,
        targetPosition.y - position.y,
        targetPosition.z - position.z
      );
      
      // Calculate distance to the center of the Dyson Sphere
      const distanceToCenter = directionToDyson.length();
      
      // Calculate distance to the surface of the Dyson Sphere
      const distanceToSurface = distanceToCenter - dysonSphereRadius;
      
      // Normalize direction vector (for orientation and movement)
      directionToDyson.normalize();
      
      // Update laser cooldown for enemies
      if (enemy.currentLaserCooldown > 0) {
        enemy.currentLaserCooldown -= deltaTime;
      }
      
      // Check if the enemy has reached its attack position - enter siege mode
      if (distanceToSurface <= this.ATTACK_DISTANCE) {
        // The enemy has reached attack position, stop moving and enter siege mode
        velocity.x = 0;
        velocity.y = 0;
        velocity.z = 0;
        
        // Enter siege mode if not already
        if (!enemy.inSiegeMode) {
          enemy.inSiegeMode = true;
          
          // Update grunt eye color to indicate siege mode
          if (enemy.type === 'grunt') {
            renderable.color = COLORS.GRUNT_EYES_SIEGE;
          }
        }
        
        // Start attack cooldown if not already attacking
        if (enemy.currentCooldown <= 0) {
          enemy.currentCooldown = enemy.attackCooldown;
          
          // First check if target has a shield
          const targetShield = this.world.getComponent<Shield>(targetEntity, 'Shield');
          const targetHealth = this.world.getComponent<Health>(targetEntity, 'Health');
          
          // Damage logic - first damage shield, then health
          if (targetShield && targetShield.current > 0) {
            // Damage shield first
            targetShield.current -= enemy.damage;
            if (targetShield.current < 0) {
              // If shield is depleted, apply remaining damage to health
              if (targetHealth) {
                targetHealth.current += targetShield.current; // Add negative value
                targetShield.current = 0; // Set shield to zero
              }
            }
          } else if (targetHealth) {
            // Shield already depleted, damage health directly
            targetHealth.current -= enemy.damage;
            if (targetHealth.current < 0) targetHealth.current = 0;
            
            // Check if this is the player and if they've been destroyed
            if (this.world.hasComponent(targetEntity, 'InputReceiver') && targetHealth.current <= 0) {
              // Trigger game over
              this.triggerPlayerGameOver(targetEntity);
            }
          }
        }
        
        // When at attack position, smoothly turn to face the Dyson Sphere directly
        this.smoothFaceTarget(rotation, position, targetPosition, deltaTime);
      } else {
        // Still moving toward the target - normal mode
        if (enemy.inSiegeMode) {
          enemy.inSiegeMode = false;
          
          // Revert grunt eye color in normal mode
          if (enemy.type === 'grunt') {
            renderable.color = COLORS.GRUNT_BASE;
          }
        }
        
        velocity.x = directionToDyson.x * enemy.speed;
        velocity.y = directionToDyson.y * enemy.speed;
        velocity.z = directionToDyson.z * enemy.speed;
        
        // Apply different behavior based on enemy type
        if (enemy.type === 'grunt') {
          // Grunts face the player while approaching
          if (playerPosition) {
            this.faceTarget(rotation, position, playerPosition);
            
            // Try to shoot at player
            if (enemy.currentLaserCooldown <= 0 && playerEntity !== -1) {
              // Calculate direction to player
              const directionToPlayer = new THREE.Vector3(
                playerPosition.x - position.x,
                playerPosition.y - position.y,
                playerPosition.z - position.z
              ).normalize();
              
              // Fire laser toward player
              this.fireEnemyLaser(entity, position, { x: directionToPlayer.x, y: directionToPlayer.y, z: directionToPlayer.z });
              
              // Reset cooldown
              enemy.currentLaserCooldown = enemy.laserCooldown;
            }
          } else {
            // No player found, face the direction of movement
            this.faceTarget(rotation, position, {
              x: position.x + velocity.x,
              y: position.y + velocity.y,
              z: position.z + velocity.z
            });
          }
        } else {
          // Default behavior for other enemy types - face where they're going
          this.faceTarget(rotation, position, {
            x: position.x + velocity.x,
            y: position.y + velocity.y,
            z: position.z + velocity.z
          });
        }
      }
      
      // Update enemy cooldown
      if (enemy.currentCooldown > 0) {
        enemy.currentCooldown -= deltaTime;
      }
    }
  }
  
  // Helper method to make an entity fire a laser
  private fireEnemyLaser(entity: number, position: Position, direction: { x: number, y: number, z: number }): void {
    // Create a spawn position slightly in front of the enemy
    const forward = new THREE.Vector3(direction.x, direction.y, direction.z).normalize();
    
    // Spawn position (3 units in front of the enemy)
    const spawnPos = {
      x: position.x + forward.x * 3,
      y: position.y + forward.y * 3,
      z: position.z + forward.z * 3
    };
    
    // Create the laser entity with red color for enemy lasers
    createLaser(this.world, this.scene, spawnPos, direction, entity, COLORS.GRUNT_EYES_SIEGE);
  }
  
  // Helper method to make an entity face a target position
  private faceTarget(rotation: Rotation, position: Position, targetPosition: Position): void {
    // Calculate direction vector from position to target
    const dx = targetPosition.x - position.x;
    const dy = targetPosition.y - position.y;
    const dz = targetPosition.z - position.z;
    
    // Calculate the angle for rotation
    rotation.y = Math.atan2(dx, dz);
    
    // Calculate pitch (vertical angle) - optional
    const distance = Math.sqrt(dx * dx + dz * dz);
    rotation.x = Math.atan2(dy, distance);
  }
  
  // Helper method to make an entity smoothly face a target position
  private smoothFaceTarget(rotation: Rotation, position: Position, targetPosition: Position, deltaTime: number): void {
    // Calculate direction vector from position to target center (Dyson Sphere)
    const directionToDyson = new THREE.Vector3(
      targetPosition.x - position.x,
      targetPosition.y - position.y,
      targetPosition.z - position.z
    );
    
    // Normalize to get direction
    directionToDyson.normalize();
    
    // This normalized vector points directly from the enemy to the center
    // When the enemy's front surface is parallel to the Dyson Sphere surface,
    // its forward direction should be pointing along this vector
    
    // Calculate target yaw (horizontal rotation around Y axis)
    // atan2 gives angle in XZ plane
    const targetYaw = Math.atan2(directionToDyson.x, directionToDyson.z);
    
    // Calculate target pitch (vertical rotation around X axis)
    // We want to fully align with the direction to the center
    // This ensures the enemy's front is parallel to the sphere's surface
    const targetPitch = Math.atan2(directionToDyson.y, 
                                 Math.sqrt(directionToDyson.x * directionToDyson.x + 
                                          directionToDyson.z * directionToDyson.z));
    
    // Smoothly interpolate current rotation to target rotation
    this.smoothRotateToAngle(rotation, 'y', targetYaw, deltaTime);
    this.smoothRotateToAngle(rotation, 'x', targetPitch, deltaTime);
  }
  
  // Helper method to smoothly rotate a value toward a target angle
  private smoothRotateToAngle(rotation: Rotation, axis: 'x' | 'y' | 'z', targetAngle: number, deltaTime: number): void {
    // Normalize both angles to the range [-π, π]
    let currentAngle = rotation[axis];
    
    // Handle the shortest path around the circle
    let diff = targetAngle - currentAngle;
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    
    // Calculate how much to rotate this frame (capped by rotation speed)
    const maxRotation = this.ROTATION_SPEED * deltaTime;
    const rotationAmount = Math.sign(diff) * Math.min(Math.abs(diff), maxRotation);
    
    // Apply the rotation
    rotation[axis] += rotationAmount;
    
    // Normalize the result to [-π, π]
    if (rotation[axis] > Math.PI) rotation[axis] -= Math.PI * 2;
    if (rotation[axis] < -Math.PI) rotation[axis] += Math.PI * 2;
  }
  
  /**
   * Remove all enemy entities from the world
   * Used when restarting the game
   */
  public clearAllEnemies(): void {
    const enemies = this.world.getEntitiesWith(['Enemy']);
    
    for (const entity of enemies) {
      this.world.removeEntity(entity);
    }
  }
  
  // New method to trigger game over when player is destroyed
  private triggerPlayerGameOver(playerEntity: number): void {
    // Get HUD system
    const systems = (this.world as any).systems;
    if (!systems) return;
    
    let hudSystem = null;
    for (const system of systems) {
      if (system.constructor.name === 'HUDSystem') {
        hudSystem = system;
        break;
      }
    }
    
    if (!hudSystem) return;
    
    // Find the HUD entity to pass to triggerGameOver
    const hudEntities = this.world.getEntitiesWith(['UIDisplay', 'GameStateDisplay']);
    if (hudEntities.length > 0) {
      // Directly trigger game over
      hudSystem.triggerGameOver(hudEntities[0], 'Player Ship Destroyed');
    }
  }
} 