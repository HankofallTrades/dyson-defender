import { World } from '../World';
import { Position, Portal, Renderable, Collider, Rotation } from '../components';
import { COLORS } from '../../constants/colors';

export function createPortal(
  world: World,
  position: Position,
  type: 'entry' | 'exit',
  label: string,
  targetUrl: string
): number {
  const entity = world.createEntity();
  
  // Add position component
  world.addComponent(entity, 'Position', { 
    x: position.x, 
    y: position.y, 
    z: position.z 
  });
  
  // Add rotation component to make portal face the Dyson sphere
  world.addComponent(entity, 'Rotation', {
    x: 0,
    y: 0, // 180 degrees to face inward toward the center
    z: Math.PI/2
  });
  
  // Add portal component
  world.addComponent(entity, 'Portal', {
    type,
    label,
    targetUrl,
    isActive: true,
    radius: 15.0, // Large enough for player to enter
    rotationSpeed: 0.5 // Moderate rotation speed
  });
  
  // Add renderable component
  world.addComponent(entity, 'Renderable', {
    modelId: 'portal',
    scale: 15.0, // Match the portal's trigger radius
    color: type === 'entry' ? COLORS.PORTAL_ENTRY : COLORS.PORTAL_EXIT,
    isVisible: true
  });
  
  // Add collider component (trigger)
  world.addComponent(entity, 'Collider', {
    type: 'sphere',
    radius: 15.0,
    isTrigger: true,
    layer: 'portal'
  });
  
  return entity;
}

export function disposePortal(world: World, entity: number): void {
  world.removeEntity(entity);
} 