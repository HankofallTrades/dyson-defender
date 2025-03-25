import * as THREE from 'three';
import { World, System } from '../World';
import { Position, Collider, Projectile, Health, Enemy, InputReceiver, Shield } from '../components';
import { HUDSystem } from './HUDSystem';

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

  constructor(world: World) {
    this.world = world;
    
    // Set up collision matrix - which layers can collide with which
    this.collisionMatrix = new Map();
    this.collisionMatrix.set('projectile', ['enemy', 'dysonSphere', 'player']);
    this.collisionMatrix.set('enemy', ['player', 'projectile', 'dysonSphere']);
    this.collisionMatrix.set('player', ['enemy', 'projectile']);
    this.collisionMatrix.set('dysonSphere', ['enemy']);
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
    
    // Handle projectile collision
    if (colliderA.layer === 'projectile' && this.collisionMatrix.get('projectile')?.includes(colliderB.layer)) {
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
  }
  
  private handleEnemyDysonSphereCollision(enemyEntity: number, dysonSphereEntity: number): void {
    // Get enemy properties
    const enemy = this.world.getComponent<Enemy>(enemyEntity, 'Enemy');
    if (!enemy) return;
    
    // Check for shield first
    const shield = this.world.getComponent<Shield>(dysonSphereEntity, 'Shield');
    const health = this.world.getComponent<Health>(dysonSphereEntity, 'Health');
    
    if (!health) return;
    
    // Damage logic - shield first, then health
    if (shield && shield.current > 0) {
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
    
    // Check if this is the Dyson Sphere (which has both shield and health)
    if (this.isDysonSphere(targetEntity)) {
      const shield = this.world.getComponent<Shield>(targetEntity, 'Shield');
      const health = this.world.getComponent<Health>(targetEntity, 'Health');
      
      if (health) {
        // Damage logic - shield first, then health
        if (shield && shield.current > 0) {
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
            
            // Display hit message
            hudSystem.displayMessage(`Hit by projectile! -${projectile.damage} health`, 1.5);
            
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
        
        // Check if entity is destroyed
        if (health.current <= 0) {
          // If this is an enemy, update the score
          if (this.world.hasComponent(targetEntity, 'Enemy')) {
            if (hudSystem) {
              // Add score based on enemy type (10 points per enemy)
              hudSystem.incrementScore(10);
              hudSystem.displayMessage("Enemy destroyed! +10 points", 1.5);
            }
          }
          
          // Remove the destroyed entity
          this.world.removeEntity(targetEntity);
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
      
      // Display hit message
      hudSystem.displayMessage(`Hit by enemy! -${enemy.damage} health`, 1.5);
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
} 