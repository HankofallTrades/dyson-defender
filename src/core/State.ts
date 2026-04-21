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
  enemiesDefeated: number;
  accuracyStreak: number;
  scoreMultiplier: number;
  starPowerCharge: number;
  starPowerActive: boolean;
  starPowerTimeRemaining: number;
  
  // Dyson Sphere properties
  dysonSphereHealth: number;
  dysonSphereMaxHealth: number;
  
  // Wave information
  currentWave: number;
  wavesCompleted: number;
  enemiesRemaining: number;
  
  // Timing information
  lastUpdateTime: number;
  
  // Boost system properties
  boostActive: boolean;
  boostRemaining: number;
  boostCooldown: number;

  // Upgrade economy
  upgradeCredits: number;
  upgradeDraftAvailable: boolean;
  shipDamageLevel: number;
  shipFireRateLevel: number;
  shipHullLevel: number;
  dysonShieldLevel: number;
  dysonRegenLevel: number;

  // Secondary weapon system
  secondaryWeapon: {
    type: 'none' | 'praetorianLaser';
    unlocked: boolean;
    charges: number;
    maxCharges: number;
    isCharging: boolean;
    chargeProgress: number;
    chargeDuration: number;
    cooldown: number;
  };
}

/**
 * Default initial game state
 */
export const initialGameState: GameState = {
  isGameOver: false,
  isPaused: false,
  
  score: 0,
  enemiesDefeated: 0,
  accuracyStreak: 0,
  scoreMultiplier: 1,
  starPowerCharge: 0,
  starPowerActive: false,
  starPowerTimeRemaining: 0,
  
  dysonSphereHealth: 100,
  dysonSphereMaxHealth: 100,
  
  currentWave: 1,
  wavesCompleted: 0,
  enemiesRemaining: 0,
  
  lastUpdateTime: 0,
  
  // Boost system initial values
  boostActive: false,
  boostRemaining: 1.0, // Full boost (1 second)
  boostCooldown: 0,  // No cooldown - ready to use

  upgradeCredits: 0,
  upgradeDraftAvailable: false,
  shipDamageLevel: 0,
  shipFireRateLevel: 0,
  shipHullLevel: 0,
  dysonShieldLevel: 0,
  dysonRegenLevel: 0,

  secondaryWeapon: {
    type: 'none',
    unlocked: false,
    charges: 0,
    maxCharges: 3,
    isCharging: false,
    chargeProgress: 0,
    chargeDuration: 1.2,
    cooldown: 0
  }
};

/**
 * Class to manage game state with helper methods
 */
export class GameStateManager {
  private state: GameState;
  
  constructor(initialState: GameState = initialGameState) {
    this.state = {
      ...initialState,
      secondaryWeapon: { ...initialState.secondaryWeapon }
    };
  }
  
  /**
   * Get current state (creates a copy to prevent direct mutation)
   */
  getState(): GameState {
    return { ...this.state };
  }

  /**
   * Get the authoritative mutable state object shared with the ECS world.
   */
  getStateReference(): GameState {
    return this.state;
  }
  
  /**
   * Update the game state
   */
  updateState(partialState: Partial<GameState>): void {
    Object.assign(this.state, partialState);
  }
  
  /**
   * Reset the game state to initial values
   */
  resetState(): void {
    this.state = {
      ...initialGameState,
      secondaryWeapon: { ...initialGameState.secondaryWeapon },
      lastUpdateTime: Date.now()
    };
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
      this.state = { ...parsedState };
    } catch (error) {
      console.error('Failed to deserialize game state:', error);
    }
  }
} 
