import { System, World } from '../World';
import { Health, UIDisplay, HealthDisplay, ScoreDisplay, MessageDisplay, DysonSphereStatus, Renderable, DamageEffect, GameStateDisplay, GameOverStats, Shield, Reticle, Radar, Enemy, Position, Rotation, WaveInfo } from '../components';
import { InputManager } from '../input/InputManager';
import * as THREE from 'three';

export class HUDSystem implements System {
  private world: World;
  private gameStartTime: number = 0;
  
  constructor(world: World) {
    this.world = world;
  }
  
  update(deltaTime: number): void {
    // Get all HUD entities
    const hudEntities = this.world.getEntitiesWith(['UIDisplay']);
    
    for (const hudEntity of hudEntities) {
      this.updateHealthDisplay(hudEntity);
      this.updateDysonSphereStatus(hudEntity);
      this.updateMessages(hudEntity, deltaTime);
      this.updateDamageEffect(hudEntity, deltaTime);
      this.updateGameState(hudEntity);
      this.updateRadar(hudEntity, deltaTime);
    }
  }
  
  private updateHealthDisplay(hudEntity: number): void {
    const healthDisplay = this.world.getComponent<HealthDisplay>(hudEntity, 'HealthDisplay');
    if (!healthDisplay) return;
    
    // Get health of the referenced entity
    const targetEntity = healthDisplay.entity;
    const health = this.world.getComponent<Health>(targetEntity, 'Health');
    
    // Health data is now available for rendering
    // (The React component will read this data)
  }
  
  private updateDysonSphereStatus(hudEntity: number): void {
    const dysonStatus = this.world.getComponent<DysonSphereStatus>(hudEntity, 'DysonSphereStatus');
    if (!dysonStatus) return;
    
    // Find Dyson Sphere entity
    const dysonEntities = this.world.getEntitiesWith(['Renderable']);
    let dysonEntity = -1;
    
    // Find the entity with modelId === 'dysonSphere'
    for (const entity of dysonEntities) {
      const renderable = this.world.getComponent<Renderable>(entity, 'Renderable');
      if (renderable && renderable.modelId === 'dysonSphere') {
        dysonEntity = entity;
        break;
      }
    }
    
    if (dysonEntity === -1) return;
    
    // Get shield and health from the Dyson Sphere entity
    const shield = this.world.getComponent<Shield>(dysonEntity, 'Shield');
    const health = this.world.getComponent<Health>(dysonEntity, 'Health');
    
    // Update status with both shield and health information
    if (shield) {
      dysonStatus.shieldPercentage = (shield.current / shield.max) * 100;
    }
    
    if (health) {
      dysonStatus.healthPercentage = (health.current / health.max) * 100;
    }
  }
  
  private updateMessages(hudEntity: number, deltaTime: number): void {
    const messageDisplay = this.world.getComponent<MessageDisplay>(hudEntity, 'MessageDisplay');
    if (!messageDisplay || messageDisplay.timeRemaining <= 0) return;
    
    // Update message timer
    messageDisplay.timeRemaining -= deltaTime;
    if (messageDisplay.timeRemaining <= 0) {
      messageDisplay.message = '';
    }
  }
  
  private updateDamageEffect(hudEntity: number, deltaTime: number): void {
    const damageEffect = this.world.getComponent<DamageEffect>(hudEntity, 'DamageEffect');
    if (!damageEffect) return;
    
    // If the damage effect is active, update its timer
    if (damageEffect.active) {
      damageEffect.timeRemaining -= deltaTime;
      
      // Deactivate when timer reaches zero
      if (damageEffect.timeRemaining <= 0) {
        damageEffect.active = false;
        damageEffect.timeRemaining = 0;
      }
    }
  }
  
