import { World } from '../World';
import { UIDisplay, HealthDisplay, ScoreDisplay, MessageDisplay, DysonSphereStatus } from '../components';

export function createHUD(world: World, playerEntity: number, dysonSphereEntity: number): number {
  const entity = world.createEntity();
  
  // Add components
  world.addComponent(entity, 'UIDisplay', { 
    visible: true 
  });
  
  world.addComponent(entity, 'HealthDisplay', { 
    entity: playerEntity 
  });
  
  world.addComponent(entity, 'ScoreDisplay', { 
    score: 0 
  });
  
  world.addComponent(entity, 'MessageDisplay', { 
    message: '',
    duration: 0,
    timeRemaining: 0
  });
  
  world.addComponent(entity, 'DysonSphereStatus', {
    healthPercentage: 100,
    criticalThreshold: 25  // Show warning when below 25%
  });
  
  return entity;
} 