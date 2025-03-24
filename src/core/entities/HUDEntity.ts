import { World } from '../World';
import { UIDisplay, HealthDisplay, ScoreDisplay, MessageDisplay, DysonSphereStatus, DamageEffect, GameStateDisplay, GameOverStats } from '../components';

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
    shieldPercentage: 100,
    healthPercentage: 100,
    criticalThreshold: 25  // Show warning when below 25%
  });
  
  world.addComponent(entity, 'DamageEffect', {
    active: false,
    duration: 0.5,
    intensity: 0.8,
    timeRemaining: 0
  });
  
  // Add game state display component
  world.addComponent(entity, 'GameStateDisplay', {
    currentState: 'not_started' // Start with the game not started
  });
  
  // Add game over stats component (will be populated later)
  world.addComponent(entity, 'GameOverStats', {
    finalScore: 0,
    survivalTime: 0,
    enemiesDefeated: 0
  });
  
  return entity;
} 