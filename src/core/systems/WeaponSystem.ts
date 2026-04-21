import * as THREE from 'three';
import { World, System } from '../World';
import { Position, Rotation, LaserCooldown, Enemy, Shield, Health, Renderable, Collider } from '../components';
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
const LIGHTNING_IMPACT_RIPPLE_COUNT = 4;
const LIGHTNING_IMPACT_RIPPLE_SPEED = 1.5;
const LIGHTNING_IMPACT_RIPPLE_MIN_RADIUS = 1.1;
const LIGHTNING_IMPACT_RIPPLE_MAX_RADIUS = 7.5;
const LIGHTNING_IMPACT_RIPPLE_SURFACE_OFFSET = 0.5;
const PRAETORIAN_LASER_DAMAGE = 160;
const PRAETORIAN_LASER_SPEED = 1100;
const PRAETORIAN_LASER_LIFETIME = 0.95;
const PRAETORIAN_LASER_COOLDOWN = 0.55;
const PRAETORIAN_BEAM_LENGTH = 260;
const PRAETORIAN_BEAM_DURATION = 0.7;

interface LightningEndpoints {
  origin: THREE.Vector3;
  target: THREE.Vector3;
  targetNormal: THREE.Vector3;
}

interface LightningImpactRipple {
  group: THREE.Group;
  glow: THREE.Mesh;
  rings: THREE.Mesh[];
}

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
  rippleTime: number;
  impactRipple: LightningImpactRipple;
}

interface PraetorianBeam {
  group: THREE.Group;
  materials: THREE.Material[];
  baseOpacities: number[];
  timeRemaining: number;
  duration: number;
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
  private readonly ripplePlaneNormal = new THREE.Vector3(0, 0, 1);
  private secondaryWasPressed = false;
  private praetorianBeams: PraetorianBeam[] = [];

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
        depthTest: false,
        depthWrite: false
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
          depthTest: false,
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
          depthTest: false,
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
          depthTest: false,
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

