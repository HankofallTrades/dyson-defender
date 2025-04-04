import { World, System } from '../World';
import { Enemy, Position, Velocity, Rotation, Collider, InputReceiver, Health, Renderable, Shield, ShieldComponent } from '../components';
import { createLaser } from '../entities/LaserEntity';
import * as THREE from 'three';
import { COLORS } from '../../constants/colors';
import { WeaponSystem } from '../systems/WeaponSystem';

export class EnemySystem implements System {
  // The minimum distance grunts should maintain from the Dyson Sphere surface
  private readonly ATTACK_DISTANCE = 20;
  // Rotation speed in radians per second for smooth turning
  private readonly ROTATION_SPEED = 2.0;
  private scene: THREE.Scene;
  private weaponSystem: WeaponSystem | null = null;

  // Add a map to track rotation completion
  private rotationComplete: Map<number, boolean> = new Map();
  // Add a map to track which enemies have had their lightning weapon created
  private lightningWeaponCreated: Map<number, boolean> = new Map();

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
      if (pos) playerPosition = pos;
    }
    
    const enemies = this.world.getEntitiesWith(['Enemy', 'Position', 'Velocity']);
    
    for (const entity of enemies) {
      const enemy = this.world.getComponent<Enemy>(entity, 'Enemy');
      const position = this.world.getComponent<Position>(entity, 'Position');
      const velocity = this.world.getComponent<Velocity>(entity, 'Velocity');
      const rotation = this.world.getComponent<Rotation>(entity, 'Rotation');
      const renderable = this.world.getComponent<Renderable>(entity, 'Renderable');
      
      if (!enemy || !position || !velocity || !rotation || !renderable) continue;
      
      // Skip movement processing if the enemy can't move
      if (!enemy.canMove) {
        velocity.x = 0;
        velocity.y = 0;
        velocity.z = 0;
        continue;
      }
      
      // Special behavior for Warp Raiders - they prioritize attacking the player
      if (enemy.type === 'warpRaider' && playerPosition) {
        // Calculate distance to player
        const distanceToPlayer = Math.sqrt(
          Math.pow(playerPosition.x - position.x, 2) +
          Math.pow(playerPosition.y - position.y, 2) +
          Math.pow(playerPosition.z - position.z, 2)
        );
        
        // Get direction to player
        const directionToPlayer = new THREE.Vector3(
          playerPosition.x - position.x,
          playerPosition.y - position.y,
          playerPosition.z - position.z
        ).normalize();
        
        // Warp Raiders maintain some distance from the player for strafing attacks
        const optimalRange = 30;
        const rangeBuffer = 5;
        
        if (distanceToPlayer > optimalRange + rangeBuffer) {
          // Move towards player if too far
          velocity.x = directionToPlayer.x * enemy.speed;
          velocity.y = directionToPlayer.y * enemy.speed;
          velocity.z = directionToPlayer.z * enemy.speed;
        } else if (distanceToPlayer < optimalRange - rangeBuffer) {
          // Back away if too close
          velocity.x = -directionToPlayer.x * enemy.speed * 0.5;
          velocity.y = -directionToPlayer.y * enemy.speed * 0.5;
          velocity.z = -directionToPlayer.z * enemy.speed * 0.5;
        } else {
          // Strafe around player at optimal range
          const strafeDirection = new THREE.Vector3(
            -directionToPlayer.z,
            0,
            directionToPlayer.x
          ).normalize();
          
          velocity.x = strafeDirection.x * enemy.speed;
          velocity.y = strafeDirection.y * enemy.speed * 0.2; // Reduced vertical movement
          velocity.z = strafeDirection.z * enemy.speed;
        }
        
        // Always face the player
        this.smoothFaceTarget(rotation, position, playerPosition, deltaTime);
        
        // Aggressive shooting at player
        if (enemy.canShoot && enemy.currentLaserCooldown <= 0) {
          this.fireEnemyLaser(entity, position, {
            x: directionToPlayer.x,
            y: directionToPlayer.y,
            z: directionToPlayer.z
          });
          enemy.currentLaserCooldown = enemy.laserCooldown;
        }
        
        // Update laser cooldown
        if (enemy.currentLaserCooldown > 0) {
          enemy.currentLaserCooldown -= deltaTime;
        }
        
        continue; // Skip regular enemy behavior
      }
      
      // Special behavior for Shield Guardian
      if (enemy.type === 'shieldGuardian') {
        this.updateShieldGuardian(entity, position, velocity, rotation, enemy, deltaTime);
        continue; // Skip regular enemy behavior
      }
      
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
        // The enemy has reached attack position, stop moving
        velocity.x = 0;
        velocity.y = 0;
        velocity.z = 0;
        
        // Special handling for asteroids that reach the Dyson Sphere
        if (enemy.type === 'asteroid') {
          this.triggerAsteroidImpact(entity, targetEntity);
          return;
        }
        
        // Enter siege mode if not already
        if (!enemy.inSiegeMode) {
          enemy.inSiegeMode = true;
          
          // Update grunt eye color to indicate siege mode
          if (enemy.type === 'grunt') {
            const mesh = this.scene.getObjectByProperty('uuid', renderable.meshId);
            if (mesh) {
              const leftEye = mesh.userData.leftEye;
              const rightEye = mesh.userData.rightEye;
              if (leftEye && rightEye) {
                (leftEye.material as THREE.MeshPhongMaterial).color.setHex(COLORS.GRUNT_EYES_SIEGE);
                (leftEye.material as THREE.MeshPhongMaterial).emissive.setHex(COLORS.GRUNT_EYES_SIEGE_EMISSIVE);
                (leftEye.material as THREE.MeshPhongMaterial).emissiveIntensity = 1.0;
                (rightEye.material as THREE.MeshPhongMaterial).color.setHex(COLORS.GRUNT_EYES_SIEGE);
                (rightEye.material as THREE.MeshPhongMaterial).emissive.setHex(COLORS.GRUNT_EYES_SIEGE_EMISSIVE);
                (rightEye.material as THREE.MeshPhongMaterial).emissiveIntensity = 1.0;
              }
            }
          }
        }
        
        // When at attack position, smoothly turn to face the Dyson Sphere directly
        const isRotationComplete = this.smoothFaceTarget(rotation, position, targetPosition, deltaTime);
        
        // Store rotation completion state
        this.rotationComplete.set(entity, isRotationComplete);
        
        // Create lightning weapon only after rotation is complete
        if (enemy.type === 'grunt' && isRotationComplete && !this.lightningWeaponCreated?.get(entity)) {
          const weaponSystem = this.getWeaponSystem();
          if (weaponSystem) {
            weaponSystem.createLightningWeapon(entity);
            this.lightningWeaponCreated?.set(entity, true);
          }
        }
        
        // Try to shoot laser at Dyson sphere when in siege mode and rotation is not complete
        if (enemy.canShoot && enemy.currentLaserCooldown <= 0 && !isRotationComplete) {
          // Get direction to Dyson sphere center for laser targeting
          const directionToDysonSphere = new THREE.Vector3(
            targetPosition.x - position.x,
            targetPosition.y - position.y,
            targetPosition.z - position.z
          ).normalize();
          
          // Fire laser toward Dyson sphere
          this.fireEnemyLaser(entity, position, { 
            x: directionToDysonSphere.x, 
            y: directionToDysonSphere.y, 
            z: directionToDysonSphere.z 
          });
          
          // Reset laser cooldown
          enemy.currentLaserCooldown = enemy.laserCooldown;
        }
      } else {
        // Still moving toward the target - normal mode
        if (enemy.inSiegeMode) {
          enemy.inSiegeMode = false;
          this.rotationComplete.delete(entity);
          this.lightningWeaponCreated?.delete(entity);
          
          // Revert grunt eye color in normal mode
          if (enemy.type === 'grunt') {
            const mesh = this.scene.getObjectByProperty('uuid', renderable.meshId);
            if (mesh) {
              const leftEye = mesh.userData.leftEye;
              const rightEye = mesh.userData.rightEye;
              if (leftEye && rightEye) {
                (leftEye.material as THREE.MeshPhongMaterial).color.setHex(COLORS.GRUNT_EYES);
                (leftEye.material as THREE.MeshPhongMaterial).emissive.setHex(COLORS.GRUNT_EYES_EMISSIVE);
                (leftEye.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.5;
                (rightEye.material as THREE.MeshPhongMaterial).color.setHex(COLORS.GRUNT_EYES);
                (rightEye.material as THREE.MeshPhongMaterial).emissive.setHex(COLORS.GRUNT_EYES_EMISSIVE);
                (rightEye.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.5;

                // Remove lightning weapon
                const weaponSystem = this.getWeaponSystem();
                if (weaponSystem) {
                  weaponSystem.removeLightningWeapon(entity);
                }
              }
            }
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
            
            // Try to shoot at player ONLY if allowed to shoot
            if (enemy.canShoot && enemy.currentLaserCooldown <= 0 && playerEntity !== -1) {
              // Calculate direction to player for laser targeting
              const directionToPlayer = new THREE.Vector3(
                playerPosition.x - position.x,
                playerPosition.y - position.y,
                playerPosition.z - position.z
              ).normalize();
              
              // Fire laser toward player
              this.fireEnemyLaser(entity, position, { 
                x: directionToPlayer.x, 
                y: directionToPlayer.y, 
                z: directionToPlayer.z 
              });
              
              // Reset cooldown
              enemy.currentLaserCooldown = enemy.laserCooldown;
            }
          } else {
            // No player found, face the direction of movement
            const moveTarget = {
              x: position.x + velocity.x,
              y: position.y + velocity.y,
              z: position.z + velocity.z
            };
            this.faceTarget(rotation, position, moveTarget);
          }
        } else {
          // Default behavior for other enemy types - face where they're going
          const moveTarget = {
            x: position.x + velocity.x,
            y: position.y + velocity.y,
            z: position.z + velocity.z
          };
          this.faceTarget(rotation, position, moveTarget);
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
    
    // Get enemy type to determine laser properties
    const enemy = this.world.getComponent<Enemy>(entity, 'Enemy');
    
    // Spawn position (3 units in front of the enemy)
    const spawnPos = {
      x: position.x + forward.x * 3,
      y: position.y + forward.y * 3,
      z: position.z + forward.z * 3
    };
    
    // Create the laser entity with appropriate color
    const laserEntity = enemy?.type === 'warpRaider'
      ? createLaser(this.world, this.scene, spawnPos, direction, entity, COLORS.WARP_RAIDER_LASER)
      : createLaser(this.world, this.scene, spawnPos, direction, entity, COLORS.GRUNT_EYES_SIEGE);

    // For Warp Raiders, make the laser thicker
    if (enemy?.type === 'warpRaider') {
      const renderable = this.world.getComponent<Renderable>(laserEntity, 'Renderable');
      if (renderable) {
        renderable.scale = 1.5; // Thicker laser
      }
      
      // Also make the collider bigger
      const collider = this.world.getComponent<Collider>(laserEntity, 'Collider');
      if (collider) {
        collider.width = 0.5;
        collider.height = 0.5;
      }
    }
  }
  
  // Helper method to make an entity face a target position
  private faceTarget(rotation: Rotation, position: Position, targetPosition: Position): void {
    // Create vectors for current position and target position
    const currentPos = new THREE.Vector3(position.x, position.y, position.z);
    const targetPos = new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z);
    
    // Create a temporary object to use lookAt
    const tempObj = new THREE.Object3D();
    tempObj.position.copy(currentPos);
    tempObj.lookAt(targetPos);
    
    // Extract the resulting rotation from the object
    const euler = new THREE.Euler().setFromQuaternion(tempObj.quaternion, 'YXZ');
    rotation.x = euler.x; // Pitch
    rotation.y = euler.y; // Yaw
    rotation.z = euler.z; // Roll
  }
  
  // Helper method to make an entity smoothly face a target position and return if rotation is complete
  private smoothFaceTarget(rotation: Rotation, position: Position, targetPosition: Position, deltaTime: number): boolean {
    // Create vectors for current position and target position
    const currentPos = new THREE.Vector3(position.x, position.y, position.z);
    const targetPos = new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z);
    
    // Create a temporary object to use lookAt
    const tempObj = new THREE.Object3D();
    tempObj.position.copy(currentPos);
    tempObj.lookAt(targetPos);
    
    // Extract the target rotation from the object
    const euler = new THREE.Euler().setFromQuaternion(tempObj.quaternion, 'YXZ');
    const targetYaw = euler.y;
    const targetPitch = euler.x;
    
    // Smoothly interpolate current rotation to target rotation
    const yawComplete = this.smoothRotateToAngle(rotation, 'y', targetYaw, deltaTime);
    const pitchComplete = this.smoothRotateToAngle(rotation, 'x', targetPitch, deltaTime);
    
    // Return true if both rotations are complete
    return yawComplete && pitchComplete;
  }
  
  // Helper method to smoothly rotate a value toward a target angle
  private smoothRotateToAngle(rotation: Rotation, axis: 'x' | 'y' | 'z', targetAngle: number, deltaTime: number): boolean {
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
    
    // Return true if we're very close to the target angle
    return Math.abs(diff) < 0.01;
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
  
  // Add this new method for Shield Guardian behavior
  private updateShieldGuardian(
    entity: number,
    position: Position,
    velocity: Velocity,
    rotation: Rotation,
    enemy: Enemy,
    deltaTime: number
  ): void {
    // Find nearby enemies to protect
    const allEnemies = this.world.getEntitiesWith(['Enemy', 'Position']);
    let nearestEnemyDist = Infinity;
    let nearestEnemyPosition: Position | null = null;
    
    for (const otherEntity of allEnemies) {
      // Skip self
      if (otherEntity === entity) continue;
      
      // Skip other shield guardians
      const otherEnemy = this.world.getComponent<Enemy>(otherEntity, 'Enemy');
      if (otherEnemy && otherEnemy.type === 'shieldGuardian') continue;
      
      const otherPosition = this.world.getComponent<Position>(otherEntity, 'Position');
      if (!otherPosition) continue;
      
      // Calculate distance
      const dist = Math.sqrt(
        Math.pow(position.x - otherPosition.x, 2) +
        Math.pow(position.y - otherPosition.y, 2) +
        Math.pow(position.z - otherPosition.z, 2)
      );
      
      // Find nearest enemy
      if (dist < nearestEnemyDist) {
        nearestEnemyDist = dist;
        nearestEnemyPosition = otherPosition;
      }
    }
    
    // If there's a nearby enemy, move toward it
    if (nearestEnemyPosition) {
      // Direction to the nearest enemy
      const direction = new THREE.Vector3(
        nearestEnemyPosition.x - position.x,
        nearestEnemyPosition.y - position.y,
        nearestEnemyPosition.z - position.z
      );
      
      // If too far, move toward it
      if (nearestEnemyDist > 15) { // Stay 15 units away
        direction.normalize();
        velocity.x = direction.x * enemy.speed;
        velocity.y = direction.y * enemy.speed;
        velocity.z = direction.z * enemy.speed;
      } else {
        // Close enough, stop moving
        velocity.x = 0;
        velocity.y = 0;
        velocity.z = 0;
      }
      
      // Face the nearest enemy
      this.faceTarget(rotation, position, nearestEnemyPosition);
    } else {
      // No other enemies, move toward the target (Dyson Sphere)
      const targetPosition = this.world.getComponent<Position>(enemy.targetEntity, 'Position');
      if (targetPosition) {
        const directionToDyson = new THREE.Vector3(
          targetPosition.x - position.x,
          targetPosition.y - position.y,
          targetPosition.z - position.z
        ).normalize();
        
        velocity.x = directionToDyson.x * enemy.speed;
        velocity.y = directionToDyson.y * enemy.speed;
        velocity.z = directionToDyson.z * enemy.speed;
        
        // Face the target
        this.faceTarget(rotation, position, targetPosition);
      }
    }
    
    // Check shield status and update visual indication if needed
    const shield = this.world.getComponent<ShieldComponent>(entity, 'ShieldComponent');
    if (shield) {
      // Could update visual effects based on shield status here
      // For example, change color intensity based on remaining shield hits
    }
  }

  private updateAttackCycle(enemy: Enemy, targetEntity: number): void {
    // ... Add this new method to handle specific enemy attack logic ...
    // Handle special case for asteroid hitting Dyson Sphere
    if (enemy.type === 'asteroid') {
      // When asteroid collides with Dyson Sphere, it's instant game over regardless of shields or health
      // This is handled in the siege mode section of the update method
      
      // Check for collision with Dyson Sphere - will be handled in update() when in siege mode
    }
    
    // Other enemy type logic can be added here
  }

  // Modify or add this helper method to handle asteroid collision with Dyson sphere
  private triggerAsteroidImpact(asteroidEntity: number, dysonSphereEntity: number): void {
    console.log('Asteroid impacted Dyson Sphere - GAME OVER');
    
    // Trigger game over when an asteroid hits the Dyson Sphere
    const gameStateEntities = this.world.getEntitiesWith(['GameStateDisplay']);
    if (gameStateEntities.length > 0) {
      const gameStateEntity = gameStateEntities[0];
      const gameStateDisplay = this.world.getComponent<{currentState: string}>(gameStateEntity, 'GameStateDisplay');
      if (gameStateDisplay) {
        gameStateDisplay.currentState = 'game_over';
      }
    }
    
    // Optional: Add explosion or impact visual effect here
  }

  // Add helper method to get WeaponSystem
  private getWeaponSystem(): any {
    const systems = (this.world as any).systems;
    if (!systems) return null;
    
    for (const system of systems) {
      if (system.constructor.name === 'WeaponSystem') {
        return system;
      }
    }
    return null;
  }
} 