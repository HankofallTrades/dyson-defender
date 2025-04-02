import { World, System } from '../World';
import { Position, Health, Collider } from '../components';
import * as THREE from 'three';

export class DysonDamageZoneSystem implements System {
  private world: World;
  private damageTimer: number = 0;
  private readonly OUTER_DAMAGE_INTERVAL = 2; // 2 seconds between damage ticks
  private readonly OUTER_DAMAGE_AMOUNT = 10;
  private readonly INNER_DAMAGE_INTERVAL = 0.5; // 0.5 seconds between damage ticks
  private readonly INNER_DAMAGE_AMOUNT = 50;
  private readonly INNER_RADIUS = 20; // Distance for higher damage zone
  private wasInRadius: boolean = false; // Track if player was in radius last frame
  private wasInInnerRadius: boolean = false; // Track if player was in inner radius last frame

  constructor(world: World) {
    this.world = world;
  }

  update(deltaTime: number): void {
    // Find the player entity
    const playerEntities = this.world.getEntitiesWith(['Position', 'Health', 'InputReceiver']);
    if (playerEntities.length === 0) return;
    const playerEntity = playerEntities[0];

    // Find the Dyson sphere entity
    const dysonEntities = this.world.getEntitiesWith(['Position', 'Collider', 'Renderable']);
    let dysonEntity = -1;
    for (const entity of dysonEntities) {
      const renderable = this.world.getComponent<{ modelId: string }>(entity, 'Renderable');
      if (renderable && renderable.modelId === 'dysonSphere') {
        dysonEntity = entity;
        break;
      }
    }
    if (dysonEntity === -1) return;

    // Get necessary components
    const playerPos = this.world.getComponent<Position>(playerEntity, 'Position');
    const dysonPos = this.world.getComponent<Position>(dysonEntity, 'Position');
    const dysonCollider = this.world.getComponent<Collider>(dysonEntity, 'Collider');
    const playerHealth = this.world.getComponent<Health>(playerEntity, 'Health');

    if (!playerPos || !dysonPos || !dysonCollider || !playerHealth) return;

    // Calculate distance from player to Dyson sphere center
    const distance = new THREE.Vector3(
      playerPos.x - dysonPos.x,
      playerPos.y - dysonPos.y,
      playerPos.z - dysonPos.z
    ).length();

    // Get the Dyson sphere radius, default to 50 if not specified (matching DysonSphereEntity.ts)
    const dysonRadius = dysonCollider.radius || 50;

    // Check if player is within different radius zones
    const isInRadius = distance <= dysonRadius;
    const isInInnerRadius = distance <= this.INNER_RADIUS;

    if (isInInnerRadius) {
      // Apply immediate damage if just entered the inner radius
      if (!this.wasInInnerRadius) {
        playerHealth.current = Math.max(0, playerHealth.current - this.INNER_DAMAGE_AMOUNT);
        const hudEntities = this.world.getEntitiesWith(['UIDisplay', 'DamageEffect']);
        if (hudEntities.length > 0) {
          const hudEntity = hudEntities[0];
          const hudSystem = this.getHUDSystem();
          if (hudSystem) {
            hudSystem.activateDamageEffect(1.0, 0.5); // Higher intensity for inner zone
          }
        }
      }

      // Handle periodic damage for inner radius
      this.damageTimer += deltaTime;
      if (this.damageTimer >= this.INNER_DAMAGE_INTERVAL) {
        // Apply damage
        playerHealth.current = Math.max(0, playerHealth.current - this.INNER_DAMAGE_AMOUNT);
        
        // Get HUD system to trigger damage effect
        const hudEntities = this.world.getEntitiesWith(['UIDisplay', 'DamageEffect']);
        if (hudEntities.length > 0) {
          const hudEntity = hudEntities[0];
          const hudSystem = this.getHUDSystem();
          if (hudSystem) {
            hudSystem.activateDamageEffect(1.0, 0.5); // Higher intensity for inner zone
          }
        }

        // Reset timer
        this.damageTimer = 0;
      }
    } else if (isInRadius) {
      // Apply immediate damage if just entered the outer radius
      if (!this.wasInRadius) {
        playerHealth.current = Math.max(0, playerHealth.current - this.OUTER_DAMAGE_AMOUNT);
        const hudEntities = this.world.getEntitiesWith(['UIDisplay', 'DamageEffect']);
        if (hudEntities.length > 0) {
          const hudEntity = hudEntities[0];
          const hudSystem = this.getHUDSystem();
          if (hudSystem) {
            hudSystem.activateDamageEffect(0.8, 0.5);
          }
        }
      }

      // Handle periodic damage for outer radius
      this.damageTimer += deltaTime;
      if (this.damageTimer >= this.OUTER_DAMAGE_INTERVAL) {
        // Apply damage
        playerHealth.current = Math.max(0, playerHealth.current - this.OUTER_DAMAGE_AMOUNT);
        
        // Get HUD system to trigger damage effect
        const hudEntities = this.world.getEntitiesWith(['UIDisplay', 'DamageEffect']);
        if (hudEntities.length > 0) {
          const hudEntity = hudEntities[0];
          const hudSystem = this.getHUDSystem();
          if (hudSystem) {
            hudSystem.activateDamageEffect(0.8, 0.5);
          }
        }

        // Reset timer
        this.damageTimer = 0;
      }
    } else {
      // Reset timer when player is outside both radii
      this.damageTimer = 0;
    }

    // Update radius states for next frame
    this.wasInRadius = isInRadius;
    this.wasInInnerRadius = isInInnerRadius;
  }

  private getHUDSystem(): any {
    const systems = this.world.getSystems();
    for (const system of systems) {
      if (system.constructor.name === 'HUDSystem') {
        return system;
      }
    }
    return null;
  }
} 