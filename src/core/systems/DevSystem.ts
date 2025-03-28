import * as THREE from 'three';
import { World, System } from '../World';
import { DevMode, MouseLook, Position, Rotation, Velocity } from '../components';
import { SceneManager } from '../../rendering/SceneManager';
import { InputManager } from '../input/InputManager';
import { createDevCamera } from '../entities/DevCameraEntity';
import { GameState, GameStateManager } from '../State';
import { GameStateDisplay } from '../components';

/**
 * Dev System
 * 
 * Purpose:
 * Provides development tools for inspecting and debugging the game.
 * 
 * Responsibilities:
 * - Manages the dev mode toggle (freeze/unfreeze game state)
 * - Handles the free-flying dev camera
 * - Processes input specifically for dev mode
 * 
 * This system is intended for development only and can be removed in production.
 */
export class DevSystem implements System {
  private world: World;
  private sceneManager: SceneManager;
  private container: HTMLElement;
  private isDevModeActive: boolean = false;
  private devModeEntity: number = -1;
  private stateManager: GameStateManager;
  private wasGameRunning: boolean = false;
  private wasToggleKeyPressed: boolean = false; // Track previous key state
  
  constructor(world: World, sceneManager: SceneManager, container: HTMLElement) {
    this.world = world;
    this.sceneManager = sceneManager;
    this.container = container;
    this.stateManager = new GameStateManager();
  }
  
  update(deltaTime: number): void {
    // Check for dev mode toggle
    const inputManager = InputManager.getInstance(this.container);
    const inputState = inputManager.getInputState();
    
    // Handle toggling dev mode - ONLY on key press, not while held
    if (inputState.toggleDevMode && !this.wasToggleKeyPressed) {
      // Key was just pressed
      console.log("Dev mode toggle key pressed");
      if (!this.isDevModeActive) {
        console.log("Activating developer mode");
        this.activateDevMode();
      } else {
        console.log("Deactivating developer mode");
        this.deactivateDevMode();
      }
    }
    
    // Update previous key state
    this.wasToggleKeyPressed = inputState.toggleDevMode;
    
    // If dev mode is active, handle camera movement
    if (this.isDevModeActive) {
      this.updateDevCamera(deltaTime);
    }
  }
  
  /**
   * Returns whether dev mode is currently active
   */
  isActive(): boolean {
    return this.isDevModeActive;
  }
  
  /**
   * Activate dev mode - create a free camera and store the current state
   */
  private activateDevMode(): void {
    this.isDevModeActive = true;
    
    // Check if game is running and store this state
    const gameState = this.world.getGameState();
    if (gameState) {
      this.wasGameRunning = !gameState.isPaused;
      // Pause the game state
      this.stateManager.updateState({ isPaused: true });
      this.world.setGameState(this.stateManager.getState());
    }
    
    // Create a dev entity to track dev mode
    this.devModeEntity = this.world.createEntity();
    
    // Find the current camera entity to get its position and rotation
    const cameraEntities = this.world.getEntitiesWith(['Camera']);
    if (cameraEntities.length > 0) {
      const cameraEntity = cameraEntities[0];
      
      // Try to get parent entity of camera for position
      let initialPosition: Position = { x: 0, y: 0, z: 0 };
      let initialRotation: Rotation = { x: 0, y: 0, z: 0 };
      
      const cameraMount = this.world.getComponent<any>(cameraEntity, 'CameraMount');
      if (cameraMount) {
        const parentEntity = cameraMount.parentEntity;
        const parentPosition = this.world.getComponent<Position>(parentEntity, 'Position');
        const parentRotation = this.world.getComponent<Rotation>(parentEntity, 'Rotation');
        
        if (parentPosition && parentRotation) {
          initialPosition = { ...parentPosition };
          initialRotation = { ...parentRotation };
        }
      }
      
      // Create dev camera at the same position
      const devCameraEntity = createDevCamera(
        this.world, 
        initialPosition,
        initialRotation
      );
      
      // Store the original and dev camera entities in the DevMode component
      this.world.addComponent(this.devModeEntity, 'DevMode', {
        isActive: true,
        originalCameraEntity: cameraEntity,
        devCameraEntity: devCameraEntity
      });
      
      // Request pointer lock for the dev camera
      const inputManager = InputManager.getInstance(this.container);
      inputManager.requestPointerLock();
    }
  }
  