  private updateGameState(hudEntity: number): void {
    const gameStateDisplay = this.world.getComponent<GameStateDisplay>(hudEntity, 'GameStateDisplay');
    if (!gameStateDisplay) return;

    const globalState = this.world.getGameState();
    if (!globalState) return; // Should not happen, but good practice

    const currentComponentState = gameStateDisplay.currentState;
    let newComponentState = currentComponentState;

    // --- Sync with global pause state --- 
    if (globalState.isPaused) {
      // If globally paused, but component thinks it's playing, update component state
      if (currentComponentState === 'playing') {
        newComponentState = 'paused';
      }
      // If component is already 'paused', 'game_over', or 'not_started', leave it.
    } else { // Global state is NOT paused
      // If globally not paused, but component thinks it's paused, update component state
      if (currentComponentState === 'paused') {
        newComponentState = 'playing';
      }
      // If component is already 'playing', 'game_over', or 'not_started', leave it.
    }
    // --- End Sync ---

    // Check for game over conditions ONLY if the potentially new state is 'playing'
    // This prevents triggering game over logic while paused or on other screens.
    if (newComponentState === 'playing') {
      // Check for game over condition - Dyson Sphere destroyed
      const dysonSphereEntities = this.world.getEntitiesWith(['Health', 'Renderable']);
      let dysonDestroyed = false;
      for (const entity of dysonSphereEntities) {
        const renderable = this.world.getComponent<Renderable>(entity, 'Renderable');
        if (renderable && renderable.modelId === 'dysonSphere') {
          const health = this.world.getComponent<Health>(entity, 'Health');
          if (health && health.current <= 0) {
            // Trigger game over but don't remove the Dyson Sphere
            if (renderable) {
              renderable.color = 0x444444; // Gray color to indicate destroyed state
            }
            this.triggerGameOver(hudEntity, 'Dyson Sphere Destroyed');
            newComponentState = 'game_over'; // Update state immediately
            dysonDestroyed = true;
            break; // Exit loop once Dyson Sphere found and destroyed
          }
        }
      }

      // Check for game over condition - Player destroyed (only if Dyson Sphere is not destroyed)
      if (!dysonDestroyed) {
        const playerEntities = this.world.getEntitiesWith(['Health', 'InputReceiver']);
        if (playerEntities.length > 0) {
          const playerEntity = playerEntities[0];
          const health = this.world.getComponent<Health>(playerEntity, 'Health');
          if (health && health.current <= 0) {
            this.triggerGameOver(hudEntity, 'Player Ship Destroyed');
            newComponentState = 'game_over'; // Update state immediately
          }
        }
      }
    }

    // Update the component state ONLY if it has actually changed
    if (newComponentState !== currentComponentState) {
      gameStateDisplay.currentState = newComponentState;
    }
  }
  
  public triggerGameOver(hudEntity: number, reason: string): void {
    const gameStateDisplay = this.world.getComponent<GameStateDisplay>(hudEntity, 'GameStateDisplay');
    if (!gameStateDisplay) return;
    
    // Update game state to game over
    gameStateDisplay.currentState = 'game_over';
    
    // Exit pointer lock so the cursor is available for the game over screen
    const container = document.getElementById('game-container');
    if (container) {
      const inputManager = InputManager.getInstance(container);
      inputManager.exitPointerLock();
    }
  }
  
  public displayMessage(message: string, duration: number = 3): void {
    const hudEntities = this.world.getEntitiesWith(['UIDisplay', 'MessageDisplay']);
    if (hudEntities.length === 0) return;
    
    const messageDisplay = this.world.getComponent<MessageDisplay>(hudEntities[0], 'MessageDisplay');
    if (messageDisplay) {
      messageDisplay.message = message;
      messageDisplay.duration = duration;
      messageDisplay.timeRemaining = duration;
    }
  }
  
  public incrementScore(amount: number): void {
    const hudEntities = this.world.getEntitiesWith(['UIDisplay', 'ScoreDisplay']);
    if (hudEntities.length === 0) return;
    
    const scoreDisplay = this.world.getComponent<ScoreDisplay>(hudEntities[0], 'ScoreDisplay');
    if (scoreDisplay) {
      scoreDisplay.score += amount;
    }
  }
  
  public activateDamageEffect(intensity: number = 0.8, duration: number = 0.5): void {
    const hudEntities = this.world.getEntitiesWith(['UIDisplay', 'DamageEffect']);
    if (hudEntities.length === 0) return;
    
    const damageEffect = this.world.getComponent<DamageEffect>(hudEntities[0], 'DamageEffect');
    if (damageEffect) {
      damageEffect.active = true;
      damageEffect.intensity = intensity;
      damageEffect.duration = duration;
      damageEffect.timeRemaining = duration;
    }
  }
  
