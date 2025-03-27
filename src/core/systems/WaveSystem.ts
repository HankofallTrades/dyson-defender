import { World, System } from '../World';
import { WaveInfo, Enemy, Renderable, GameStateDisplay, Position } from '../components';
import { createGrunt } from '../entities/GruntEntity';
import { createWormhole } from '../entities/WormholeEntity';
import { createShieldGuardian } from '../entities/ShieldGuardianEntity';
import { AnimationSystem } from './AnimationSystem';
import { HUDSystem } from './HUDSystem';
import * as THREE from 'three';

export class WaveSystem implements System {
  private dysonSphereEntity: number = -1; // Initialize with invalid entity ID
  private waveEntity: number;
  private timeSinceLastSpawn: number = 0;
  private spawnInterval: number = 1.5; // Time between spawns within a wave
  private gameStateEntity: number = -1; // Track game state entity
  private animationSystem: AnimationSystem | null = null;
  private hudSystem: HUDSystem | null = null;
  private hasAnnouncedWave: boolean = false;
  private hasAnnouncedCompletion: boolean = false;
  private hasAnnouncedShieldGuardian: boolean = false;
  
  constructor(private world: World) {
    // Create a special entity just to hold the wave information
    this.waveEntity = this.world.createEntity();
    this.world.addComponent(this.waveEntity, 'WaveInfo', {
      currentWave: 0,  // Start at wave 0, will increment to 1 when first wave starts
      enemiesRemaining: 0,
      totalEnemies: 0,
      nextWaveTimer: 3, // Start first wave after 3 seconds
      isActive: false
    });
    
    // Initial attempt to find the Dyson Sphere entity
    this.findDysonSphereEntity();
    
    // Find the game state entity (HUD entity with GameStateDisplay)
    const gameStateEntities = this.world.getEntitiesWith(['GameStateDisplay']);
    if (gameStateEntities.length > 0) {
      this.gameStateEntity = gameStateEntities[0];
    }
  }
  
  // Set the reference to the animation system
  public setAnimationSystem(animationSystem: AnimationSystem): void {
    this.animationSystem = animationSystem;
  }
  
  // Set the reference to the HUD system for displaying messages
  public setHUDSystem(hudSystem: HUDSystem): void {
    this.hudSystem = hudSystem;
  }
  
  // Method to find the Dyson Sphere entity
  public findDysonSphereEntity(): void {
    const dysonSpheres = this.world.getEntitiesWith(['Renderable', 'Health']);
    
    for (const entity of dysonSpheres) {
      const renderable = this.world.getComponent<Renderable>(entity, 'Renderable');
      if (renderable?.modelId === 'dysonSphere') {
        this.dysonSphereEntity = entity;
        return;
      }
    }
  }
  
  update(deltaTime: number): void {
    // Try to find the Dyson Sphere entity if we haven't found it yet
    if (this.dysonSphereEntity === -1) {
      this.findDysonSphereEntity();
      return; // Skip the rest of the update until we find the Dyson Sphere
    }
    
    // Try to find the game state entity if we haven't found it yet
    if (this.gameStateEntity === -1) {
      const gameStateEntities = this.world.getEntitiesWith(['GameStateDisplay']);
      if (gameStateEntities.length > 0) {
        this.gameStateEntity = gameStateEntities[0];
      }
    }
    
    // Check if the game is in the playing state
    if (this.gameStateEntity !== -1) {
      const gameStateDisplay = this.world.getComponent<GameStateDisplay>(this.gameStateEntity, 'GameStateDisplay');
      if (!gameStateDisplay || gameStateDisplay.currentState !== 'playing') {
        return; // Don't process wave logic if the game hasn't started
      }
    }
    
    const waveInfo = this.world.getComponent<WaveInfo>(this.waveEntity, 'WaveInfo');
    if (!waveInfo) return;
    
    // Count active enemies
    const activeEnemies = this.world.getEntitiesWith(['Enemy']);
    waveInfo.enemiesRemaining = activeEnemies.length;
    
    // Handle wave state
    if (!waveInfo.isActive) {
      // If no wave is active, count down to the next wave
      waveInfo.nextWaveTimer -= deltaTime;
      
      // Announce wave countdown at specific intervals
      this.handleWaveCountdown(waveInfo);
      
      if (waveInfo.nextWaveTimer <= 0) {
        this.startNextWave(waveInfo);
      }
    } else if (waveInfo.enemiesRemaining === 0 && waveInfo.totalEnemies === 0) {
      // Wave complete, prepare for the next one
      this.completeWave(waveInfo);
    } else if (waveInfo.totalEnemies > 0) {
      // Still have enemies to spawn in the current wave
      this.timeSinceLastSpawn += deltaTime;
      
      if (this.timeSinceLastSpawn >= this.spawnInterval) {
        this.spawnEnemy();
        this.timeSinceLastSpawn = 0;
        waveInfo.totalEnemies--;
      }
    }
  }
  