      this.updateSecondaryWeapon(entity, position, rotation, deltaTime);
    }
    
    // Update existing projectiles
    this.updateProjectiles(deltaTime);
    this.updatePraetorianBeams(deltaTime);

    // Update all active lightning weapons
    for (const [entityId, lightning] of this.lightningWeapons) {
      const enemy = this.world.getComponent<Enemy>(lightning.ownerEntity, 'Enemy');
      
      if (!enemy) {
        // Owner no longer exists, remove the lightning
        this.removeLightningWeapon(entityId);
        continue;
      }

      const endpoints = this.getLightningEndpoints(lightning.ownerEntity, enemy.targetEntity);
      if (!endpoints) {
        this.removeLightningWeapon(entityId);
        continue;
      }

      // Update origin and target positions
      lightning.origin.copy(endpoints.origin);
      lightning.target.copy(endpoints.target);

      lightning.updateTimer += deltaTime * 1000;
      lightning.auraTime += deltaTime * 2;
      lightning.damageTimer += deltaTime;
      lightning.rippleTime += deltaTime * LIGHTNING_IMPACT_RIPPLE_SPEED;

      // Damage is gameplay-critical, so keep it independent from the visual refresh path.
      if (lightning.damageTimer >= LIGHTNING_DAMAGE_INTERVAL) {
        this.applyLightningDamage(enemy.targetEntity, lightning.damageTimer);
        lightning.damageTimer = 0;
      }

      // Update visual effects
      if (lightning.updateTimer >= LIGHTNING_UPDATE_INTERVAL) {
        try {
          this.updateLightningStrands(lightning);
        } catch (error) {
          console.error('[WeaponSystem] Failed to refresh lightning visuals:', error);
        }
        lightning.updateTimer = 0;
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

      this.updateImpactRipple(lightning, endpoints);
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
      
      const damageLevel = this.world.getGameState()?.shipDamageLevel ?? 0;
      createLaser(this.world, this.scene, spawnPos, forward, entity, COLORS.LASER_GREEN, {
        damage: 5 + damageLevel * 2
      });
    });
  }

  private updateSecondaryWeapon(entity: number, position: Position, rotation: Rotation, deltaTime: number): void {
    const gameState = this.world.getGameState();
    const secondaryWeapon = gameState?.secondaryWeapon;
    if (!secondaryWeapon || !secondaryWeapon.unlocked || secondaryWeapon.type !== 'praetorianLaser') {
      this.secondaryWasPressed = this.inputManager.isSecondaryFiring();
      return;
    }

    if (secondaryWeapon.cooldown > 0) {
      secondaryWeapon.cooldown = Math.max(0, secondaryWeapon.cooldown - deltaTime);
    }

    const isPressed = this.inputManager.isSecondaryFiring();
    const canStartCharge = secondaryWeapon.charges > 0 && secondaryWeapon.cooldown <= 0;

    if (isPressed && !this.secondaryWasPressed && !secondaryWeapon.isCharging && canStartCharge) {
      secondaryWeapon.isCharging = true;
      secondaryWeapon.chargeProgress = 0;
    }

    if (!isPressed && secondaryWeapon.isCharging) {
      secondaryWeapon.isCharging = false;
      secondaryWeapon.chargeProgress = 0;
    }

    if (isPressed && secondaryWeapon.isCharging) {
      secondaryWeapon.chargeProgress = Math.min(
        1,
        secondaryWeapon.chargeProgress + deltaTime / secondaryWeapon.chargeDuration
      );

      if (secondaryWeapon.chargeProgress >= 1) {
        this.firePraetorianLaser(entity, position, rotation);
        secondaryWeapon.charges = Math.max(0, secondaryWeapon.charges - 1);
        secondaryWeapon.isCharging = false;
        secondaryWeapon.chargeProgress = 0;
        secondaryWeapon.cooldown = PRAETORIAN_LASER_COOLDOWN;
      }
    }

    this.secondaryWasPressed = isPressed;
  }

  private firePraetorianLaser(entity: number, position: Position, rotation: Rotation): void {
    const forward = new THREE.Vector3(0, 0, -1);
    const shipEuler = new THREE.Euler(rotation.x, rotation.y, rotation.z, 'YXZ');
    forward.applyQuaternion(new THREE.Quaternion().setFromEuler(shipEuler)).normalize();

    const spawnPos = {
      x: position.x + forward.x * 5,
      y: position.y + forward.y * 5,
      z: position.z + forward.z * 5
    };

    if (this.audioManager) {
      this.audioManager.playSound('laser', false, 0.9);
    }

    this.createPraetorianBeam(spawnPos, forward);

    createLaser(this.world, this.scene, spawnPos, forward, entity, COLORS.PRAETORIAN_LASER, {
      damage: PRAETORIAN_LASER_DAMAGE,
      speed: PRAETORIAN_LASER_SPEED,
      lifetime: PRAETORIAN_LASER_LIFETIME,
      scale: 4.5,
      colliderWidth: 2.4,
      colliderHeight: 2.4,
      colliderDepth: 42
    });
  }

  private createPraetorianBeam(origin: Position, direction: THREE.Vector3): void {
    const beamDirection = direction.clone().normalize();
    const originVector = new THREE.Vector3(origin.x, origin.y, origin.z);
    const midpoint = originVector.clone().addScaledVector(beamDirection, PRAETORIAN_BEAM_LENGTH / 2);
    const beamRotation = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      beamDirection
    );

    const group = new THREE.Group();
    group.position.copy(midpoint);
    group.quaternion.copy(beamRotation);
    group.renderOrder = 2500;
    group.frustumCulled = false;

    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xfff8d0,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const hotAuraMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.PRAETORIAN_LASER,
      transparent: true,
      opacity: 0.58,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const outerAuraMaterial = new THREE.MeshBasicMaterial({
      color: 0xff7b00,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 0.95, PRAETORIAN_BEAM_LENGTH, 32),
      coreMaterial
    );
    const hotAura = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, PRAETORIAN_BEAM_LENGTH, 32),
      hotAuraMaterial
    );
    const outerAura = new THREE.Mesh(
      new THREE.CylinderGeometry(4.2, 4.2, PRAETORIAN_BEAM_LENGTH, 32),
      outerAuraMaterial
    );

    const muzzleFlash = new THREE.Mesh(
      new THREE.SphereGeometry(5.5, 24, 16),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    muzzleFlash.position.y = -PRAETORIAN_BEAM_LENGTH / 2;

    group.add(outerAura, hotAura, core, muzzleFlash);
    this.scene.add(group);

    this.praetorianBeams.push({
      group,
      materials: [coreMaterial, hotAuraMaterial, outerAuraMaterial, muzzleFlash.material],
      baseOpacities: [1, 0.58, 0.24, 0.75],
      timeRemaining: PRAETORIAN_BEAM_DURATION,
      duration: PRAETORIAN_BEAM_DURATION
    });
  }

  private updatePraetorianBeams(deltaTime: number): void {
    if (this.praetorianBeams.length === 0) {
      return;
    }

    const activeBeams: PraetorianBeam[] = [];
    for (const beam of this.praetorianBeams) {
      beam.timeRemaining -= deltaTime;
      const progress = Math.max(0, beam.timeRemaining / beam.duration);
      const pulse = 0.9 + Math.sin(performance.now() * 0.04) * 0.08;
      beam.group.scale.set(pulse, 1, pulse);

      beam.materials.forEach((material, index) => {
        if ('opacity' in material) {
          material.opacity = beam.baseOpacities[index] * progress;
        }
      });

      if (beam.timeRemaining > 0) {
        activeBeams.push(beam);
      } else {
        this.scene.remove(beam.group);
        beam.group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
          }
        });
        beam.materials.forEach((material) => material.dispose());
      }
    }

    this.praetorianBeams = activeBeams;
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

  createLightningWeapon(ownerEntity: number): boolean {
    if (this.lightningWeapons.has(ownerEntity)) {
      return true;
    }

    const enemy = this.world.getComponent<Enemy>(ownerEntity, 'Enemy');
    
    if (!enemy) return false;

    const endpoints = this.getLightningEndpoints(ownerEntity, enemy.targetEntity);
    if (!endpoints) return false;

    const currentOrigin = endpoints.origin;
    const currentTarget = endpoints.target;

    const lightning: LightningWeapon = {
      strands: [],
      updateTimer: 0,
      auraTime: 0,
      damageTimer: 0,
      origin: currentOrigin,
      target: currentTarget,
      ownerEntity,
      rippleTime: 0,
      impactRipple: this.createImpactRipple()
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
        mesh.frustumCulled = false;
        this.scene.add(mesh);
        return mesh;
      });

      // Create jagged lightning line
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeometry, this.lightningMaterials.line);
      line.renderOrder = 2100; // Even higher render order than the auras
      line.frustumCulled = false;
      this.scene.add(line);

      lightning.strands.push({ 
        points, 
        line,
        auras 
      });
    }

    this.lightningWeapons.set(ownerEntity, lightning);
    this.updateImpactRipple(lightning, endpoints);
    return true;
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

    this.disposeImpactRipple(lightning.impactRipple);
    this.lightningWeapons.delete(entityId);
  }

  private updateLightningStrands(lightning: LightningWeapon): void {
    const enemy = this.world.getComponent<Enemy>(lightning.ownerEntity, 'Enemy');
    if (!enemy) return;

    const endpoints = this.getLightningEndpoints(lightning.ownerEntity, enemy.targetEntity);
    if (!endpoints) return;

    const currentOrigin = endpoints.origin;
    const currentTarget = endpoints.target;

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

  private createImpactRipple(): LightningImpactRipple {
    const group = new THREE.Group();
    group.frustumCulled = false;

    const glowGeometry = new THREE.CircleGeometry(1.2, 48);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.SHIELD_BUBBLE_INNER,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.renderOrder = 2040;
    glow.frustumCulled = false;
    group.add(glow);

    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < LIGHTNING_IMPACT_RIPPLE_COUNT; i++) {
      const ringGeometry = new THREE.RingGeometry(0.82, 1.0, 64);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? COLORS.SHIELD_BUBBLE : COLORS.DYSON_PRIMARY,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.renderOrder = 2050 + i;
      ring.frustumCulled = false;
      group.add(ring);
      rings.push(ring);
    }

    this.scene.add(group);

    return { group, glow, rings };
  }

  private disposeImpactRipple(impactRipple: LightningImpactRipple): void {
    impactRipple.group.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();

        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    this.scene.remove(impactRipple.group);
  }

  private updateImpactRipple(lightning: LightningWeapon, endpoints: LightningEndpoints): void {
    const surfaceNormal = endpoints.targetNormal.lengthSq() > 0
      ? endpoints.targetNormal
      : this.ripplePlaneNormal;

    lightning.impactRipple.group.position
      .copy(endpoints.target)
      .addScaledVector(surfaceNormal, LIGHTNING_IMPACT_RIPPLE_SURFACE_OFFSET);
    lightning.impactRipple.group.quaternion.setFromUnitVectors(this.ripplePlaneNormal, surfaceNormal);

    const contactPulse = (Math.sin(lightning.auraTime * 4) + 1) * 0.5;
    lightning.impactRipple.glow.scale.setScalar(1.8 + contactPulse * 1.4);
    (lightning.impactRipple.glow.material as THREE.MeshBasicMaterial).opacity = 0.18 + contactPulse * 0.2;

    lightning.impactRipple.rings.forEach((ring, index) => {
      const phase = (lightning.rippleTime + index / lightning.impactRipple.rings.length) % 1;
      const radius = THREE.MathUtils.lerp(
        LIGHTNING_IMPACT_RIPPLE_MIN_RADIUS,
        LIGHTNING_IMPACT_RIPPLE_MAX_RADIUS,
        phase
      );
      const opacity = (0.08 + Math.pow(1 - phase, 1.1) * 0.34) * (1 - index * 0.08);

      ring.scale.setScalar(radius);
      (ring.material as THREE.MeshBasicMaterial).opacity = opacity;
    });
  }

  private getLightningEndpoints(ownerEntity: number, targetEntity: number): LightningEndpoints | null {
    const ownerPos = this.world.getComponent<Position>(ownerEntity, 'Position');
    const targetPos = this.world.getComponent<Position>(targetEntity, 'Position');
    if (!ownerPos || !targetPos) {
      return null;
    }

    const ownerRotation = this.world.getComponent<Rotation>(ownerEntity, 'Rotation');
    const ownerRenderable = this.world.getComponent<Renderable>(ownerEntity, 'Renderable');
    const targetCollider = this.world.getComponent<Collider>(targetEntity, 'Collider');

    const origin = new THREE.Vector3(ownerPos.x, ownerPos.y, ownerPos.z);

    if (ownerRotation && ownerRenderable?.modelId === 'grunt') {
      const scale = ownerRenderable.scale || 1;
      // The grunt eyes sit around (0.2, 0.1, 0.4); this places the beam between them and slightly forward.
      const localMouthOffset = new THREE.Vector3(0, -0.04 * scale, 0.52 * scale);
      const mouthEuler = new THREE.Euler(ownerRotation.x, ownerRotation.y, ownerRotation.z, 'YXZ');
      localMouthOffset.applyEuler(mouthEuler);
      origin.add(localMouthOffset);
    } else if (ownerRenderable?.scale) {
      const fallbackDirection = new THREE.Vector3(
        targetPos.x - ownerPos.x,
        targetPos.y - ownerPos.y,
        targetPos.z - ownerPos.z
      ).normalize();
      origin.addScaledVector(fallbackDirection, ownerRenderable.scale * 0.5);
    }

    const beamDirection = new THREE.Vector3(
      targetPos.x - origin.x,
      targetPos.y - origin.y,
      targetPos.z - origin.z
    );

    if (beamDirection.lengthSq() === 0) {
      return null;
    }

    beamDirection.normalize();

    const targetRadius = targetCollider?.radius || 0;
    const targetCenter = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
    const target = targetCenter.clone();
    if (targetRadius > 0) {
      target.addScaledVector(beamDirection, -targetRadius);
    }

    const targetNormal = target.clone().sub(targetCenter);
    if (targetNormal.lengthSq() > 0) {
      targetNormal.normalize();
    } else {
      targetNormal.copy(beamDirection).multiplyScalar(-1);
    }

    return { origin, target, targetNormal };
  }
} 
