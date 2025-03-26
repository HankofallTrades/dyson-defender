import * as THREE from 'three';
import { World, System } from '../World';
import { Animation, Position, WormholeAnimationData, Renderable, GrowthAnimationData } from '../components';
import { COLORS } from '../../constants/colors';

// Define a type for animation events
type AnimationEventCallback = (entity: number, position: Position) => void;

/**
 * AnimationSystem
 * 
 * Purpose:
 * Handles all visual effects and animations in the game using the ECS pattern.
 * 
 * Responsibilities:
 * - Updates animation progress and lifecycle
 * - Manages animation phases (e.g., wormhole growing/stable/shrinking)
 * - Creates and updates visual effects using Three.js
 * - Cleans up completed animations
 * - Triggers callbacks when animations reach certain phases
 */
export class AnimationSystem implements System {
  private world: World;
  private scene: THREE.Scene;
  private effectMeshes: Map<number, THREE.Group> = new Map();
  private shootingTimers: Map<number, number> = new Map();
  private wormholeStableCallbacks: Map<number, AnimationEventCallback> = new Map();

  constructor(world: World, scene: THREE.Scene) {
    this.world = world;
    this.scene = scene;
  }

  /**
   * Register a callback to be called when a wormhole entity reaches the stable phase
   * @param entity - The wormhole entity ID
   * @param callback - Function to call when the wormhole reaches stable phase
   */
  public onWormholeStable(entity: number, callback: AnimationEventCallback): void {
    this.wormholeStableCallbacks.set(entity, callback);
  }

  update(deltaTime: number): void {
    // Process any shooting timers
    const timerEntities = [...this.shootingTimers.keys()];
    for (const entity of timerEntities) {
      let timeRemaining = this.shootingTimers.get(entity)!;
      timeRemaining -= deltaTime;
      
      if (timeRemaining <= 0) {
        // Time's up - mark enemy as ready to shoot
        const enemy = this.world.getComponent<any>(entity, 'Enemy');
        if (enemy) {
          enemy.canShoot = true;
          console.log(`Enemy ${entity} can now shoot after delay`);
        }
        this.shootingTimers.delete(entity);
      } else {
        this.shootingTimers.set(entity, timeRemaining);
      }
    }
    
    const entities = this.world.getEntitiesWith(['Animation', 'Position']);
    
    if (entities.length > 0) {
      // Log active animations for debugging
      if (performance.now() % 3000 < 50) { // Log every ~3 seconds
        console.log(`Active animations: ${entities.length}`);
        for (const entity of entities) {
          const animation = this.world.getComponent<Animation>(entity, 'Animation');
          if (animation) {
            console.log(`Entity ${entity}: ${animation.type} animation at progress ${animation.progress.toFixed(2)}`);
          }
        }
      }
    }

    for (const entity of entities) {
      const animation = this.world.getComponent<Animation>(entity, 'Animation');
      const position = this.world.getComponent<Position>(entity, 'Position');

      if (!animation || !position) {
        console.warn(`Missing components for entity ${entity}. Animation: ${!!animation}, Position: ${!!position}`);
        continue;
      }

      // Store previous phase to detect phase changes
      const prevPhase = animation.type === 'wormhole' ? 
        (animation.data as WormholeAnimationData).phase : null;

      // Update animation progress
      animation.progress += deltaTime / animation.duration;

      // Handle animation based on type
      switch (animation.type) {
        case 'wormhole':
          this.updateWormholeAnimation(entity, animation, position, deltaTime);
          
          // Check for phase change to stable
          const data = animation.data as WormholeAnimationData;
          if (prevPhase !== 'stable' && data.phase === 'stable') {
            console.log(`Wormhole ${entity} has reached stable phase`);
            
            // Execute the registered callback for this wormhole if it exists
            const callback = this.wormholeStableCallbacks.get(entity);
            if (callback) {
              callback(entity, position);
              // Remove the callback after it's been called to avoid duplicate execution
              this.wormholeStableCallbacks.delete(entity);
            }
          }
          break;
        case 'growth':
          this.updateGrowthAnimation(entity, animation);
          break;
        case 'explosion':
          // TODO: Implement explosion animation
          break;
        case 'lightning':
          // TODO: Implement lightning animation
          break;
      }

      // Check for animation completion
      if (animation.progress >= 1) {
        animation.isComplete = true;
        this.cleanupAnimation(entity);
        
        // Remove animation component
        this.world.removeComponent(entity, 'Animation');
        console.log(`Animation completed for entity ${entity}`);
      }
    }
  }

