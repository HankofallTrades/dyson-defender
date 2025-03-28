import * as THREE from 'three';
import { World, System } from '../World';
import { Position, Collider, Projectile, Health, Enemy, InputReceiver, Shield, ShieldComponent, ShieldBubbleComponent, HealthBarComponent, PowerUp } from '../components';
import { HUDSystem } from './HUDSystem';
import { ShieldSystem } from './ShieldSystem';
import { AnimationSystem } from './AnimationSystem';
import { PowerUpSystem } from './PowerUpSystem';
import { createFloatingScore } from '../entities/FloatingScoreEntity';

/**
 * Collision System
 * 
 * Purpose:
 * Detects and handles collisions between game entities.
 * 
 * Responsibilities:
 * - Detects collisions between entities with Collider components
 * - Handles different collision types based on entity layers
 * - Applies damage to Health components when hit by projectiles
 * - Maintains collision layer filtering
 */
export class CollisionSystem implements System {
  private world: World;
  private collisionMatrix: Map<string, string[]>;
  private animationSystem: AnimationSystem | null = null;
  private powerUpSystem: PowerUpSystem | null = null;

  constructor(world: World) {
    this.world = world;
    
    // Set up collision matrix - which layers can collide with which
    this.collisionMatrix = new Map();
    this.collisionMatrix.set('projectile', ['enemy', 'dysonSphere', 'player', 'shield']);
    this.collisionMatrix.set('enemy', ['player', 'projectile', 'dysonSphere']);
    this.collisionMatrix.set('player', ['enemy', 'projectile', 'powerUp']);
    this.collisionMatrix.set('dysonSphere', ['enemy']);
    this.collisionMatrix.set('shield', ['projectile']);
    this.collisionMatrix.set('powerUp', ['player']);
  }

  // Method to set the animation system reference
  public setAnimationSystem(animationSystem: AnimationSystem): void {
    this.animationSystem = animationSystem;
  }

  public setPowerUpSystem(powerUpSystem: PowerUpSystem): void {
    this.powerUpSystem = powerUpSystem;
  }

  update(deltaTime: number): void {
    // Get all entities with Position and Collider components
    const collidableEntities = this.world.getEntitiesWith(['Position', 'Collider']);
    
    // Group entities by collision layer for more efficient collision checking
    const entitiesByLayer = new Map<string, number[]>();
    
    for (const entity of collidableEntities) {
      const collider = this.world.getComponent<Collider>(entity, 'Collider');
      if (!collider) continue;
      
      if (!entitiesByLayer.has(collider.layer)) {
        entitiesByLayer.set(collider.layer, []);
      }
      entitiesByLayer.get(collider.layer)!.push(entity);
    }
    
    // Check collisions for each layer against its potential colliding layers
    for (const [layer, entities] of entitiesByLayer.entries()) {
      const collidingLayers = this.collisionMatrix.get(layer) || [];
      
      for (const collidingLayer of collidingLayers) {
        const targetEntities = entitiesByLayer.get(collidingLayer) || [];
        
        // Check collisions between entities in these two layers
        this.checkCollisionsBetweenLayers(entities, targetEntities);
      }
    }
  }
  
  private checkCollisionsBetweenLayers(entitiesA: number[], entitiesB: number[]): void {
    for (const entityA of entitiesA) {
      const positionA = this.world.getComponent<Position>(entityA, 'Position');
      const colliderA = this.world.getComponent<Collider>(entityA, 'Collider');
      
      if (!positionA || !colliderA) continue;
      
      for (const entityB of entitiesB) {
        // Don't check collision with self
        if (entityA === entityB) continue;
        
        // If this is a projectile, check if entityB is the owner
        if (colliderA.layer === 'projectile') {
          const projectile = this.world.getComponent<Projectile>(entityA, 'Projectile');
          if (projectile && projectile.ownerEntity === entityB) {
            // Skip collision check with owner
            continue;
          }
        }
        
        // If entityB is a projectile, check if entityA is the owner
        if (colliderA.layer === 'enemy' || colliderA.layer === 'player') {
          const entityBCollider = this.world.getComponent<Collider>(entityB, 'Collider');
          if (entityBCollider && entityBCollider.layer === 'projectile') {
            const projectile = this.world.getComponent<Projectile>(entityB, 'Projectile');
            if (projectile && projectile.ownerEntity === entityA) {
              // Skip collision check with owner
              continue;
            }
          }
        }
        
        const positionB = this.world.getComponent<Position>(entityB, 'Position');
        const colliderB = this.world.getComponent<Collider>(entityB, 'Collider');
        
        if (!positionB || !colliderB) continue;
        
        // Check collision based on collider types
        if (this.checkCollisionBetweenEntities(
          entityA, positionA, colliderA, 
          entityB, positionB, colliderB
        )) {
          // Handle collision
          this.handleCollision(entityA, entityB);
        }
      }
    }
  }
  
