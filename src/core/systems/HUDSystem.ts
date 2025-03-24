import { System, World } from '../World';
import { Health, UIDisplay, HealthDisplay, ScoreDisplay, MessageDisplay, DysonSphereStatus, Renderable } from '../components';

export class HUDSystem implements System {
  private world: World;
  
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
  
  // Method to display a message - can be called from other systems
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
} 