import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GameState, Enemy, Laser, KeyState } from './types';
import { createGameObjects, createEnemy } from './gameObjects';
import { 
  shootLaser, 
  updateLasers, 
  updateEnemyLasers, 
  updateEnemy 
} from './gameMechanics';
import { Explosion } from './effects/Explosion';
import { Wormhole } from './effects/Wormhole';
import { preloadSounds, unlockAudio } from './utils/soundEffects';
import { 
  BASE_SPAWN_TIME, 
  MIN_SPAWN_TIME,
  MAX_DISTANCE_FROM_CENTER,
  PLAYER_BASE_SPEED,
  PLAYER_BOOST_MULTIPLIER,
  PLAYER_MAX_BOOST_TIME,
  PLAYER_BOOST_COOLDOWN,
  ENEMIES_PER_WAVE_BASE,
  ENEMIES_PER_WAVE_INCREASE,
  WAVE_COOLDOWN_DURATION,
  MAX_ACTIVE_ENEMIES,
  SPAWN_TIME_DECREASE_PER_LEVEL,
  ENEMY_SPAWN_DISTANCE,
  COLORS
} from './constants';

interface GameSceneProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  setShowLevelUp: React.Dispatch<React.SetStateAction<boolean>>;
  mountRef: React.RefObject<HTMLDivElement | null>;
}

