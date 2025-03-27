import * as THREE from 'three';
import { World, System } from '../World';
import { Position, ShieldBubbleComponent } from '../components';

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
      
      // Get the renderable to add animation effects
      const renderable = this.world.getComponent<any>(bubble, 'Renderable');
      if (renderable && renderable.mesh) {
        const mesh = renderable.mesh;
        
        if (mesh instanceof THREE.Group) {
          // Base shield pulsation
          const globalPulseFactor = 1 + 0.08 * Math.sin(this.time * 1.5);
          mesh.scale.set(
            bubbleComponent.radius * globalPulseFactor,
            bubbleComponent.radius * globalPulseFactor,
            bubbleComponent.radius * globalPulseFactor
          );
          
          // Process the shield's components
          if (mesh.children.length >= 4) {
            // Outer shell (icosahedron) slow rotation
            const shell = mesh.children[0];
            shell.rotation.y += deltaTime * 0.15;
            shell.rotation.z += deltaTime * 0.05;
            
            // Inner energy field pulsation
            const innerField = mesh.children[1];
            if (innerField instanceof THREE.Mesh && 
                innerField.material instanceof THREE.MeshBasicMaterial) {
              const pulseValue = 0.15 + 0.12 * Math.sin(this.time * 2.5);
              innerField.material.opacity = pulseValue;
              innerField.scale.set(
                1 + 0.15 * Math.sin(this.time),
                1 + 0.15 * Math.sin(this.time * 1.2),
                1 + 0.15 * Math.sin(this.time * 0.8)
              );
            }
            
            // Animate rings
            const ringsGroup = mesh.children[2];
            if (ringsGroup instanceof THREE.Group) {
              ringsGroup.rotation.y += deltaTime * 0.1;
              ringsGroup.rotation.z += deltaTime * 0.05;
              
              ringsGroup.children.forEach((ring) => {
                if (ring instanceof THREE.Mesh && (ring as any).animData) {
                  const animData = (ring as any).animData;
                  // Rotate ring around its own axis
                  const rotationAxis = animData.axis;
                  const rotationQuat = new THREE.Quaternion();
                  rotationQuat.setFromAxisAngle(rotationAxis, animData.speed * deltaTime * 1.5);
                  ring.quaternion.multiply(rotationQuat);
                  
                  // Add pulsating opacity to rings
                  if (ring.material instanceof THREE.MeshBasicMaterial) {
                    const baseOpacity = 0.35;
                    const pulseAmount = 0.2 * Math.sin(this.time * 2 + animData.radius * 10);
                    ring.material.opacity = baseOpacity + pulseAmount;
                  }
                }
              });
            }
            
            // Animate hexagonal energy points
            const hexGroup = mesh.children[3];
            if (hexGroup instanceof THREE.Group) {
              hexGroup.children.forEach((hex) => {
                if (hex instanceof THREE.Mesh && 
                    hex.material instanceof THREE.MeshBasicMaterial && 
                    (hex as any).animData) {
                  const hexData = (hex as any).animData;
                  // Pulse opacity based on individual speed and phase
                  const pulseVal = Math.sin(this.time * hexData.pulseSpeed + hexData.pulsePhase);
                  hex.material.opacity = 0.3 + 0.2 * pulseVal;
                  
                  // Subtle size pulsing
                  const scaleFactor = 1 + 0.2 * pulseVal;
                  hex.scale.set(scaleFactor, scaleFactor, 1);
                }
              });
              
              // Slowly rotate the entire hex group
              hexGroup.rotation.y += deltaTime * 0.02;
            }
            
            // Animate energy arcs (electrical discharges)
            if (mesh.children.length >= 5) {
              const arcGroup = mesh.children[4];
              if (arcGroup instanceof THREE.Group) {
                arcGroup.children.forEach((arc) => {
                  if (arc instanceof THREE.Line && 
                      arc.material instanceof THREE.LineBasicMaterial && 
                      (arc as any).animData) {
                    const arcData = (arc as any).animData;
                    
                    // Count down to next flash
                    arcData.timeToNextFlash -= deltaTime;
                    
                    if (arcData.timeToNextFlash <= 0) {
                      // Flash the arc
                      if (arc.material.opacity <= 0) {
                        // Start flash - brighter
                        arc.material.opacity = 0.9;
                        arcData.timeToNextFlash = arcData.flashDuration;
                      } else {
                        // End flash and set shorter cooldown (more frequent flashing)
                        arc.material.opacity = 0;
                        arcData.timeToNextFlash = 1.5 + Math.random() * 3;
                      }
                    }
                  }
                });
                
                // Make all arcs flash at once when the shield takes damage
                // (This would need to be triggered by the collision system)
              }
            }
          }
        } else {
          // Fallback for older implementation
          const pulseFactor = 1 + 0.08 * Math.sin(this.time * 2);
          mesh.scale.set(
            bubbleComponent.radius * pulseFactor,
            bubbleComponent.radius * pulseFactor,
            bubbleComponent.radius * pulseFactor
          );
        }
      }
      
      // If guardian has a core, rotate it
      const guardianRenderable = this.world.getComponent<any>(guardian, 'Renderable');
      if (guardianRenderable && guardianRenderable.mesh) {
        const mesh = guardianRenderable.mesh;
        if (mesh instanceof THREE.Group && mesh.children.length > 0) {
          const mainMesh = mesh.children[0];
          
          // Rotate the entire crystal
          mainMesh.rotation.y += deltaTime * 0.2;
          
          // Handle crystal shards rotation for additional effect
          if (mainMesh instanceof THREE.Mesh && mainMesh.children.length > 0) {
            // Get the core (last child)
            const core = mainMesh.children[mainMesh.children.length - 1];
            
            // Rotate the core
            core.rotation.y += deltaTime * 0.5;
            core.rotation.x += deltaTime * 0.2;
            
            // For each crystal shard, add subtle independent movement
            for (let i = 0; i < mainMesh.children.length - 1; i++) {
              const shard = mainMesh.children[i];
              // Small oscillating movement for the shards
              const time = this.time + i;
              const oscillation = Math.sin(time * 2) * 0.05;
              shard.rotation.x += oscillation * deltaTime;
              shard.rotation.y += oscillation * deltaTime * 0.5;
            }
          }
        }
      }
    }
  }
} 