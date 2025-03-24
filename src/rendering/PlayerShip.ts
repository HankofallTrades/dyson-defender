import * as THREE from 'three';

/**
 * PlayerShip class
 * 
 * Purpose:
 * Manages the player's spaceship in the game, including its 3D model,
 * position, and movement controls.
 * 
 * Responsibilities:
 * - Creates and manages the ship's 3D model
 * - Handles ship movement and rotation
 * - Manages ship position relative to the Dyson Sphere
 * - Provides methods for ship manipulation
 */
export class PlayerShip {
  private mesh: THREE.Group;
  private moveSpeed: number = 0.5;
  private rotationSpeed: number = 0.05;
  private position: THREE.Vector3;
  
  constructor() {
    // Create a group to hold all ship parts
    this.mesh = new THREE.Group();
    
    // Create the main body (cone shape)
    const bodyGeometry = new THREE.ConeGeometry(1, 4, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.add(body);
    
    // Create wings
    const wingGeometry = new THREE.BoxGeometry(6, 0.5, 2);
    const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const wing = new THREE.Mesh(wingGeometry, wingMaterial);
    wing.position.y = -1;
    this.mesh.add(wing);
    
    // Set initial position (50 units away from Dyson Sphere)
    this.position = new THREE.Vector3(0, 0, 50);
    this.mesh.position.copy(this.position);
    
    // Rotate ship to face the Dyson Sphere
    this.mesh.rotation.y = Math.PI;
  }
  
  /**
   * Get the ship's mesh for adding to the scene
   */
  public getMesh(): THREE.Group {
    return this.mesh;
  }
  
  /**
   * Update ship position based on input
   * @param input Object containing movement input values
   */
  public update(input: { 
    forward: boolean; 
    backward: boolean; 
    left: boolean; 
    right: boolean; 
    up: boolean; 
    down: boolean; 
  }): void {
    // Calculate movement direction
    const moveDirection = new THREE.Vector3();
    
    if (input.forward) moveDirection.z -= 1;
    if (input.backward) moveDirection.z += 1;
    if (input.left) moveDirection.x -= 1;
    if (input.right) moveDirection.x += 1;
    if (input.up) moveDirection.y += 1;
    if (input.down) moveDirection.y -= 1;
    
    // Normalize direction and apply speed
    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      moveDirection.multiplyScalar(this.moveSpeed);
      
      // Update position
      this.position.add(moveDirection);
      
      // Keep ship within reasonable bounds
      this.position.x = THREE.MathUtils.clamp(this.position.x, -30, 30);
      this.position.y = THREE.MathUtils.clamp(this.position.y, -20, 20);
      this.position.z = THREE.MathUtils.clamp(this.position.z, 30, 70);
      
      // Update mesh position
      this.mesh.position.copy(this.position);
    }
  }
  
  /**
   * Get the ship's current position
   */
  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }
  
  /**
   * Dispose of ship resources
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