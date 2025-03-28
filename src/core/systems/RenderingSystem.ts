// src/core/systems/RenderingSystem.ts
import * as THREE from 'three';
import { World, System } from '../World';
import { Position, Rotation, Renderable } from '../components';
import { MeshFactory } from '../../rendering/MeshFactory';

/**
 * RenderingSystem
 * 
 * Purpose:
 * Handles the rendering of entities in the 3D scene.
 * 
 * Responsibilities:
 * - Creates and manages meshes for entities with Renderable components
 * - Updates mesh transforms based on entity Position and Rotation
 * - Cleans up meshes for removed entities
 * - Delegates mesh creation to the MeshFactory
 */
export class RenderingSystem implements System {
  private world: World;
  private meshes: Map<number, THREE.Object3D> = new Map();
  private scene: THREE.Scene;
  private camera: THREE.Camera | null = null;

  constructor(world: World, scene: THREE.Scene) {
    this.world = world;
    this.scene = scene;
  }

  public setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  public update(deltaTime: number): void {
    // Find camera mount to determine player entity
    const cameraEntities = this.world.getEntitiesWith(['Camera', 'CameraMount']);
    let playerEntityId = -1;
    
    if (cameraEntities.length > 0) {
      const cameraEntity = cameraEntities[0];
      const cameraMount = this.world.getComponent<{parentEntity: number}>(cameraEntity, 'CameraMount');
      if (cameraMount) {
        playerEntityId = cameraMount.parentEntity;
      }
    }
    
    // Check for boost effect on player
    if (playerEntityId !== -1) {
      this.updateBoostVisuals(playerEntityId);
    }
    
    // Get all entities with Renderable and Position components
    const entities = this.world.getEntitiesWith(['Renderable', 'Position']);
    
    for (const entity of entities) {
      const position = this.world.getComponent<Position>(entity, 'Position');
      const renderable = this.world.getComponent<Renderable>(entity, 'Renderable');
      const rotation = this.world.getComponent<Rotation>(entity, 'Rotation');

      if (!position || !renderable) {
        continue;
      }

      // Skip rendering the player ship if it's the one with the camera mounted
      if (entity === playerEntityId && renderable.modelId === 'playerShip') {
        continue;
      }

      // Get or create mesh
      let mesh = this.meshes.get(entity);
      if (!mesh) {
        mesh = MeshFactory.createMesh(renderable);
        this.meshes.set(entity, mesh);
        this.scene.add(mesh); // Add mesh to scene when created
      }

      // Update visibility based on renderable.isVisible property
      mesh.visible = renderable.isVisible !== false; // True if isVisible is undefined or true
      
      // Update transform
      mesh.position.set(position.x, position.y, position.z);
      
      // Apply scale from renderable.scale if available
      if (renderable.scale) {
        mesh.scale.set(renderable.scale, renderable.scale, renderable.scale);
      }
      
      if (rotation) {
        // Apply rotation in the correct order (pitch, yaw, roll)
        mesh.rotation.order = 'YXZ'; // Set rotation order to match our ECS calculations
        mesh.rotation.set(rotation.x, rotation.y, rotation.z);
      }
      
      // Special case for powerup orbs: Handle custom auto-rotation
      if (renderable.modelId === 'powerUpOrb') {
        this.updatePowerUpVisuals(mesh, deltaTime);
      }
    }

    // Clean up meshes for entities that no longer exist
    for (const [entityId, mesh] of this.meshes.entries()) {
      if (!this.world.hasEntity(entityId)) {
        mesh.parent?.remove(mesh);
        this.meshes.delete(entityId);
      }
    }
  }

