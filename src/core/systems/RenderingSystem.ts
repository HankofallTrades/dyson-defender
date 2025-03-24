// src/core/systems/RenderingSystem.ts
import * as THREE from 'three';
import { World, System } from '../World';
import { Position, Rotation, Renderable, Transform } from '../components';

export class RenderingSystem implements System {
  private world: World;
  private meshes: Map<number, THREE.Object3D> = new Map();
  private scene: THREE.Scene;

  constructor(world: World, scene: THREE.Scene) {
    console.log('RenderingSystem: Constructor called');
    this.world = world;
    this.scene = scene;
  }

  private createMesh(renderable: Renderable): THREE.Object3D {
    console.log('RenderingSystem: Creating mesh for renderable:', renderable);
    
    // Create different models based on modelId
    if (renderable.modelId === 'dysonSphere') {
      console.log('RenderingSystem: Creating Dyson Sphere model');
      return this.createDysonSphereMesh(renderable);
    } else if (renderable.modelId === 'playerShip') {
      console.log('RenderingSystem: Creating Player Ship model');
      return this.createPlayerShipMesh(renderable);
    }
    
    // Default to a simple cube if no matching modelId
    console.log('RenderingSystem: Creating default cube model');
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: renderable.color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(renderable.scale, renderable.scale, renderable.scale);
    return mesh;
  }

  private createPlayerShipMesh(renderable: Renderable): THREE.Object3D {
    console.log('RenderingSystem: Building player ship mesh');
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
    console.log('RenderingSystem: Building Dyson Sphere mesh');
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
    console.log('RenderingSystem: Update called with deltaTime:', deltaTime);
    console.log('RenderingSystem: All active entities:', Array.from(this.world.getActiveEntities()));
    
    // Check for entities with Position
    const entitiesWithPosition = this.world.getEntitiesWith(['Position']);
    console.log('RenderingSystem: Entities with Position:', entitiesWithPosition);
    
    // Check for entities with Renderable
    const entitiesWithRenderable = this.world.getEntitiesWith(['Renderable']);
    console.log('RenderingSystem: Entities with Renderable:', entitiesWithRenderable);
    
    // Now check for both
    const entities = this.world.getEntitiesWith(['Position', 'Renderable']);
    console.log('RenderingSystem: Found entities with Position and Renderable:', entities);
    
    for (const entity of entities) {
      console.log('RenderingSystem: Processing entity:', entity);
      const position = this.world.getComponent<Position>(entity, 'Position');
      const renderable = this.world.getComponent<Renderable>(entity, 'Renderable');
      const rotation = this.world.getComponent<Rotation>(entity, 'Rotation');

      console.log('RenderingSystem: Components for entity', entity, ':', {
        position,
        renderable,
        rotation
      });

      if (!position || !renderable) {
        console.log('RenderingSystem: Skipping entity', entity, 'due to missing components');
        continue;
      }

      // Get or create mesh
      let mesh = this.meshes.get(entity);
      if (!mesh) {
        console.log('RenderingSystem: Creating new mesh for entity:', entity);
        mesh = this.createMesh(renderable);
        this.meshes.set(entity, mesh);
        this.scene.add(mesh); // Add mesh to scene when created
        console.log('RenderingSystem: Added mesh to scene for entity:', entity);
      }

      // Update transform
      mesh.position.set(position.x, position.y, position.z);
      if (rotation) {
        mesh.rotation.set(rotation.x, rotation.y, rotation.z);
      }
      console.log('RenderingSystem: Updated transform for entity', entity, ':', {
        position: mesh.position,
        rotation: mesh.rotation
      });
    }

    // Clean up meshes for entities that no longer exist
    for (const [entityId, mesh] of this.meshes.entries()) {
      if (!this.world.hasEntity(entityId)) {
        console.log('RenderingSystem: Removing mesh for deleted entity:', entityId);
        mesh.parent?.remove(mesh);
        this.meshes.delete(entityId);
      }
    }
  }

  public dispose(): void {
    console.log('RenderingSystem: Disposing');
    // Clean up all meshes
    for (const mesh of this.meshes.values()) {
      mesh.parent?.remove(mesh);
    }
    this.meshes.clear();
  }
}