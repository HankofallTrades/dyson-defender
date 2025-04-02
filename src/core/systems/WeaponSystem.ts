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
  damageTimer: number; // Track time for damage ticks
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
  };

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
        linewidth: 3 // Note: Due to WebGL limitations, line width may be capped at 1
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
          depthWrite: false
        })
      ]
    };
  }

  /**
   * Set the audio manager after construction
   * @param audioManager The audio manager to use
   */
  public setAudioManager(audioManager: AudioManager): void {
    this.audioManager = audioManager;
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

      // Update origin and target positions
      lightning.origin.set(ownerPos.x, ownerPos.y, ownerPos.z);
      lightning.target.set(targetPos.x, targetPos.y, targetPos.z);

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

    const currentOrigin = new THREE.Vector3(ownerPos.x, ownerPos.y, ownerPos.z);
    const currentTarget = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);

    const lightning: LightningWeapon = {
      strands: [],
      updateTimer: 0,
      auraTime: 0,
      damageTimer: 0, // Initialize damage timer
      origin: currentOrigin,
      target: currentTarget,
      ownerEntity
    };

    // Create multiple lightning strands
    const numStrands = 4;
    for (let i = 0; i < numStrands; i++) {
      const points = this.generateLightningPoints(currentOrigin, currentTarget, i / numStrands * Math.PI * 2);
      
      // Create aura tubes first (back to front)
      const auras = this.lightningMaterials.auras.map((material, index) => {
        const tubeGeometry = this.createTubeGeometry(points, 0.15 + index * 0.2);
        const mesh = new THREE.Mesh(tubeGeometry, material);
        mesh.renderOrder = 1 + index;
        this.scene.add(mesh);
        return mesh;
      });

      // Create jagged lightning line
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeometry, this.lightningMaterials.line);
      line.renderOrder = 10;
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

    this.lightningWeapons.delete(entityId);
  }

  private updateLightningStrands(lightning: LightningWeapon): void {
    const ownerPos = this.world.getComponent<Position>(lightning.ownerEntity, 'Position');
    const enemy = this.world.getComponent<Enemy>(lightning.ownerEntity, 'Enemy');
    if (!ownerPos || !enemy) return;

    const targetPos = this.world.getComponent<Position>(enemy.targetEntity, 'Position');
    if (!targetPos) return;

    const currentOrigin = new THREE.Vector3(ownerPos.x, ownerPos.y, ownerPos.z);
    const currentTarget = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);

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