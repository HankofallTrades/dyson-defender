import * as THREE from 'three';
import { PlayerShip } from '../core/entities/PlayerShip';

/**
 * PlayerShipVisual class
 * 
 * Purpose:
 * Handles the visual representation of the player's ship in Three.js,
 * including the 3D model and its visual updates.
 * 
 * Responsibilities:
 * - Creates and manages the ship's 3D model
 * - Updates visual representation based on entity state
 * - Handles visual resource cleanup
 * 
 * This class follows the separation-of-concerns.mdc rule by keeping rendering
 * logic separate from game logic.
 */
export class PlayerShipVisual {
  private mesh: THREE.Group;
  private playerShip: PlayerShip;
  
  constructor(playerShip: PlayerShip) {
    this.playerShip = playerShip;
    this.mesh = this.createShipMesh();
  }
  
  /**
   * Create the ship's 3D model
   */
  private createShipMesh(): THREE.Group {
    const group = new THREE.Group();
    
    // Create the main body (cone shape)
    const bodyGeometry = new THREE.ConeGeometry(1, 4, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);
    
    // Create wings
    const wingGeometry = new THREE.BoxGeometry(6, 0.5, 2);
    const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const wing = new THREE.Mesh(wingGeometry, wingMaterial);
    wing.position.y = -1;
    group.add(wing);
    
    // Set initial position and rotation
    group.position.copy(this.playerShip.getPosition());
    group.rotation.y = Math.PI;
    
    return group;
  }
  
  /**
   * Update the visual representation
   */
  public update(): void {
    // Update position to match entity
    this.mesh.position.copy(this.playerShip.getPosition());
  }
  
  /**
   * Get the ship's mesh for adding to the scene
   */
  public getMesh(): THREE.Group {
    return this.mesh;
  }
  
  /**
   * Dispose of visual resources
   */
  public dispose(): void {
    this.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
  }
} 