import * as THREE from 'three';
import { World, System } from '../World';
import { InputReceiver, Position, Rotation, LaserCooldown, Enemy, Renderable, Shield, Health } from '../components';
import { InputManager } from '../input/InputManager';
import { SceneManager } from '../../rendering/SceneManager';
import { createLaser } from '../entities/LaserEntity';
import { AudioManager } from '../AudioManager';
import { COLORS } from '../../constants/colors';

const LIGHTNING_SEGMENTS = 20;
const LIGHTNING_UPDATE_INTERVAL = 100; // milliseconds
const LIGHTNING_DAMAGE_INTERVAL = 0.1; // seconds
const LIGHTNING_BASE_DPS = 5; // Damage per second (reduced from 10)
const LIGHTNING_SHIELD_MULTIPLIER = 1.5; // 50% more damage to shields

interface LightningWeapon {
  strands: {
    points: THREE.Vector3[];
    line: THREE.Line;
    auras: THREE.Mesh[];
  }[];
  updateTimer: number;
  auraTime: number;
  origin: THREE.Vector3;
  target: THREE.Vector3;
  ownerEntity: number;
  damageTimer: number;
  sparkSystem: {
    geometry: THREE.BufferGeometry;
    particles: THREE.Points;
    velocities: THREE.Vector3[];
    lifetimes: number[];
  };
}

/**
 * WeaponSystem
 * 
 * Purpose:
 * Handles weapon firing logic and manages cooldowns.
 * Creates projectile entities when the player fires.
 * 
 * Responsibilities:
 * - Tracks weapon cooldowns
 * - Creates projectile entities when firing
 * - Handles timing and cooldown management
 * - Supports different weapon types (to be expanded)
 * - Plays sound effects when weapons are fired
 */
export class WeaponSystem implements System {
  private world: World;
  private scene: THREE.Scene;
  private inputManager: InputManager;
  private sceneManager: SceneManager;
  private audioManager?: AudioManager;
  private lightningWeapons: Map<number, LightningWeapon>;
  private lightningMaterials: {
    line: THREE.LineBasicMaterial;
    auras: THREE.MeshPhongMaterial[];
    sparks: THREE.PointsMaterial;
  };
  private readonly NUM_SPARKS = 75; // Keep increased number of sparks
  private readonly SPARK_SIZE = 1.2; // Keep increased visibility
  private readonly SPARK_SPEED = 20; // Reduced from 35
  private readonly SPARK_SPREAD = 0.8; // Keep same spread angle
  private readonly SPARK_DRAG = 3.0; // Add drag to slow particles down

  constructor(world: World, sceneManager: SceneManager, audioManager?: AudioManager) {
    this.world = world;
    this.scene = sceneManager.getScene();
    this.sceneManager = sceneManager;
    this.audioManager = audioManager;
    
    // Get the renderer DOM element for input handling
    const rendererElement = sceneManager.getRendererDomElement();
    if (!rendererElement) {
      throw new Error('Renderer DOM element not available');
    }
    this.inputManager = InputManager.getInstance(rendererElement);

    this.lightningWeapons = new Map();

    // Initialize lightning materials
    this.lightningMaterials = {
      line: new THREE.LineBasicMaterial({
        color: 0xff00ff, // Magenta core
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        linewidth: 3, // Note: Due to WebGL limitations, line width may be capped at 1
        depthTest: true, // Enable depth testing for lightning
        depthWrite: false // Keep this false to avoid z-fighting
      }),
      auras: [
        new THREE.MeshPhongMaterial({
          color: 0xff00ff, // Magenta inner aura
          emissive: 0xff00ff,
          emissiveIntensity: 2.0,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthTest: true, // Enable depth testing for lightning
          depthWrite: false
        }),
        new THREE.MeshPhongMaterial({
          color: 0xff66ff, // Lighter magenta middle aura
          emissive: 0xff66ff,
          emissiveIntensity: 1.5,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthTest: true, // Enable depth testing for lightning
          depthWrite: false
        }),
        new THREE.MeshPhongMaterial({
          color: 0x00ffff, // Cyan outer aura
          emissive: 0x00ffff,
          emissiveIntensity: 1.0,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthTest: true, // Enable depth testing for lightning
          depthWrite: false
        })
      ],
      sparks: new THREE.PointsMaterial({
        color: 0x00ffff,
        size: this.SPARK_SIZE,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthTest: false, // Keep depth testing disabled for sparks
        depthWrite: false,
        map: this.createSparkTexture(),
        vertexColors: true
      })
    };
  }

