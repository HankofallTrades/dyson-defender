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
import { GameStateDisplay, CameraMount, Position, Rotation, DevMode, MouseLook, Velocity } from './components';
import { InputManager } from './input/InputManager';
import { AnimationSystem } from './systems/AnimationSystem';
import { ShieldSystem } from './systems/ShieldSystem';
import { ShieldBubbleSystem } from './systems/ShieldBubbleSystem';
import { HealthBarSystem } from './systems/HealthBarSystem';
import { PowerUpSystem } from './systems/PowerUpSystem';
import { createFireRatePowerUp } from './entities/PowerUpEntity';
import { WaveInfo } from './components';
import { DevSystem } from './systems/DevSystem';

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
  private animationSystem!: AnimationSystem; // Add reference to AnimationSystem
  private devSystem!: DevSystem; // Reference to the dev system
  private inputManager!: InputManager;
  private isFirstFrameLogged: boolean = false;

  constructor(container: HTMLElement) {
    console.log('[Game] Initializing...');
    
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

    this.inputManager = InputManager.getInstance(this.container);

    console.log('[Game] Game initialized');
  }

  private initSystems(): void {
    this.world.addSystem(new InputSystem(this.world, this.sceneManager));
    this.world.addSystem(new MovementSystem(this.sceneManager, this.world));
    this.world.addSystem(new CameraSystem(this.sceneManager, this.world));
    this.world.addSystem(new WeaponSystem(this.world, this.sceneManager));
    this.world.addSystem(new EnemySystem(this.world, this.sceneManager.getScene()));
    
    // Create and store reference to CollisionSystem
    const collisionSystem = new CollisionSystem(this.world);
    this.world.addSystem(collisionSystem);
    
    // Create and store reference to PowerUpSystem
    const powerUpSystem = new PowerUpSystem(this.world, this.sceneManager.getScene());
    this.world.addSystem(powerUpSystem);
    
    // Make systems globally accessible for debugging
    (window as any).powerUpSystem = powerUpSystem;
    (window as any).collisionSystem = collisionSystem;
    
    // Add a debug method to test power-up collection
    (window as any).testPowerUp = () => {
      // Find player entity
      const playerEntities = this.world.getEntitiesWith(['InputReceiver']);
      if (playerEntities.length === 0) {
        console.error("No player entity found");
        return;
      }
      
      // Get player position
      const playerEntity = playerEntities[0];
      const playerPos = this.world.getComponent<Position>(playerEntity, 'Position');
      if (!playerPos) {
        console.error("Player has no position component");
        return;
      }
      
      // Create a power-up at player's position
      console.log("Creating test power-up at player position");
      const powerUpEntity = createFireRatePowerUp(this.world, playerPos);
      
      // Force collision handling
      console.log("Forcing power-up collection");
      collisionSystem.handlePlayerPowerUpCollision(playerEntity, powerUpEntity);
    };
    
    this.world.addSystem(new ShieldSystem(this.world));
    this.world.addSystem(new ShieldBubbleSystem(this.world));
    this.world.addSystem(new HealthBarSystem(this.world));
    
    // Create and store reference to HUD system
    this.hudSystem = new HUDSystem(this.world);
    this.world.addSystem(this.hudSystem);
    
    // Create and store reference to Wave system
    this.waveSystem = new WaveSystem(this.world);
    this.world.addSystem(this.waveSystem);
    
    // Create and store reference to FloatingScore system
    this.floatingScoreSystem = new FloatingScoreSystem(this.world);
    this.world.addSystem(this.floatingScoreSystem);
    
    // Create and store reference to Animation system
    this.animationSystem = new AnimationSystem(this.world, this.sceneManager.getScene());
    this.world.addSystem(this.animationSystem);
    
    // Connect the WaveSystem with the AnimationSystem and HUDSystem
    this.waveSystem.setAnimationSystem(this.animationSystem);
    this.waveSystem.setHUDSystem(this.hudSystem);
    
    // Connect the CollisionSystem with the AnimationSystem and PowerUpSystem
    collisionSystem.setAnimationSystem(this.animationSystem);
    collisionSystem.setPowerUpSystem(powerUpSystem);
    
    // Create and store reference to Dev system
    this.devSystem = new DevSystem(this.world, this.sceneManager, this.container);
    this.world.addSystem(this.devSystem);
    
    // Add the AutoRotateSystem to handle rotation of entities
    this.world.addSystem(new AutoRotateSystem(this.world));
    
    // Create and add the RenderingSystem
    const renderingSystem = new RenderingSystem(this.world, this.sceneManager.getScene());
    this.world.addSystem(renderingSystem);
    
    // Set the camera for the rendering system once the scene is set up
    const camera = this.sceneManager.getCamera();
    if (camera) {
      renderingSystem.setCamera(camera);
    }
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
    
    // Reset the game state
    this.stateManager.resetState();
    
    // Clear all entities by creating a new World instance
    this.world = new World();
    
    // Set the game state in the world
    this.world.setGameState(this.stateManager.getState());
    
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

  public resumeGame(): void {
    // Update the game state to playing through the HUD system
    const hudEntities = this.world.getEntitiesWith(['UIDisplay', 'GameStateDisplay']);
    if (hudEntities.length > 0) {
      const hudEntity = hudEntities[0];
      const gameStateDisplay = this.world.getComponent<GameStateDisplay>(hudEntity, 'GameStateDisplay');
      
      if (gameStateDisplay) {
        // Remove and add component to update game state
        this.world.removeComponent(hudEntity, 'GameStateDisplay');
        this.world.addComponent(hudEntity, 'GameStateDisplay', {
          ...gameStateDisplay,
          currentState: 'playing'
        });
      }
    }
    
    // Set game to running state
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastFrameTime = performance.now();
    }
    
    // Request pointer lock when resuming the game
    const inputManager = InputManager.getInstance(this.container);
    inputManager.requestPointerLock();
    
    // Update game state manager
    this.stateManager.updateState({ isPaused: false });
  }

  private animate = (): void => {
    if (!this.isFirstFrameLogged) {
      console.log('[Game] First animation frame running');
      this.isFirstFrameLogged = true;
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
    
    // Always get the current time for consistent timing
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;
    
    // Check if in dev mode
    const isDevMode = this.devSystem && this.devSystem.isActive();
    
    // Normal game flow
    let isPlaying = false;
    const hudEntities = this.world.getEntitiesWith(['UIDisplay', 'GameStateDisplay']);
    
    if (hudEntities.length > 0) {
      const hudEntity = hudEntities[0];
      const gameStateDisplay = this.world.getComponent<GameStateDisplay>(hudEntity, 'GameStateDisplay');
      
      if (gameStateDisplay) {
        // If game state changed to game_over or paused, exit pointer lock
        if (gameStateDisplay.currentState === 'game_over' || gameStateDisplay.currentState === 'paused') {
          // Exit pointer lock when game is over or paused
          if (document.pointerLockElement === this.container) {
            document.exitPointerLock();
          }
        }
        
        isPlaying = gameStateDisplay.currentState === 'playing';
      }
    }
    
    // Only update specific systems if in dev mode
    if (isDevMode) {
      this.updateFilteredSystems(deltaTime);
    }
    // Otherwise, follow normal game update rules
    else if (isPlaying && this.isRunning) {
      // Normal game update - all systems
      this.world.update(deltaTime);
      this.stateManager.updateState({ lastUpdateTime: Date.now() });
    }
    
    // Render scene
    this.render();
  };
  
  /**
   * Updates only specific systems when in dev mode
   */
  private updateFilteredSystems(deltaTime: number): void {
    // Get all systems and filter to only run certain ones in dev mode
    const systems = this.world.getSystems();
    for (const system of systems) {
      const systemName = system.constructor.name;
      
      // Only update specific systems in dev mode
      if (systemName === 'DevSystem' || 
          systemName === 'RenderingSystem' ||
          systemName === 'InputSystem') {
        system.update(deltaTime);
      }
    }
  }

  private render(): void {
    if (!this.sceneManager) {
      console.warn('[Game] SceneManager not available for rendering');
      return;
    }
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
    this.sceneManager.destroy();
    this.inputManager.dispose();
  }

  public restartAtWave(waveNumber: number): void {
    // Stop the current game loop
    this.pause();
    
    // Clean up any existing Three.js objects in the scene
    // to prevent memory leaks and duplicate objects
    this.sceneManager.clearScene();
    
    // Reset the game state
    this.stateManager.resetState();
    
    // Clear all entities by creating a new World instance
    this.world = new World();
    
    // Set the game state in the world
    this.world.setGameState(this.stateManager.getState());
    
    // Reinitialize systems and entities
    this.initSystems();
    this.initEntities();
    
    // Start the game
    this.hudSystem.startGame();
    
    // Set the specific wave number
    const waveEntities = this.world.getEntitiesWith(['WaveInfo']);
    if (waveEntities.length > 0) {
      const waveEntity = waveEntities[0];
      const waveInfo = this.world.getComponent<WaveInfo>(waveEntity, 'WaveInfo');
      
      if (waveInfo) {
        // Remove the old component and add the updated one
        this.world.removeComponent(waveEntity, 'WaveInfo');
        this.world.addComponent(waveEntity, 'WaveInfo', {
          ...waveInfo,
          currentWave: waveNumber - 1, // Subtract 1 because next wave will be incremented
          isActive: false,
          nextWaveTimer: 3, // Start next wave countdown
          enemiesRemaining: 0
        });
      }
    }
    
    // Reset the game state to running
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    
    // Request pointer lock when restarting the game
    const inputManager = InputManager.getInstance(this.container);
    inputManager.requestPointerLock();
  }

  public requestPointerLock(): void {
    if (this.inputManager) {
      this.inputManager.requestPointerLock();
    } else {
      console.warn('[Game] InputManager not available to request pointer lock.');
    }
  }
}

export default Game;