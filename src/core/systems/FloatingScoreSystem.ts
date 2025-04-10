import { System, World } from '../World';
import { FloatingScore, Position } from '../components';

/**
 * System for managing floating score indicators that appear when enemies are destroyed
 */
export class FloatingScoreSystem implements System {
  private world: World;
  
  constructor(world: World) {
    this.world = world;
  }
  
  /**
   * Update all floating score entities
   * @param deltaTime Time since last frame in seconds
   */
  update(deltaTime: number): void {
    // Get all entities with floating score components
    const scoreEntities = this.world.getEntitiesWith(['FloatingScore', 'Position']);
    
    // --- REMOVE DEBUG LOGS ---
    // if (scoreEntities.length > 0) {
    //   console.log(`[DEBUG] FloatingScoreSystem: updating ${scoreEntities.length} floating score entities`);
    // }
    // --- END DEBUG LOG ---
    
    for (const entity of scoreEntities) {
      const score = this.world.getComponent<FloatingScore>(entity, 'FloatingScore');
      const position = this.world.getComponent<Position>(entity, 'Position');
      
      // --- REMOVE DEBUG LOGS AND SIMPLIFY BACK TO ORIGINAL ---
      if (!score || !position) continue;
      
      // const oldY = position.y;
      // --- END REMOVED DEBUG VARS ---
      
      // Update remaining lifetime
      score.timeRemaining -= deltaTime;
      
      // Move the score upward
      position.y += deltaTime * 0.5; // Move up at 0.5 units per second
      
      // --- REMOVE DEBUG LOGS ---
      // if (Math.random() < 0.05) {
      //   console.log(`[DEBUG] FloatingScore ${entity} value=${score.value} pos=(${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}) moved up by ${(position.y - oldY).toFixed(3)}, remaining=${score.timeRemaining.toFixed(1)}s`);
      // }
      // --- END DEBUG LOG ---
      
      // Fade out based on remaining time
      score.opacity = Math.max(0, score.timeRemaining / score.lifetime);
      
      // Remove the entity if its lifetime is over
      if (score.timeRemaining <= 0) {
        // --- REMOVE DEBUG LOGS ---
        // console.log(`[DEBUG] FloatingScore ${entity} value=${score.value} lifetime ended, removing entity at final pos=(${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);
        // --- END DEBUG LOG ---
        this.world.removeEntity(entity);
      }
    }
  }
} 