  /**
   * Deactivate dev mode - remove the dev camera and restore original state
   */
  private deactivateDevMode(): void {
    this.isDevModeActive = false;
    
    // Check if we have a dev mode entity
    if (this.devModeEntity !== -1 && this.world.hasEntity(this.devModeEntity)) {
      const devMode = this.world.getComponent<DevMode>(this.devModeEntity, 'DevMode');
      
      if (devMode) {
        // Remove the dev camera entity
        this.world.removeEntity(devMode.devCameraEntity);
      }
      
      // Remove the dev mode entity
      this.world.removeEntity(this.devModeEntity);
      this.devModeEntity = -1;
    }
    
    // Restore game running state if it was running before
    if (this.wasGameRunning) {
      // First update the GameState
      const gameState = this.world.getGameState();
      if (gameState) {
        this.stateManager.updateState({ isPaused: false });
        this.world.setGameState(this.stateManager.getState());
      }
      
      // Then update the UI game state display
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
    }
    
    // Request pointer lock to keep playing the game
    const inputManager = InputManager.getInstance(this.container);
    inputManager.requestPointerLock();
  }
  
  /**
   * Update the dev camera based on input
   */
  private updateDevCamera(deltaTime: number): void {
    if (this.devModeEntity === -1 || !this.world.hasEntity(this.devModeEntity)) return;
    
    const devMode = this.world.getComponent<DevMode>(this.devModeEntity, 'DevMode');
    if (!devMode || !devMode.devCameraEntity) return;
    
    // Only process input for the dev camera
    const inputManager = InputManager.getInstance(this.container);
    const inputState = inputManager.getInputState();
    const mouseState = inputManager.getMouseState();
    
    // Handle mouse movement for dev camera rotation
    if (mouseState.isPointerLocked) {
      const rotation = this.world.getComponent<Rotation>(devMode.devCameraEntity, 'Rotation');
      const mouseLook = this.world.getComponent<MouseLook>(devMode.devCameraEntity, 'MouseLook');
      
      if (rotation && mouseLook) {
        // Apply mouse movement
        mouseLook.yaw -= mouseState.movementX * mouseLook.sensitivity;
        mouseLook.pitch -= mouseState.movementY * mouseLook.sensitivity;
        
        // Constrain pitch to prevent camera flipping
        mouseLook.pitch = Math.max(mouseLook.pitchMin, Math.min(mouseLook.pitchMax, mouseLook.pitch));
        
        // Apply rotation to entity
        rotation.x = mouseLook.pitch;
        rotation.y = mouseLook.yaw;
        rotation.z = 0;
      }
      
      // Handle movement for dev camera
      const position = this.world.getComponent<Position>(devMode.devCameraEntity, 'Position');
      const velocity = this.world.getComponent<Velocity>(devMode.devCameraEntity, 'Velocity');
      
      if (position && velocity && rotation) {
        // Calculate movement direction based on input
        const direction = new THREE.Vector3(0, 0, 0);
        
        // Create forward vector based on where the camera is looking
        const forward = new THREE.Vector3(0, 0, -1);
        const pitchMatrix = new THREE.Matrix4().makeRotationX(rotation.x);
        const yawMatrix = new THREE.Matrix4().makeRotationY(rotation.y);
        
        // Apply rotations to get the true forward direction
        forward.applyMatrix4(pitchMatrix);
        forward.applyMatrix4(yawMatrix);
        
        // Apply right vector (perpendicular to forward, only apply yaw)
        const right = new THREE.Vector3(1, 0, 0);
        right.applyMatrix4(yawMatrix); 
        
        // Up is always world up
        const up = new THREE.Vector3(0, 1, 0);
        
        // Apply inputs to direction
        if (inputState.forward) direction.add(forward);
        if (inputState.backward) direction.sub(forward);
        if (inputState.right) direction.add(right);
        if (inputState.left) direction.sub(right);
        if (inputState.up) direction.add(up);
        if (inputState.down) direction.sub(up);
        
        // Normalize direction and apply velocity
        if (direction.lengthSq() > 0) {
          direction.normalize();
          const SPEED = 100.0; // Faster camera speed for dev mode
          
          // Calculate new position directly
          position.x += direction.x * SPEED * deltaTime;
          position.y += direction.y * SPEED * deltaTime;
          position.z += direction.z * SPEED * deltaTime;
        }
      }
    }
    
    // Update camera in scene
    const camera = this.sceneManager.getCamera();
    if (camera) {
      const position = this.world.getComponent<Position>(devMode.devCameraEntity, 'Position');
      const rotation = this.world.getComponent<Rotation>(devMode.devCameraEntity, 'Rotation');
      
      if (position && rotation) {
        camera.position.set(position.x, position.y, position.z);
        camera.rotation.x = rotation.x;
        camera.rotation.y = rotation.y;
        camera.rotation.z = rotation.z;
        camera.updateMatrixWorld(true);
      }
    }
  }
} 