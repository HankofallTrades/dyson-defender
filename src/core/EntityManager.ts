import * as THREE from 'three';
import { SceneManager } from '../rendering/SceneManager';

/**
 * Entity-Component-System Manager
 * 
 * Purpose:
 * Implements the Entity-Component-System pattern, providing a flexible and scalable
 * system for managing game entities and their behaviors.
 * 
 * Responsibilities:
 * - Tracks all game entities
 * - Updates entities each frame
 * - Manages entity lifecycle (creation, updates, disposal)
 * - Provides entity querying and management
 * - Coordinates entity interactions
 * 
 * This class follows the design-patterns.mdc rule by implementing the ECS pattern,
 * which provides flexibility and scalability for managing game entities and their
 * behaviors efficiently.
 */

// Base Entity interface
export interface Entity {
  id: string;
  update(deltaTime: number): void;
  dispose(): void;
}

// Entity Manager to handle all game entities
export class EntityManager {
  private static instance: EntityManager | null = null;
  private entities: Map<string, Entity> = new Map();
  private sceneManager: SceneManager;
  
  private constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
  }
  
  public static getInstance(sceneManager: SceneManager): EntityManager {
    if (!EntityManager.instance) {
      EntityManager.instance = new EntityManager(sceneManager);
    }
    return EntityManager.instance;
  }
  
  public addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
  }
  
  public removeEntity(id: string): void {
    const entity = this.entities.get(id);
    if (entity) {
      entity.dispose();
      this.entities.delete(id);
    }
  }
  
  public getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }
  
  public updateEntities(deltaTime: number): void {
    for (const entity of this.entities.values()) {
      entity.update(deltaTime);
    }
  }
  
  public dispose(): void {
    for (const entity of this.entities.values()) {
      entity.dispose();
    }
    this.entities.clear();
    EntityManager.instance = null;
  }
} 