// src/core/systems/AutoRotateSystem.ts
import { World, System } from '../World';
import { AutoRotate, Rotation } from '../components';

export class AutoRotateSystem implements System {
  constructor(private world: World) {}

  update(deltaTime: number): void {
    // Only need AutoRotate and Rotation components, not Renderable
    const entities = this.world.getEntitiesWith(['AutoRotate', 'Rotation']);
    
    for (const entity of entities) {
      const autoRotate = this.world.getComponent<AutoRotate>(entity, 'AutoRotate');
      const rotation = this.world.getComponent<Rotation>(entity, 'Rotation');
      
      if (!autoRotate || !rotation) continue;
      
      // Update rotation values in the component
      rotation.x += autoRotate.speedX * deltaTime;
      rotation.y += autoRotate.speedY * deltaTime;
      rotation.z += autoRotate.speedZ * deltaTime;
      
      // No direct mesh manipulation here - RenderingSystem will handle that
    }
  }
}