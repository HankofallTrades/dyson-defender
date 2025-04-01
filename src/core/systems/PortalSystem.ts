import { World, System } from '../World';
import { Position, Portal } from '../components';

/**
 * PortalSystem
 * 
 * Purpose:
 * Handles portal interactions and teleportation between games.
 * 
 * Responsibilities:
 * - Detects player collisions with portals
 * - Handles portal entry and exit
 * - Manages portal state and transitions
 */
export class PortalSystem implements System {
  private world: World;
  private lastPortalEntry: number = 0;
  private readonly PORTAL_COOLDOWN: number = 2000; // 2 seconds cooldown between portal entries

  constructor(world: World) {
    this.world = world;
  }

  public update(deltaTime: number): void {
    // Get all portal entities
    const portalEntities = this.world.getEntitiesWith(['Portal', 'Position']);
    
    // Get player entity
    const playerEntities = this.world.getEntitiesWith(['InputReceiver', 'Position']);
    if (playerEntities.length === 0) return;
    
    const playerEntity = playerEntities[0];
    const playerPosition = this.world.getComponent<Position>(playerEntity, 'Position');
    if (!playerPosition) return;

    // Check each portal for collision with player
    for (const portalEntity of portalEntities) {
      const portal = this.world.getComponent<Portal>(portalEntity, 'Portal');
      const portalPosition = this.world.getComponent<Position>(portalEntity, 'Position');
      
      if (!portal || !portalPosition || !portal.isActive) continue;

      // Calculate distance between player and portal
      const dx = playerPosition.x - portalPosition.x;
      const dy = playerPosition.y - portalPosition.y;
      const dz = playerPosition.z - portalPosition.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Check if player is within portal radius
      if (distance <= portal.radius) {
        const currentTime = Date.now();
        if (currentTime - this.lastPortalEntry >= this.PORTAL_COOLDOWN) {
          this.handlePortalEntry(portal, playerPosition);
          this.lastPortalEntry = currentTime;
        }
      }
    }
  }

  private handlePortalEntry(portal: Portal, playerPosition: Position): void {
    // Construct the target URL with parameters
    const params = new URLSearchParams({
      x: playerPosition.x.toString(),
      y: playerPosition.y.toString(),
      z: playerPosition.z.toString(),
      portal: 'true',
      type: portal.type,
      label: portal.label
    });

    // Add any additional parameters from the portal's targetUrl
    if (portal.targetUrl) {
      const targetUrl = new URL(portal.targetUrl);
      targetUrl.searchParams.forEach((value, key) => {
        if (!params.has(key)) {
          params.append(key, value);
        }
      });
    }

    // Redirect to the target URL
    window.location.href = `${portal.targetUrl}?${params.toString()}`;
  }

  public dispose(): void {
    // Clean up any resources if needed
  }
} 