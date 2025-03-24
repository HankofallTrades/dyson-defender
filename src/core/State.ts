/**
 * Interfaces and implementation for game state management
 * Following the rule to make the game state easily serializable
 */

/**
 * Interface defining the core game state
 */
export interface GameState {
  // Game status
  isGameOver: boolean;
  isPaused: boolean;
  
  // Player stats
  score: number;
  
  // Dyson Sphere properties
  dysonSphereHealth: number;
  dysonSphereMaxHealth: number;
  
  // Wave information
  currentWave: number;
  enemiesRemaining: number;
  
  // Timing information
  lastUpdateTime: number;
}

/**
 * Default initial game state
 */
export const initialGameState: GameState = {
  isGameOver: false,
  isPaused: false,
  
  score: 0,
  
  dysonSphereHealth: 100,
  dysonSphereMaxHealth: 100,
  
  currentWave: 1,
  enemiesRemaining: 0,
  
  lastUpdateTime: 0
};

/**
 * Class to manage game state with helper methods
 */
export class GameStateManager {
  private state: GameState;
  
  constructor(initialState: GameState = initialGameState) {
    this.state = { ...initialState };
  }
  
  /**
   * Get current state (creates a copy to prevent direct mutation)
   */
  getState(): GameState {
    return { ...this.state };
  }
  
  /**
   * Update the game state
   */
  updateState(partialState: Partial<GameState>): void {
    this.state = { ...this.state, ...partialState };
  }
  
  /**
   * Reset the game state to initial values
   */
  resetState(): void {
    this.state = { ...initialGameState, lastUpdateTime: Date.now() };
  }
  
  /**
   * Serialize the game state to JSON
   */
  serializeState(): string {
    return JSON.stringify(this.state);
  }
  
  /**
   * Deserialize the game state from JSON
   */
  deserializeState(jsonState: string): void {
    try {
      const parsedState = JSON.parse(jsonState) as GameState;
      this.state = parsedState;
    } catch (error) {
      console.error('Failed to deserialize game state:', error);
    }
  }
} 