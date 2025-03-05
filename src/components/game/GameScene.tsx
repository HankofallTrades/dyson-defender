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
import { 
  BASE_SPAWN_TIME, 
  MIN_SPAWN_TIME,
  MAX_DISTANCE_FROM_CENTER,
  PLAYER_BASE_SPEED,
  PLAYER_BOOST_MULTIPLIER,
  PLAYER_MAX_BOOST_TIME,
  PLAYER_BOOST_COOLDOWN
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

  useEffect(() => {
    if (!gameState.started || !mountRef.current) return;

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
    const keys: KeyState = {};
    let enemySpawnTimer = 0;
    const mouseDelta = new THREE.Vector2(0, 0);
    let lastShootTime = 0;  // Track when the player last shot
    const SHOOT_COOLDOWN = 250;  // 250ms cooldown (twice as fast as half-second)

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

    const handleMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement) {
        const sensitivityFactor = 0.002;
        mouseDelta.x = event.movementX * sensitivityFactor;
        mouseDelta.y = event.movementY * sensitivityFactor;
      }
    };

    // Handle pointer lock change
    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement === mountRef.current;
      if (!isLocked) {
        mouseDelta.set(0, 0);
      }
      setGameState(prev => ({
        ...prev,
        pointerLocked: isLocked
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
    document.addEventListener('mousemove', handleMouseMove);
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

      // Spawn enemies
      enemySpawnTimer += delta;
      const spawnTime = Math.max(
        MIN_SPAWN_TIME, 
        BASE_SPAWN_TIME - (gameState.level * 0.3)
      );

      if (enemySpawnTimer > spawnTime) {
        const enemy = createEnemy(scene, gameState.level);
        enemies.push(enemy);
        enemySpawnTimer = 0;
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
          setGameState
        );

        if (wasRemoved) {
          enemies.splice(i, 1);
        }
      }

      // Update projectiles
      updateLasers(lasers, enemies, scene, setGameState, setShowLevelUp);
      updateEnemyLasers(enemyLasers, dysonSphere, playerShip, scene, setGameState);

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
      document.removeEventListener('mousemove', handleMouseMove);
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
    };
  }, [gameState.started]);

  return null;
};