  private checkCollisionBetweenEntities(
    entityA: number, posA: Position, colliderA: Collider,
    entityB: number, posB: Position, colliderB: Collider
  ): boolean {
    // Create THREE.js vectors for position
    const positionA = new THREE.Vector3(posA.x, posA.y, posA.z);
    const positionB = new THREE.Vector3(posB.x, posB.y, posB.z);
    
    // Calculate distance between entities
    const distance = positionA.distanceTo(positionB);
    
    // Special case for power-up collision - be extremely generous with collision detection
    if (colliderA.layer === 'powerUp' || colliderB.layer === 'powerUp') {
      const powerUpRadius = colliderA.layer === 'powerUp' ? (colliderA.radius || 10.0) : (colliderB.radius || 10.0);
      const otherRadius = 10.0; // Give player a very generous collision radius for power-ups
      const collisionDistance = powerUpRadius + otherRadius;
      const isColliding = distance < collisionDistance;
      
      // Log distance data for debugging power-up collisions
      if (distance < 20) { // Only log when getting close to avoid console spam
        console.log(`Power-up distance check: ${distance.toFixed(2)} < ${collisionDistance}? ${isColliding}`);
        console.log(`Entity positions: A(${posA.x.toFixed(1)}, ${posA.y.toFixed(1)}, ${posA.z.toFixed(1)}) - B(${posB.x.toFixed(1)}, ${posB.y.toFixed(1)}, ${posB.z.toFixed(1)})`);
      }
      
      return isColliding;
    }
    
    if (colliderA.type === 'sphere' && colliderB.type === 'sphere') {
      // Sphere-sphere collision
      const radiusSum = (colliderA.radius || 0) + (colliderB.radius || 0);
      return distance < radiusSum;
    } else if (colliderA.type === 'box' && colliderB.type === 'box') {
      // Box-box collision - simplified for now
      // For a real game, you'd want to use proper AABB or OBB collision detection
      const halfWidthA = (colliderA.width || 0) / 2;
      const halfHeightA = (colliderA.height || 0) / 2;
      const halfDepthA = (colliderA.depth || 0) / 2;
      
      const halfWidthB = (colliderB.width || 0) / 2;
      const halfHeightB = (colliderB.height || 0) / 2;
      const halfDepthB = (colliderB.depth || 0) / 2;
      
      return (
        Math.abs(posA.x - posB.x) < halfWidthA + halfWidthB &&
        Math.abs(posA.y - posB.y) < halfHeightA + halfHeightB &&
        Math.abs(posA.z - posB.z) < halfDepthA + halfDepthB
      );
    } else if (colliderA.type === 'sphere' && colliderB.type === 'box') {
      // Sphere-box collision - simplified
      return this.checkSphereBoxCollision(
        positionA, colliderA.radius || 0,
        positionB, colliderB.width || 0, colliderB.height || 0, colliderB.depth || 0
      );
    } else if (colliderA.type === 'box' && colliderB.type === 'sphere') {
      // Box-sphere collision
      return this.checkSphereBoxCollision(
        positionB, colliderB.radius || 0,
        positionA, colliderA.width || 0, colliderA.height || 0, colliderA.depth || 0
      );
    }
    
    // Default fallback - use a simple distance check
    const fallbackRadius = 1.0; // Default fallback radius
    return distance < fallbackRadius * 2;
  }
  