  public startGame(): void {
    const hudEntities = this.world.getEntitiesWith(['UIDisplay', 'GameStateDisplay']);
    if (hudEntities.length === 0) return;
    
    const hudEntity = hudEntities[0];
    const gameStateDisplay = this.world.getComponent<GameStateDisplay>(hudEntity, 'GameStateDisplay');
    
    if (gameStateDisplay) {
      gameStateDisplay.currentState = 'playing';
      this.gameStartTime = Date.now();
      
      // Reset all HUD components when starting a game
      this.resetHUD(hudEntity);
    }
  }
  
  public setReticleStyle(style: string, color: string = '#00ffff', size: number = 1, pulsating: boolean = true): void {
    const hudEntities = this.world.getEntitiesWith(['UIDisplay', 'Reticle']);
    if (hudEntities.length === 0) return;
    
    const reticle = this.world.getComponent<Reticle>(hudEntities[0], 'Reticle');
    if (reticle) {
      reticle.style = style;
      reticle.color = color;
      reticle.size = size;
      reticle.pulsating = pulsating;
    }
  }
  
  public toggleReticleVisibility(visible?: boolean): void {
    const hudEntities = this.world.getEntitiesWith(['UIDisplay', 'Reticle']);
    if (hudEntities.length === 0) return;
    
    const reticle = this.world.getComponent<Reticle>(hudEntities[0], 'Reticle');
    if (reticle) {
      reticle.visible = visible !== undefined ? visible : !reticle.visible;
    }
  }
  
  // Reset all HUD-related components to their initial values
  public resetHUD(hudEntity: number): void {
    // Reset score to 0
    const scoreDisplay = this.world.getComponent<ScoreDisplay>(hudEntity, 'ScoreDisplay');
    if (scoreDisplay) {
      scoreDisplay.score = 0;
    }
    
    // Reset game over stats
    const gameOverStats = this.world.getComponent<GameOverStats>(hudEntity, 'GameOverStats');
    if (gameOverStats) {
      gameOverStats.finalScore = 0;
      gameOverStats.survivalTime = 0;
      gameOverStats.enemiesDefeated = 0;
      gameOverStats.wavesCompleted = 0;
    }
    
    // Reset message display
    const messageDisplay = this.world.getComponent<MessageDisplay>(hudEntity, 'MessageDisplay');
    if (messageDisplay) {
      messageDisplay.message = '';
      messageDisplay.timeRemaining = 0;
    }
    
    // Reset damage effect
    const damageEffect = this.world.getComponent<DamageEffect>(hudEntity, 'DamageEffect');
    if (damageEffect) {
      damageEffect.active = false;
      damageEffect.timeRemaining = 0;
    }
  }
  
  private updateRadar(hudEntity: number, deltaTime: number): void {
    const radar = this.world.getComponent<Radar>(hudEntity, 'Radar');
    if (!radar || !radar.active) return;
    
    // Update refresh timer
    radar.timeUntilRefresh -= deltaTime;
    if (radar.timeUntilRefresh > 0) return; // Not time to refresh yet
    
    // Reset timer
    radar.timeUntilRefresh = radar.refreshRate;
    
    // Get player position and rotation as reference point
    const playerEntities = this.world.getEntitiesWith(['InputReceiver', 'Position', 'Rotation']);
    if (playerEntities.length === 0) return;
    
    const playerEntity = playerEntities[0];
    const playerPos = this.world.getComponent<Position>(playerEntity, 'Position');
    const playerRot = this.world.getComponent<Rotation>(playerEntity, 'Rotation');
    if (!playerPos || !playerRot) return;
    
    // Create a forward vector based on player's rotation
    const playerForward = new THREE.Vector3(0, 0, -1); // Default forward in THREE.js
    const playerQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(playerRot.x, playerRot.y, playerRot.z, 'YXZ')
    );
    playerForward.applyQuaternion(playerQuat);
    
