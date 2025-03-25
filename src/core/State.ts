/**
 * Game State Management System
 * 
 * Purpose:
 * Manages all game data and state, providing a centralized, serializable state management
 * system that can be easily saved, loaded, and synchronized for multiplayer.
 * 
 * Responsibilities:
 * - Stores and manages game state (score, health, wave information)
 * - Provides serialization for game saving/loading
 * - Centralizes state updates
 * - Ensures state consistency across the game
 * - Manages game state transitions
 * 
 * This module follows the game-state-management.mdc rule by ensuring all game state
 * is easily serializable and suitable for future multiplayer integration.
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
  
  // Boost system properties
  boostActive: boolean;
  boostRemaining: number;
  boostCooldown: number;
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
  
  lastUpdateTime: 0,
  
  // Boost system initial values
  boostActive: false,
  boostRemaining: 1.0, // 1 second of boost
  boostCooldown: 0
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