  private handleWaveCountdown(waveInfo: WaveInfo): void {
    // Reset announcement flags when a new countdown starts
    if (waveInfo.nextWaveTimer > 4.8 && waveInfo.currentWave > 0) {
      this.hasAnnouncedCompletion = false;
    }
    
    // Announce wave completion once when the countdown starts
    if (!this.hasAnnouncedCompletion && waveInfo.currentWave > 0) {
      if (this.hudSystem) {
        this.hudSystem.displayMessage(`WAVE ${waveInfo.currentWave} COMPLETE!`, 3);
      }
      this.hasAnnouncedCompletion = true;
    }
    
    // For first wave or when countdown is near the end
    if (waveInfo.nextWaveTimer <= 3 && !this.hasAnnouncedWave) {
      const message = waveInfo.currentWave === 0 
        ? "FIRST WAVE INCOMING!" 
        : `PREPARE FOR WAVE ${waveInfo.currentWave + 1}!`;
      
      if (this.hudSystem) {
        this.hudSystem.displayMessage(message, 3);
      }
      this.hasAnnouncedWave = true;
    }
  }
  
  private completeWave(waveInfo: WaveInfo): void {
    waveInfo.isActive = false;
    waveInfo.nextWaveTimer = 5; // 5 seconds until next wave
    this.hasAnnouncedWave = false; // Reset for next wave
  }
  
  private startNextWave(waveInfo: WaveInfo): void {
    waveInfo.currentWave++;
    waveInfo.isActive = true;
    
    // Calculate number of enemies for this wave
    // Base of 5 enemies for wave 1, then +3 per wave
    waveInfo.totalEnemies = 5 + (waveInfo.currentWave - 1) * 3;
    
    // No need to display objective message here since it's always shown in the UI
    
    // Reset announcement flags for the new wave
    this.hasAnnouncedShieldGuardian = false;
    
    // Spawn the first enemy immediately
    this.spawnEnemy();
    waveInfo.totalEnemies--;
    this.timeSinceLastSpawn = 0;
  }
  
  private spawnEnemy(): number {
    // Pick a random position on a sphere around the Dyson Sphere
    const radius = 160; // Spawn radius
    const position = this.getRandomPositionOnSphere(radius);
    
    // Create a wormhole entity first
    const wormholeEntity = createWormhole(this.world, position, this.dysonSphereEntity);
    
    // Calculate direction away from Dyson sphere (this is the direction the wormhole faces)
    const dysonPosition = this.world.getComponent<Position>(this.dysonSphereEntity, 'Position');
    if (!dysonPosition) return wormholeEntity;
    
    // Calculate normalized direction vector pointing away from Dyson sphere
    const direction = new THREE.Vector3(
      position.x - dysonPosition.x,
      position.y - dysonPosition.y,
      position.z - dysonPosition.z
    ).normalize();
    
    // Offset enemy position 8 units behind the wormhole opening (increased from 4)
    const enemyPosition = {
      x: position.x + direction.x * 8,
      y: position.y + direction.y * 8,
      z: position.z + direction.z * 8
    };
    
    // Get current wave info
    const waveInfo = this.world.getComponent<WaveInfo>(this.waveEntity, 'WaveInfo');
    let enemyEntity: number;
    
    // Shield Guardians start spawning at wave 3
    if (waveInfo && waveInfo.currentWave >= 3) {
      // Guarantee at least one shield guardian for all waves 3+
      if (!this.hasAnnouncedShieldGuardian) {
        // Spawn Shield Guardian
        enemyEntity = createShieldGuardian(this.world, enemyPosition, this.dysonSphereEntity);
        
        // Announce the shield guardian
        if (this.hudSystem) {
          this.hudSystem.displayMessage("SHIELD GUARDIAN DETECTED!", 3);
        }
        this.hasAnnouncedShieldGuardian = true;
        
        return wormholeEntity;
      }
      
      // 5% chance to spawn additional shield guardians
      const shieldGuardianChance = 0.05;
      
      if (Math.random() < shieldGuardianChance) {
        // Spawn Shield Guardian
        enemyEntity = createShieldGuardian(this.world, enemyPosition, this.dysonSphereEntity);
        return wormholeEntity;
      }
    }
    
    // Default to grunt
    enemyEntity = createGrunt(this.world, enemyPosition, this.dysonSphereEntity);
    return wormholeEntity;
  }
  
  private getRandomPositionOnSphere(radius: number): { x: number, y: number, z: number } {
    // Use spherical coordinates to get a random position on a sphere
    const theta = Math.random() * Math.PI * 2; // Random angle around the y-axis
    const phi = Math.acos((Math.random() * 2) - 1); // Random angle from the y-axis
    
    // Convert spherical to cartesian coordinates
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    return { x, y, z };
  }
  
  // Helper method to get the current wave info (can be used by UI)
  public getWaveInfo(): WaveInfo | undefined {
    return this.world.getComponent<WaveInfo>(this.waveEntity, 'WaveInfo');
  }
  
  // Reset the wave system when game is restarted
  public resetWaves(): void {
    const waveInfo = this.world.getComponent<WaveInfo>(this.waveEntity, 'WaveInfo');
    if (waveInfo) {
      waveInfo.currentWave = 0;
      waveInfo.enemiesRemaining = 0;
      waveInfo.totalEnemies = 0;
      waveInfo.nextWaveTimer = 3; // Start first wave after 3 seconds
      waveInfo.isActive = false;
    }
    this.timeSinceLastSpawn = 0;
    this.hasAnnouncedWave = false;
    this.hasAnnouncedCompletion = false;
    this.hasAnnouncedShieldGuardian = false;
  }
} 