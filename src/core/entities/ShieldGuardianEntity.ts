import { World } from '../World';
import * as THREE from 'three';
import { Position, Velocity, Rotation, Health, Collider, Enemy, ShieldComponent, ShieldBubbleComponent, ShieldBarComponent } from '../components';
import { COLORS } from '../../constants/colors';

export function createShieldGuardian(
  world: World,
  position: { x: number, y: number, z: number },
  targetEntity: number // The entity ID that this enemy will target (usually Dyson Sphere)
): number {
  // Create the Shield Guardian entity
  const guardian = world.createEntity();
  
  // Add position component
  world.addComponent(guardian, 'Position', { 
    x: position.x, 
    y: position.y, 
    z: position.z 
  });
  
  // Add rotation component
  world.addComponent(guardian, 'Rotation', { 
    x: 0, 
    y: 0, 
    z: 0 
  });
  
  // Add enemy-specific component
  world.addComponent(guardian, 'Enemy', {
    targetEntity: targetEntity,
    type: 'shieldGuardian',
    speed: 20, // Doubled speed (was 10)
    damage: 15, // More damage than regular enemies
    attackCooldown: 3, // Seconds between attacks
    currentCooldown: 0,
    inSiegeMode: false,
    laserCooldown: 4.0, // Fire laser less frequently
    currentLaserCooldown: 0,
    canMove: true,
    canShoot: false
  });
  
  // Add health component
  world.addComponent(guardian, 'Health', { 
    current: 1, // Reduced from 50 to 1 (one-shot kill)
    max: 1 
  });
  
  // Add shield component
  world.addComponent(guardian, 'ShieldComponent', {
    currentShield: 5, // Increased from 3 to 5 hits to destroy
    maxShield: 5
  });
  
  // Add shield bar component for visual display
  world.addComponent(guardian, 'ShieldBarComponent', {
    entity: guardian,
    offsetY: 7, // Position above the guardian
    width: 40,
    height: 5,
    visible: true
  });
  
  // Add renderable component with initial small scale
  world.addComponent(guardian, 'Renderable', {
    modelId: 'shieldGuardian',
    scale: 0.1, // Start with a small scale
    color: COLORS.SHIELD_GUARDIAN_CRYSTAL,
    isVisible: true
  });
  
  // Add collider for collision detection
  world.addComponent(guardian, 'Collider', {
    type: 'sphere',
    radius: 3.0,
    isTrigger: false,
    layer: 'enemy'
  });
  
  // Add velocity component (initialized to zero, will be set by systems)
  world.addComponent(guardian, 'Velocity', { 
    x: 0, 
    y: 0, 
    z: 0 
  });
  
  // Add a growth animation component that matches the wormhole's timing
  world.addComponent(guardian, 'Animation', {
    type: 'growth',
    progress: 0,
    duration: 3.5, // 70% of the 5-second wormhole animation (growing + stable phases)
    isComplete: false,
    data: {
      finalScale: 3.0 // Target scale to grow to
    }
  });
  
  // Create the shield bubble entity
  const bubble = world.createEntity();
  
  // Add position to match the guardian
  world.addComponent(bubble, 'Position', { 
    x: position.x, 
    y: position.y, 
    z: position.z 
  });
  
  // Add shield bubble component
  world.addComponent(bubble, 'ShieldBubbleComponent', {
    guardian: guardian,
    radius: 80  // Doubled from 40 to 80
  });
  
  // Add renderable component for the bubble with initial small scale
  // Start from a very small point and expand to full size
  world.addComponent(bubble, 'Renderable', {
    modelId: 'shieldBubble',
    scale: 0.1, // Start very small
    color: COLORS.SHIELD_BUBBLE,
    isVisible: true
  });
  
  // Add collider for the bubble
  world.addComponent(bubble, 'Collider', {
    type: 'sphere',
    radius: 80.0, // Full collision radius
    isTrigger: true, // It's a trigger collider as it doesn't physically block
    layer: 'shield'  // Custom layer for shield
  });
  
  // Add growth animation for the shield bubble
  world.addComponent(bubble, 'Animation', {
    type: 'growth',
    progress: 0,
    duration: 3.5, // Same timing as the guardian
    isComplete: false,
    data: {
      finalScale: 80.0 // Target scale to grow to
    }
  });
  
  return guardian;
}

export function disposeShieldGuardian(world: World, entity: number): void {
  // Find and remove the shield bubble entity
  const bubbles = world.getEntitiesWith(['ShieldBubbleComponent']);
  for (const bubble of bubbles) {
    const bubbleComponent = world.getComponent<ShieldBubbleComponent>(bubble, 'ShieldBubbleComponent');
    if (bubbleComponent && bubbleComponent.guardian === entity) {
      world.removeEntity(bubble);
      break;
    }
  }
  
  // Remove the Shield Guardian entity
  world.removeEntity(entity);
} 