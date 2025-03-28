import * as THREE from 'three';
import { World, System } from '../World';
import { Position, ShieldBubbleComponent, ShieldComponent, Renderable } from '../components';

export class ShieldBubbleSystem implements System {
  private world: World;
  private time: number = 0;

  constructor(world: World) {
    this.world = world;
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    
    // Get all shield bubbles
    const bubbles = this.world.getEntitiesWith(['ShieldBubbleComponent', 'Position', 'Renderable']);
    
    for (const bubble of bubbles) {
      const bubbleComponent = this.world.getComponent<ShieldBubbleComponent>(bubble, 'ShieldBubbleComponent');
      if (!bubbleComponent) continue;
      
      const guardian = bubbleComponent.guardian;
      
      // Check if guardian still exists
      if (!this.world.hasEntity(guardian)) {
        // Guardian is gone, remove the bubble
        this.world.removeEntity(bubble);
        continue;
      }
      
      // Update bubble position to match guardian position
      const guardianPos = this.world.getComponent<Position>(guardian, 'Position');
      const bubblePos = this.world.getComponent<Position>(bubble, 'Position');
      
      if (guardianPos && bubblePos) {
        bubblePos.x = guardianPos.x;
        bubblePos.y = guardianPos.y;
        bubblePos.z = guardianPos.z;
      }
      
      // Simple bubble pulsing effect
      const renderable = this.world.getComponent<any>(bubble, 'Renderable');
      if (renderable && renderable.mesh) {
        const mesh = renderable.mesh;
        
        if (mesh instanceof THREE.Group) {
          // Simple scale pulsing only
          const pulseFactor = 1 + 0.05 * Math.sin(this.time * 1.5);
          mesh.scale.set(
            bubbleComponent.radius * pulseFactor,
            bubbleComponent.radius * pulseFactor,
            bubbleComponent.radius * pulseFactor
          );
          
          // Slowly rotate the shield for visual interest
          if (mesh.children.length > 0) {
            const outerShell = mesh.children[0];
            outerShell.rotation.y += deltaTime * 0.1;
          }
        }
      }
      
      // Rotate guardian crystal core if it exists
      const guardianRenderable = this.world.getComponent<any>(guardian, 'Renderable');
      if (guardianRenderable && guardianRenderable.mesh) {
        const guardianMesh = guardianRenderable.mesh;
        if (guardianMesh instanceof THREE.Group && guardianMesh.children.length > 0) {
          const mainCrystal = guardianMesh.children[0];
          if (mainCrystal && mainCrystal.children.length > 0) {
            const core = mainCrystal.children[0];
            if (core) {
              core.rotation.y += deltaTime * 1.5;
              core.rotation.x += deltaTime;
            }
          }
        }
      }
    }
  }
} 