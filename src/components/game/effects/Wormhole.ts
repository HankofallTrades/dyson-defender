import * as THREE from 'three';
import { COLORS } from '../constants';

export class Wormhole {
  private scene: THREE.Scene | null = null;
  private position: THREE.Vector3;
  private targetPosition: THREE.Vector3; // Position of the Dyson sphere
  private startTime: number;
  private duration: number; // Total duration of the wormhole effect in ms
  private isComplete: boolean = false;
  private wormholeMesh: THREE.Mesh;
  private particleSystem: THREE.Points;
  private innerGlow: THREE.Mesh;
  private spiralMesh: THREE.Line;
  private enemyMesh: THREE.Object3D | null = null;
  private enemyShowing: boolean = false;
  private originalEnemyScale: THREE.Vector3 | null = null;

  constructor(
    position: THREE.Vector3, 
    targetPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0), // Default to origin (Dyson sphere location)
    size: number = 1.2, 
    duration: number = 1.5, 
    color: number = COLORS.ENEMY_GLOW
  ) {
    this.position = position.clone();
    this.targetPosition = targetPosition.clone();
    this.duration = duration * 1000; // Convert to milliseconds
    this.startTime = Date.now();

    // Calculate direction from position to target (Dyson sphere)
    const direction = new THREE.Vector3().subVectors(this.targetPosition, this.position).normalize();
    
    // Create the wormhole ring mesh
    // A torus in Three.js has its hole facing along the z-axis by default
    const ringGeometry = new THREE.TorusGeometry(size, size * 0.08, 16, 64);
    const ringMaterial = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 1.5,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0
    });
    this.wormholeMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    this.wormholeMesh.scale.set(0.01, 0.01, 0.01); // Start very small
    this.wormholeMesh.position.copy(this.position);
    
    // Create quaternion for proper orientation
    // Since a torus faces along the z-axis, we need to align this z-axis with our direction vector
    const quaternion = new THREE.Quaternion();
    // The default forward direction of the torus (hole facing)
    const zAxis = new THREE.Vector3(0, 0, 1);
    // Compute the quaternion to rotate the z-axis to match our direction
    quaternion.setFromUnitVectors(zAxis, direction);
    
    // Apply the rotation
    this.wormholeMesh.quaternion.copy(quaternion);

    // Create the inner glow
    const innerGlowGeometry = new THREE.SphereGeometry(size * 0.8, 32, 32);
    const innerGlowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide
    });
    this.innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    this.innerGlow.scale.set(0.01, 0.01, 0.01); // Start very small
    this.innerGlow.position.copy(this.position);
    
    // Create the spiral effect (darker purple)
    const spiralGeometry = new THREE.BufferGeometry();
    const spiralVertices = [];
    const segments = 400;
    const coils = 4;
    const innerRadius = 0.1 * size;
    
    // Calculate a darker purple color
    const baseColor = new THREE.Color(color);
    const darkerPurple = new THREE.Color(
      Math.max(0, baseColor.r * 0.5),
      Math.max(0, baseColor.g * 0.3),
      Math.max(0, baseColor.b * 0.8)
    );
    
    // Create spiral in the XY plane (will be rotated to face the direction)
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2 * coils;
      const radiusIncrease = (i / segments) * (size * 0.7);
      const radius = innerRadius + radiusIncrease;
      
      // Create in XY plane (facing along Z)
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      const z = (Math.sin(angle * 3) * 0.05) * size; // Small wave along z
      
      spiralVertices.push(x, y, z);
    }
    
    spiralGeometry.setAttribute('position', new THREE.Float32BufferAttribute(spiralVertices, 3));
    
    const spiralMaterial = new THREE.LineBasicMaterial({
      color: darkerPurple,
      linewidth: 2,
      transparent: true,
      opacity: 0
    });
    
    this.spiralMesh = new THREE.Line(spiralGeometry, spiralMaterial);
    this.spiralMesh.scale.set(0.01, 0.01, 0.01);
    this.spiralMesh.position.copy(this.position);
    // Apply the same rotation to align with direction
    this.spiralMesh.quaternion.copy(quaternion);

    // Create particle system
    const particleCount = 150;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    const particleColors = new Float32Array(particleCount * 3);
    
    const baseParticleColor = new THREE.Color(color);
    
    // Create particles in a disk shape in the XY plane
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = size * (0.8 + Math.random() * 0.4);
      
      // Position in XY plane (will be rotated)
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      const z = (Math.random() * 0.3 - 0.15) * size; // Small variance in Z
      
      // Store original position in local space
      const localPos = new THREE.Vector3(x, y, z);
      // Rotate to face direction
      localPos.applyQuaternion(quaternion);
      // Add position offset
      const worldPos = localPos.add(this.position);
      
      particlePositions[i * 3] = worldPos.x;
      particlePositions[i * 3 + 1] = worldPos.y;
      particlePositions[i * 3 + 2] = worldPos.z;
      
      // Random sizes
      particleSizes[i] = 0.05 + Math.random() * 0.15;
      
      // Vary colors
      const colorVariation = 0.2;
      particleColors[i * 3] = baseParticleColor.r * (1 - colorVariation/2 + Math.random() * colorVariation);
      particleColors[i * 3 + 1] = baseParticleColor.g * (1 - colorVariation/2 + Math.random() * colorVariation);
      particleColors[i * 3 + 2] = baseParticleColor.b * (1 - colorVariation/2 + Math.random() * colorVariation);
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.3,
      transparent: true,
      opacity: 0,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false
    });
    
    this.particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    // No need to position or rotate the particle system since the particles already have world positions
  }

  update() {
    if (this.isComplete) return;
    
    const elapsedTime = Date.now() - this.startTime;
    const progress = Math.min(elapsedTime / this.duration, 1.0);
    
    // Get materials
    const ringMaterial = this.wormholeMesh.material as THREE.MeshPhongMaterial;
    const glowMaterial = this.innerGlow.material as THREE.MeshBasicMaterial;
    const spiralMaterial = this.spiralMesh.material as THREE.LineBasicMaterial;
    const particleMaterial = this.particleSystem.material as THREE.PointsMaterial;
    
    // Get direction vector for rotation axis
    const direction = new THREE.Vector3().subVectors(this.targetPosition, this.position).normalize();
    
    // Calculate the phase of the animation
    if (progress < 0.3) {
      // Growing phase (0-30%)
      const growProgress = progress / 0.3;
      const easeInOut = this.easeInOutQuad(growProgress);
      
      // Scale from 0 to full size
      const currentScale = easeInOut;
      this.wormholeMesh.scale.set(currentScale, currentScale, currentScale);
      this.innerGlow.scale.set(currentScale, currentScale, currentScale);
      this.spiralMesh.scale.set(currentScale, currentScale, currentScale);
      
      // Opacity increases during grow phase
      ringMaterial.opacity = easeInOut;
      glowMaterial.opacity = easeInOut * 0.7;
      spiralMaterial.opacity = easeInOut * 0.9;
      particleMaterial.opacity = easeInOut * 0.8;
      
      // Rotate spiral around the direction axis (perpendicular to facing)
      this.spiralMesh.rotateOnWorldAxis(direction, 0.01);
    } 
    else if (progress < 0.7) {
      // Stable phase (30-70%) - enemy emerges
      const stableProgress = (progress - 0.3) / 0.4;
      
      // Maintain full size
      this.wormholeMesh.scale.set(1, 1, 1);
      this.innerGlow.scale.set(1, 1, 1);
      this.spiralMesh.scale.set(1, 1, 1);
      
      // Maximum opacity during stable phase
      ringMaterial.opacity = 1;
      glowMaterial.opacity = 0.7;
      spiralMaterial.opacity = 0.9;
      particleMaterial.opacity = 0.8;
      
      // Pulse effect during stable phase
      const pulse = 0.1 * Math.sin(elapsedTime * 0.01);
      this.wormholeMesh.scale.set(1 + pulse, 1 + pulse, 1 + pulse);
      
      // Rotate spiral around direction axis
      this.spiralMesh.rotateOnWorldAxis(direction, 0.015);
      
      // Show enemy emerging during stable phase
      if (this.enemyMesh && !this.enemyShowing && stableProgress > 0.2) {
        this.enemyShowing = true;
        
        // Save original scale
        if (!this.originalEnemyScale) {
          this.originalEnemyScale = this.enemyMesh.scale.clone();
        }
        
        // Start enemy at small scale
        this.enemyMesh.scale.set(0.01, 0.01, 0.01);
        this.enemyMesh.visible = true;
        
        // Animate enemy scale
        this.animateEnemyEmergence();
      }
    } 
    else if (progress < 1.0) {
      // Shrinking phase (70-100%)
      const shrinkProgress = (progress - 0.7) / 0.3;
      const easeInOut = this.easeInOutQuad(1 - shrinkProgress);
      
      // Scale from full size to 0
      const currentScale = easeInOut;
      this.wormholeMesh.scale.set(currentScale, currentScale, currentScale);
      this.innerGlow.scale.set(currentScale, currentScale, currentScale);
      this.spiralMesh.scale.set(currentScale, currentScale, currentScale);
      
      // Opacity decreases during shrink phase
      ringMaterial.opacity = easeInOut;
      glowMaterial.opacity = easeInOut * 0.7;
      spiralMaterial.opacity = easeInOut * 0.9;
      particleMaterial.opacity = easeInOut * 0.8;
      
      // Final faster rotation
      this.spiralMesh.rotateOnWorldAxis(direction, 0.02);
    } 
    else {
      // Animation complete
      this.isComplete = true;
      
      // Make sure enemy has original scale
      if (this.enemyMesh && this.originalEnemyScale) {
        this.enemyMesh.scale.copy(this.originalEnemyScale);
      }
    }
    
    // Update particle positions for swirling effect
    if (this.particleSystem && !this.isComplete) {
      const positions = (this.particleSystem.geometry as THREE.BufferGeometry).attributes.position.array;
      const particleCount = positions.length / 3;
      
      // Create rotation matrix around the direction axis
      const rotationMatrix = new THREE.Matrix4();
      // Create a small rotation around the direction vector
      const rotationAmount = 0.01;
      rotationMatrix.makeRotationAxis(direction, rotationAmount);
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Get current particle position
        const particlePos = new THREE.Vector3(
          positions[i3],
          positions[i3 + 1],
          positions[i3 + 2]
        );
        
        // Vector from center to particle
        const toParticle = particlePos.clone().sub(this.position);
        
        // Apply rotation around the direction vector
        toParticle.applyMatrix4(rotationMatrix);
        
        // Get new position
        const newPos = this.position.clone().add(toParticle);
        
        // Update position
        positions[i3] = newPos.x;
        positions[i3 + 1] = newPos.y;
        positions[i3 + 2] = newPos.z;
      }
      
      (this.particleSystem.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
    }
  }

  private animateEnemyEmergence() {
    if (!this.enemyMesh || !this.originalEnemyScale) return;

    const startScale = 0.01;
    const duration = 800; // ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      const eased = this.easeOutBack(progress);
      
      const scale = startScale + (eased * (1 - startScale));
      this.enemyMesh!.scale.set(
        this.originalEnemyScale!.x * scale,
        this.originalEnemyScale!.y * scale,
        this.originalEnemyScale!.z * scale
      );
      
      if (progress < 1.0) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
  
  private easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  setEnemyMesh(enemy: THREE.Object3D) {
    this.enemyMesh = enemy;
    
    // Hide enemy initially
    if (this.enemyMesh) {
      this.enemyMesh.visible = false;
    }
  }

  addToScene(scene: THREE.Scene) {
    this.scene = scene;
    scene.add(this.wormholeMesh);
    scene.add(this.innerGlow);
    scene.add(this.spiralMesh);
    scene.add(this.particleSystem);
  }

  removeFromScene() {
    if (this.scene) {
      this.scene.remove(this.wormholeMesh);
      this.scene.remove(this.innerGlow);
      this.scene.remove(this.spiralMesh);
      this.scene.remove(this.particleSystem);
      this.scene = null;
    }
  }

  dispose() {
    (this.wormholeMesh.geometry as THREE.BufferGeometry).dispose();
    (this.wormholeMesh.material as THREE.Material).dispose();
    
    (this.innerGlow.geometry as THREE.BufferGeometry).dispose();
    (this.innerGlow.material as THREE.Material).dispose();
    
    (this.spiralMesh.geometry as THREE.BufferGeometry).dispose();
    (this.spiralMesh.material as THREE.Material).dispose();
    
    (this.particleSystem.geometry as THREE.BufferGeometry).dispose();
    (this.particleSystem.material as THREE.Material).dispose();
  }

  isFinished(): boolean {
    return this.isComplete;
  }
} 