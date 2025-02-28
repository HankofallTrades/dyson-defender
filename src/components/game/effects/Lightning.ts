import * as THREE from 'three';
import { 
  COLORS, 
  LIGHTNING_SEGMENTS, 
  LIGHTNING_BRANCH_PROBABILITY,
  LIGHTNING_WIDTH,
  LIGHTNING_LENGTH,
  LIGHTNING_UPDATE_INTERVAL
} from '../constants';

export class Lightning {
  private points: THREE.Vector3[];
  private geometry: THREE.BufferGeometry | null;
  private material: THREE.LineBasicMaterial | null;
  private glowMaterial: THREE.LineBasicMaterial | null;
  private line: THREE.Line | null;
  private glow: THREE.Line | null;
  private branches: Lightning[];
  private updateTimer: number;
  private origin: THREE.Vector3;
  private target: THREE.Vector3;

  constructor(origin: THREE.Vector3, target: THREE.Vector3) {
    this.points = [];
    this.branches = [];
    this.updateTimer = 0;
    this.origin = origin.clone();
    this.target = target.clone();

    // Initialize as null
    this.geometry = null;
    this.material = null;
    this.glowMaterial = null;
    this.line = null;
    this.glow = null;

    try {
      this.createLightning();
    } catch (error) {
      console.error('Error initializing lightning:', error);
    }
  }

  private createLightning() {
    try {
      // Clean up existing components
      this.dispose();

      // Create new geometry
      this.geometry = new THREE.BufferGeometry();
      
      // Create main lightning material
      this.material = new THREE.LineBasicMaterial({
        color: COLORS.LIGHTNING_CORE,
        transparent: true,
        opacity: 1,
        linewidth: LIGHTNING_WIDTH * 2
      });

      // Create glow material
      this.glowMaterial = new THREE.LineBasicMaterial({
        color: COLORS.LIGHTNING_GLOW,
        transparent: true,
        opacity: 0.4,
        linewidth: LIGHTNING_WIDTH * 4
      });

      // Create lines
      if (this.geometry && this.material && this.glowMaterial) {
        this.line = new THREE.Line(this.geometry, this.material);
        this.glow = new THREE.Line(this.geometry.clone(), this.glowMaterial);
        if (this.glow) {
          this.glow.scale.multiplyScalar(1.2);
        }
      }

      this.generatePoints();
    } catch (error) {
      console.error('Error creating lightning components:', error);
      this.dispose();
    }
  }

  private generatePoints() {
    if (!this.geometry) return;

    this.points = [];
    const direction = this.target.clone().sub(this.origin);
    const length = direction.length();
    direction.normalize();

    // Create zigzag pattern
    for (let i = 0; i <= LIGHTNING_SEGMENTS; i++) {
      const t = i / LIGHTNING_SEGMENTS;
      const pos = this.origin.clone().add(direction.clone().multiplyScalar(length * t));
      
      // Add random offset except for start and end points
      if (i > 0 && i < LIGHTNING_SEGMENTS) {
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5
        );
        pos.add(offset);
      }
      
      this.points.push(pos);
    }

    // Update geometry
    this.geometry.setFromPoints(this.points);
  }

  update(delta: number) {
    try {
      this.updateTimer += delta * 1000;
      if (this.updateTimer >= LIGHTNING_UPDATE_INTERVAL) {
        this.generatePoints();
        this.updateTimer = 0;
      }
    } catch (error) {
      console.error('Error updating lightning:', error);
    }
  }

  addToScene(scene: THREE.Scene) {
    try {
      if (this.glow) scene.add(this.glow);
      if (this.line) scene.add(this.line);
    } catch (error) {
      console.error('Error adding lightning to scene:', error);
    }
  }

  removeFromScene(scene: THREE.Scene) {
    try {
      if (this.glow) scene.remove(this.glow);
      if (this.line) scene.remove(this.line);
    } catch (error) {
      console.error('Error removing lightning from scene:', error);
    }
  }

  setOrigin(origin: THREE.Vector3) {
    try {
      this.origin.copy(origin);
      this.generatePoints();
    } catch (error) {
      console.error('Error setting lightning origin:', error);
    }
  }

  setTarget(target: THREE.Vector3) {
    try {
      this.target.copy(target);
      this.generatePoints();
    } catch (error) {
      console.error('Error setting lightning target:', error);
    }
  }

  dispose() {
    try {
      if (this.geometry) {
        this.geometry.dispose();
        this.geometry = null;
      }
      if (this.material) {
        this.material.dispose();
        this.material = null;
      }
      if (this.glowMaterial) {
        this.glowMaterial.dispose();
        this.glowMaterial = null;
      }
      if (this.line) {
        this.line = null;
      }
      if (this.glow) {
        this.glow = null;
      }
    } catch (error) {
      console.error('Error disposing lightning:', error);
    }
  }
}
