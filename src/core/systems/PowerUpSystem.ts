import { World, System } from '../World';
import { Position, PowerUp, LaserCooldown, InputReceiver, Velocity, Health, ActivePowerUps } from '../components';
import { createFireRatePowerUp, createSpeedPowerUp, createHealthPowerUp, getRandomPowerUpType } from '../entities/PowerUpEntity';
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
    } else if (powerUpType === 'health') {
      createHealthPowerUp(this.world, powerUpPos);
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
    } else if (powerUp.type === 'health') {
      this.applyHealthPowerUp(playerEntity, powerUp);
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
    
    // Add or update the effect in ActivePowerUps
    let activePowerUps = this.world.getComponent<ActivePowerUps>(playerEntity, 'ActivePowerUps');
    if (!activePowerUps) {
      activePowerUps = { effects: {} };
      this.world.addComponent(playerEntity, 'ActivePowerUps', activePowerUps);
    }
    
    activePowerUps.effects['fireRate'] = {
      timeRemaining: powerUp.duration,
      duration: powerUp.duration
    };
  }
  
  /**
   * Apply speed power-up effect to increase player movement speed by 1.5x
   */
  private applySpeedPowerUp(playerEntity: number, powerUp: PowerUp): void {
    const inputReceiver = this.world.getComponent<InputReceiver>(playerEntity, 'InputReceiver');
    if (!inputReceiver) {
      return;
    }
    
    // Apply the speed multiplier directly to the Velocity component
    const velocity = this.world.getComponent<Velocity>(playerEntity, 'Velocity');
    if (velocity) {
      velocity.powerUpMultiplier = 1.5; // Set the power-up multiplier
    }
    
    // Add or update the effect in ActivePowerUps
    let activePowerUps = this.world.getComponent<ActivePowerUps>(playerEntity, 'ActivePowerUps');
    if (!activePowerUps) {
      activePowerUps = { effects: {} };
      this.world.addComponent(playerEntity, 'ActivePowerUps', activePowerUps);
    }
    
    activePowerUps.effects['speed'] = {
      timeRemaining: powerUp.duration,
      duration: powerUp.duration
    };
  }
  
  /**
   * Apply health power-up effect to give player 20 hit points
   */
  private applyHealthPowerUp(playerEntity: number, powerUp: PowerUp): void {
    // Get the player's health component
    const health = this.world.getComponent<Health>(playerEntity, 'Health');
    if (!health) {
      return;
    }
    
    // Add 20 hit points, but don't exceed max health
    health.current = Math.min(health.current + 20, health.max);
    
    // The health power-up has an instant effect, so it doesn't need to be tracked
    // We'll still set a very short duration just to show a notification briefly
    powerUp.active = true;
    powerUp.timeRemaining = powerUp.duration;
    
    // Add a short-lived PowerUp component to the player just for notification
    this.world.addComponent(playerEntity, 'PowerUp', {
      type: 'health',
      duration: 0.1,
      timeRemaining: 0.1,
      active: true
    });
  }
  
  /**
   * Update method called each frame to update power-up timers and effects
   */
  update(deltaTime: number): void {
    // Update uncollected power-ups
    const powerUpEntities = this.world.getEntitiesWith(['PowerUp']);
    for (const entity of powerUpEntities) {
      const powerUp = this.world.getComponent<PowerUp>(entity, 'PowerUp');
      if (!powerUp || powerUp.active) continue;
      
      // Handle uncollected power-up lifetime
      if (powerUp.lifetime !== undefined) {
        powerUp.lifetime -= deltaTime;
        if (powerUp.lifetime <= 0) {
          this.world.removeEntity(entity);
          continue;
        }
        
        // Add fade-out effect when nearing expiration
        if (powerUp.lifetime < 1.0) {
          const renderable = this.world.getComponent<any>(entity, 'Renderable');
          if (renderable && renderable.fadeOut !== false) {
            renderable.fadeOut = true;
            renderable.opacity = Math.max(0.2, powerUp.lifetime);
          }
        }
      }
    }
    
    // Update active power-ups on players
    const entitiesWithActivePowerUps = this.world.getEntitiesWith(['ActivePowerUps']);
    for (const entity of entitiesWithActivePowerUps) {
      const activePowerUps = this.world.getComponent<ActivePowerUps>(entity, 'ActivePowerUps');
      if (!activePowerUps) continue;
      
      // Update each active effect
      for (const [type, effect] of Object.entries(activePowerUps.effects)) {
        effect.timeRemaining -= deltaTime;
        
        // If effect expired, remove it and deactivate its benefits
        if (effect.timeRemaining <= 0) {
          delete activePowerUps.effects[type];
          this.deactivateEffect(entity, type);
        }
      }
      
      // Remove ActivePowerUps component if no effects remain
      if (Object.keys(activePowerUps.effects).length === 0) {
        this.world.removeComponent(entity, 'ActivePowerUps');
      }
    }
  }
  
  private deactivateEffect(entity: number, type: string): void {
    if (type === 'fireRate') {
      const laserCooldown = this.world.getComponent<LaserCooldown>(entity, 'LaserCooldown');
      if (laserCooldown && (laserCooldown as any).originalMax) {
        laserCooldown.max = (laserCooldown as any).originalMax;
        delete (laserCooldown as any).originalMax; // Clean up dynamic property
      }
    } else if (type === 'speed') {
      const velocity = this.world.getComponent<Velocity>(entity, 'Velocity');
      if (velocity) {
        velocity.powerUpMultiplier = 1.0; // Reset the power-up multiplier
      }
    }
    // Health power-up doesn't need cleanup as it's instant
  }
} 