  private checkSphereBoxCollision(
    spherePos: THREE.Vector3, sphereRadius: number,
    boxPos: THREE.Vector3, boxWidth: number, boxHeight: number, boxDepth: number
  ): boolean {
    // Transform sphere center to box space
    const halfWidth = boxWidth / 2;
    const halfHeight = boxHeight / 2;
    const halfDepth = boxDepth / 2;
    
    // Find closest point on box to sphere center
    const closestX = Math.max(boxPos.x - halfWidth, Math.min(spherePos.x, boxPos.x + halfWidth));
    const closestY = Math.max(boxPos.y - halfHeight, Math.min(spherePos.y, boxPos.y + halfHeight));
    const closestZ = Math.max(boxPos.z - halfDepth, Math.min(spherePos.z, boxPos.z + halfDepth));
    
    // Calculate distance to closest point
    const distanceX = spherePos.x - closestX;
    const distanceY = spherePos.y - closestY; 
    const distanceZ = spherePos.z - closestZ;
    
    const distanceSquared = distanceX * distanceX + distanceY * distanceY + distanceZ * distanceZ;
    
    return distanceSquared < (sphereRadius * sphereRadius);
  }
  
  private handleCollision(entityA: number, entityB: number): void {
    const colliderA = this.world.getComponent<Collider>(entityA, 'Collider');
    const colliderB = this.world.getComponent<Collider>(entityB, 'Collider');
    
    if (!colliderA || !colliderB) return;
    
    // Handle projectile collision with shield
    if (colliderA.layer === 'projectile' && colliderB.layer === 'shield') {
      this.handleProjectileShieldCollision(entityA, entityB);
    } else if (colliderA.layer === 'shield' && colliderB.layer === 'projectile') {
      this.handleProjectileShieldCollision(entityB, entityA);
    }
    
    // Handle projectile collision
    else if (colliderA.layer === 'projectile' && this.collisionMatrix.get('projectile')?.includes(colliderB.layer)) {
      this.handleProjectileCollision(entityA, entityB);
    } else if (colliderB.layer === 'projectile' && this.collisionMatrix.get('projectile')?.includes(colliderA.layer)) {
      this.handleProjectileCollision(entityB, entityA);
    }
    
    // Handle enemy-dysonSphere collision
    if (colliderA.layer === 'enemy' && colliderB.layer === 'dysonSphere') {
      this.handleEnemyDysonSphereCollision(entityA, entityB);
    } else if (colliderB.layer === 'enemy' && colliderA.layer === 'dysonSphere') {
      this.handleEnemyDysonSphereCollision(entityB, entityA);
    }
    
    // Handle player-enemy collision
    if (colliderA.layer === 'player' && colliderB.layer === 'enemy') {
      this.handlePlayerEnemyCollision(entityA, entityB);
    } else if (colliderB.layer === 'player' && colliderA.layer === 'enemy') {
      this.handlePlayerEnemyCollision(entityB, entityA);
    }
    
    // Handle player-powerUp collision
    if (colliderA.layer === 'player' && colliderB.layer === 'powerUp') {
      this.handlePlayerPowerUpCollision(entityA, entityB);
    } else if (colliderB.layer === 'player' && colliderA.layer === 'powerUp') {
      this.handlePlayerPowerUpCollision(entityB, entityA);
    }
  }
  
  private handleEnemyDysonSphereCollision(enemyEntity: number, dysonSphereEntity: number): void {
    // Get enemy properties
    const enemy = this.world.getComponent<Enemy>(enemyEntity, 'Enemy');
    if (!enemy) return;
    
    // Check for shield first
    const shield = this.world.getComponent<Shield>(dysonSphereEntity, 'Shield');
    const health = this.world.getComponent<Health>(dysonSphereEntity, 'Health');
    const shieldSystem = this.getShieldSystem();
    
    if (!health) return;
    
    // Damage logic - shield first, then health
    if (shield && shield.current > 0) {
      // Notify shield system of hit
      if (shieldSystem) {
        shieldSystem.onShieldHit(dysonSphereEntity);
      }
      
      // Apply damage to shield
      shield.current -= enemy.damage;
      
      // If shield is depleted, apply remaining damage to health
      if (shield.current < 0) {
        health.current += shield.current; // Add negative value
        shield.current = 0;
      }
    } else {
      // Shield already depleted or doesn't exist, damage health directly
      health.current -= enemy.damage;
    }
    
    // Clamp health to minimum of 0
    health.current = Math.max(0, health.current);
    
    // Remove the enemy
    this.world.removeEntity(enemyEntity);
    
    // Game over logic is handled by the HUDSystem that monitors the Dyson Sphere health
  }
  
