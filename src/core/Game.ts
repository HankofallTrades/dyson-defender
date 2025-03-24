import * as THREE from 'three';
import { GameState, GameStateManager } from './State';
import { SceneManager } from '../rendering/SceneManager';
import { World } from './World';
import { createDysonSphere } from './entities/DysonSphereEntity';
import { createPlayerShip } from './entities/PlayerShipEntity';
import { createCamera } from './entities/CameraEntity';
import { InputSystem } from './systems/InputSystem';
import { MovementSystem } from './systems/MovementSystem';
import { RenderingSystem } from './systems/RenderingSystem';
import { AutoRotateSystem } from './systems/AutoRotateSystem';
import { CameraSystem } from './systems/CameraSystem';
import { WeaponSystem } from './systems/WeaponSystem';

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

  constructor(container: HTMLElement) {
    console.log('Game: Initializing game');
    this.container = container;
    this.stateManager = new GameStateManager();
    this.stateManager.updateState({ lastUpdateTime: Date.now() });
    this.sceneManager = SceneManager.getInstance(container);
    this.world = new World();

    console.log('Game: Initializing systems');
    this.initSystems();
    
    console.log('Game: Initializing entities');
    this.initEntities();

    this.render();
    window.addEventListener('resize', this.handleResize);
    console.log('Game: Initialization complete');
  }

  private initSystems(): void {
    this.world.addSystem(new InputSystem(this.world, this.sceneManager));
    this.world.addSystem(new MovementSystem(this.sceneManager, this.world));
    this.world.addSystem(new CameraSystem(this.sceneManager, this.world));
    this.world.addSystem(new RenderingSystem(this.world, this.sceneManager.getScene()));
    this.world.addSystem(new WeaponSystem(this.world, this.sceneManager));
  }

  private initEntities(): void {
    console.log('Game: Creating Dyson Sphere');
    createDysonSphere(this.world);
    
    console.log('Game: Creating Player Ship');
    const playerShip = createPlayerShip(this.world);
    
    console.log('Game: Creating Camera Entity for player ship:', playerShip);
    createCamera(this.world, playerShip);
  }

  public start(): void {
    if (!this.isRunning) {
      console.log('Game: Starting game loop');
      this.isRunning = true;
      this.lastFrameTime = performance.now();
      this.stateManager.updateState({ isPaused: false });
      this.animate();
    }
  }

  public pause(): void {
    if (this.isRunning && this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      this.isRunning = false;
      this.stateManager.updateState({ isPaused: true });
    }
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    const gameState = this.stateManager.getState();
    if (gameState.isGameOver || gameState.isPaused) {
      return;
    }

    this.stateManager.updateState({ lastUpdateTime: Date.now() });
    this.world.update(deltaTime);
    this.render();
  };

  private render(): void {
    this.sceneManager.render();
  }

  private handleResize = (): void => {};

  public getGameState(): GameState {
    return this.stateManager.getState();
  }

  public resetGame(): void {
    this.stateManager.resetState();
    this.start();
  }

  public dispose(): void {
    this.pause();
    window.removeEventListener('resize', this.handleResize);
    this.sceneManager.dispose();
  }
}

export default Game;