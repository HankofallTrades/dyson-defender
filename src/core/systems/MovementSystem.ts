// src/core/systems/MovementSystem.ts
import { System, World } from '../World';
import { Position, Velocity, InputReceiver, Rotation, Boost } from '../components';
import { SceneManager } from '../../rendering/SceneManager';
import { InputManager } from '../input/InputManager';
import * as THREE from 'three';

export class MovementSystem implements System {
  private sceneManager: SceneManager;
  private world: World;
  private inputManager: InputManager;
  private readonly MIN_VELOCITY = 0.01; // Threshold for considering movement
  private readonly MIN_DISTANCE = 20; // Minimum distance from Dyson Sphere
  private readonly MAX_DISTANCE = 400; // Maximum distance from Dyson Sphere (increased to 400)

  constructor(sceneManager: SceneManager, world: World) {
    this.sceneManager = sceneManager;
    this.world = world;
    
    // Get the renderer DOM element for input handling
    const rendererElement = sceneManager.getRendererDomElement();
    this.inputManager = InputManager.getInstance(rendererElement);
  }

  update(deltaTime: number): void {
    if (deltaTime === 0) {
      return;
    }
    
    if (deltaTime > 0.1) {
      deltaTime = 0.1; // Cap delta time to prevent huge jumps
    }
    
    const entities = this.world.getEntitiesWith(['Position', 'Velocity', 'Rotation']);
    
    if (entities.length === 0) {
      return;
    }
    
    // Get current input state for boost checking
    const inputState = this.inputManager.getInputState();
    
    for (const entity of entities) {
      const position = this.world.getComponent<Position>(entity, 'Position');
      const velocity = this.world.getComponent<Velocity>(entity, 'Velocity');
      const rotation = this.world.getComponent<Rotation>(entity, 'Rotation');

      if (!position || !velocity) {
        continue;
      }

      // Update boost state (only for player with InputReceiver)
      const hasInputReceiver = this.world.hasComponent(entity, 'InputReceiver');
      if (hasInputReceiver) {
        this.updateBoostState(entity, deltaTime, inputState.boost);
      }

      // Apply boost to velocity if active
      let speedMultiplier = 1.0;
      if (hasInputReceiver) {
        const boost = this.world.getComponent<Boost>(entity, 'Boost');
        if (boost && boost.active) {
          speedMultiplier = boost.speedMultiplier;
        }
      }

      // Check if there's any significant movement to apply
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);
      const hasVelocity = speed > this.MIN_VELOCITY;
      
      if (hasVelocity) {
        // Apply velocity with boost multiplier if active
        const dx = velocity.x * deltaTime * speedMultiplier;
        const dy = velocity.y * deltaTime * speedMultiplier;
        const dz = velocity.z * deltaTime * speedMultiplier;
        
        // Apply movement
        position.x += dx;
        position.y += dy;
        position.z += dz;
      }

      // Apply friction (only to entities with InputReceiver)
      if (hasInputReceiver && hasVelocity) {
        const friction = 0.95;
        velocity.x *= friction;
        velocity.y *= friction;
        velocity.z *= friction;
        
        // If velocity becomes too small, zero it out to prevent tiny movements
        if (Math.abs(velocity.x) < this.MIN_VELOCITY) velocity.x = 0;
        if (Math.abs(velocity.y) < this.MIN_VELOCITY) velocity.y = 0;
        if (Math.abs(velocity.z) < this.MIN_VELOCITY) velocity.z = 0;
      }

      // Skip distance constraints for projectiles
      const isProjectile = this.world.hasComponent(entity, 'Projectile');
      if (isProjectile) {
        continue;
      }

      // Check if we need to enforce distance constraints
      const distanceFromCenter = Math.sqrt(
        position.x * position.x + 
        position.y * position.y + 
        position.z * position.z
      );

      if (distanceFromCenter < this.MIN_DISTANCE) {
        // Too close to center, push outward
        const scale = this.MIN_DISTANCE / distanceFromCenter;
        position.x *= scale;
        position.y *= scale;
        position.z *= scale;
      } else if (distanceFromCenter > this.MAX_DISTANCE) {
        // Too far from center, pull inward
        const scale = this.MAX_DISTANCE / distanceFromCenter;
        position.x *= scale;
        position.y *= scale;
        position.z *= scale;
      }
    }
  }
  
  /**
   * Updates the boost state for an entity
   * @param entity The entity to update boost for
   * @param deltaTime Time since last update
   * @param boostKeyPressed Whether the boost key is currently pressed
   */
  private updateBoostState(entity: number, deltaTime: number, boostKeyPressed: boolean): void {
    // Get or create the Boost component
    let boost = this.world.getComponent<Boost>(entity, 'Boost');
    if (!boost) {
      boost = {
        active: false,
        remaining: 1.0, // 1 second of boost (changed from 3.0)
        maxTime: 1.0,   // 1 second total (changed from 3.0)
        cooldown: 0,
        speedMultiplier: 1.75 // 75% speed increase
      };
      this.world.addComponent(entity, 'Boost', boost);
    }
    
    // Track if we just released the boost key
    const wasActive = boost.active;
    
    // Handle boost activation/deactivation
    if (boostKeyPressed && boost.cooldown <= 0 && boost.remaining > 0) {
      boost.active = true;
    } else if (!boostKeyPressed && boost.active) {
      // We just released the boost key - enter charging state
      boost.active = false;
      
      // Calculate cooldown time proportional to how much boost was used
      // Full depletion (1.0 second used) = 3.0 seconds cooldown
      const boostUsed = boost.maxTime - boost.remaining;
      const maxCooldown = 3.0; // Changed from 5.0 to 3.0
      boost.cooldown = (boostUsed / boost.maxTime) * maxCooldown;
    } else if (!boostKeyPressed) {
      boost.active = false;
    }
    
    // Handle boost consumption and recharging
    if (boost.active) {
      // Deplete boost at a constant rate
      const depletionRate = boost.maxTime / 1; // Fully depletes in 1 second (changed from 3)
      boost.remaining = Math.max(0, boost.remaining - deltaTime * depletionRate);
      
      // If boost is completely depleted, deactivate it and start cooldown
      if (boost.remaining <= 0) {
        boost.remaining = 0;
        boost.active = false;
        boost.cooldown = 3.0; // 3 second cooldown when fully depleted (changed from 5.0)
      }
    } else if (boost.cooldown > 0) {
      // Handle cooldown after depletion or release
      boost.cooldown = Math.max(0, boost.cooldown - deltaTime);
      
      // Once cooldown is complete, fully restore boost
      if (boost.cooldown <= 0) {
        boost.cooldown = 0;
        boost.remaining = boost.maxTime; // Start with full boost when cooldown completes
      }
    }
    
    // Update game state for HUD display
    const gameState = this.world.getGameState();
    if (gameState) {
      gameState.boostActive = boost.active;
      gameState.boostRemaining = boost.remaining;
      gameState.boostCooldown = boost.cooldown;
    }
  }
}