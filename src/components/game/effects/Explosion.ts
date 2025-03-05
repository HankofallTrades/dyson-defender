import * as THREE from 'three';
import { COLORS } from '../constants';

export class Explosion {
  private particles: THREE.Points;
  private shockwave: THREE.Mesh | null = null;
  private startTime: number;
  private duration: number;
  private position: THREE.Vector3;
  private scene: THREE.Scene | null = null;
  private isComplete: boolean = false;
  private includeShockwave: boolean;
  private debrisParticles: THREE.Points | null = null;

  constructor(position: THREE.Vector3, color: number = COLORS.ENEMY_GLOW, duration: number = 1.0, includeShockwave: boolean = true) {
    this.position = position.clone();
    this.startTime = Date.now();
    this.duration = duration * 1000; // Convert to milliseconds
    this.includeShockwave = includeShockwave;
    
    // Create particle system for explosion
    const particleCount = 75; // Increased particle count
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    const particleColors = new Float32Array(particleCount * 3);
    
    // Create a color object from the input color
    const baseColor = new THREE.Color(color);
    
    // Initialize particles in a sphere
    for (let i = 0; i < particleCount; i++) {
      // Random position in a sphere
      const radius = 0.1 + Math.random() * 0.3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      particlePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = z;
      
      // Random sizes
      particleSizes[i] = 0.05 + Math.random() * 0.15;
      
      // Color variations
      const colorVariation = 0.2;
      const r = baseColor.r + (Math.random() * colorVariation * 2 - colorVariation);
      const g = baseColor.g + (Math.random() * colorVariation * 2 - colorVariation);
      const b = baseColor.b + (Math.random() * colorVariation * 2 - colorVariation);
      
      particleColors[i * 3] = r;
      particleColors[i * 3 + 1] = g;
      particleColors[i * 3 + 2] = b;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    
    // Create particle material
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      transparent: true,
      opacity: 1.0,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    // Create particle system
    this.particles = new THREE.Points(particleGeometry, particleMaterial);
    this.particles.position.copy(this.position);
    
    // Create debris particles for a more dramatic effect
    if (includeShockwave) {
      const debrisCount = 30;
      const debrisGeometry = new THREE.BufferGeometry();
      const debrisPositions = new Float32Array(debrisCount * 3);
      const debrisSizes = new Float32Array(debrisCount);
      const debrisColors = new Float32Array(debrisCount * 3);
      
      // Create debris particles with more directional velocities
      for (let i = 0; i < debrisCount; i++) {
        // Start at center
        debrisPositions[i * 3] = 0;
        debrisPositions[i * 3 + 1] = 0;
        debrisPositions[i * 3 + 2] = 0;
        
        // Larger sizes for debris
        debrisSizes[i] = 0.1 + Math.random() * 0.2;
        
        // Darker colors for debris
        const debrisColor = new THREE.Color(color).multiplyScalar(0.7);
        debrisColors[i * 3] = debrisColor.r;
        debrisColors[i * 3 + 1] = debrisColor.g;
        debrisColors[i * 3 + 2] = debrisColor.b;
      }
      
      debrisGeometry.setAttribute('position', new THREE.BufferAttribute(debrisPositions, 3));
      debrisGeometry.setAttribute('size', new THREE.BufferAttribute(debrisSizes, 1));
      debrisGeometry.setAttribute('color', new THREE.BufferAttribute(debrisColors, 3));
      
      // Create debris material
      const debrisMaterial = new THREE.PointsMaterial({
        size: 0.15,
        transparent: true,
        opacity: 0.8,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      
      // Create debris system
      this.debrisParticles = new THREE.Points(debrisGeometry, debrisMaterial);
      this.debrisParticles.position.copy(this.position);
      
      // Store velocities for debris particles
      this.debrisParticles.userData = {
        velocities: Array(debrisCount).fill(0).map(() => new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1
        ))
      };
    }
    
    // Create shockwave ring if enabled
    if (this.includeShockwave) {
      const shockwaveGeometry = new THREE.RingGeometry(0.1, 0.2, 32);
      const shockwaveMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      
      this.shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
      this.shockwave.position.copy(this.position);
      
      // Orient the ring to face the camera by default
      this.shockwave.lookAt(0, 0, 0);
    }
  }
  
  update() {
    if ((!this.particles && !this.shockwave && !this.debrisParticles) || this.isComplete) return;
    
    const elapsed = Date.now() - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1.0);
    
    if (progress >= 1.0) {
      this.isComplete = true;
      this.removeFromScene();
      return;
    }
    
    // Update particle positions - expand outward
    if (this.particles) {
      const positions = (this.particles.geometry.attributes.position as THREE.BufferAttribute).array;
      const sizes = (this.particles.geometry.attributes.size as THREE.BufferAttribute).array;
      const colors = (this.particles.geometry.attributes.color as THREE.BufferAttribute).array;
      
      const expansionFactor = 1.0 + progress * 5.0; // Expand outward
      const sizeFactor = 1.0 - progress * 0.8; // Shrink slightly over time
      
      for (let i = 0; i < positions.length / 3; i++) {
        // Expand positions outward
        const x = positions[i * 3] * expansionFactor;
        const y = positions[i * 3 + 1] * expansionFactor;
        const z = positions[i * 3 + 2] * expansionFactor;
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        // Shrink sizes over time
        sizes[i] *= sizeFactor;
        
        // Fade out colors
        colors[i * 3] *= 0.99;
        colors[i * 3 + 1] *= 0.99;
        colors[i * 3 + 2] *= 0.99;
      }
      
      // Update material opacity
      if (this.particles.material instanceof THREE.PointsMaterial) {
        this.particles.material.opacity = 1.0 - progress;
      }
      
      // Update geometry attributes
      this.particles.geometry.attributes.position.needsUpdate = true;
      this.particles.geometry.attributes.size.needsUpdate = true;
      this.particles.geometry.attributes.color.needsUpdate = true;
    }
    
    // Update debris particles
    if (this.debrisParticles) {
      const positions = (this.debrisParticles.geometry.attributes.position as THREE.BufferAttribute).array;
      const sizes = (this.debrisParticles.geometry.attributes.size as THREE.BufferAttribute).array;
      const velocities = this.debrisParticles.userData.velocities;
      
      for (let i = 0; i < positions.length / 3; i++) {
        // Apply velocity with some gravity effect
        positions[i * 3] += velocities[i].x;
        positions[i * 3 + 1] += velocities[i].y - (0.001 * progress); // Add gravity
        positions[i * 3 + 2] += velocities[i].z;
        
        // Shrink sizes over time
        sizes[i] *= 0.99;
      }
      
      // Update material opacity
      if (this.debrisParticles.material instanceof THREE.PointsMaterial) {
        this.debrisParticles.material.opacity = 0.8 * (1.0 - progress);
      }
      
      // Update geometry attributes
      this.debrisParticles.geometry.attributes.position.needsUpdate = true;
      this.debrisParticles.geometry.attributes.size.needsUpdate = true;
    }
    
    // Update shockwave
    if (this.shockwave && this.includeShockwave) {
      // Expand the ring outward
      const ringExpansion = 0.1 + progress * 3.0;
      this.shockwave.scale.set(ringExpansion, ringExpansion, ringExpansion);
      
      // Fade out the ring
      if (this.shockwave.material instanceof THREE.MeshBasicMaterial) {
        this.shockwave.material.opacity = 0.7 * (1.0 - progress);
      }
      
      // Make sure the ring always faces the camera
      if (this.scene) {
        const cameraPosition = new THREE.Vector3(0, 0, 0);
        this.shockwave.lookAt(cameraPosition);
      }
    }
  }
  
  addToScene(scene: THREE.Scene) {
    this.scene = scene;
    scene.add(this.particles);
    
    if (this.debrisParticles) {
      scene.add(this.debrisParticles);
    }
    
    if (this.shockwave && this.includeShockwave) {
      scene.add(this.shockwave);
    }
  }
  
  removeFromScene() {
    if (this.scene) {
      if (this.particles) {
        this.scene.remove(this.particles);
        this.particles.geometry.dispose();
        if (this.particles.material instanceof THREE.Material) {
          this.particles.material.dispose();
        }
      }
      
      if (this.debrisParticles) {
        this.scene.remove(this.debrisParticles);
        this.debrisParticles.geometry.dispose();
        if (this.debrisParticles.material instanceof THREE.Material) {
          this.debrisParticles.material.dispose();
        }
        this.debrisParticles = null;
      }
      
      if (this.shockwave) {
        this.scene.remove(this.shockwave);
        this.shockwave.geometry.dispose();
        if (this.shockwave.material instanceof THREE.Material) {
          this.shockwave.material.dispose();
        }
        this.shockwave = null;
      }
      
      this.scene = null;
    }
  }
  
  isFinished(): boolean {
    return this.isComplete;
  }
} 