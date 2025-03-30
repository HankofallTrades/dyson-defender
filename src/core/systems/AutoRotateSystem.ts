// src/core/systems/AutoRotateSystem.ts
import { World, System } from '../World';
import { Rotation, AutoRotate } from '../components';

/**
 * Responsible for auto-rotating entities
 * This is used for the Dyson Sphere, starfield background, and other effects
 */
export class AutoRotateSystem implements System {
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  public update(deltaTime: number): void {
    // Get all entities with Rotation and AutoRotate components
    const entities = this.world.getEntitiesWith(['Rotation', 'AutoRotate']);

    for (const entity of entities) {
      const rotation = this.world.getComponent<Rotation>(entity, 'Rotation');
      const autoRotate = this.world.getComponent<AutoRotate>(entity, 'AutoRotate');

      if (!rotation || !autoRotate) continue;

      // Update rotation based on speeds and delta time
      rotation.x += autoRotate.speedX * deltaTime;
      rotation.y += autoRotate.speedY * deltaTime;
      rotation.z += autoRotate.speedZ * deltaTime;

      // Normalize rotation values between 0 and 2π to prevent overflow
      rotation.x %= Math.PI * 2;
      rotation.y %= Math.PI * 2;
      rotation.z %= Math.PI * 2;
    }
  }
}