export const GameScene: React.FC<GameSceneProps> = ({
  gameState,
  setGameState,
  setShowLevelUp,
  mountRef
}) => {
  // Create a simple, direct boost state manager
  const boostManager = useRef({
    // Core state
    active: false,
    remaining: PLAYER_MAX_BOOST_TIME,
    cooldown: 0,
    
    // Last frame time for delta calculation
    lastFrameTime: 0,
    
    // Methods to manage boost state
    update: function(currentTime: number) {
      // Calculate delta time
      const delta = this.lastFrameTime === 0 ? 0.016 : Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
      this.lastFrameTime = currentTime;
      
      // Handle cooldown
      if (this.cooldown > 0) {
        // Update cooldown
        this.cooldown = Math.max(0, this.cooldown - delta);
        
        // Refill boost based on cooldown progress
        if (this.cooldown > 0) {
          const progress = 1 - (this.cooldown / PLAYER_BOOST_COOLDOWN);
          this.remaining = progress * PLAYER_MAX_BOOST_TIME;
        } else {
          // Cooldown complete
          this.remaining = PLAYER_MAX_BOOST_TIME;
        }
        
        // Ensure boost is not active during cooldown
        this.active = false;
        return;
      }
      
      // Handle active boost
      if (this.active) {
        // Deplete boost
        this.remaining = Math.max(0, this.remaining - delta);
        
        // Check if depleted
        if (this.remaining <= 0) {
          this.active = false;
          this.cooldown = PLAYER_BOOST_COOLDOWN;
        }
      }
    },
    
    // Activate boost if possible
    activate: function() {
      if (this.remaining > 0 && this.cooldown <= 0 && !this.active) {
        this.active = true;
        return true;
      }
      return false;
    },
    
    // Deactivate boost and start cooldown if needed
    deactivate: function() {
      if (this.active) {
        this.active = false;
        if (this.remaining < PLAYER_MAX_BOOST_TIME) {
          this.cooldown = PLAYER_BOOST_COOLDOWN;
        }
        return true;
      }
      return false;
    },
    
    // Get current state for React
    getState: function() {
      return {
        boostActive: this.active,
        boostRemaining: this.remaining,
        boostCooldown: this.cooldown
      };
    }
  }).current;

  // Add a ref to track enemy spawning for the current wave
  const waveManager = useRef({
    spawnedEnemiesCount: 0,
    waveLimit: ENEMIES_PER_WAVE_BASE,
    reset: function(limit: number) {
      this.spawnedEnemiesCount = 0;
      this.waveLimit = limit;
      console.log(`Wave manager reset. New wave limit: ${limit}`);
    }
  });

  // Monitor changes in enemiesRemainingInWave to help with debugging
  useEffect(() => {
    if (gameState.started && !gameState.over) {
      console.log(`enemiesRemainingInWave changed to: ${gameState.enemiesRemainingInWave}`);
      
      // If all enemies are killed, double-check wave completion
      if (gameState.enemiesRemainingInWave === 0 && gameState.waveActive) {
        console.log(`All enemies killed! FORCE CHECKING WAVE COMPLETION. Wave active: ${gameState.waveActive}, Enemies: ${waveManager.current.spawnedEnemiesCount}/${waveManager.current.waveLimit}`);
        
        // Force wave completion if all enemies were spawned
        if (waveManager.current.spawnedEnemiesCount >= waveManager.current.waveLimit) {
          console.log("Explicitly triggering wave completion because all enemies are killed!");
          // Wave completed, start cooldown
          setGameState(prev => ({
            ...prev,
            waveActive: false,
            waveCooldown: true,
            waveCooldownTimer: WAVE_COOLDOWN_DURATION / 1000 // Convert to seconds for countdown
          }));
        }
      }
    }
  }, [gameState.enemiesRemainingInWave, gameState.started, gameState.over, gameState.waveActive]);

  // Add a dedicated effect to handle the wave cooldown timer
  useEffect(() => {
    if (!gameState.started || gameState.over) return;
    
    // Only run this effect when the wave cooldown is active
    if (!gameState.waveCooldown) return;
    
    console.log(`Wave cooldown active: ${gameState.waveCooldownTimer.toFixed(1)}s remaining`);
    
    // Set up an interval to update the timer every 100ms
    const timerInterval = setInterval(() => {
      setGameState(prev => {
        // Update the timer by 0.1 seconds
        const newTimer = Math.max(0, prev.waveCooldownTimer - 0.1);
        
        // If the timer reaches zero, start the next wave
        if (newTimer <= 0) {
          const nextLevel = prev.level + 1;
          const enemiesInNextWave = ENEMIES_PER_WAVE_BASE + (nextLevel - 1) * ENEMIES_PER_WAVE_INCREASE;
          
          // Reset the wave manager for the new wave
          waveManager.current.reset(enemiesInNextWave);
          
          console.log(`STARTING NEXT WAVE! Level ${nextLevel} with ${enemiesInNextWave} enemies`);
          
          return {
            ...prev,
            level: nextLevel,
            waveActive: true,
            waveCooldown: false,
            enemiesRemainingInWave: enemiesInNextWave,
            totalEnemiesInWave: enemiesInNextWave,
            waveCooldownTimer: 0
          };
        }
        
        // Otherwise just update the timer
        return {
          ...prev,
          waveCooldownTimer: newTimer
        };
      });
    }, 100);
    
    return () => clearInterval(timerInterval);
  }, [gameState.started, gameState.over, gameState.waveCooldown]);

  useEffect(() => {
    if (!gameState.started || !mountRef.current) return;

    // Preload sound effects
    preloadSounds();
    
    // Attempt to unlock audio immediately
    unlockAudio();
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000020);
    
    // Camera setup with narrower FOV for better aiming
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create game objects
    const {
      dysonSphere,
      core,
      glow,
      playerShip,
      stars,
      reticle
    } = createGameObjects(gameState.playerPosition, gameState.playerRotation);

    scene.add(dysonSphere, core, glow, playerShip, stars);
    camera.add(reticle);
    scene.add(camera);

    // Game state
    const enemies: Enemy[] = [];
    const lasers: Laser[] = [];
    const enemyLasers: Laser[] = [];
    const explosions: Explosion[] = [];
    const wormholes: Wormhole[] = []; // Track active wormholes
    const keys: KeyState = {};
    let enemySpawnTimer = 0;
    const mouseDelta = new THREE.Vector2(0, 0);
    let lastShootTime = 0;  // Track when the player last shot
    const SHOOT_COOLDOWN = 250;  // 250ms cooldown (twice as fast as half-second)

    // Reset wave manager when the level changes
    waveManager.current.reset(
      ENEMIES_PER_WAVE_BASE + (gameState.level - 1) * ENEMIES_PER_WAVE_INCREASE
    );
    console.log(`Game started/reset. Level: ${gameState.level}, Wave limit: ${waveManager.current.waveLimit}`);

    // Event handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (!keys[key]) {
        keys[key] = true;
        
        // Handle boost activation when shift is pressed
        if (key === 'shift') {
          if (boostManager.activate()) {
            console.log('Boost activated!');
            // Update React state
            setGameState(prev => ({
              ...prev,
              boostActive: true
            }));
          }
        }
        
        // Unlock audio on user input
        unlockAudio();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keys[key] = false;
      
      // Handle boost deactivation when shift is released
      if (key === 'shift') {
        if (boostManager.deactivate()) {
          console.log('Boost deactivated!');
          // Update React state with the current boost state
          setGameState(prev => ({
            ...prev,
            ...boostManager.getState()
          }));
        }
      }
    };

    // Handle mouse movement - now only attached when pointer is locked
    const handleMouseMove = (event: MouseEvent) => {
      // Store mouse delta for smoother rotation in the next frame
      mouseDelta.x = event.movementX * 0.002;
      mouseDelta.y = event.movementY * 0.002;
    };

    // Handle pointer lock change
    const handlePointerLockChange = () => {
      const locked = document.pointerLockElement === mountRef.current;
      if (locked) {
        document.addEventListener('mousemove', handleMouseMove);
        // Unlock audio when the user clicks to start the game
        unlockAudio();
      } else {
        document.removeEventListener('mousemove', handleMouseMove);
        mouseDelta.set(0, 0); // Reset delta when pointer is unlocked
      }
      setGameState(prev => ({
        ...prev,
        pointerLocked: locked
      }));
    };

    // Handle pointer lock error
    const handlePointerLockError = () => {
      console.error('Pointer lock failed');
      setGameState(prev => ({
        ...prev,
        pointerLocked: false
      }));
    };

    // Request pointer lock on mount
    const requestPointerLock = () => {
      mountRef.current?.requestPointerLock();
    };

    // Only add click listener for re-locking
    mountRef.current.addEventListener('click', requestPointerLock);

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', handlePointerLockError);

    // Animation loop
    const clock = new THREE.Clock();
    // Start the clock immediately to avoid large initial delta
    clock.start();
    let lastTime = clock.getElapsedTime();
    let animationFrameId: number;
    let frameCount = 0;
    
    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      
      // Safety check: if game is over, don't proceed with updates
      if (gameState.over) {
        console.log("Game over detected in animation loop - suspending game updates");
        // Still render the scene but don't update game state
        renderer.render(scene, camera);
        return;
      }
      
      // Debug output every 10 seconds to track all relevant values
      if (frameCount % 600 === 0) { // Assuming 60fps, log every 10 seconds
        console.log(`DEBUG - Wave system state - Level: ${gameState.level}`);
        console.log(`- Wave active: ${gameState.waveActive}, Wave cooldown: ${gameState.waveCooldown}`);
        console.log(`- Spawned: ${waveManager.current.spawnedEnemiesCount}/${waveManager.current.waveLimit}`);
        console.log(`- Remaining: ${gameState.enemiesRemainingInWave}, Active enemies: ${enemies.length}`);
        console.log(`- All spawned: ${waveManager.current.spawnedEnemiesCount >= waveManager.current.waveLimit}`);
        console.log(`- No active enemies: ${enemies.length === 0}`);
        console.log(`- No remaining: ${gameState.enemiesRemainingInWave <= 0}`);
        
        if (gameState.waveCooldown) {
          console.log(`- Wave cooldown timer: ${gameState.waveCooldownTimer.toFixed(1)}s`);
        }
      }
      
      // Update boost manager with current time
      boostManager.update(Date.now());
      
      // Update React state with boost state if needed
      const boostState = boostManager.getState();
      if (boostState.boostActive !== gameState.boostActive || 
          Math.abs(boostState.boostRemaining - gameState.boostRemaining) > 0.01 ||
          Math.abs(boostState.boostCooldown - gameState.boostCooldown) > 0.01) {
        setGameState(prev => ({
          ...prev,
          ...boostState
        }));
      }
      
      // Calculate delta time manually
      const currentTime = clock.getElapsedTime();
      const delta = Math.min(currentTime - lastTime, 0.1);
      lastTime = currentTime;

      // Update game objects
      dysonSphere.rotation.x += delta * 0.1;
      dysonSphere.rotation.y += delta * 0.15;
      core.rotation.y -= delta * 0.05;

      // Wave-based enemy spawning system
      if (gameState.waveActive) {
        // Log current state at regular intervals for debugging
        if (frameCount % 60 === 0) { // Log once per second at 60fps
          console.log(`Wave state: Level ${gameState.level}, Spawned: ${waveManager.current.spawnedEnemiesCount}/${waveManager.current.waveLimit}, Remaining: ${gameState.enemiesRemainingInWave}, Active enemies: ${enemies.length}`);
        }
        
        // Only spawn enemies if we haven't reached the wave limit
        // AND we haven't reached the maximum active enemies limit
        const spawnedCount = waveManager.current.spawnedEnemiesCount;
        const waveLimit = waveManager.current.waveLimit;
        
        if (spawnedCount < waveLimit && enemies.length < MAX_ACTIVE_ENEMIES) {
          enemySpawnTimer += delta;
          const spawnTime = Math.max(
            MIN_SPAWN_TIME, 
            BASE_SPAWN_TIME - (gameState.level * SPAWN_TIME_DECREASE_PER_LEVEL)
          );

          if (enemySpawnTimer > spawnTime) {
            // Create spawn position for enemy
            const angle = Math.random() * Math.PI * 2;
            const distance = ENEMY_SPAWN_DISTANCE + Math.random() * 10;
            
            const x = Math.sin(angle) * distance;
            const y = (Math.random() - 0.5) * distance;
            const z = Math.cos(angle) * distance;
            
            const spawnPosition = new THREE.Vector3(x, y, z);
            
            // Create wormhole effect
            const wormhole = new Wormhole(
              spawnPosition,
              new THREE.Vector3(0, 0, 0), // Dyson sphere position (center of the scene)
              1.2, // Size the wormhole should grow to
              1.5, // Duration in seconds
              COLORS.ENEMY_GLOW // Color of the wormhole
            );
            wormhole.addToScene(scene);
            
            // Create the enemy (initially invisible)
            const enemy = createEnemy(scene, gameState.level, false); // Pass false to make it initially invisible
            enemy.position.copy(spawnPosition);
            enemies.push(enemy);
            
            // Link the enemy to the wormhole
            wormhole.setEnemyMesh(enemy);
            
            // Add to wormholes array
            wormholes.push(wormhole);
            
            enemySpawnTimer = 0;
            
            // Increment the spawned count directly
            waveManager.current.spawnedEnemiesCount++;
            console.log(`Spawned enemy ${waveManager.current.spawnedEnemiesCount}/${waveLimit}. Active enemies: ${enemies.length}`);
          }
        }
        
        // Enhanced wave completion check
        // Check if all enemies in this wave have been killed
        // This is a critical condition for wave progression
        const allEnemiesSpawned = waveManager.current.spawnedEnemiesCount >= waveManager.current.waveLimit;
        const noActiveEnemies = enemies.length === 0;
        const noRemainingEnemies = gameState.enemiesRemainingInWave <= 0;
        
        // Log every 60 frames or when any condition changes
        if (frameCount % 60 === 0 || 
            (allEnemiesSpawned && (noActiveEnemies || noRemainingEnemies !== (gameState.enemiesRemainingInWave <= 0)))) {
          console.log(`Wave completion check: All spawned: ${allEnemiesSpawned}, No active: ${noActiveEnemies}, No remaining: ${noRemainingEnemies}, Enemies left: ${gameState.enemiesRemainingInWave}`);
        }
        
        // Safety check: If enemiesRemainingInWave is 0, all enemies have been spawned, and there are no active enemies,
        // but wave is still active, force the wave to complete
        if (gameState.enemiesRemainingInWave === 0 && 
            waveManager.current.spawnedEnemiesCount >= waveManager.current.waveLimit && 
            enemies.length === 0 && 
            frameCount % 30 === 0) { // Check every half second
          console.log("SAFETY CHECK: Wave conditions met but wave still active. Forcing completion...");
          setGameState(prev => ({
            ...prev,
            waveActive: false,
            waveCooldown: true,
            waveCooldownTimer: WAVE_COOLDOWN_DURATION / 1000
          }));
        }
        
        // Use a more reliable check to see if the wave is complete
        // We only need to check if all enemies have been spawned and if there are no active enemies
        if (allEnemiesSpawned && noActiveEnemies) {
          // Fix counter if needed - this ensures the state is consistent
          if (!noRemainingEnemies) {
            console.log(`FIXING MISMATCH: All enemies appear to be killed but counter is ${gameState.enemiesRemainingInWave}. Setting to 0...`);
            setGameState(prev => ({
              ...prev,
              enemiesRemainingInWave: 0
            }));
          } else {
            console.log(`Wave ${gameState.level} completed! ALL CONDITIONS MET. Moving to next wave.`);
            // Wave completed, start cooldown
            setGameState(prev => ({
              ...prev,
              waveActive: false,
              waveCooldown: true,
              waveCooldownTimer: WAVE_COOLDOWN_DURATION / 1000 // Convert to seconds for countdown
            }));
            
            // Show level up notification immediately when wave is completed
            setShowLevelUp(true);
          }
        }
      } else if (gameState.waveCooldown) {
        // Wave cooldown is now handled by a dedicated useEffect
        // Log wave cooldown progress if needed
        if (frameCount % 60 === 0) {
          console.log(`Wave cooldown in animation loop: ${gameState.waveCooldownTimer.toFixed(1)}s remaining`);
        }
      }

      // Update enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const wasRemoved = updateEnemy(
          enemy,
          delta,
          dysonSphere,
          enemyLasers,
          scene,
          gameState.level,
          setGameState,
          explosions,
          playerShip
        );

        if (wasRemoved) {
          enemies.splice(i, 1);
        }
      }

      // Update projectiles
      updateLasers(lasers, enemies, scene, setGameState, setShowLevelUp, explosions);
      updateEnemyLasers(enemyLasers, dysonSphere, playerShip, scene, setGameState);

      // Update explosions
      for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].update();
        if (explosions[i].isFinished()) {
          explosions[i].removeFromScene();
          explosions.splice(i, 1);
        }
      }
      
      // Update wormholes
      for (let i = wormholes.length - 1; i >= 0; i--) {
        wormholes[i].update();
        if (wormholes[i].isFinished()) {
          wormholes[i].removeFromScene();
          wormholes[i].dispose();
          wormholes.splice(i, 1);
        }
      }

      // Update player movement
      if (Math.abs(mouseDelta.x) > 0 || Math.abs(mouseDelta.y) > 0) {
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(playerShip.quaternion);
        
        euler.y -= mouseDelta.x;
        euler.x -= mouseDelta.y;
        
        euler.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, euler.x));
        
        playerShip.quaternion.setFromEuler(euler);
        mouseDelta.set(0, 0);
      }

      // Handle keyboard movement
      // Use the boost manager to determine if boost is active
      const isBoostActive = boostManager.active && keys['shift'];
      const speed = PLAYER_BASE_SPEED * (isBoostActive ? PLAYER_BOOST_MULTIPLIER : 1.0);
      const velocity = new THREE.Vector3();
      
      const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(playerShip.quaternion);
      const rightDir = new THREE.Vector3(1, 0, 0).applyQuaternion(playerShip.quaternion);
      const upDir = new THREE.Vector3(0, 1, 0).applyQuaternion(playerShip.quaternion);
      
      if (keys['w'] || keys['arrowup']) velocity.add(forwardDir.clone().multiplyScalar(speed));
      if (keys['s'] || keys['arrowdown']) velocity.add(forwardDir.clone().multiplyScalar(-speed));
      if (keys['a'] || keys['arrowleft']) velocity.add(rightDir.clone().multiplyScalar(-speed));
      if (keys['d'] || keys['arrowright']) velocity.add(rightDir.clone().multiplyScalar(speed));
      if (keys['q']) velocity.add(upDir.clone().multiplyScalar(-speed));
      if (keys['e']) velocity.add(upDir.clone().multiplyScalar(speed));
      
      // Check for shooting
      if ((keys[' '] || keys['space']) && Date.now() - lastShootTime >= SHOOT_COOLDOWN) {
        shootLaser(playerShip, lasers, scene);
        lastShootTime = Date.now();
      }
      
      playerShip.position.add(velocity);
      
      // Update player position and rotation in game state
      setGameState(prev => ({
        ...prev,
        playerPosition: playerShip.position.clone(),
        playerRotation: playerShip.rotation.clone()
      }));

      // Add visual effect for boost
      if (boostManager.active) {
        // Find the player ship body (first child)
        const shipBody = playerShip.children[0];
        if (shipBody && shipBody instanceof THREE.Mesh && shipBody.material instanceof THREE.MeshPhongMaterial) {
          // Pulse the emissive intensity for a boost effect
          const pulseValue = (Math.sin(Date.now() * 0.01) + 1) * 0.5;
          shipBody.material.emissive.setHex(0x00ffff);
          shipBody.material.emissiveIntensity = 0.5 + pulseValue * 0.5;
          
          // Make ship slightly larger during boost for visual feedback
          shipBody.scale.set(1.1, 1.1, 1.1);
        }
      } else {
        // Reset visual effect when not boosting
        const shipBody = playerShip.children[0];
        if (shipBody && shipBody instanceof THREE.Mesh && shipBody.material instanceof THREE.MeshPhongMaterial) {
          shipBody.material.emissiveIntensity = 0;
          shipBody.scale.set(1.0, 1.0, 1.0);
        }
      }

      // Keep player within bounds
      const distanceToDyson = playerShip.position.length();
      if (distanceToDyson > MAX_DISTANCE_FROM_CENTER) {
        const pullDirection = playerShip.position.clone().negate().normalize();
        playerShip.position.add(pullDirection.multiplyScalar(0.1));
      }

      // Update camera position and hide player ship in first-person
      const cameraOffset = new THREE.Vector3(0, 0.3, 0);
      const cameraPosition = playerShip.position.clone().add(
        cameraOffset.clone().applyQuaternion(playerShip.quaternion)
      );
      
      camera.position.copy(cameraPosition);
      camera.quaternion.copy(playerShip.quaternion);
      
      // Hide player ship in first-person view
      playerShip.visible = false;

      renderer.render(scene, camera);

      frameCount++;
    }

    // Start animation
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      // Remove event listeners
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('pointerlockerror', handlePointerLockError);
      
      // Clean up game objects
      enemies.forEach(enemy => {
        if (enemy.userData.lightning) {
          enemy.userData.lightning.removeFromScene(scene);
          enemy.userData.lightning.dispose();
          delete enemy.userData.lightning;
        }
        scene.remove(enemy);
      });
      
      // Clean up lasers - simpler version
      lasers.forEach(laser => scene.remove(laser.mesh));
      enemyLasers.forEach(laser => scene.remove(laser.mesh));
      
      // Clean up explosions
      explosions.forEach(explosion => {
        explosion.removeFromScene();
      });
      
      // Clean up wormholes
      wormholes.forEach(wormhole => {
        wormhole.removeFromScene();
        wormhole.dispose();
      });
      
      // Clean up THREE.js resources
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else if (object.material) {
            object.material.dispose();
          }
        }
      });
      
      // Clean up renderer and mount point
      if (mountRef.current) {
        mountRef.current.removeEventListener('click', requestPointerLock);
        if (renderer.domElement.parentNode === mountRef.current) {
          mountRef.current.removeChild(renderer.domElement);
        }
      }
      
      renderer.dispose();
      scene.clear();

      // Make sure to remove the mousemove listener if it's still attached
      if (document.pointerLockElement === mountRef.current) {
        document.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [gameState.started, gameState.level, setGameState, setShowLevelUp, mountRef]);

  return null;
};
