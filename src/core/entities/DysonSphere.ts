import * as THREE from 'three';
import { Entity } from '../EntityManager';
import { SceneManager } from '../../rendering/SceneManager';

/**
 * Dyson Sphere Entity
 * 
 * Purpose:
 * Represents the central Dyson Sphere in the game, implementing its visual
 * representation and behavior as a game entity.
 * 
 * Responsibilities:
 * - Manages the Dyson Sphere's visual representation
 * - Handles entity-specific behavior (rotation, effects)
 * - Manages entity resources (creation, disposal)
 * - Implements the Entity interface for integration with EntityManager
 * 
 * This class follows the modularity.mdc rule by being a self-contained entity
 * that can be easily modified or extended without affecting other game systems.
 */
export class DysonSphere implements Entity {
  id: string = 'dyson-sphere';
  private mesh: THREE.Mesh;
  private innerMesh: THREE.Mesh;
  private scene: THREE.Scene;
  
  constructor(sceneManager: SceneManager) {
    this.scene = sceneManager.getScene();
    
    // Create sphere geometry with radius 50 units
    const geometry = new THREE.SphereGeometry(50, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3388ff,
      metalness: 0.7,
      roughness: 0.2,
      emissive: 0x112244,
      wireframe: true,
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0, 0);
    this.scene.add(this.mesh);
    
    // Inner sphere for holographic effect
    const innerGeometry = new THREE.SphereGeometry(48, 32, 32);
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: 0x0055aa,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    
    this.innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    this.scene.add(this.innerMesh);
  }
  
  update(deltaTime: number): void {
    // Slowly rotate the Dyson Sphere for visual effect
    this.mesh.rotation.y += 0.05 * deltaTime;
    this.innerMesh.rotation.y += 0.03 * deltaTime;
  }
  
  dispose(): void {
    this.scene.remove(this.mesh);
    this.scene.remove(this.innerMesh);
    
    if (this.mesh.geometry) this.mesh.geometry.dispose();
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.dispose();
    }
    
    if (this.innerMesh.geometry) this.innerMesh.geometry.dispose();
    if (this.innerMesh.material instanceof THREE.Material) {
      this.innerMesh.material.dispose();
    }
  }
} 