  /**
   * Set the audio manager after construction
   * @param audioManager The audio manager to use
   */
  public setAudioManager(audioManager: AudioManager): void {
    this.audioManager = audioManager;
  }

  private createSparkTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    // Create a more intense radial gradient for the spark with cyan colors
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(150, 255, 255, 0.9)');
    gradient.addColorStop(0.4, 'rgba(0, 255, 255, 0.7)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private createSparkSystem(position: THREE.Vector3) {
    // Create geometry with positions and colors
    const positions = new Float32Array(this.NUM_SPARKS * 3);
    const colors = new Float32Array(this.NUM_SPARKS * 3);
    const velocities: THREE.Vector3[] = [];
    const lifetimes: number[] = [];

    // Initialize all particles at the impact position
    for (let i = 0; i < this.NUM_SPARKS; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      // Set initial color (bright white-pink)
      colors[i * 3] = 1.0;     // R
      colors[i * 3 + 1] = 0.8; // G
      colors[i * 3 + 2] = 1.0; // B

      // Create random velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      );
      velocity.multiplyScalar(this.SPARK_SPEED * (0.5 + Math.random()));
      velocities.push(velocity);

      // Random lifetime between 0.2 and 0.6 seconds
      lifetimes.push(0.2 + Math.random() * 0.4);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const particles = new THREE.Points(geometry, this.lightningMaterials.sparks);
    particles.renderOrder = 2200;
    this.scene.add(particles);

    return {
      geometry,
      particles,
      velocities,
      lifetimes
    };
  }

  update(deltaTime: number): void {
    const rendererDomElement = this.sceneManager.getRendererDomElement();
    if (!rendererDomElement) {
      console.warn('Renderer DOM element not available');
      return;
    }

    // Get input state to check if shoot button is pressed
    const inputState = this.inputManager.getInputState();
    const isFiring = this.inputManager.isFiring(); // Check both keyboard and mobile firing
    
    // Process entities with weapon components
    const entities = this.world.getEntitiesWith(['InputReceiver', 'Position']);
    
    for (const entity of entities) {
      // Get required components
      const position = this.world.getComponent<Position>(entity, 'Position');
      const rotation = this.world.getComponent<Rotation>(entity, 'Rotation');
      
      if (!position || !rotation) continue;
      
      // Get or add LaserCooldown component
      let laserCooldown = this.world.getComponent<LaserCooldown>(entity, 'LaserCooldown');
      
      if (!laserCooldown) {
        // Initialize cooldown component if it doesn't exist
        laserCooldown = {
          current: 0,
          max: 0.25, // 4 shots per second
          canFire: true,
          readyToFire: false
        };
        this.world.addComponent(entity, 'LaserCooldown', laserCooldown);
      }
      
      // Update cooldown
      if (!laserCooldown.canFire) {
        laserCooldown.current -= deltaTime;
        if (laserCooldown.current <= 0) {
          laserCooldown.canFire = true;
          laserCooldown.current = 0;
        }
      }
      
      // Check if shooting and can fire
      if (laserCooldown && (inputState.shoot || isFiring || laserCooldown.readyToFire) && laserCooldown.canFire) {
        this.fireWeapon(entity, position, rotation);
        
        // Reset cooldown and ready state
        laserCooldown.canFire = false;
        laserCooldown.readyToFire = false;
        laserCooldown.current = laserCooldown.max;
      }
    }
    
    // Update existing projectiles
    this.updateProjectiles(deltaTime);

    // Update all active lightning weapons
    for (const [entityId, lightning] of this.lightningWeapons) {
      // Get current positions
      const ownerPos = this.world.getComponent<Position>(lightning.ownerEntity, 'Position');
      const enemy = this.world.getComponent<Enemy>(lightning.ownerEntity, 'Enemy');
      
      if (!ownerPos || !enemy) {
        // Owner no longer exists, remove the lightning
        this.removeLightningWeapon(entityId);
        continue;
      }

      const targetPos = this.world.getComponent<Position>(enemy.targetEntity, 'Position');
      if (!targetPos) continue;

      // Calculate direction and surface point
      const direction = new THREE.Vector3(
        targetPos.x - ownerPos.x,
        targetPos.y - ownerPos.y,
        targetPos.z - ownerPos.z
      ).normalize();

      // Calculate the intersection point with the Dyson Sphere's surface
      const DYSON_RADIUS = 50;
      const surfacePoint = new THREE.Vector3(
        targetPos.x - direction.x * DYSON_RADIUS,
        targetPos.y - direction.y * DYSON_RADIUS,
        targetPos.z - direction.z * DYSON_RADIUS
      );

      // Update origin and target positions
      lightning.origin.set(ownerPos.x, ownerPos.y, ownerPos.z);
      lightning.target.copy(surfacePoint);

      lightning.updateTimer += deltaTime * 1000;
      lightning.auraTime += deltaTime * 2;
      lightning.damageTimer += deltaTime;

      // Update visual effects
      if (lightning.updateTimer >= LIGHTNING_UPDATE_INTERVAL) {
        this.updateLightningStrands(lightning);
        lightning.updateTimer = 0;
      }

      // Apply damage at regular intervals
      if (lightning.damageTimer >= LIGHTNING_DAMAGE_INTERVAL) {
        this.applyLightningDamage(enemy.targetEntity, lightning.damageTimer);
        lightning.damageTimer = 0;
      }

      // Update aura materials for more dramatic pulsing effect
      lightning.strands.forEach(strand => {
        strand.auras.forEach((aura, i) => {
          const material = aura.material as THREE.MeshPhongMaterial;
          const baseIntensity = 2.0 - (i * 0.3);
          const pulseAmount = Math.sin(lightning.auraTime * 2) * 0.5;
          material.emissiveIntensity = baseIntensity + pulseAmount;
        });
      });

      // Update spark particles
      const positions = lightning.sparkSystem.geometry.attributes.position;
      const colors = lightning.sparkSystem.geometry.attributes.color;
      const posArray = positions.array as Float32Array;
      const colorArray = colors.array as Float32Array;

      for (let i = 0; i < this.NUM_SPARKS; i++) {
        if (lightning.sparkSystem.lifetimes[i] > 0) {
          // Update position
          const velocity = lightning.sparkSystem.velocities[i];
          
          // Apply drag to slow down particles over time
          velocity.multiplyScalar(1 - (this.SPARK_DRAG * deltaTime));
          
          posArray[i * 3] += velocity.x * deltaTime;
          posArray[i * 3 + 1] += velocity.y * deltaTime;
          posArray[i * 3 + 2] += velocity.z * deltaTime;

          // Reduced gravity
          velocity.y -= 10 * deltaTime;

          // Update lifetime and color
          lightning.sparkSystem.lifetimes[i] -= deltaTime;
          const lifeRatio = lightning.sparkSystem.lifetimes[i] / 0.4;
          
          // Enhanced color brightness with cyan
          colorArray[i * 3] = Math.min(1.0, lifeRatio * 0.5);     // R (reduced for cyan)
          colorArray[i * 3 + 1] = Math.min(1.0, lifeRatio * 1.5); // G (increased for cyan)
          colorArray[i * 3 + 2] = Math.min(1.0, lifeRatio * 1.5); // B (increased for cyan)
        } else {
          // Reset particle to the surface impact point
          posArray[i * 3] = surfacePoint.x;
          posArray[i * 3 + 1] = surfacePoint.y;
          posArray[i * 3 + 2] = surfacePoint.z;

          // Create a more varied spread of directions
          const outwardDir = direction.clone().negate();
          
          // Generate a random direction in a cone around the outward direction
          const spreadAngle = Math.PI * this.SPARK_SPREAD;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * spreadAngle;
          
          const rotationMatrix = new THREE.Matrix4();
          
          // First, find a perpendicular vector to rotate around
          const up = new THREE.Vector3(0, 1, 0);
          const rotationAxis = new THREE.Vector3().crossVectors(outwardDir, up).normalize();
          if (rotationAxis.lengthSq() < 0.1) {
            rotationAxis.set(1, 0, 0);
          }
          
          // Create our random direction starting from the outward direction
          const velocity = lightning.sparkSystem.velocities[i];
          velocity.copy(outwardDir);
          
          // Apply the spread angle
          rotationMatrix.makeRotationAxis(rotationAxis, phi);
          velocity.applyMatrix4(rotationMatrix);
          
          // Rotate around the original direction
          rotationMatrix.makeRotationAxis(outwardDir, theta);
          velocity.applyMatrix4(rotationMatrix);
          
          // Reduced speed range
          const speed = this.SPARK_SPEED * (0.5 + Math.random() * 0.5); // 50-100% of base speed
          velocity.multiplyScalar(speed);

          // Shorter lifetime
          lightning.sparkSystem.lifetimes[i] = 0.2 + Math.random() * 0.2; // 0.2-0.4 seconds
          
          // Reset to bright cyan color
          colorArray[i * 3] = 0.5;  // R (reduced for cyan)
          colorArray[i * 3 + 1] = 1.0; // G (full for cyan)
          colorArray[i * 3 + 2] = 1.0; // B (full for cyan)
        }
      }

      positions.needsUpdate = true;
      colors.needsUpdate = true;
    }
  }
  
  private fireWeapon(entity: number, position: Position, rotation: Rotation): void {
    // Calculate weapon muzzle position (slightly in front of the ship)
    // Create forward vector based on rotation
    const forward = new THREE.Vector3(0, 0, -1);
    const pitchMatrix = new THREE.Matrix4().makeRotationX(rotation.x);
    const yawMatrix = new THREE.Matrix4().makeRotationY(rotation.y);
    
    // Apply rotations to get the true forward direction
    forward.applyMatrix4(pitchMatrix);
    forward.applyMatrix4(yawMatrix);
    
    // Create right vector for positioning the dual cannons
    const right = new THREE.Vector3(1, 0, 0);
    right.applyMatrix4(pitchMatrix);
    right.applyMatrix4(yawMatrix);
    
    // Define cannon offset positions (left and right of the ship)
    const cannonOffsets = [-1.5, 1.5];
    
    // Play laser sound effect
    if (this.audioManager) {
      this.audioManager.playSound('laser', false, 0.5);
    }
    
    // Fire from both cannons
    cannonOffsets.forEach(offset => {
      // Calculate the cannon position
      const cannonPos = new THREE.Vector3(
        position.x + right.x * offset + forward.x * 2,
        position.y + right.y * offset + forward.y * 2 - 0.5, // Adjust for cannon height
        position.z + right.z * offset + forward.z * 2
      );
      
      // Spawn position for the laser
      const spawnPos = {
        x: cannonPos.x,
        y: cannonPos.y,
        z: cannonPos.z
      };
      
      // Create the laser entity
      createLaser(this.world, this.scene, spawnPos, forward, entity);
    });
  }
  
  private updateProjectiles(deltaTime: number): void {
    // Get all projectile entities
    const projectiles = this.world.getEntitiesWith(['Projectile', 'Position']);
    
    for (const entity of projectiles) {
      const projectile = this.world.getComponent<{lifetime: number, timeAlive: number}>(entity, 'Projectile');
      
      if (!projectile) continue;
      
      // Update lifetime
      projectile.timeAlive += deltaTime;
      
      // Remove projectile if it exceeds its lifetime
      if (projectile.timeAlive >= projectile.lifetime) {
        // This will indirectly remove the mesh via the RenderingSystem
        this.world.removeEntity(entity);
      }
    }
  }

  private applyLightningDamage(targetEntity: number, deltaTime: number): void {
    // Calculate damage for this tick
    const baseDamage = LIGHTNING_BASE_DPS * deltaTime;
    
    // Check for shield first
    const shield = this.world.getComponent<Shield>(targetEntity, 'Shield');
    const health = this.world.getComponent<Health>(targetEntity, 'Health');
    
    if (!health) return;

    if (shield && shield.current > 0) {
      // Apply increased damage to shield
      const shieldDamage = baseDamage * LIGHTNING_SHIELD_MULTIPLIER;
      shield.current -= shieldDamage;
      
      // If shield is depleted, apply remaining damage to health
      if (shield.current < 0) {
        const remainingDamage = -shield.current / LIGHTNING_SHIELD_MULTIPLIER; // Convert back to base damage
        health.current -= remainingDamage;
        shield.current = 0;
      }

      // Update shield hit time
      shield.lastHitTime = performance.now() / 1000;
      shield.isRegenerating = false;
    } else {
      // No shield or shield depleted, damage health directly
      health.current -= baseDamage;
    }

    // Ensure health doesn't go below 0
    if (health.current < 0) health.current = 0;
  }

  createLightningWeapon(ownerEntity: number): void {
    const ownerPos = this.world.getComponent<Position>(ownerEntity, 'Position');
    const enemy = this.world.getComponent<Enemy>(ownerEntity, 'Enemy');
    
    if (!ownerPos || !enemy) return;

    const targetPos = this.world.getComponent<Position>(enemy.targetEntity, 'Position');
    if (!targetPos) return;

    // Calculate direction from owner to target
    const direction = new THREE.Vector3(
      targetPos.x - ownerPos.x,
      targetPos.y - ownerPos.y,
      targetPos.z - ownerPos.z
    ).normalize();

    // Calculate the intersection point with the Dyson Sphere's surface
    const DYSON_RADIUS = 50;
    const surfacePoint = new THREE.Vector3(
      targetPos.x - direction.x * DYSON_RADIUS,
      targetPos.y - direction.y * DYSON_RADIUS,
      targetPos.z - direction.z * DYSON_RADIUS
    );

    const currentOrigin = new THREE.Vector3(ownerPos.x, ownerPos.y, ownerPos.z);
    const currentTarget = surfacePoint;

    const lightning: LightningWeapon = {
      strands: [],
      updateTimer: 0,
      auraTime: 0,
      damageTimer: 0,
      origin: currentOrigin,
      target: currentTarget,
      ownerEntity,
      sparkSystem: this.createSparkSystem(surfacePoint)
    };

    // Create multiple lightning strands
    const numStrands = 4;
    for (let i = 0; i < numStrands; i++) {
      const points = this.generateLightningPoints(currentOrigin, currentTarget, i / numStrands * Math.PI * 2);
      
      // Create aura tubes first (back to front)
      const auras = this.lightningMaterials.auras.map((material, index) => {
        const tubeGeometry = this.createTubeGeometry(points, 0.15 + index * 0.2);
        const mesh = new THREE.Mesh(tubeGeometry, material);
        mesh.renderOrder = 2000 + index; // Very high render order to ensure it renders after everything
        this.scene.add(mesh);
        return mesh;
      });

      // Create jagged lightning line
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeometry, this.lightningMaterials.line);
      line.renderOrder = 2100; // Even higher render order than the auras
      this.scene.add(line);

      lightning.strands.push({ 
        points, 
        line,
        auras 
      });
    }

    this.lightningWeapons.set(ownerEntity, lightning);
  }

