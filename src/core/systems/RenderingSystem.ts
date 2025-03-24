// src/core/systems/RenderingSystem.ts
import * as THREE from 'three';
import { World, System } from '../World';
import { Position, Rotation, Renderable, Transform } from '../components';

export class RenderingSystem implements System {
  private world: World;
  private meshes: Map<number, THREE.Object3D> = new Map();
  private scene: THREE.Scene;

  constructor(world: World, scene: THREE.Scene) {
    this.world = world;
    this.scene = scene;
  }

  private createMesh(renderable: Renderable): THREE.Object3D {
    // Create different models based on modelId
    if (renderable.modelId === 'dysonSphere') {
      return this.createDysonSphereMesh(renderable);
    } else if (renderable.modelId === 'playerShip') {
      return this.createPlayerShipMesh(renderable);
    }
    
    // Default to a simple cube if no matching modelId
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: renderable.color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(renderable.scale, renderable.scale, renderable.scale);
    return mesh;
  }

  private createPlayerShipMesh(renderable: Renderable): THREE.Object3D {
    // Create a simple ship model
    const group = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.ConeGeometry(1, 4, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: renderable.color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);

    // Wing
    const wingGeometry = new THREE.BoxGeometry(6, 0.5, 2);
    const wingMaterial = new THREE.MeshPhongMaterial({ color: renderable.color });
    const wing = new THREE.Mesh(wingGeometry, wingMaterial);
    wing.position.y = -1;
    group.add(wing);

    // Apply scale
    group.scale.set(renderable.scale, renderable.scale, renderable.scale);
    
    return group;
  }

  private createDysonSphereMesh(renderable: Renderable): THREE.Object3D {
    const group = new THREE.Group();
    
    // Outer wireframe sphere
    const outerGeometry = new THREE.SphereGeometry(50, 32, 32);
    const outerMaterial = new THREE.MeshStandardMaterial({
      color: renderable.color,
      metalness: 0.7,
      roughness: 0.2,
      emissive: 0x112244,
      wireframe: true,
    });
    const outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
    group.add(outerMesh);
    
    // Inner transparent sphere
    const innerGeometry = new THREE.SphereGeometry(48, 32, 32);
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: 0x0055aa,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    group.add(innerMesh);
    
    // Apply scale
    group.scale.set(renderable.scale, renderable.scale, renderable.scale);
    
    return group;
  }

  public update(deltaTime: number): void {
    const entities = this.world.getEntitiesWith(['Position', 'Renderable']);
    
    for (const entity of entities) {
      const position = this.world.getComponent<Position>(entity, 'Position');
      const renderable = this.world.getComponent<Renderable>(entity, 'Renderable');
      const rotation = this.world.getComponent<Rotation>(entity, 'Rotation');

      if (!position || !renderable) {
        continue;
      }

      // Get or create mesh
      let mesh = this.meshes.get(entity);
      if (!mesh) {
        mesh = this.createMesh(renderable);
        this.meshes.set(entity, mesh);
        this.scene.add(mesh); // Add mesh to scene when created
      }

      // Update transform
      mesh.position.set(position.x, position.y, position.z);
      if (rotation) {
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