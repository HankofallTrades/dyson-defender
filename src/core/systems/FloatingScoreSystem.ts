import { System, World } from '../World';
import { FloatingScore, Position } from '../components';
import { Vector3 } from 'three';
import { Camera } from 'three';

/**
 * System for managing floating score indicators that appear when enemies are destroyed
 */
export class FloatingScoreSystem implements System {
  private world: World;
  private camera: Camera | null = null;
  
  constructor(world: World) {
    this.world = world;
  }
  
  /**
   * Set the camera reference for 3D to 2D position conversions
   */
  setCamera(camera: Camera): void {
    this.camera = camera;
  }
  
  /**
   * Update all floating score entities
   * @param deltaTime Time since last frame in seconds
   */
  update(deltaTime: number): void {
    // Get all entities with floating score components
    const scoreEntities = this.world.getEntitiesWith(['FloatingScore', 'Position']);
    
    for (const entity of scoreEntities) {
      const score = this.world.getComponent<FloatingScore>(entity, 'FloatingScore');
      const position = this.world.getComponent<Position>(entity, 'Position');
      
      if (!score || !position) continue;
      
      // Update remaining lifetime
      score.timeRemaining -= deltaTime;
      
      // Move the score upward
      position.y += deltaTime * 0.5; // Move up at 0.5 units per second
      
      // Fade out based on remaining time
      score.opacity = Math.max(0, score.timeRemaining / score.lifetime);
      
      // Remove the entity if its lifetime is over
      if (score.timeRemaining <= 0) {
        this.world.removeEntity(entity);
      }
    }
  }
  
  /**
   * Helper method to convert a 3D world position to 2D screen coordinates
   */
  worldToScreen(position: Position): { x: number, y: number } | null {
    if (!this.camera) return null;
    
    // Create a Three.js Vector3 from the position
    const vec = new Vector3(position.x, position.y, position.z);
    
    // Project the 3D point to 2D screen coordinates
    vec.project(this.camera);
    
    // Convert to screen coordinates
    return {
      x: (vec.x * 0.5 + 0.5) * window.innerWidth,
      y: (-vec.y * 0.5 + 0.5) * window.innerHeight
    };
  }
} 