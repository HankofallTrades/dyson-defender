import * as THREE from 'three';
import { World, System } from '../World'; // Assuming System interface/type exists
import { SceneManager } from '../../rendering/SceneManager'; // Adjust path if needed
import { Position, ScreenPosition, FloatingScore, HealthBarComponent, ShieldBarComponent } from '../components'; // Adjust path if needed

export class UISystem implements System {
  private world: World;
  private sceneManager: SceneManager;
  private screenWidth: number;
  private screenHeight: number;
  private tempVector = new THREE.Vector3(); // Reuse vector object

  constructor(world: World, sceneManager: SceneManager) {
    this.world = world;
    this.sceneManager = sceneManager;
    // Initialize screen dimensions (these might need updating if the screen resizes)
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
    // TODO: Add resize listener to update screenWidth/screenHeight
  }

  private calculateScreenPosition(worldPosition: Position, camera: THREE.Camera): { x: number; y: number; isOnScreen: boolean } | null {
    this.tempVector.set(worldPosition.x, worldPosition.y, worldPosition.z);
    this.tempVector.project(camera);

    // Check if the object is behind the camera (z > 1 in NDC)
    // Also check if it's outside the normalized device coordinates [-1, 1]
    const isOnScreen =
      this.tempVector.z <= 1 && // Not behind the camera
      this.tempVector.x >= -1 && this.tempVector.x <= 1 &&
      this.tempVector.y >= -1 && this.tempVector.y <= 1;

    // Convert Normalized Device Coordinates (NDC) to screen pixels
    // NDC range is [-1, 1], screen range is [0, width] and [0, height]
    // Origin is top-left for screen coordinates
    const x = ((this.tempVector.x + 1) / 2) * this.screenWidth;
    const y = ((-this.tempVector.y + 1) / 2) * this.screenHeight; // Y is inverted

    return { x, y, isOnScreen };
  }

  update(deltaTime: number): void {
    const camera = this.sceneManager.getCamera();
    if (!camera) return;

    // Ensure camera matrices are up-to-date.
    // updateMatrixWorld() is usually called by the renderer, but doing it here ensures
    // we have the latest matrix before projection, especially if the camera moved this frame.
    camera.updateMatrixWorld(true);

    // --- Update ScreenPosition for relevant entities ---

    const entitiesToUpdate = new Set([
        ...this.world.getEntitiesWith(['FloatingScore', 'Position']),
        ...this.world.getEntitiesWith(['HealthBarComponent', 'Position']),
        ...this.world.getEntitiesWith(['ShieldBarComponent', 'Position'])
    ]);

    for (const entity of entitiesToUpdate) {
      const position = this.world.getComponent<Position>(entity, 'Position');
      // Double-check the entity still exists and has Position (might have been destroyed)
      if (!position) {
          if (this.world.hasComponent(entity, 'ScreenPosition')) {
              this.world.removeComponent(entity, 'ScreenPosition');
          }
          continue;
      }

      const screenPosData = this.calculateScreenPosition(position, camera);

      if (screenPosData) {
        // Add or update the ScreenPosition component
        this.world.addComponent(entity, 'ScreenPosition', {
          x: screenPosData.x,
          y: screenPosData.y,
          isOnScreen: screenPosData.isOnScreen,
        });
      } else {
        // Calculation failed or invalid - ensure no stale ScreenPosition exists
        if (this.world.hasComponent(entity, 'ScreenPosition')) {
          this.world.removeComponent(entity, 'ScreenPosition');
        }
      }
    }

    // --- Cleanup stale ScreenPosition components ---
    // Iterate through all entities that *currently have* ScreenPosition
    const entitiesWithScreenPos = this.world.getEntitiesWith(['ScreenPosition']);
    for (const entity of entitiesWithScreenPos) {
        // Check if the entity *still* has the necessary source components
        const hasPosition = this.world.hasComponent(entity, 'Position');
        const hasFloatingScore = this.world.hasComponent(entity, 'FloatingScore');
        const hasHealthBar = this.world.hasComponent(entity, 'HealthBarComponent');
        const hasShieldBar = this.world.hasComponent(entity, 'ShieldBarComponent');

        // If it has Position AND at least one of the UI components it's tracking, it's valid
        const isStillValid = hasPosition && (hasFloatingScore || hasHealthBar || hasShieldBar);

        if (!isStillValid) {
            // The source components are gone (e.g., FloatingScore expired), remove ScreenPosition
            this.world.removeComponent(entity, 'ScreenPosition');
        }
    }

    // Note: A resize listener should update this.screenWidth/Height if the window changes size.
    // Consider how to handle that, e.g., in the constructor or a separate method called on resize.
  }

  // REMOVED: Explicit cleanup method
  // /**
  //  * NEW METHOD: Explicitly cleans up HealthBar and ShieldBar entities
  //  * ...
  //  */
  // public cleanupBarsForEntity(targetEntityId: number): void {
  //   ...
  // }

} 