  removeLightningWeapon(entityId: number): void {
    const lightning = this.lightningWeapons.get(entityId);
    if (!lightning) return;

    lightning.strands.forEach(strand => {
      strand.line.geometry.dispose();
      this.scene.remove(strand.line);

      strand.auras.forEach(aura => {
        aura.geometry.dispose();
        this.scene.remove(aura);
      });
    });

    // Clean up spark system
    if (lightning.sparkSystem) {
      lightning.sparkSystem.geometry.dispose();
      this.scene.remove(lightning.sparkSystem.particles);
    }

    this.lightningWeapons.delete(entityId);
  }

  private updateLightningStrands(lightning: LightningWeapon): void {
    const ownerPos = this.world.getComponent<Position>(lightning.ownerEntity, 'Position');
    const enemy = this.world.getComponent<Enemy>(lightning.ownerEntity, 'Enemy');
    if (!ownerPos || !enemy) return;

    const targetPos = this.world.getComponent<Position>(enemy.targetEntity, 'Position');
    if (!targetPos) return;

    // Calculate direction from owner to target
    const direction = new THREE.Vector3(
      targetPos.x - ownerPos.x,
      targetPos.y - ownerPos.y,
      targetPos.z - ownerPos.z
    ).normalize();

    // Calculate the intersection point with the Dyson Sphere's surface
    const DYSON_RADIUS = 50;
    const surfacePoint = new THREE.Vector3(
      targetPos.x - direction.x * DYSON_RADIUS,
      targetPos.y - direction.y * DYSON_RADIUS,
      targetPos.z - direction.z * DYSON_RADIUS
    );

    const currentOrigin = new THREE.Vector3(ownerPos.x, ownerPos.y, ownerPos.z);
    const currentTarget = surfacePoint;

    lightning.strands.forEach((strand, i) => {
      const points = this.generateLightningPoints(currentOrigin, currentTarget, i / lightning.strands.length * Math.PI * 2);
      
      // Update jagged line geometry
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      strand.line.geometry.dispose();
      strand.line.geometry = lineGeometry;
      
      // Update aura tubes
      strand.auras.forEach((aura, index) => {
        const newGeometry = this.createTubeGeometry(points, 0.15 + index * 0.2);
        aura.geometry.dispose();
        aura.geometry = newGeometry;
      });

      strand.points = points;
    });
  }

