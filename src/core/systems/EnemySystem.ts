import { World, System } from '../World';
import { Enemy, Position, Velocity, Rotation, Collider, InputReceiver, Health, Renderable } from '../components';
import { createLaser } from '../entities/LaserEntity';
import * as THREE from 'three';
import { COLORS } from '../../constants/colors';

export class EnemySystem implements System {
  // The minimum distance grunts should maintain from the Dyson Sphere surface
  private readonly ATTACK_DISTANCE = 5;
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
          
          // Deal damage to the Dyson Sphere
          const targetHealth = this.world.getComponent<Health>(targetEntity, 'Health');
          if (targetHealth) {
            targetHealth.current -= enemy.damage;
            if (targetHealth.current < 0) targetHealth.current = 0;
          }
        }
        
        // When at attack position, face the Dyson Sphere
        this.faceTarget(rotation, position, targetPosition);
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
    // Create vectors for calculations
    const entityPos = new THREE.Vector3(position.x, position.y, position.z);
    const targetPos = new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z);
    
    // Create a look direction - this is where we want the entity to face
    const lookDir = new THREE.Vector3().subVectors(targetPos, entityPos).normalize();
    
    // Create a dummy object to use Three.js's lookAt functionality
    const dummy = new THREE.Object3D();
    dummy.position.copy(entityPos);
    
    // Calculate a position in front of the entity to look at
    const lookAtPos = new THREE.Vector3().addVectors(
      entityPos,
      lookDir.multiplyScalar(1) // Look 1 unit ahead in the look direction
    );
    
    // Use Three.js lookAt which handles the matrix math for us
    dummy.lookAt(lookAtPos);
    
    // Get the resulting rotation
    dummy.updateMatrixWorld(true);
    const resultEuler = new THREE.Euler().setFromRotationMatrix(dummy.matrixWorld);
    
    // Add PI to Y to flip it around 180 degrees (face toward target, not away)
    rotation.x = resultEuler.x;
    rotation.y = resultEuler.y + Math.PI;
    rotation.z = resultEuler.z;
  }
} 