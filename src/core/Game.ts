import * as THREE from 'three';
import { GameState, GameStateManager } from './State';
import { SceneManager } from '../rendering/SceneManager';
import { World } from './World';
import { createDysonSphere } from './entities/DysonSphereEntity';
import { createPlayerShip } from './entities/PlayerShipEntity';
import { createCamera } from './entities/CameraEntity';
import { createHUD } from './entities/HUDEntity';
import { InputSystem } from './systems/InputSystem';
import { MovementSystem } from './systems/MovementSystem';
import { RenderingSystem } from './systems/RenderingSystem';
import { AutoRotateSystem } from './systems/AutoRotateSystem';
import { CameraSystem } from './systems/CameraSystem';
import { WeaponSystem } from './systems/WeaponSystem';
import { CollisionSystem } from './systems/CollisionSystem';
import { WaveSystem } from './systems/WaveSystem';
import { EnemySystem } from './systems/EnemySystem';
import { HUDSystem } from './systems/HUDSystem';
import { FloatingScoreSystem } from './systems/FloatingScoreSystem';
import { GameStateDisplay } from './components';
import { InputManager } from './input/InputManager';

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
// src/core/Game.ts

class Game {
  private container: HTMLElement;
  private sceneManager: SceneManager;
  private world: World;
  private stateManager: GameStateManager;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private hudSystem!: HUDSystem; // Use definite assignment assertion
  private waveSystem!: WaveSystem; // Use definite assignment assertion
  private floatingScoreSystem!: FloatingScoreSystem; // Use definite assignment assertion

  constructor(container: HTMLElement) {
    this.container = container;
    this.stateManager = new GameStateManager();
    this.stateManager.updateState({ lastUpdateTime: Date.now() });
    this.sceneManager = SceneManager.getInstance(container);
    this.world = new World();
    
    // Set the game state in the world
    this.world.setGameState(this.stateManager.getState());

    this.initSystems();
    this.initEntities();

    this.render();
    window.addEventListener('resize', this.handleResize);
    
    // Don't start the game automatically - just render the start screen
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  private initSystems(): void {
    this.world.addSystem(new InputSystem(this.world, this.sceneManager));
    this.world.addSystem(new MovementSystem(this.sceneManager, this.world));
    this.world.addSystem(new CameraSystem(this.sceneManager, this.world));
    this.world.addSystem(new WeaponSystem(this.world, this.sceneManager));
    this.world.addSystem(new EnemySystem(this.world, this.sceneManager.getScene()));
    this.world.addSystem(new CollisionSystem(this.world));
    
    // Create and store reference to HUD system
    this.hudSystem = new HUDSystem(this.world);
    this.world.addSystem(this.hudSystem);
    
    // Create and store reference to Wave system
    this.waveSystem = new WaveSystem(this.world);
    this.world.addSystem(this.waveSystem);
    
    // Create and store reference to FloatingScore system
    this.floatingScoreSystem = new FloatingScoreSystem(this.world);
    this.world.addSystem(this.floatingScoreSystem);
    
    // Set the camera reference for the floating score system
    // Need to do this after camera is created
    this.world.addSystem(new RenderingSystem(this.world, this.sceneManager.getScene()));
  }

  private initEntities(): void {
    const dysonSphere = createDysonSphere(this.world);
    const playerShip = createPlayerShip(this.world);
    const cameraEntity = createCamera(this.world, playerShip);
    createHUD(this.world, playerShip, dysonSphere);
    
    // Set camera for the floating score system after entities are created
    // Need to get the actual camera from the scene manager
    const camera = this.sceneManager.getCamera();
    if (camera) {
      this.floatingScoreSystem.setCamera(camera);
    }
    
    // Ensure the WaveSystem is properly set up
    this.waveSystem.findDysonSphereEntity();
    this.waveSystem.resetWaves();
  }

  public startGame(): void {
    // Update the game state to playing through the HUD system
    this.hudSystem.startGame();
    
    // Ensure the WaveSystem is properly set up
    this.waveSystem.findDysonSphereEntity();
    this.waveSystem.resetWaves();
    
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastFrameTime = performance.now();
    }
    
    // Request pointer lock when starting the game
    const inputManager = InputManager.getInstance(this.container);
    inputManager.requestPointerLock();
  }

  public restart(): void {
    // Stop the current game loop
    this.pause();
    
    // Clean up any existing Three.js objects in the scene
    // to prevent memory leaks and duplicate objects
    this.sceneManager.clearScene();
    
    // Clear all entities by creating a new World instance
    this.world = new World();
    
    // Reinitialize systems and entities
    this.initSystems();
    this.initEntities();
    
    // Start the game
    this.startGame();
    
    // Reset the game state to running
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    
    // Request pointer lock when restarting the game
    const inputManager = InputManager.getInstance(this.container);
    inputManager.requestPointerLock();
  }

  public start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastFrameTime = performance.now();
    }
  }

  public pause(): void {
    if (this.isRunning && this.animationFrameId !== null) {
      this.isRunning = false;
      this.stateManager.updateState({ isPaused: true });
    }
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    // Check if the game is in a playing state
    let isPlaying = false;
    const hudEntities = this.world.getEntitiesWith(['UIDisplay', 'GameStateDisplay']);
    
    if (hudEntities.length > 0) {
      const hudEntity = hudEntities[0];
      const gameStateDisplay = this.world.getComponent<GameStateDisplay>(hudEntity, 'GameStateDisplay');
      
      if (gameStateDisplay) {
        // If game state changed to game_over, exit pointer lock
        if (gameStateDisplay.currentState === 'game_over') {
          // Exit pointer lock when game is over
          if (document.pointerLockElement === this.container) {
            document.exitPointerLock();
          }
        }
        
        isPlaying = gameStateDisplay.currentState === 'playing';
      }
    }
    
    // Always render, but only update game logic if playing
    if (isPlaying && this.isRunning) {
      const currentTime = performance.now();
      const deltaTime = (currentTime - this.lastFrameTime) / 1000;
      this.lastFrameTime = currentTime;
      
      this.stateManager.updateState({ lastUpdateTime: Date.now() });
      
      // Update the game state in the world
      this.world.setGameState(this.stateManager.getState());
      
      this.world.update(deltaTime);
    }
    
    this.render();
  };

  private render(): void {
    this.sceneManager.render();
  }

  private handleResize = (): void => {};

  public getGameState(): GameState {
    return this.stateManager.getState();
  }

  public getWorld(): World {
    return this.world;
  }

  public getCamera(): THREE.Camera | null {
    return this.sceneManager.getCamera();
  }

  public dispose(): void {
    this.pause();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    window.removeEventListener('resize', this.handleResize);
    this.sceneManager.dispose();
  }
}

export default Game;