  private handleProjectileCollision(projectileEntity: number, targetEntity: number): void {
    // Get projectile properties
    const projectile = this.world.getComponent<Projectile>(projectileEntity, 'Projectile');
    if (!projectile) return;
    
    // Get HUD system for notifications
    const hudSystem = this.getHUDSystem();
    const shieldSystem = this.getShieldSystem();
    
    // Check if this is the Dyson Sphere (which has both shield and health)
    if (this.isDysonSphere(targetEntity)) {
      const shield = this.world.getComponent<Shield>(targetEntity, 'Shield');
      const health = this.world.getComponent<Health>(targetEntity, 'Health');
      
      if (health) {
        // Damage logic - shield first, then health
        if (shield && shield.current > 0) {
          // Notify shield system of hit
          if (shieldSystem) {
            shieldSystem.onShieldHit(targetEntity);
          }
          
          // Apply damage to shield
          shield.current -= projectile.damage;
          
          // If shield is depleted, apply remaining damage to health
          if (shield.current < 0) {
            health.current += shield.current; // Add negative value
            shield.current = 0;
          }
        } else {
          // Shield already depleted or doesn't exist, damage health directly
          health.current -= projectile.damage;
        }
        
        // Clamp health to minimum of 0
        health.current = Math.max(0, health.current);
      }
    } 
    // Handle other entities with just health
    else if (this.world.hasComponent(targetEntity, 'Health')) {
      const health = this.world.getComponent<Health>(targetEntity, 'Health');
      if (health) {
        // Apply damage
        health.current -= projectile.damage;
        
        // Check if this is a player being hit
        if (this.world.hasComponent(targetEntity, 'InputReceiver')) {
          if (hudSystem) {
            // Activate damage effect
            hudSystem.activateDamageEffect(0.8, 0.5);
            
            // Check if player is destroyed
            if (health.current <= 0) {
              // Find the HUD entity to pass to triggerGameOver
              const hudEntities = this.world.getEntitiesWith(['UIDisplay', 'GameStateDisplay']);
              if (hudEntities.length > 0) {
                // Directly trigger game over
                hudSystem.triggerGameOver(hudEntities[0], 'Player Ship Destroyed');
                return; // Exit early to prevent entity removal
              }
            }
          }
        }
        // Check if entity is an enemy
        else if (this.world.hasComponent(targetEntity, 'Enemy')) {
          // Get the enemy component to check its type
          const enemy = this.world.getComponent<Enemy>(targetEntity, 'Enemy');
          
          // Check if the enemy has a HealthBarComponent and update its visibility if damaged
          if (this.world.hasComponent(targetEntity, 'HealthBarComponent')) {
            const healthBar = this.world.getComponent<HealthBarComponent>(targetEntity, 'HealthBarComponent');
            if (healthBar && healthBar.showWhenDamaged && health.current < health.max) {
              healthBar.visible = true;
            }
          }
          
          // Check if entity is destroyed
          if (health.current <= 0) {
            if (hudSystem) {
              // Get the enemy position for the floating score
              const enemyPosition = this.world.getComponent<Position>(targetEntity, 'Position');
              
              if (enemyPosition && enemy) {
                // Add score based on enemy type
                let scoreValue = 10; // Default for 'grunt' enemies
                
                // Special score values for different enemy types
                if (enemy.type === 'warpRaider') {
                  scoreValue = 25; // Warp Raiders are worth more points
                } else if (enemy.type === 'asteroid') {
                  scoreValue = 50; // Asteroids are worth even more points
                  
                  // Create a special explosion effect for asteroids
                  if (this.world.hasComponent(targetEntity, 'Position')) {
                    // Add an explosion animation at the asteroid's position
                    if (this.animationSystem) {
                      const asteroidPos = this.world.getComponent<Position>(targetEntity, 'Position');
                      if (asteroidPos) {
                        this.animationSystem.createExplosion(
                          asteroidPos, 
                          3.0,  // Larger explosion
                          1.5,  // Longer duration
                          50   // More particles
                        );
                      }
                    }
                    
                    // Display a special message when destroying an asteroid
                    if (hudSystem) {
                      hudSystem.displayMessage("Asteroid Destroyed!", 3);
                    }
                  }
                }
                
                // Create floating score at enemy position
                createFloatingScore(this.world, enemyPosition, scoreValue);
                
                // Still update the score in HUD
                hudSystem.incrementScore(scoreValue);
                
                // Spawn a power-up at the enemy's position (10% chance)
                if (this.powerUpSystem && Math.random() < 0.1) {
                  // Create a fresh copy of the enemy position to avoid reference issues
                  const powerUpPosition = {
                    x: enemyPosition.x,
                    y: enemyPosition.y,
                    z: enemyPosition.z
                  };
                  
                  // Debug enemy position before spawning
                  console.log(`Enemy destroyed: ${enemy.type} at position X=${powerUpPosition.x.toFixed(2)}, Y=${powerUpPosition.y.toFixed(2)}, Z=${powerUpPosition.z.toFixed(2)}`);
                  
                  this.powerUpSystem.spawnPowerUpAtPosition(powerUpPosition);
                }
              }
            }
            
            // Remove the destroyed entity
            this.world.removeEntity(targetEntity);
          }
        }
      }
    }
    
    // Remove the projectile
    this.world.removeEntity(projectileEntity);
  }
  
