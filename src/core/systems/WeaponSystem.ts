import * as THREE from 'three';
import { World, System } from '../World';
import { InputReceiver, Position, Rotation, LaserCooldown } from '../components';
import { InputManager } from '../input/InputManager';
import { SceneManager } from '../../rendering/SceneManager';
import { createLaser } from '../entities/LaserEntity';

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
 */
export class WeaponSystem implements System {
  private world: World;
  private scene: THREE.Scene;
  private inputManager: InputManager;
  private sceneManager: SceneManager;

  constructor(world: World, sceneManager: SceneManager) {
    this.world = world;
    this.scene = sceneManager.getScene();
    this.sceneManager = sceneManager;
    
    // Get the renderer DOM element for input handling
    const rendererElement = sceneManager.getRendererDomElement();
    this.inputManager = InputManager.getInstance(rendererElement);
  }

  update(deltaTime: number): void {
    const rendererDomElement = this.sceneManager.getRendererDomElement();
    if (!rendererDomElement) {
      console.warn('Renderer DOM element not available');
      return;
    }

    // Get input state to check if shoot button is pressed
    const inputState = this.inputManager.getInputState();
    
    // Get all entities with InputReceiver and Position and Rotation components
    // These are entities that can fire weapons
    const entities = this.world.getEntitiesWith(['InputReceiver', 'Position', 'Rotation']);
    
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
          canFire: true
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
      if (inputState.shoot && laserCooldown.canFire) {
        this.fireWeapon(entity, position, rotation);
        
        // Reset cooldown
        laserCooldown.canFire = false;
        laserCooldown.current = laserCooldown.max;
      }
    }
    
    // Update existing projectiles
    this.updateProjectiles(deltaTime);
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
} 