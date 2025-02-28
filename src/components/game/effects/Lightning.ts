import * as THREE from 'three';
import { 
  COLORS, 
  LIGHTNING_SEGMENTS, 
  LIGHTNING_WIDTH,
  LIGHTNING_UPDATE_INTERVAL
} from '../constants';

interface LightningStrand {
  points: THREE.Vector3[];
  line: THREE.Line;
  auras: THREE.Mesh[];
}

export class Lightning {
  private strands: LightningStrand[];
  private material: THREE.LineBasicMaterial;
  private auraMaterials: THREE.MeshPhongMaterial[];
  private updateTimer: number;
  private auraTime: number;
  private origin: THREE.Vector3;
  private target: THREE.Vector3;

  constructor(origin: THREE.Vector3, target: THREE.Vector3) {
    this.strands = [];
    this.updateTimer = 0;
    this.auraTime = 0;
    this.origin = origin.clone();
    this.target = target.clone();

    // Create core lightning material
    this.material = new THREE.LineBasicMaterial({
      color: COLORS.LIGHTNING_CORE,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });

    // Create aura materials with emissive properties
    this.auraMaterials = [
      new THREE.MeshPhongMaterial({
        color: COLORS.LIGHTNING_GLOW,
        emissive: COLORS.LIGHTNING_GLOW,
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      }),
      new THREE.MeshPhongMaterial({
        color: COLORS.LIGHTNING_AURA,
        emissive: COLORS.LIGHTNING_AURA,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      }),
      new THREE.MeshPhongMaterial({
        color: COLORS.LIGHTNING_AURA,
        emissive: COLORS.LIGHTNING_AURA,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      })
    ];

    this.createLightning();
  }

  private createLightning() {
    try {
      // Clear existing strands
      this.dispose();

      // Create multiple lightning strands
      const numStrands = 3;
      for (let i = 0; i < numStrands; i++) {
        const points = this.generateStrandPoints(i / numStrands * Math.PI * 2);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Create core line
        const line = new THREE.Line(geometry, this.material);
        
        // Create aura tubes for this strand
        const auras = this.auraMaterials.map((material, index) => {
          const tubeGeometry = this.createTubeGeometry(points, 0.05 + index * 0.05);
          return new THREE.Mesh(tubeGeometry, material);
        });

        this.strands.push({ points, line, auras });
      }
    } catch (error) {
      console.error('Error creating lightning:', error);
    }
  }

  private createTubeGeometry(points: THREE.Vector3[], radius: number): THREE.BufferGeometry {
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, LIGHTNING_SEGMENTS, radius, 8, false);
  }

  private generateStrandPoints(angleOffset: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const direction = this.target.clone().sub(this.origin);
    const length = direction.length();
    direction.normalize();

    // Create a basis for offset calculation
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(direction, up).normalize();
    const realUp = new THREE.Vector3().crossVectors(right, direction).normalize();

    for (let i = 0; i <= LIGHTNING_SEGMENTS; i++) {
      const t = i / LIGHTNING_SEGMENTS;
      const basePoint = this.origin.clone().add(direction.clone().multiplyScalar(length * t));
      
      if (i > 0 && i < LIGHTNING_SEGMENTS) {
        // Create spiral-like offset
        const angle = t * 4 * Math.PI + angleOffset;
        const radius = Math.sin(t * Math.PI) * 0.3; // Maximum deviation in middle
        const offset = right.clone().multiplyScalar(Math.cos(angle) * radius)
          .add(realUp.clone().multiplyScalar(Math.sin(angle) * radius));
        
        // Add some randomness
        offset.add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1
        ));
        
        basePoint.add(offset);
      }
      
      points.push(basePoint);
    }

    return points;
  }

  update(delta: number) {
    try {
      this.updateTimer += delta * 1000;
      this.auraTime += delta * 2;

      if (this.updateTimer >= LIGHTNING_UPDATE_INTERVAL) {
        // Update all strands
        this.strands.forEach((strand, i) => {
          const points = this.generateStrandPoints(i / this.strands.length * Math.PI * 2);
          
          // Update core line
          strand.line.geometry.setFromPoints(points);
          
          // Update aura tubes
          strand.auras.forEach((aura, index) => {
            const newGeometry = this.createTubeGeometry(points, 0.05 + index * 0.05);
            aura.geometry.dispose();
            aura.geometry = newGeometry;
          });
        });
        this.updateTimer = 0;
      }

      // Update aura materials for pulsing effect
      this.strands.forEach(strand => {
        strand.auras.forEach((aura, i) => {
          if (aura.material instanceof THREE.MeshPhongMaterial) {
            const baseIntensity = 1.0 - (i * 0.2);
            aura.material.emissiveIntensity = baseIntensity + Math.sin(this.auraTime * 1.5) * 0.2;
          }
        });
      });
    } catch (error) {
      console.error('Error updating lightning:', error);
    }
  }

  addToScene(scene: THREE.Scene) {
    try {
      this.strands.forEach(strand => {
        // Add auras first (back to front)
        strand.auras.reverse().forEach(aura => scene.add(aura));
        // Add main line last
        scene.add(strand.line);
      });
    } catch (error) {
      console.error('Error adding lightning to scene:', error);
    }
  }

  removeFromScene(scene: THREE.Scene) {
    try {
      this.strands.forEach(strand => {
        strand.auras.forEach(aura => scene.remove(aura));
        scene.remove(strand.line);
      });
    } catch (error) {
      console.error('Error removing lightning from scene:', error);
    }
  }

  setOrigin(origin: THREE.Vector3) {
    this.origin.copy(origin);
  }

  setTarget(target: THREE.Vector3) {
    this.target.copy(target);
  }

  dispose() {
    try {
      this.strands.forEach(strand => {
        strand.line.geometry.dispose();
        if (strand.line.material instanceof THREE.Material) {
          strand.line.material.dispose();
        }
        strand.auras.forEach(aura => {
          aura.geometry.dispose();
          if (aura.material instanceof THREE.Material) {
            aura.material.dispose();
          }
        });
      });
      this.strands = [];
    } catch (error) {
      console.error('Error disposing lightning:', error);
    }
  }
}
