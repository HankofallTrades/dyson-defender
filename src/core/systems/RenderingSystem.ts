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

  constructor(world: World, scene: THREE.Scene) {
    this.world = world;
    this.scene = scene;
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

      // Update transform
      mesh.position.set(position.x, position.y, position.z);
      if (rotation) {
        // Apply rotation in the correct order (pitch, yaw, roll)
        mesh.rotation.set(rotation.x, rotation.y, rotation.z);
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

  public dispose(): void {
    // Clean up all meshes
    for (const mesh of this.meshes.values()) {
      mesh.parent?.remove(mesh);
    }
    this.meshes.clear();
  }
}