  private updateWormholeAnimation(entity: number, animation: Animation, position: Position, deltaTime: number): void {
    const data = animation.data as WormholeAnimationData;
    let effectGroup = this.effectMeshes.get(entity);

    // Create wormhole effect meshes if they don't exist
    if (!effectGroup) {
      effectGroup = this.createWormholeEffect();
      this.effectMeshes.set(entity, effectGroup);
      this.scene.add(effectGroup);
      
      // Position the wormhole at the fixed spawn location
      effectGroup.position.set(
        data.spawnPosition.x,
        data.spawnPosition.y,
        data.spawnPosition.z
      );
      
      // Calculate direction to Dyson sphere (target)
      const direction = new THREE.Vector3(
        data.targetPosition.x - data.spawnPosition.x,
        data.targetPosition.y - data.spawnPosition.y,
        data.targetPosition.z - data.spawnPosition.z
      ).normalize();
      
      // Invert the direction to face 180 degrees away from the Dyson sphere
      direction.negate();
      
      // Create a quaternion that rotates the default forward vector (0,0,1) to point in the desired direction
      const lookAtQuaternion = new THREE.Quaternion();
      const defaultForward = new THREE.Vector3(0, 0, 1);
      lookAtQuaternion.setFromUnitVectors(defaultForward, direction);
      
      // Apply the rotation to the effect group
      effectGroup.quaternion.copy(lookAtQuaternion);
      
      console.log('Created wormhole effect for entity', entity, 'facing away from Dyson sphere');
    }

    // Update wormhole phase based on progress
    if (animation.progress < 0.3) {
      data.phase = 'growing';
    } else if (animation.progress < 0.7) {
      data.phase = 'stable';
    } else {
      data.phase = 'shrinking';
    }

    // Update entity visibility and scale based on animation phase
    const renderable = this.world.getComponent<Renderable>(entity, 'Renderable');
    if (renderable) {
      // Always make the entity visible, but control its appearance through scale
      renderable.isVisible = true;
      
      // Calculate emergence progress (0 to 1) across growing and stable phases
      const emergenceProgress = animation.progress < 0.7 
        ? this.easeInOutQuad(animation.progress / 0.7) 
        : 1;
      
      // Start from a small but visible size (0.1 = 10% of full size) instead of nearly zero
      const minScale = 0.1;
      const maxScale = 6.0; // Final grunt scale
      
      if (data.phase === 'growing' || data.phase === 'stable') {
        // Scale from small to full size using a smoother curve
        const scaleProgress = this.easeOutBack(emergenceProgress);
        renderable.scale = minScale + (maxScale - minScale) * scaleProgress;
        
        // Log scale for debugging
        if (animation.progress % 0.1 < 0.01) {
          console.log(`Entity ${entity} scale: ${renderable.scale.toFixed(2)}, progress: ${animation.progress.toFixed(2)}`);
        }
        
        // REMOVED position lerping to allow enemy to move independently
      } else {
        // During shrinking phase, maintain final scale
        renderable.scale = maxScale;
      }
    } else {
      console.warn('No Renderable component found for entity', entity);
    }

    // Update visual effects based on phase
    switch (data.phase) {
      case 'growing':
        const growScale = this.easeInOutQuad(animation.progress / 0.3);
        data.scale = growScale;
        data.opacity = growScale;
        break;
      case 'stable':
        data.scale = 1.0;
        data.opacity = 1.0;
        // Add pulsing effect during stable phase
        const pulseAmount = Math.sin(performance.now() * 0.005) * 0.1 + 1.0;
        data.scale *= pulseAmount;
        break;
      case 'shrinking':
        const shrinkProgress = (animation.progress - 0.7) / 0.3;
        data.scale = this.easeInOutQuad(1 - shrinkProgress);
        data.opacity = data.scale;
        break;
    }

    // Update effect group scale - doubled the base size from 2 to 4
    effectGroup.scale.setScalar(data.scale * 4);
    
    // Update rotation
    data.rotation += deltaTime * 2;
    effectGroup.rotation.z = data.rotation;

    // Explicitly update all materials with proper opacity
    const ring = effectGroup.children[0] as THREE.Mesh;
    const spiral = effectGroup.children[1] as THREE.Line;
    // Multiple glow circles from index 2 to 5 (4 circles)
    const particles = effectGroup.children[effectGroup.children.length - 1] as THREE.Points;
    
    if (ring && ring.material) {
      (ring.material as THREE.MeshBasicMaterial).opacity = data.opacity;
    }
    
    if (spiral && spiral.material) {
      (spiral.material as THREE.LineBasicMaterial).opacity = data.opacity;
    }
    
    // Update all glow circles (4 of them)
    for (let i = 0; i < 4; i++) {
      const glowIndex = 2 + i; // Glow circles start at index 2
      if (glowIndex < effectGroup.children.length - 1) { // Don't go past the particles
        const glow = effectGroup.children[glowIndex] as THREE.Mesh;
        if (glow && glow.material) {
          // Calculate base opacity for each circle based on its index
          const baseOpacity = (1 - i / 4) * 0.6;
          (glow.material as THREE.MeshBasicMaterial).opacity = data.opacity * baseOpacity;
        }
      }
    }
    
    if (particles && particles.material) {
      (particles.material as THREE.PointsMaterial).opacity = data.opacity * 0.9;
      
      // Add some movement to particles based on phase
      if (data.phase === 'growing' || data.phase === 'stable') {
        // Move particles outward during growing and stable phases
        const positions = (particles.geometry.getAttribute('position') as THREE.BufferAttribute).array;
        for (let i = 0; i < positions.length; i += 3) {
          const x = positions[i];
          const y = positions[i + 1];
          const z = positions[i + 2];
          
          // Calculate distance from center
          const dist = Math.sqrt(x * x + y * y);
          
          // Move particles
          if (dist < 1.5) {
            const angle = Math.atan2(y, x);
            positions[i] = Math.cos(angle) * (dist + deltaTime * 0.2);
            positions[i + 1] = Math.sin(angle) * (dist + deltaTime * 0.2);
          } else {
            // Reset particles that move too far out
            const newAngle = Math.random() * Math.PI * 2;
            const newRadius = Math.random() * 0.3;
            positions[i] = Math.cos(newAngle) * newRadius;
            positions[i + 1] = Math.sin(newAngle) * newRadius;
          }
        }
        particles.geometry.getAttribute('position').needsUpdate = true;
      }
    }
  }

