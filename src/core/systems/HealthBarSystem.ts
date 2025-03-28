import { World, System } from '../World';
import { Health, HealthBarComponent } from '../components';

export class HealthBarSystem implements System {
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  update(deltaTime: number): void {
    // Find all entities with both HealthBarComponent and Health components
    const entities = this.world.getEntitiesWith(['HealthBarComponent', 'Health']);
    
    for (const entity of entities) {
      const healthBar = this.world.getComponent<HealthBarComponent>(entity, 'HealthBarComponent');
      const health = this.world.getComponent<Health>(entity, 'Health');
      
      if (!healthBar || !health) continue;
      
      // Check if this health bar should only show when damaged
      if (healthBar.showWhenDamaged) {
        // Show health bar if health is less than max
        const isDamaged = health.current < health.max;
        healthBar.visible = isDamaged;
      }
    }
  }
} 