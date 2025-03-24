import { World, System } from '../World';
import { WaveInfo, Enemy, Renderable } from '../components';
import { createGrunt } from '../entities/GruntEntity';
import * as THREE from 'three';

export class WaveSystem implements System {
  private dysonSphereEntity: number = -1; // Initialize with invalid entity ID
  private waveEntity: number;
  private timeSinceLastSpawn: number = 0;
  private spawnInterval: number = 1.5; // Time between spawns within a wave
  
  constructor(private world: World) {
    // Create a special entity just to hold the wave information
    this.waveEntity = this.world.createEntity();
    this.world.addComponent(this.waveEntity, 'WaveInfo', {
      currentWave: 0,
      enemiesRemaining: 0,
      totalEnemies: 0,
      nextWaveTimer: 3, // Start first wave after 3 seconds
      isActive: false
    });
    
    // Find the Dyson Sphere entity
    const dysonSpheres = this.world.getEntitiesWith(['Renderable', 'Health']);
    
    for (const entity of dysonSpheres) {
      const renderable = this.world.getComponent<Renderable>(entity, 'Renderable');
      if (renderable?.modelId === 'dysonSphere') {
        this.dysonSphereEntity = entity;
        break;
      }
    }
  }
  
  update(deltaTime: number): void {
    // Skip if we couldn't find the Dyson Sphere
    if (this.dysonSphereEntity === -1) return;
    
    const waveInfo = this.world.getComponent<WaveInfo>(this.waveEntity, 'WaveInfo');
    if (!waveInfo) return;
    
    // Count active enemies
    const activeEnemies = this.world.getEntitiesWith(['Enemy']);
    waveInfo.enemiesRemaining = activeEnemies.length;
    
    // Handle wave state
    if (!waveInfo.isActive) {
      // If no wave is active, count down to the next wave
      waveInfo.nextWaveTimer -= deltaTime;
      
      if (waveInfo.nextWaveTimer <= 0) {
        this.startNextWave(waveInfo);
      }
    } else if (waveInfo.enemiesRemaining === 0 && waveInfo.totalEnemies === 0) {
      // Wave complete, prepare for the next one
      waveInfo.isActive = false;
      waveInfo.nextWaveTimer = 5; // 5 seconds until next wave
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
  
  private startNextWave(waveInfo: WaveInfo): void {
    waveInfo.currentWave++;
    waveInfo.isActive = true;
    
    // Calculate number of enemies for this wave
    // Base of 5 enemies for wave 1, then +3 per wave
    waveInfo.totalEnemies = 5 + (waveInfo.currentWave - 1) * 3;
    
    // Spawn the first enemy immediately
    this.spawnEnemy();
    waveInfo.totalEnemies--;
    this.timeSinceLastSpawn = 0;
  }
  
  private spawnEnemy(): void {
    // Pick a random position on a sphere around the Dyson Sphere
    const radius = 160; // Doubled spawn radius from 80 to 160
    const position = this.getRandomPositionOnSphere(radius);
    
    // Create the enemy entity
    createGrunt(this.world, position, this.dysonSphereEntity);
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
} 