  private createWormholeEffect(): THREE.Group {
    const group = new THREE.Group();

    // Create ring - increased size
    const ringGeometry = new THREE.RingGeometry(1.6, 2.0, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.WORMHOLE_RING || 0x00ff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    group.add(ring);

    // Create spiral effect - make it more prominent and larger
    const spiralPoints = [];
    for (let i = 0; i < 200; i++) {
      const angle = (i / 100) * Math.PI * 4;
      const radius = 0.6 + (i / 100) * 1.4; // Doubled the radius range
      spiralPoints.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
      ));
    }
    const spiralGeometry = new THREE.BufferGeometry().setFromPoints(spiralPoints);
    const spiralMaterial = new THREE.LineBasicMaterial({
      color: COLORS.WORMHOLE_SPIRAL || 0x0088ff,
      transparent: true,
      opacity: 0,
      linewidth: 2
    });
    const spiral = new THREE.Line(spiralGeometry, spiralMaterial);
    group.add(spiral);

    // Replace the problematic plane glow with a circular gradient glow
    const circleCount = 4; // Create multiple overlapping circles for a better glow effect
    for (let i = 0; i < circleCount; i++) {
      const size = 2.0 + i * 0.8; // Increasing sizes
      const glowGeometry = new THREE.CircleGeometry(size, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: COLORS.WORMHOLE_GLOW || 0x00ffff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        // Set opacity based on circle index to create a gradient effect
        opacity: (1 - i / circleCount) * 0.6
      });
      const glowCircle = new THREE.Mesh(glowGeometry, glowMaterial);
      glowCircle.renderOrder = -1 - i; // Ensure proper layering
      group.add(glowCircle);
    }
    
    // Add a particle system - increased size and count
    const particleCount = 100; // Doubled particle count
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 2.4; // Doubled radius
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = Math.sin(angle) * radius;
      positions[i3 + 2] = (Math.random() - 0.5) * 1.0; // Doubled z-variation
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: COLORS.WORMHOLE_RING,
      size: 0.2, // Doubled particle size
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);

    return group;
  }

  private cleanupAnimation(entity: number): void {
    const effectGroup = this.effectMeshes.get(entity);
    if (effectGroup) {
      this.scene.remove(effectGroup);
      
      // Properly dispose of all geometries and materials
      effectGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        } else if (child instanceof THREE.Line) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      
      this.effectMeshes.delete(entity);
      console.log('Cleaned up wormhole effect for entity', entity);
    }
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  // Add a new easing function for more dynamic growth
  private easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  /**
   * Updates the growth animation for an entity
   * This handles the scaling animation for enemies as they spawn
   */
  private updateGrowthAnimation(entity: number, animation: Animation): void {
    const data = animation.data as GrowthAnimationData;
    const renderable = this.world.getComponent<Renderable>(entity, 'Renderable');
    
    if (renderable) {
      // Use a smoothed easing function for nicer growth effect
      // 0-30% of animation: slower growth (matches wormhole growing phase)
      // 30-100% of animation: faster growth to reach full size (during wormhole stable phase)
      let progress;
      
      if (animation.progress < 0.3) {
        // During wormhole growing phase - slower growth
        progress = this.easeInOutQuad(animation.progress / 0.3) * 0.3;
      } else {
        // During wormhole stable phase - accelerate to full size
        progress = 0.3 + this.easeOutBack((animation.progress - 0.3) / 0.7) * 0.7;
      }
      
      // Linearly interpolate from starting scale (0.1) to final scale
      const startScale = 0.1;
      renderable.scale = startScale + (data.finalScale - startScale) * progress;
      
      // Occasionally log scale for debugging
      if (animation.progress % 0.25 < 0.01) {
        console.log(`Entity ${entity} growth scale: ${renderable.scale.toFixed(2)}, progress: ${animation.progress.toFixed(2)}`);
      }
      
      // Start shooting timer when the wormhole enters stable phase (30% of animation)
      // This is when enemy is at minimal visible size but still growing
      if (animation.progress >= 0.3 && animation.progress < 0.3 + animation.duration / 60) {
        // Check if this entity has an Enemy component and if we need to start a shooting timer
        const enemy = this.world.getComponent<any>(entity, 'Enemy');
        if (enemy && !enemy.canShoot && !this.shootingTimers.has(entity)) {
          // Add a 0.5 second timer before the enemy can shoot
          this.shootingTimers.set(entity, 0.5);
          console.log(`Enemy ${entity} has emerged and will be able to shoot in 0.5 seconds`);
        }
      }
    }
  }
} 