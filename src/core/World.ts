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
  private componentVersion = 0;
  private queryCache: Map<string, { version: number; entities: Entity[] }> = new Map();

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
    const componentMap = this.components.get(componentType)!;
    const hadComponent = componentMap.has(entity);
    componentMap.set(entity, component);

    if (!hadComponent) {
      this.componentVersion++;
    }
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
    if (componentTypes.length === 0) {
      return [];
    }

    const normalizedTypes = [...componentTypes].sort();
    const cacheKey = normalizedTypes.join('|');
    const cached = this.queryCache.get(cacheKey);
    if (cached && cached.version === this.componentVersion) {
      return cached.entities;
    }

    let seedMap: Map<Entity, any> | null = null;
    for (const type of normalizedTypes) {
      const componentMap = this.components.get(type);
      if (!componentMap) {
        this.queryCache.set(cacheKey, { version: this.componentVersion, entities: [] });
        return [];
      }

      if (!seedMap || componentMap.size < seedMap.size) {
        seedMap = componentMap;
      }
    }

    if (!seedMap) {
      return [];
    }

    const entities: Entity[] = [];
    for (const entity of seedMap.keys()) {
      let matches = true;
      for (const type of normalizedTypes) {
        if (!this.components.get(type)?.has(entity)) {
          matches = false;
          break;
        }
      }

      if (matches) {
        entities.push(entity);
      }
    }

    this.queryCache.set(cacheKey, { version: this.componentVersion, entities });
    return entities;
  }

  public addSystem(system: System): void {
    this.systems.push(system);
  }

  /**
   * Get all systems currently registered with the world
   * @returns Array of all systems
   */
  public getSystems(): System[] {
    return this.systems;
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

      this.componentVersion++;
    }
  }
  
  public removeComponent(entity: Entity, componentType: string): void {
    const componentMap = this.components.get(componentType);
    if (componentMap && componentMap.delete(entity)) {
      this.componentVersion++;
    }
  }
  
  public setGameState(gameState: GameState): void {
    this.gameState = gameState;
  }
  
  public getGameState(): GameState | null {
    return this.gameState;
  }
}
