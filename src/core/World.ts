// src/core/World.ts
import { GameState } from './State';

type Entity = number;

export interface System {
  update(deltaTime: number): void;
}

export class World {
  private nextEntityId: Entity = 0;
  private components: Map<string, Map<Entity, any>> = new Map();
  private systems: System[] = [];
  private activeEntities: Set<Entity> = new Set();
  private gameState: GameState | null = null;

  public createEntity(): Entity {
    const entity = this.nextEntityId++;
    this.activeEntities.add(entity);
    return entity;
  }

  public hasEntity(entity: Entity): boolean {
    return this.activeEntities.has(entity);
  }

  public addComponent<T>(entity: Entity, componentType: string, component: T): void {
    if (!this.components.has(componentType)) {
      this.components.set(componentType, new Map());
    }
    this.components.get(componentType)!.set(entity, component);
  }

  public getComponent<T>(entity: Entity, componentType: string): T | undefined {
    const component = this.components.get(componentType)?.get(entity);
    return component;
  }

  public hasComponent(entity: Entity, componentType: string): boolean {
    const has = this.components.get(componentType)?.has(entity) || false;
    return has;
  }

  public getEntitiesWith(componentTypes: string[]): Entity[] {
    const entities = new Set<Entity>();
    for (const type of componentTypes) {
      const componentMap = this.components.get(type);
      if (componentMap) {
        for (const entity of componentMap.keys()) {
          if (componentTypes.every(t => this.hasComponent(entity, t))) {
            entities.add(entity);
          }
        }
      }
    }
    const result = Array.from(entities);
    return result;
  }

  public addSystem(system: System): void {
    this.systems.push(system);
  }

  public update(deltaTime: number): void {
    for (const system of this.systems) {
      try {
        system.update(deltaTime);
      } catch (error) {
        console.error(`Error in ${system.constructor.name}.update:`, error);
      }
    }
  }

  public getActiveEntities(): Set<Entity> {
    return this.activeEntities;
  }

  public removeEntity(entity: Entity): void {
    if (this.activeEntities.has(entity)) {
      this.activeEntities.delete(entity);
      
      // Remove entity from all component maps
      for (const componentMap of this.components.values()) {
        componentMap.delete(entity);
      }
    }
  }
  
  public removeComponent(entity: Entity, componentType: string): void {
    const componentMap = this.components.get(componentType);
    if (componentMap) {
      componentMap.delete(entity);
    }
  }
  
  public setGameState(gameState: GameState): void {
    this.gameState = gameState;
  }
  
  public getGameState(): GameState | null {
    return this.gameState;
  }
}