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
  MAX_DISTANCE_FROM_CENTER 
} from './constants';

interface GameSceneProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  setShowLevelUp: React.Dispatch<React.SetStateAction<boolean>>;
  mountRef: React.RefObject<HTMLDivElement>;
}

export const GameScene: React.FC<GameSceneProps> = ({
  gameState,
  setGameState,
  setShowLevelUp,
  mountRef
}) => {
  useEffect(() => {
    if (!gameState.started || !mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000020);
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
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
    } = createGameObjects();

    scene.add(dysonSphere, core, glow, playerShip, stars);
    camera.add(reticle);
    scene.add(camera);

    // Game state
    const enemies: Enemy[] = [];
    const lasers: Laser[] = [];
    const enemyLasers: Laser[] = [];
    const keys: KeyState = {};
    let enemySpawnTimer = 0;
    let mouseDelta = new THREE.Vector2(0, 0);

    // Event handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key.toLowerCase() === 'space') {
        shootLaser(playerShip, lasers, scene);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
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
      if (!document.pointerLockElement) {
        mouseDelta.set(0, 0);
      }
    };

    // Request pointer lock on mount
    mountRef.current.addEventListener('click', () => {
      mountRef.current?.requestPointerLock();
    });

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    // Animation loop
    const clock = new THREE.Clock();
    
    function animate() {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();

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
          gameState.level
        );

        if (wasRemoved) {
          enemies.splice(i, 1);
        }
      }

      // Update projectiles
      updateLasers(lasers, enemies, scene, setGameState);
      updateEnemyLasers(enemyLasers, dysonSphere, playerShip, scene, setGameState);

      // Update player movement and camera
      updatePlayerMovement();

      renderer.render(scene, camera);
    }

    function updatePlayerMovement() {
      // Handle mouse look
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
      const speed = 0.2;
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
      
      playerShip.position.add(velocity);

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
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      
      if (mountRef.current) {
        mountRef.current?.removeEventListener('click', () => {
          mountRef.current?.requestPointerLock();
        });
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [gameState.started, gameState.level]);

  return null;
};