  // Helper method to check if an entity is the Dyson Sphere
  private isDysonSphere(entity: number): boolean {
    // Get the renderable component
    const renderable = this.world.getComponent<{ modelId: string }>(entity, 'Renderable');
    return renderable ? renderable.modelId === 'dysonSphere' : false;
  }
  
  private handlePlayerEnemyCollision(playerEntity: number, enemyEntity: number): void {
    // Get player health
    const playerHealth = this.world.getComponent<Health>(playerEntity, 'Health');
    if (!playerHealth) return;
    
    // Get enemy component
    const enemy = this.world.getComponent<{ damage: number }>(enemyEntity, 'Enemy');
    if (!enemy) return;
    
    // Apply damage to player
    playerHealth.current -= enemy.damage;
    
    // Clamp health to minimum of 0
    playerHealth.current = Math.max(0, playerHealth.current);
    
    // Get HUD system to activate damage effect
    const hudSystem = this.getHUDSystem();
    if (hudSystem) {
      // Activate damage effect with higher intensity since this is direct collision
      hudSystem.activateDamageEffect(1.0, 0.7);
    }
    
    // Remove the enemy
    this.world.removeEntity(enemyEntity);
    
    // Check if player is destroyed
    if (playerHealth.current <= 0 && hudSystem) {
      // Find the HUD entity to pass to triggerGameOver
      const hudEntities = this.world.getEntitiesWith(['UIDisplay', 'GameStateDisplay']);
      if (hudEntities.length > 0) {
        // Directly trigger game over now that the method is public
        hudSystem.triggerGameOver(hudEntities[0], 'Player Ship Destroyed');
      }
    }
  }
  
  // Get the HUD system from the world
  private getHUDSystem(): HUDSystem | null {
    const systems = (this.world as any).systems;
    if (!systems) return null;
    
    for (const system of systems) {
      if (system instanceof HUDSystem) {
        return system;
      }
    }
    
    return null;
  }

  // Get the Shield system from the world
  private getShieldSystem(): ShieldSystem | null {
    const systems = (this.world as any).systems;
    if (!systems) return null;
    
    for (const system of systems) {
      if (system instanceof ShieldSystem) {
        return system;
      }
    }
    
    return null;
  }

