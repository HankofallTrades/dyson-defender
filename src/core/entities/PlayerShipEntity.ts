import { Vector3 } from 'three';
import { Entity } from './Entity';

/**
 * PlayerShip Entity
 * 
 * Purpose:
 * Represents the player's ship in the game, handling game logic aspects
 * like position, movement, and state.
 * 
 * Responsibilities:
 * - Manages ship position and movement
 * - Handles ship state (health, shields, etc.)
 * - Provides interface for ship manipulation
 * 
 * This class follows the separation-of-concerns.mdc rule by keeping game logic
 * separate from rendering concerns.
 */
export class PlayerShip extends Entity {
  private position: Vector3;
  private moveSpeed: number = 0.5;
  private rotationSpeed: number = 0.05;
  
  constructor() {
    super('playerShip');
    
    // Set initial position (50 units away from Dyson Sphere)
    this.position = new Vector3(0, 0, 50);
  }
  
  /**
   * Update ship position based on input
   * @param input Object containing movement input values
   */
  public updateShip(input: { 
    forward: boolean; 
    backward: boolean; 
    left: boolean; 
    right: boolean; 
    up: boolean; 
    down: boolean; 
  }): void {
    // Calculate movement direction
    const moveDirection = new Vector3();
    
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
      this.position.x = Math.max(-30, Math.min(30, this.position.x));
      this.position.y = Math.max(-20, Math.min(20, this.position.y));
      this.position.z = Math.max(30, Math.min(70, this.position.z));
    }
  }
  
  /**
   * Get the ship's current position
   */
  public getPosition(): Vector3 {
    return this.position.clone();
  }
  
  /**
   * Get the ship's movement speed
   */
  public getMoveSpeed(): number {
    return this.moveSpeed;
  }
  
  /**
   * Get the ship's rotation speed
   */
  public getRotationSpeed(): number {
    return this.rotationSpeed;
  }
  
  /**
   * Update the entity's state
   * @param deltaTime Time elapsed since last update in seconds
   */
  public update(deltaTime: number): void {
    // Player ship updates are handled by the Game class
    // This method is required by the Entity class but not used
  }
  
  /**
   * Clean up entity resources
   */
  public dispose(): void {
    // No resources to clean up at this time
  }
} 