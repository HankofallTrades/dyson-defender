import * as THREE from 'three';
import { GameState, GameStateManager } from './State';
import { SceneManager } from '../rendering/SceneManager';
import { World } from './World';
import { createDysonSphere } from './entities/DysonSphereEntity';
import { createPlayerShip } from './entities/PlayerShipEntity';
import { createCamera } from './entities/CameraEntity';
import { createHUD } from './entities/HUDEntity';
import { createStarfieldBackground } from './entities/StarfieldEntity';
import { createCentralStar } from './entities/StarEntity';
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
import { GameStateDisplay, CameraMount, Position, Rotation, DevMode, MouseLook, Velocity, Health, Shield, LaserCooldown } from './components';
import { InputManager } from './input/InputManager';
import { AnimationSystem } from './systems/AnimationSystem';
import { ShieldSystem } from './systems/ShieldSystem';
import { ShieldBubbleSystem } from './systems/ShieldBubbleSystem';
import { HealthBarSystem } from './systems/HealthBarSystem';
import { PowerUpSystem } from './systems/PowerUpSystem';
import { createFireRatePowerUp } from './entities/PowerUpEntity';
import { WaveInfo } from './components';
import { DevSystem } from './systems/DevSystem';
import { AudioManager } from './AudioManager';
import { UISystem } from './systems/UISystem';
import { DysonDamageZoneSystem } from './systems/DysonDamageZoneSystem';
import { getUpgradeCost } from './upgrades';
import { clearAccuracyShots, updateStarPower } from './accuracy';

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
  private audioManager: AudioManager;
  private wasPointerLocked: boolean = false;

  constructor(container: HTMLElement, audioManager?: AudioManager) {
    console.log('[Game] Initializing...');
    
    this.container = container;
    this.stateManager = new GameStateManager();
    this.stateManager.updateState({ lastUpdateTime: Date.now() });
    this.sceneManager = SceneManager.getInstance(container);
    this.world = new World();

    // Set the game state in the world
    this.world.setGameState(this.stateManager.getStateReference());

    // Use provided audio manager or create a new one if not provided
    this.audioManager = audioManager || new AudioManager();
    
    // Set up the camera for audio listener
    const camera = this.sceneManager.getCamera();
    if (camera) {
      this.audioManager.setCamera(camera);
    }

    this.initSystems();
    this.initEntities();

    this.render();
    
    // Don't start the game automatically - just render the start screen
    this.animationFrameId = requestAnimationFrame(this.animate);

    this.inputManager = InputManager.getInstance(this.container);

    // Add pointer lock change event listener to keep game state in sync
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    this.wasPointerLocked = document.pointerLockElement === this.container;

    console.log('[Game] Game initialized');
  }

  private initSystems(): void {
    // Create and store reference to systems that need to be accessed later
    this.hudSystem = new HUDSystem(this.world);
    this.waveSystem = new WaveSystem(this.world, this.stateManager);
    this.floatingScoreSystem = new FloatingScoreSystem(this.world);
    this.animationSystem = new AnimationSystem(this.world, this.sceneManager.getScene());
    this.devSystem = new DevSystem(this.world, this.sceneManager, this.container);
    
    // Create and store reference to systems that need to be connected
    const collisionSystem = new CollisionSystem(this.world, this.stateManager, this.audioManager);
    const powerUpSystem = new PowerUpSystem(this.world, this.sceneManager.getScene());
    const weaponSystem = new WeaponSystem(this.world, this.sceneManager, this.audioManager);
    const enemySystem = new EnemySystem(this.world, this.sceneManager.getScene(), weaponSystem);
    
    // Initialize all game systems
    this.world.addSystem(new InputSystem(this.world, this.sceneManager));
    this.world.addSystem(new MovementSystem(this.sceneManager, this.world, this.audioManager));
    this.world.addSystem(new CameraSystem(this.sceneManager, this.world));
    this.world.addSystem(collisionSystem);
    this.world.addSystem(powerUpSystem);
    this.world.addSystem(weaponSystem);
    this.world.addSystem(enemySystem);
    this.world.addSystem(new ShieldSystem(this.world));
    this.world.addSystem(new ShieldBubbleSystem(this.world));
    this.world.addSystem(new HealthBarSystem(this.world));
    this.world.addSystem(this.hudSystem);
    this.world.addSystem(this.waveSystem);
    this.world.addSystem(this.floatingScoreSystem);
    this.world.addSystem(this.animationSystem);
    this.world.addSystem(this.devSystem);
    this.world.addSystem(new AutoRotateSystem(this.world));
    this.world.addSystem(new UISystem(this.world, this.sceneManager));
    this.world.addSystem(new DysonDamageZoneSystem(this.world));
    const renderingSystem = new RenderingSystem(this.world, this.sceneManager.getScene());
    const activeCamera = this.sceneManager.getCamera();
    if (activeCamera) {
      renderingSystem.setCamera(activeCamera);
    }
    this.world.addSystem(renderingSystem);
    
    // Make systems globally accessible for debugging
    (window as any).powerUpSystem = powerUpSystem;
    (window as any).collisionSystem = collisionSystem;
    
    // Add debug method for testing audio
    (window as any).testAudio = (soundId: string = 'laser') => {
      console.log(`Playing test sound: ${soundId}`);
      this.audioManager.playSound(soundId);
    };
    
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
    
    // Connect systems that need to communicate with each other
    this.waveSystem.setAnimationSystem(this.animationSystem);
    this.waveSystem.setHUDSystem(this.hudSystem);
    collisionSystem.setAnimationSystem(this.animationSystem);
    collisionSystem.setPowerUpSystem(powerUpSystem);
  }

  private initEntities(): void {
    // Create the starfield background first so it's rendered behind everything else
    createStarfieldBackground(this.world);
    
    // Create the Dyson Sphere
    const dysonSphereEntity = createDysonSphere(this.world);
    
    // Create the central star inside the Dyson Sphere
    createCentralStar(this.world);
    
    // Create player ship
    const playerShip = createPlayerShip(this.world);
    const cameraEntity = createCamera(this.world, playerShip);
    createHUD(this.world, playerShip, dysonSphereEntity);
    
    // Ensure the WaveSystem is properly set up
    this.waveSystem.findDysonSphereEntity();
    this.waveSystem.resetWaves();

    this.stateManager.updateState({
      isPaused: false,
      isGameOver: false
    });
  }

  public startGame(): void {
    console.log('[Game] startGame() called'); // Added log

    // Update the game state to playing through the HUD system
    this.hudSystem.startGame();
    
    // Ensure the WaveSystem is properly set up
    this.waveSystem.findDysonSphereEntity();
    this.waveSystem.resetWaves();
    
    if (!this.isRunning) {
      console.log('[Game] Setting isRunning to true in startGame'); // Added log
      this.isRunning = true;
      this.lastFrameTime = performance.now();
    }
    
    // Request pointer lock when starting the game
    console.log('[Game] Requesting pointer lock in startGame'); // Added log
    this.inputManager.requestPointerLock();
  }

  public restart(): void {
    // Stop the current game loop
    this.pause();
    
    // Clean up any existing Three.js objects in the scene
    // to prevent memory leaks and duplicate objects
    this.sceneManager.clearScene();
    
    // Reset the game state
    this.stateManager.resetState();
    clearAccuracyShots();
    
    // Clear all entities by creating a new World instance
    this.world = new World();
    
    // Set the game state in the world
    this.world.setGameState(this.stateManager.getStateReference());
    
    // Reinitialize systems and entities
    this.initSystems();
    this.initEntities();
    
    // Resume soundtrack if it was paused
    this.audioManager.resumeSoundtrack();
    
    // Start the game - this updates HUD to 'playing' state
    this.hudSystem.startGame();
    
    // Make sure the global game state is also properly synchronized
    this.isRunning = true;
    this.stateManager.updateState({ isPaused: false, isGameOver: false });
    this.lastFrameTime = performance.now();
    
    // Double-check that GameStateDisplay is properly set to 'playing'
    // This ensures consistency between global state and component state
    const hudEntities = this.world.getEntitiesWith(['UIDisplay', 'GameStateDisplay']);
    if (hudEntities.length > 0) {
      const hudEntity = hudEntities[0];
      const gameStateDisplay = this.world.getComponent<GameStateDisplay>(hudEntity, 'GameStateDisplay');
      
      if (gameStateDisplay && gameStateDisplay.currentState !== 'playing') {
        // Force update to playing state using the same method as resumeGame
        this.world.removeComponent(hudEntity, 'GameStateDisplay');
        this.world.addComponent(hudEntity, 'GameStateDisplay', {
          ...gameStateDisplay,
          currentState: 'playing'
        });
      }
    }
    
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
    // Always set running to false immediately, even if we were already paused
    this.isRunning = false;
    
    // Update global state
    this.stateManager.updateState({ isPaused: true });
    
    // Update the GameStateDisplay component to ensure UI reflects the change
    const hudEntities = this.world.getEntitiesWith(['UIDisplay', 'GameStateDisplay']);
    if (hudEntities.length > 0) {
      const hudEntity = hudEntities[0];
      const gameStateDisplay = this.world.getComponent<GameStateDisplay>(hudEntity, 'GameStateDisplay');
      
      if (gameStateDisplay) {
        // Only update if state is actually changing
        if (gameStateDisplay.currentState !== 'paused') {
          this.world.removeComponent(hudEntity, 'GameStateDisplay');
          this.world.addComponent(hudEntity, 'GameStateDisplay', {
            ...gameStateDisplay,
            currentState: 'paused'
          });
        }
      }
    } else {
      console.warn('[Game] No HUD entities found to update GameStateDisplay');
    }

    this.inputManager.exitPointerLock();
  }

  public resumeGame(): void {
    // Update the game state component first
    const hudEntities = this.world.getEntitiesWith(['UIDisplay', 'GameStateDisplay']);
    if (hudEntities.length > 0) {
      const hudEntity = hudEntities[0];
      const gameStateDisplay = this.world.getComponent<GameStateDisplay>(hudEntity, 'GameStateDisplay');
      
      if (gameStateDisplay && gameStateDisplay.currentState !== 'playing') {
        this.world.removeComponent(hudEntity, 'GameStateDisplay');
        this.world.addComponent(hudEntity, 'GameStateDisplay', {
          ...gameStateDisplay,
          currentState: 'playing'
        });
      }
    } else {
      console.warn('[Game] No HUD entities found to update GameStateDisplay in resumeGame');
    }
    
    // Set game to running state only if it wasn't already
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastFrameTime = performance.now();
    }
    
    // Update game state manager immediately
    this.stateManager.updateState({ isPaused: false, isGameOver: false });
    this.inputManager.requestPointerLock();
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
        const globalState = this.stateManager.getStateReference();
        if (globalState.isGameOver && gameStateDisplay.currentState !== 'game_over') {
          gameStateDisplay.currentState = 'game_over';
        }

        // Exit pointer lock ONLY when game is definitively OVER
        if (gameStateDisplay.currentState === 'game_over') {
          if (document.pointerLockElement === this.container) {
             console.log('[Game Animate] Game Over detected, exiting pointer lock.');
             this.inputManager.exitPointerLock(); // Use InputManager method
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
      updateStarPower(this.stateManager.getStateReference(), deltaTime);
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

  public getGameState(): GameState {
    return this.stateManager.getState();
  }

  public getWorld(): World {
    return this.world;
  }

  public getStateManager(): GameStateManager {
    return this.stateManager;
  }

  public applyUpgrade(upgradeId: string): boolean {
    const state = this.stateManager.getStateReference();
    const upgradeCost = getUpgradeCost(upgradeId, this.getUpgradeLevel(upgradeId));
    if (state.upgradeCredits < upgradeCost) {
      return false;
    }

    const playerEntity = this.findPlayerEntity();
    const dysonEntity = this.findDysonSphereEntity();
    let applied = false;

    if (upgradeId === 'ship-damage') {
      state.shipDamageLevel += 1;
      applied = true;
    } else if (upgradeId === 'ship-fire-rate' && playerEntity !== -1) {
      const laserCooldown = this.world.getComponent<LaserCooldown>(playerEntity, 'LaserCooldown');
      if (laserCooldown) {
        laserCooldown.max = Math.max(0.12, laserCooldown.max * 0.9);
        state.shipFireRateLevel += 1;
        applied = true;
      }
    } else if (upgradeId === 'ship-hull' && playerEntity !== -1) {
      const health = this.world.getComponent<Health>(playerEntity, 'Health');
      if (health) {
        health.max += 25;
        health.current = Math.min(health.max, health.current + 25);
        state.shipHullLevel += 1;
        applied = true;
      }
    } else if (upgradeId === 'dyson-shield' && dysonEntity !== -1) {
      const shield = this.world.getComponent<Shield>(dysonEntity, 'Shield');
      if (shield) {
        shield.max += 50;
        shield.current = Math.min(shield.max, shield.current + 50);
        state.dysonShieldLevel += 1;
        applied = true;
      }
    } else if (upgradeId === 'dyson-regen' && dysonEntity !== -1) {
      const shield = this.world.getComponent<Shield>(dysonEntity, 'Shield');
      if (shield) {
        shield.regenRate += 5;
        state.dysonRegenLevel += 1;
        applied = true;
      }
    } else if (upgradeId === 'secondary-praetorian-laser') {
      state.secondaryWeapon = {
        ...state.secondaryWeapon,
        type: 'praetorianLaser',
        unlocked: true,
        charges: state.secondaryWeapon.maxCharges,
        isCharging: false,
        chargeProgress: 0,
        cooldown: 0
      };
      applied = true;
    }

    if (!applied) {
      return false;
    }

    state.upgradeCredits -= upgradeCost;

    this.hudSystem.displayMessage('UPGRADE INSTALLED', 2);

    return true;
  }

  private getUpgradeLevel(upgradeId: string): number {
    const state = this.stateManager.getStateReference();

    if (upgradeId === 'ship-damage') {
      return state.shipDamageLevel;
    }
    if (upgradeId === 'ship-fire-rate') {
      return state.shipFireRateLevel;
    }
    if (upgradeId === 'ship-hull') {
      return state.shipHullLevel;
    }
    if (upgradeId === 'dyson-shield') {
      return state.dysonShieldLevel;
    }
    if (upgradeId === 'dyson-regen') {
      return state.dysonRegenLevel;
    }

    return 0;
  }

  public skipUpgradeDraft(): void {
    const state = this.stateManager.getStateReference();
    state.upgradeDraftAvailable = false;
    if (this.isRunning) {
      this.inputManager.requestPointerLock();
    }
  }

  public getCamera(): THREE.Camera | null {
    return this.sceneManager.getCamera();
  }

  private findPlayerEntity(): number {
    const playerEntities = this.world.getEntitiesWith(['InputReceiver']);
    return playerEntities.length > 0 ? playerEntities[0] : -1;
  }

  private findDysonSphereEntity(): number {
    const entities = this.world.getEntitiesWith(['Renderable']);
    for (const entity of entities) {
      const renderable = this.world.getComponent<{ modelId: string }>(entity, 'Renderable');
      if (renderable?.modelId === 'dysonSphere') {
        return entity;
      }
    }

    return -1;
  }

  public dispose(): void {
    console.log('[Game] Disposing...');
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Remove event listeners
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    this.inputManager.dispose();
    
    // Dispose Three.js related resources via SceneManager
    this.sceneManager.destroy();
    
    // Clean up global references if set
    if ((window as any).powerUpSystem) {
        delete (window as any).powerUpSystem;
    }
    if ((window as any).collisionSystem) {
        delete (window as any).collisionSystem;
    }
    if ((window as any).testAudio) {
        delete (window as any).testAudio;
    }
    if ((window as any).testPowerUp) {
        delete (window as any).testPowerUp;
    }
    
    // Clear references
    // @ts-ignore - Allow setting to null for cleanup
    this.world = null;
    // @ts-ignore
    this.sceneManager = null;
    // @ts-ignore
    this.stateManager = null;
    // @ts-ignore
    this.hudSystem = null;
    // @ts-ignore
    this.waveSystem = null;
    // @ts-ignore
    this.floatingScoreSystem = null;
    // @ts-ignore
    this.animationSystem = null;
    // @ts-ignore
    this.devSystem = null;
    // @ts-ignore
    this.inputManager = null;
    // @ts-ignore
    this.audioManager = null;

    this.isRunning = false;
    this.wasPointerLocked = false;
    console.log('[Game] Disposed');
  }

  public restartAtWave(waveNumber: number): void {
    // Stop the current game loop
    this.pause();
    
    // Clean up any existing Three.js objects in the scene
    // to prevent memory leaks and duplicate objects
    this.sceneManager.clearScene();
    
    // Reset the game state
    this.stateManager.resetState();
    clearAccuracyShots();
    clearAccuracyShots();
    
    // Clear all entities by creating a new World instance
    this.world = new World();
    
    // Set the game state in the world
    this.world.setGameState(this.stateManager.getStateReference());
    
    // Reinitialize systems and entities
    this.initSystems();
    this.initEntities();
    
    // Start the game - this updates HUD to 'playing' state
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
    
    // Resume soundtrack if it was paused
    this.audioManager.resumeSoundtrack();
    
    // Make sure the global game state is also properly synchronized
    this.isRunning = true;
    this.stateManager.updateState({ isPaused: false, isGameOver: false });
    this.lastFrameTime = performance.now();
    
    // Double-check that GameStateDisplay is properly set to 'playing'
    // This ensures consistency between global state and component state
    const hudEntities = this.world.getEntitiesWith(['UIDisplay', 'GameStateDisplay']);
    if (hudEntities.length > 0) {
      const hudEntity = hudEntities[0];
      const gameStateDisplay = this.world.getComponent<GameStateDisplay>(hudEntity, 'GameStateDisplay');
      
      if (gameStateDisplay && gameStateDisplay.currentState !== 'playing') {
        // Force update to playing state using the same method as resumeGame
        this.world.removeComponent(hudEntity, 'GameStateDisplay');
        this.world.addComponent(hudEntity, 'GameStateDisplay', {
          ...gameStateDisplay,
          currentState: 'playing'
        });
      }
    }
    
    // Request pointer lock when restarting the game
    const inputManager = InputManager.getInstance(this.container);
    inputManager.requestPointerLock();
  }

  public requestPointerLock(): void {
    console.log('[Game] requestPointerLock called'); // Added log
    if (this.inputManager) {
      console.log('[Game] Forwarding request to InputManager'); // Added log
      this.inputManager.requestPointerLock();
    } else {
      console.warn('[Game] InputManager not available to request pointer lock.');
    }
  }

  /**
   * Resets the game to the initial state (start screen)
   */
  public reset(): void {
    // Stop the current game loop
    this.pause();
    
    // Clean up any existing Three.js objects in the scene
    this.sceneManager.clearScene();
    
    // Reset the game state
    this.stateManager.resetState();
    
    // Clear all entities by creating a new World instance
    this.world = new World();
    
    // Set the game state in the world
    this.world.setGameState(this.stateManager.getStateReference());
    
    // Reinitialize systems and entities
    this.initSystems();
    this.initEntities();
    
    // Set the game state to not_started
    const hudEntities = this.world.getEntitiesWith(['UIDisplay', 'GameStateDisplay']);
    if (hudEntities.length > 0) {
      const hudEntity = hudEntities[0];
      const gameStateDisplay = this.world.getComponent<GameStateDisplay>(hudEntity, 'GameStateDisplay');
      
      if (gameStateDisplay) {
        this.world.removeComponent(hudEntity, 'GameStateDisplay');
        this.world.addComponent(hudEntity, 'GameStateDisplay', {
          ...gameStateDisplay,
          currentState: 'not_started'
        });
      }
    }
    
    // Make sure the global game state is properly synchronized
    this.isRunning = false;
    this.stateManager.updateState({ isPaused: false, isGameOver: false });
    this.lastFrameTime = performance.now();
    
    // Exit pointer lock if active
    if (document.pointerLockElement === this.container) {
      document.exitPointerLock();
    }
  }

  // Handle pointer lock changes to ensure game state stays in sync
  private handlePointerLockChange = (): void => {
    const isLocked = document.pointerLockElement === this.container;

    // Get the current game state from the component
    let currentGameState: GameStateDisplay['currentState'] = 'not_started';
    const hudEntities = this.world?.getEntitiesWith(['UIDisplay', 'GameStateDisplay']);
    if (hudEntities && hudEntities.length > 0) {
      const hudEntity = hudEntities[0];
      const gameStateDisplay = this.world.getComponent<GameStateDisplay>(hudEntity, 'GameStateDisplay');
      if (gameStateDisplay) {
        currentGameState = gameStateDisplay.currentState;
      }
    }
    
    const isUpgradeDraftOpen = this.stateManager.getStateReference().upgradeDraftAvailable;

    // If pointer lock is exited while the game is actively playing, auto-pause.
    if (this.wasPointerLocked && !isLocked && this.isRunning && currentGameState === 'playing' && !isUpgradeDraftOpen) {
      this.pause();
    }

    this.wasPointerLocked = isLocked;
  };
}

export default Game;
