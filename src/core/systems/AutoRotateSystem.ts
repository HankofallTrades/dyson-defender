// src/core/systems/AutoRotateSystem.ts
import { World, System } from '../World';
import { AutoRotate, Rotation, Renderable } from '../components';

export class AutoRotateSystem implements System {
  constructor(private world: World) {}

  update(deltaTime: number): void {
    const entities = this.world.getEntitiesWith(['AutoRotate', 'Rotation', 'Renderable']);
    
    for (const entity of entities) {
      const autoRotate = this.world.getComponent<AutoRotate>(entity, 'AutoRotate');
      const rotation = this.world.getComponent<Rotation>(entity, 'Rotation');
      const renderable = this.world.getComponent<Renderable>(entity, 'Renderable');
      
      if (!autoRotate || !rotation || !renderable) continue;
      
      // Update rotation values
      rotation.x += autoRotate.speedX * deltaTime;
      rotation.y += autoRotate.speedY * deltaTime;
      rotation.z += autoRotate.speedZ * deltaTime;
      
      // Apply rotation to mesh
      renderable.mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    }
  }
}