  /**
   * Updates custom rotation and effects for power-up orbs
   */
  private updatePowerUpVisuals(mesh: THREE.Object3D, deltaTime: number): void {
    // Directly look for the rings by name
    const horizontalRing = mesh.getObjectByName('horizontalRing');
    const verticalRing = mesh.getObjectByName('verticalRing');
    
    // Apply rotations to rings
    if (horizontalRing) {
      const autoRotate = horizontalRing.userData.autoRotate || (horizontalRing as any).autoRotate;
      if (autoRotate) {
        horizontalRing.rotation.y += autoRotate.speed * deltaTime;
      }
    }
    
    if (verticalRing) {
      const autoRotate = verticalRing.userData.autoRotate || (verticalRing as any).autoRotate;
      if (autoRotate) {
        verticalRing.rotation.z += autoRotate.speed * deltaTime;
      }
    }
    
    // Apply custom rotations to any other parts that might have autoRotate
    mesh.traverse((child) => {
      if (child === horizontalRing || child === verticalRing) {
        // Skip rings as we've already handled them directly
        return;
      }
      
      // Handle autoRotate for other objects
      const autoRotate = child.userData?.autoRotate || (child as any).autoRotate;
      if (autoRotate) {
        const axis = autoRotate.axis || 'y';
        const speed = autoRotate.speed || Math.PI * 0.5;
        
        if (axis === 'x') {
          child.rotation.x += speed * deltaTime;
        } else if (axis === 'y') {
          child.rotation.y += speed * deltaTime;
        } else if (axis === 'z') {
          child.rotation.z += speed * deltaTime;
        }
      }
    });
    
    // Handle fade-out effect for expiring power-ups
    const renderable = this.world.getEntitiesWith(['Renderable', 'PowerUp'])
      .find(entity => this.meshes.get(entity) === mesh);
    
    if (renderable) {
      const renderableComp = this.world.getComponent<any>(renderable, 'Renderable');
      if (renderableComp && renderableComp.fadeOut) {
        // Apply fade-out to all materials
        mesh.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if (mat.transparent) {
                  mat.opacity = renderableComp.opacity || 0.5;
                }
              });
            } else if (child.material.transparent) {
              child.material.opacity = renderableComp.opacity || 0.5;
            }
          }
        });
      }
    }
    
    // Make any billboard elements face the camera
    if (this.camera) {
      mesh.traverse((child) => {
        if (child.name === 'billboard' || (child as any).isBillboard) {
          child.quaternion.copy(this.camera!.quaternion);
        }
      });
    }
    
    // Apply floating motion
    if ((mesh as any).floatData) {
      const floatData = (mesh as any).floatData;
      
      // Initialize originalY with the actual mesh position first time
      if (!floatData.initialized) {
        floatData.originalY = mesh.position.y;
        floatData.initialized = true;
      }
      
      // Apply floating effect
      const floatY = floatData.originalY + 
                    Math.sin((performance.now() - floatData.startTime) / 1000 * floatData.speed) * 
                    floatData.height;
      
      // Only update the Y position, preserving X and Z
      mesh.position.y = floatY;
    }
  }

  public dispose(): void {
    // Clean up all meshes
    for (const mesh of this.meshes.values()) {
      mesh.parent?.remove(mesh);
    }
    this.meshes.clear();
  }

  /**
   * Updates visual effects for the player ship's boost
   * @param playerEntityId The entity ID of the player ship
   */
  private updateBoostVisuals(playerEntityId: number): void {
    // Get the boost component
    const boost = this.world.getComponent<any>(playerEntityId, 'Boost');
    if (!boost) return;
    
    // Get the player ship mesh
    const mesh = this.meshes.get(playerEntityId);
    if (!mesh) return;
    
    // Update mesh emissive properties based on boost state
    if (boost.active) {
      // Apply pulsing emissive effect when boost is active
      const pulseValue = (Math.sin(performance.now() * 0.01) + 1) * 0.5;  // Value between 0 and 1
      const intensity = 0.5 + pulseValue * 0.5;  // Pulsate between 0.5 and 1.0
      
      // Apply to all child meshes (body and wings)
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhongMaterial) {
          child.material.emissiveIntensity = intensity;
          // Slightly scale up for visual feedback
          child.scale.set(1.1, 1.1, 1.1);
        }
      });
    } else {
      // Reset visual effect when not boosting
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhongMaterial) {
          // Gradually fade out emissive effect
          if (child.material.emissiveIntensity > 0) {
            child.material.emissiveIntensity = Math.max(0, child.material.emissiveIntensity - 0.1);
          }
          // Reset scale
          child.scale.set(1.0, 1.0, 1.0);
        }
      });
    }
  }
}