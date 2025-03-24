// src/core/World.ts
type Entity = number;

export interface System {
  update(deltaTime: number): void;
}

export class World {
  private nextEntityId: Entity = 0;
  private components: Map<string, Map<Entity, any>> = new Map();
  private systems: System[] = [];
  private activeEntities: Set<Entity> = new Set();

  public createEntity(): Entity {
    const entity = this.nextEntityId++;
    this.activeEntities.add(entity);
    console.log('World: Created entity:', entity);
    return entity;
  }

  public hasEntity(entity: Entity): boolean {
    return this.activeEntities.has(entity);
  }

  public addComponent<T>(entity: Entity, componentType: string, component: T): void {
    console.log('World: Adding component', componentType, 'to entity:', entity);
    if (!this.components.has(componentType)) {
      this.components.set(componentType, new Map());
    }
    this.components.get(componentType)!.set(entity, component);
  }

  public getComponent<T>(entity: Entity, componentType: string): T | undefined {
    const component = this.components.get(componentType)?.get(entity);
    console.log('World: Getting component', componentType, 'for entity:', entity, ':', component);
    return component;
  }

  public hasComponent(entity: Entity, componentType: string): boolean {
    const has = this.components.get(componentType)?.has(entity) || false;
    console.log('World: Checking if entity', entity, 'has component', componentType, ':', has);
    return has;
  }

  public getEntitiesWith(componentTypes: string[]): Entity[] {
    console.log('World: Getting entities with components:', componentTypes);
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
    console.log('World: Found entities with components:', result);
    return result;
  }

  public addSystem(system: System): void {
    console.log('World: Adding system:', system.constructor.name);
    this.systems.push(system);
  }

  public update(deltaTime: number): void {
    console.log('World: Updating systems with deltaTime:', deltaTime);
    for (const system of this.systems) {
      console.log(`World: Calling update on system: ${system.constructor.name}`);
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
}