  // Add this new method for shield collisions
  private handleProjectileShieldCollision(projectileEntity: number, shieldEntity: number): void {
    // Get the projectile component
    const projectile = this.world.getComponent<Projectile>(projectileEntity, 'Projectile');
    if (!projectile) return;
    
    // Check if this projectile is from a player or an enemy
    const ownerEntity = projectile.ownerEntity;
    const isPlayerProjectile = this.world.hasComponent(ownerEntity, 'InputReceiver');
    
    // Only player projectiles should damage shields
    if (!isPlayerProjectile) {
      return; // Skip collision for enemy projectiles with shields
    }
    
    // Get the shield bubble component
    const bubbleComponent = this.world.getComponent<ShieldBubbleComponent>(shieldEntity, 'ShieldBubbleComponent');
    if (!bubbleComponent) return;
    
    // Get the guardian entity
    const guardianEntity = bubbleComponent.guardian;
    if (!this.world.hasEntity(guardianEntity)) return;
    
    // Get shield component from guardian
    const shield = this.world.getComponent<ShieldComponent>(guardianEntity, 'ShieldComponent');
    if (!shield) return;
    
    // Get the projectile position for visual effects
    const projectilePos = this.world.getComponent<Position>(projectileEntity, 'Position');
    const bubblePos = this.world.getComponent<Position>(shieldEntity, 'Position');
    
    if (projectilePos && bubblePos) {
      // Calculate impact point on shield surface
      const direction = new THREE.Vector3(
        projectilePos.x - bubblePos.x,
        projectilePos.y - bubblePos.y,
        projectilePos.z - bubblePos.z
      ).normalize();
      
      // Get the shield renderable to add impact effect
      const renderable = this.world.getComponent<any>(shieldEntity, 'Renderable');
      if (renderable && renderable.mesh) {
        const mesh = renderable.mesh;
        
        // Add impact point to the shield data for visual processing
        if (mesh instanceof THREE.Group && (mesh as any).shieldData) {
          const impactPoint = direction.clone();
          if (!(mesh as any).shieldData.impactPoints) {
            (mesh as any).shieldData.impactPoints = [];
          }
          (mesh as any).shieldData.impactPoints.push(impactPoint);
          
          // Make the shield flash brighter momentarily
          if (mesh.children.length >= 1) {
            const shell = mesh.children[0];
            if (shell instanceof THREE.Mesh && 
                shell.material instanceof THREE.MeshPhongMaterial) {
              // Temporarily increase emissive intensity for flash effect
              const currentEmissive = shell.material.emissive.clone();
              shell.material.emissive.setRGB(
                currentEmissive.r + 0.3,
                currentEmissive.g + 0.3,
                currentEmissive.b + 0.3
              );
              
              // Reset emissive after short delay using animation system
              setTimeout(() => {
                if (shell.material instanceof THREE.MeshPhongMaterial) {
                  shell.material.emissive.copy(currentEmissive);
                }
              }, 100);
            }
          }
          
          // Make arc group flash on impact 
          if (mesh.children.length >= 7) {
            const arcGroup = mesh.children[6];
            if (arcGroup instanceof THREE.Group) {
              arcGroup.children.forEach((arc) => {
                if (arc instanceof THREE.Line && 
                    arc.material instanceof THREE.LineBasicMaterial) {
                  // Bright flash for hit effect
                  arc.material.opacity = 0.95;
                  
                  // Reset the flash timer if it exists
                  if ((arc as any).animData) {
                    (arc as any).animData.timeToNextFlash = 0.1 + Math.random() * 0.1;
                  }
                }
              });
            }
          }
        }
      }
    }
    
    // Decrement shield
    shield.currentShield -= 1;
    
    // If shield is depleted, remove the shield bubble and kill the guardian
    if (shield.currentShield <= 0) {
      // First remove the shield bubble
      this.world.removeEntity(shieldEntity);
      
      // Now destroy the guardian itself
      this.world.removeEntity(guardianEntity);
      
      // Create score entity if the HUD system is available
      const hudSystem = this.getHUDSystem();
      if (hudSystem && bubblePos) {
        createFloatingScore(this.world, bubblePos, 20); // 20 points for killing a Shield Guardian
        
        // Update the actual score in the HUD
        hudSystem.incrementScore(20);
      }
    }
    
    // Remove the projectile
    this.world.removeEntity(projectileEntity);
  }

  // Make this public for debugging
  public handlePlayerPowerUpCollision(playerEntity: number, powerUpEntity: number): void {
    // Debug logging
    console.log(`Collision detected between player ${playerEntity} and power-up ${powerUpEntity}`);
    
    // Make sure we have access to the power-up system
    if (!this.powerUpSystem) {
      // Try to find the power-up system in the world
      const systems = this.world.getSystems();
      for (const system of systems) {
        if (system instanceof PowerUpSystem) {
          this.powerUpSystem = system;
          break;
        }
      }
      
      // If still not found, we can't handle power-ups
      if (!this.powerUpSystem) {
        console.error("PowerUpSystem not found!");
        return;
      }
    }
    
    // Get the power-up type to display the correct message
    const powerUp = this.world.getComponent<PowerUp>(powerUpEntity, 'PowerUp');
    if (!powerUp) {
      return;
    }
    
    // Apply the power-up effect
    this.powerUpSystem.applyPowerUp(powerUpEntity, playerEntity);
    console.log("Power-up applied successfully");
    
    // Get HUD system for notifications
    const hudSystem = this.getHUDSystem();
    if (hudSystem) {
      // Display message based on power-up type
      if (powerUp.type === 'fireRate') {
        hudSystem.displayMessage("Double Fire Rate Power-Up Collected!", 2);
      } else if (powerUp.type === 'speed') {
        hudSystem.displayMessage("1.5x Speed Boost Power-Up Collected!", 2);
      } else if (powerUp.type === 'health') {
        hudSystem.displayMessage("Health Power-Up Collected! +20 HP", 2);
      }
    }
  }
} 