// src/core/systems/MovementSystem.ts
import { System, World } from '../World';
import { Position, Velocity, InputReceiver, Rotation } from '../components';
import { SceneManager } from '../../rendering/SceneManager';
import * as THREE from 'three';

export class MovementSystem implements System {
  private sceneManager: SceneManager;
  private world: World;
  private readonly MIN_VELOCITY = 0.01; // Threshold for considering movement
  private readonly MIN_DISTANCE = 20; // Minimum distance from Dyson Sphere
  private readonly MAX_DISTANCE = 100; // Maximum distance from Dyson Sphere

  constructor(sceneManager: SceneManager, world: World) {
    this.sceneManager = sceneManager;
    this.world = world;
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
    
    for (const entity of entities) {
      const position = this.world.getComponent<Position>(entity, 'Position');
      const velocity = this.world.getComponent<Velocity>(entity, 'Velocity');
      const rotation = this.world.getComponent<Rotation>(entity, 'Rotation');

      if (!position || !velocity) {
        continue;
      }

      // Check if there's any significant movement to apply
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);
      const hasVelocity = speed > this.MIN_VELOCITY;
      
      if (hasVelocity) {
        // The direction is already transformed in InputSystem, so we just apply it directly
        const dx = velocity.x * deltaTime;
        const dy = velocity.y * deltaTime;
        const dz = velocity.z * deltaTime;
        
        // Apply movement
        position.x += dx;
        position.y += dy;
        position.z += dz;
      }

      // Apply friction (only to entities with InputReceiver)
      const hasInputReceiver = this.world.hasComponent(entity, 'InputReceiver');
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
}