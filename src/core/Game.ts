import * as THREE from 'three';
import { GameState, GameStateManager } from './State';
import { SceneManager } from '../rendering/SceneManager';
import { EntityManager } from './EntityManager';
import { DysonSphere } from './entities/DysonSphere';

/**
 * Main Game Controller
 * 
 * Purpose:
 * Acts as the central controller/orchestrator for the entire game, managing the game loop
 * and coordinating between different systems (state, entities, rendering).
 * 
 * Responsibilities:
 * - Manages the game loop using requestAnimationFrame
 * - Coordinates updates between different systems (state, entities, rendering)
 * - Handles game lifecycle (start, stop, pause, resume)
 * - Initializes and manages core game systems
 * - Provides high-level game control interface
 * 
 * This class follows the independant-game-loop.mdc rule by keeping the game loop
 * independent of UI updates, ensuring consistent frame rate and smooth gameplay.
 */
class Game {
  // Container element where the game will be rendered
  private container: HTMLElement;
  
  // Scene and entity management
  private sceneManager: SceneManager;
  private entityManager: EntityManager;
  
  // Game state management
  private stateManager: GameStateManager;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  
  /**
   * Constructor for the Game class
   * @param container The HTML element where the game will be rendered
   */
  constructor(container: HTMLElement) {
    this.container = container;
    
    // Initialize game state
    this.stateManager = new GameStateManager();
    this.stateManager.updateState({ lastUpdateTime: Date.now() });
    
    // Initialize scene manager
    this.sceneManager = SceneManager.getInstance(container);
    
    // Initialize entity manager
    this.entityManager = EntityManager.getInstance(this.sceneManager);
    
    // Initialize game entities
    this.initEntities();
    
    // Force an initial render
    this.render();
    
    // Handle window resize
    window.addEventListener('resize', this.handleResize);
  }
  
  /**
   * Initialize game entities
   */
  private initEntities(): void {
    // Create and add the Dyson Sphere entity
    const dysonSphere = new DysonSphere(this.sceneManager);
    this.entityManager.addEntity(dysonSphere);
    
    // More entities will be added in future steps
  }
  
  /**
   * Start the game loop
   */
  start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastFrameTime = performance.now();
      this.stateManager.updateState({ isPaused: false });
      this.animate();
      console.log('Game started');
    }
  }
  
  /**
   * Stop the game loop
   */
  stop(): void {
    if (this.isRunning && this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      this.isRunning = false;
      this.stateManager.updateState({ isPaused: true });
      console.log('Game stopped');
    }
  }
  
  /**
   * Pause the game
   */
  pause(): void {
    this.stop();
  }
  
  /**
   * Resume the game
   */
  resume(): void {
    this.start();
  }
  
  /**
   * The main game loop
   */
  private animate = (): void => {
    // Store animation frame ID for potential cancellation
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    // Calculate delta time for frame-independent movement
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;
    
    // Don't update if game is over or paused
    const gameState = this.stateManager.getState();
    if (gameState.isGameOver || gameState.isPaused) {
      return;
    }
    
    // Update game state with timing information
    this.stateManager.updateState({ lastUpdateTime: Date.now() });
    
    // Update game state here
    this.update(deltaTime);
    
    // Render the scene
    this.render();
  }
  
  /**
   * Update the game state
   * @param deltaTime Time elapsed since last frame in seconds
   */
  private update(deltaTime: number): void {
    // Update all entities through the entity manager
    this.entityManager.updateEntities(deltaTime);
  }
  
  /**
   * Render the current scene
   */
  private render(): void {
    this.sceneManager.render();
  }
  
  /**
   * Handle window resize events
   */
  private handleResize = (): void => {
    // SceneManager handles resize internally
  }
  
  /**
   * Get the current game state
   */
  getGameState(): GameState {
    return this.stateManager.getState();
  }
  
  /**
   * Reset the game state
   */
  resetGame(): void {
    this.stateManager.resetState();
    this.start();
    console.log('Game reset');
  }
  
  /**
   * Clean up resources when the game is disposed
   */
  dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    
    // Clean up entities
    this.entityManager.dispose();
    
    // Let SceneManager dispose of Three.js resources
    this.sceneManager.dispose();
  }
}

export default Game; 