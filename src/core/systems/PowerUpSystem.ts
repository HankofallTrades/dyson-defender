import { World, System } from '../World';
import { Position, PowerUp, LaserCooldown, InputReceiver, Velocity } from '../components';
import { createFireRatePowerUp, createSpeedPowerUp, getRandomPowerUpType } from '../entities/PowerUpEntity';
import * as THREE from 'three';

/**
 * PowerUpSystem
 * 
 * Handles the spawning, collection, and effect application of power-ups
 */
export class PowerUpSystem implements System {
  private world: World;
  private scene: THREE.Scene;
  
  constructor(world: World, scene: THREE.Scene) {
    this.world = world;
    this.scene = scene;
  }
  
  /**
   * Spawn a power-up at the given position (e.g., where an enemy was destroyed)
   */
  public spawnPowerUpAtPosition(position: Position): void {
    // Create a clone of the position to ensure we're not affected by reference changes
    const powerUpPos = {
      x: position.x,
      y: position.y,
      z: position.z
    };
    
    // Randomly choose which power-up to spawn
    const powerUpType = getRandomPowerUpType();
    
    // Create the appropriate power-up at this position
    if (powerUpType === 'fireRate') {
      createFireRatePowerUp(this.world, powerUpPos);
    } else if (powerUpType === 'speed') {
      createSpeedPowerUp(this.world, powerUpPos);
    }
  }
  
  /**
   * Apply a power-up effect to the player
   */
  public applyPowerUp(powerUpEntity: number, playerEntity: number): void {
    const powerUp = this.world.getComponent<PowerUp>(powerUpEntity, 'PowerUp');
    if (!powerUp) {
      return;
    }
    
    // Handle different power-up types
    if (powerUp.type === 'fireRate') {
      this.applyFireRatePowerUp(playerEntity, powerUp);
    } else if (powerUp.type === 'speed') {
      this.applySpeedPowerUp(playerEntity, powerUp);
    }
    
    // Remove the power-up entity after collection
    this.world.removeEntity(powerUpEntity);
  }
  
  /**
   * Apply fire rate power-up effect
   */
  private applyFireRatePowerUp(playerEntity: number, powerUp: PowerUp): void {
    const laserCooldown = this.world.getComponent<LaserCooldown>(playerEntity, 'LaserCooldown');
    if (!laserCooldown) {
      return;
    }
    
    // Store the original cooldown if this is the first time applying this power-up
    if (!(laserCooldown as any).originalMax) {
      (laserCooldown as any).originalMax = laserCooldown.max;
    }
    
    // Double fire rate by halving the cooldown time
    laserCooldown.max = (laserCooldown as any).originalMax / 2;
    
    // Reset current cooldown to allow immediate firing
    laserCooldown.current = 0;
    
    // Activate power-up and set duration
    powerUp.active = true;
    powerUp.timeRemaining = powerUp.duration;
    
    // Add the PowerUp component to the player to track its duration
    this.world.addComponent(playerEntity, 'PowerUp', {
      type: 'fireRate',
      duration: powerUp.duration,
      timeRemaining: powerUp.duration,
      active: true
    });
  }
  
  /**
   * Apply speed power-up effect to increase player movement speed by 1.5x
   */
  private applySpeedPowerUp(playerEntity: number, powerUp: PowerUp): void {
    // Get InputSystem's BASE_SPEED indirectly through an InputReceiver entity
    const inputReceiver = this.world.getComponent<InputReceiver>(playerEntity, 'InputReceiver');
    if (!inputReceiver) {
      return;
    }
    
    // Store original velocity multiplier if not already stored
    const velocity = this.world.getComponent<Velocity>(playerEntity, 'Velocity');
    if (velocity && !(velocity as any).originalMultiplier) {
      (velocity as any).originalMultiplier = 1.0;
      (velocity as any).speedBoostActive = true;
    }
    
    // Activate power-up and set duration
    powerUp.active = true;
    powerUp.timeRemaining = powerUp.duration;
    
    // Add the PowerUp component to the player to track its duration
    this.world.addComponent(playerEntity, 'PowerUp', {
      type: 'speed',
      duration: powerUp.duration,
      timeRemaining: powerUp.duration,
      active: true
    });
  }
  
  /**
   * Update method called each frame to update power-up timers and effects
   */
  update(deltaTime: number): void {
    // Update active power-ups
    const entitiesWithPowerUps = this.world.getEntitiesWith(['PowerUp']);
    
    for (const entity of entitiesWithPowerUps) {
      const powerUp = this.world.getComponent<PowerUp>(entity, 'PowerUp');
      if (!powerUp) continue;
      
      if (powerUp.active) {
        // Decrease the time remaining for active power-ups
        powerUp.timeRemaining -= deltaTime;
        
        // Check if the power-up has expired
        if (powerUp.timeRemaining <= 0) {
          this.deactivatePowerUp(entity, powerUp);
        }
      } else {
        // For inactive power-ups (not collected yet), check lifetime
        if (powerUp.lifetime !== undefined) {
          // Decrease lifetime
          powerUp.lifetime -= deltaTime;
          
          // If lifetime has expired, remove the power-up
          if (powerUp.lifetime <= 0) {
            this.world.removeEntity(entity);
          }
          
          // Add a fade-out effect when nearing expiration
          if (powerUp.lifetime < 1.0) {
            const renderable = this.world.getComponent<any>(entity, 'Renderable');
            if (renderable && renderable.fadeOut !== false) {
              renderable.fadeOut = true;
              renderable.opacity = Math.max(0.2, powerUp.lifetime);
            }
          }
        }
      }
    }
  }
  
  /**
   * Deactivate an expired power-up
   */
  private deactivatePowerUp(entity: number, powerUp: PowerUp): void {
    // Set power-up as inactive
    powerUp.active = false;
    
    // Handle different power-up types
    if (powerUp.type === 'fireRate') {
      // Only handle if this is the player entity (has LaserCooldown)
      if (this.world.hasComponent(entity, 'LaserCooldown')) {
        const laserCooldown = this.world.getComponent<LaserCooldown>(entity, 'LaserCooldown');
        if (laserCooldown && (laserCooldown as any).originalMax) {
          // Restore original cooldown
          laserCooldown.max = (laserCooldown as any).originalMax;
        }
      }
    } else if (powerUp.type === 'speed') {
      // Only handle if this is the player entity (has InputReceiver)
      if (this.world.hasComponent(entity, 'InputReceiver')) {
        const velocity = this.world.getComponent<Velocity>(entity, 'Velocity');
        if (velocity && (velocity as any).speedBoostActive) {
          // Mark the speed boost as inactive
          (velocity as any).speedBoostActive = false;
        }
      }
    }
    
    // If this is a power-up entity (not the player), remove it
    if (!this.world.hasComponent(entity, 'InputReceiver')) {
      this.world.removeEntity(entity);
    } else {
      // If it's the player, just remove the power-up component
      this.world.removeComponent(entity, 'PowerUp');
    }
  }
} 