    // Create right vector (perpendicular to forward)
    const playerRight = new THREE.Vector3(1, 0, 0);
    playerRight.applyQuaternion(playerQuat);
    
    // Find all enemy entities within range
    const enemyEntities = this.world.getEntitiesWith(['Enemy', 'Position']);
    
    // Clear tracked entities
    radar.trackedEntities = [];
    
    // Process each enemy
    for (const enemyEntity of enemyEntities) {
      const enemy = this.world.getComponent<Enemy>(enemyEntity, 'Enemy');
      const position = this.world.getComponent<Position>(enemyEntity, 'Position');
      
      if (!enemy || !position) continue;
      
      // Calculate distance vector from player to enemy
      const distanceVector = new THREE.Vector3(
        position.x - playerPos.x,
        position.y - playerPos.y,
        position.z - playerPos.z
      );
      
      const distance = distanceVector.length();
      
      // Track all enemies regardless of distance since we clamp in UI
      // Calculate normalized direction vector for the radar
      const rawDirection = distanceVector.clone().normalize();
      
      // Project the enemy position onto the player's local space
      // Forward (z) will be mapped to y-axis on radar (up/down)
      // Right (x) will be mapped to x-axis on radar (left/right)
      const forwardProjection = playerForward.dot(rawDirection);
      const rightProjection = playerRight.dot(rawDirection);
      
      // Calculate relative vertical position (how much higher/lower the enemy is)
      const verticalDifference = position.y - playerPos.y;
      
      // Calculate threat level based on enemy type or siege mode
      let threatLevel = 0.5; // Default threat level
      
      // Higher threat level for enemies in siege mode
      if (enemy.inSiegeMode) {
        threatLevel = 0.9;
      } else {
        // Threat level based on enemy type
        switch (enemy.type) {
          case 'grunt':
            threatLevel = 0.6;
            break;
          case 'bomber':
            threatLevel = 0.8;
            break;
          case 'asteroid':
            threatLevel = 1.0; // Highest threat level for asteroids
            break;
          case 'warpRaider':
            threatLevel = 0.8;
            break;
          case 'shieldGuardian':
            threatLevel = 0.7;
            break;
          default:
            threatLevel = 0.5;
        }
      }
      
      // Add to tracked entities - with directions relative to player's orientation
      radar.trackedEntities.push({
        entityId: enemyEntity,
        entityType: enemy.type,
        distance: distance,
        direction: {
          // X is left/right relative to player
          x: rightProjection,
          // Original Y (vertical axis in 3D) preserved for elevation indicators
          y: verticalDifference,
          // Z becomes Y in radar (up/down) - forward is positive, backward is negative
          z: forwardProjection
        },
        threatLevel: threatLevel
      });
    }
    
    // Find and add Dyson Sphere to radar
    const dysonSphereEntities = this.world.getEntitiesWith(['Renderable', 'Position']);
    for (const dysonEntity of dysonSphereEntities) {
      const renderable = this.world.getComponent<Renderable>(dysonEntity, 'Renderable');
      const position = this.world.getComponent<Position>(dysonEntity, 'Position');
      
      if (!renderable || !position || renderable.modelId !== 'dysonSphere') continue;
      
      // Calculate distance vector from player to Dyson Sphere
      const distanceVector = new THREE.Vector3(
        position.x - playerPos.x,
        position.y - playerPos.y,
        position.z - playerPos.z
      );
      
      const distance = distanceVector.length();
      
      // Dyson sphere is always on radar regardless of distance
      const rawDirection = distanceVector.clone().normalize();
      
      // Project the Dyson Sphere position onto the player's local space
      const forwardProjection = playerForward.dot(rawDirection);
      const rightProjection = playerRight.dot(rawDirection);
      
      // Add Dyson Sphere to tracked entities
      radar.trackedEntities.push({
        entityId: dysonEntity,
        entityType: 'dysonSphere',
        distance: distance,
        direction: {
          x: rightProjection,
          y: position.y - playerPos.y,
          z: forwardProjection
        },
        threatLevel: 0.0 // Special value for Dyson Sphere - will render differently
      });
    }
  }
} 