  private generateLightningPoints(origin: THREE.Vector3, target: THREE.Vector3, angleOffset: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const direction = target.clone().sub(origin);
    const length = direction.length();
    direction.normalize();

    // Create a basis for offset calculation
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(direction, up).normalize();
    const realUp = new THREE.Vector3().crossVectors(right, direction).normalize();

    // First point is exactly at origin
    points.push(origin.clone());

    // Generate middle points with more jagged variation
    const numPoints = LIGHTNING_SEGMENTS;
    for (let i = 1; i < numPoints - 1; i++) {
      const t = i / numPoints;
      
      // Base point along the direct path
      const basePoint = origin.clone().add(direction.clone().multiplyScalar(length * t));
      
      // Calculate spiral offset with more randomness
      const angle = t * 6 * Math.PI + angleOffset + (Math.random() - 0.5) * 2;
      const radius = Math.sin(t * Math.PI) * 1.2 * (0.8 + Math.random() * 0.4);
      
      // Add offset perpendicular to direction
      const offset = right.clone()
        .multiplyScalar(Math.cos(angle) * radius)
        .add(realUp.clone().multiplyScalar(Math.sin(angle) * radius));
      
      basePoint.add(offset);
      points.push(basePoint);
    }

    // Last point is exactly at target
    points.push(target.clone());

    return points;
  }

  private createTubeGeometry(points: THREE.Vector3[], radius: number): THREE.BufferGeometry {
    const curve = new THREE.CatmullRomCurve3(points);
    // Increase tube detail for smoother appearance
    return new THREE.TubeGeometry(curve, LIGHTNING_SEGMENTS * 2, radius * 2, 16, false);
  }
} 