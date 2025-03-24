import { System, World } from '../World';
import { Health, UIDisplay, HealthDisplay, ScoreDisplay, MessageDisplay, DysonSphereStatus, Renderable, DamageEffect, GameStateDisplay, GameOverStats } from '../components';

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
    
    const health = this.world.getComponent<Health>(dysonEntity, 'Health');
    
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
    
    // Only check for game over conditions if we're currently playing
    if (gameStateDisplay.currentState !== 'playing') return;
    
    // Check for game over condition - Dyson Sphere destroyed
    const dysonSphereEntities = this.world.getEntitiesWith(['Health', 'Renderable']);
    for (const entity of dysonSphereEntities) {
      const renderable = this.world.getComponent<Renderable>(entity, 'Renderable');
      if (renderable && renderable.modelId === 'dysonSphere') {
        const health = this.world.getComponent<Health>(entity, 'Health');
        if (health && health.current <= 0) {
          this.triggerGameOver(hudEntity, 'Dyson Sphere Destroyed');
          return;
        }
      }
    }
    
    // Check for game over condition - Player destroyed
    const playerEntities = this.world.getEntitiesWith(['Health', 'InputReceiver']);
    if (playerEntities.length > 0) {
      const playerEntity = playerEntities[0];
      const health = this.world.getComponent<Health>(playerEntity, 'Health');
      if (health && health.current <= 0) {
        this.triggerGameOver(hudEntity, 'Player Ship Destroyed');
        return;
      }
    }
  }
  
  private triggerGameOver(hudEntity: number, reason: string): void {
    const gameStateDisplay = this.world.getComponent<GameStateDisplay>(hudEntity, 'GameStateDisplay');
    if (!gameStateDisplay) return;
    
    // Update game state to game over
    gameStateDisplay.currentState = 'game_over';
    
    // Update game over stats
    const gameOverStats = this.world.getComponent<GameOverStats>(hudEntity, 'GameOverStats');
    const scoreDisplay = this.world.getComponent<ScoreDisplay>(hudEntity, 'ScoreDisplay');
    
    if (gameOverStats && scoreDisplay) {
      gameOverStats.finalScore = scoreDisplay.score;
      gameOverStats.survivalTime = (Date.now() - this.gameStartTime) / 1000; // in seconds
      
      // Calculate enemies defeated based on score
      // This is a simplified example - you might have a dedicated counter in a real game
      gameOverStats.enemiesDefeated = Math.floor(scoreDisplay.score / 100);
    }
    
    // Display game over message
    this.displayMessage(`GAME OVER - ${reason}`, 0); // Duration 0 means permanent
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
      this.displayMessage('Game Started! Protect the Dyson Sphere!', 3);
    }
  }
} 