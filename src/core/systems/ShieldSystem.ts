import { World } from '../World';
import { Shield } from '../components';

export class ShieldSystem {
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  update(deltaTime: number): void {
    const entities = this.world.getEntitiesWith(['Shield']);
    const currentTime = performance.now() / 1000; // Convert to seconds

    for (const entity of entities) {
      const shield = this.world.getComponent<Shield>(entity, 'Shield');
      if (!shield) continue;
      
      // Skip if shield is already at max
      if (shield.current >= shield.max) {
        shield.isRegenerating = false;
        continue;
      }

      // Check if enough time has passed since last hit
      const timeSinceHit = currentTime - shield.lastHitTime;
      if (timeSinceHit >= shield.regenDelay) {
        shield.isRegenerating = true;
        // Regenerate shield
        shield.current = Math.min(
          shield.max,
          shield.current + (shield.regenRate * deltaTime)
        );
      }
    }
  }

  // Call this when a shield takes damage
  onShieldHit(entity: number): void {
    const shield = this.world.getComponent<Shield>(entity, 'Shield');
    if (!shield) return;
    
    shield.lastHitTime = performance.now() / 1000;
    shield.isRegenerating = false;
  }
} 