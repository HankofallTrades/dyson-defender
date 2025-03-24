// src/core/World.ts
type Entity = number;

export interface System {
  update(deltaTime: number): void;
}

export class World {
  private nextEntityId: Entity = 0;
  private components: Map<string, Map<Entity, any>> = new Map();
  private systems: System[] = [];

  public createEntity(): Entity {
    return this.nextEntityId++;
  }

  public addComponent<T>(entity: Entity, componentType: string, component: T): void {
    if (!this.components.has(componentType)) {
      this.components.set(componentType, new Map());
    }
    this.components.get(componentType)!.set(entity, component);
  }

  public getComponent<T>(entity: Entity, componentType: string): T | undefined {
    return this.components.get(componentType)?.get(entity);
  }

  public hasComponent(entity: Entity, componentType: string): boolean {
    return this.components.get(componentType)?.has(entity) || false;
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
    return Array.from(entities);
  }

  public addSystem(system: System): void {
    this.systems.push(system);
  }

  public update(deltaTime: number): void {
    for (const system of this.systems) {
      system.update(deltaTime);
    }
  }
}