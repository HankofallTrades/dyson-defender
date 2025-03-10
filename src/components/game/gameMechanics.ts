import * as THREE from 'three';
import { Enemy, Laser, GameState } from './types';
import { Lightning } from './effects/Lightning';
import { Explosion as ExplosionEffect } from './effects/Explosion';
import { 
  COLORS, 
  LASER_SPEED, 
  ENEMY_LASER_SPEED, 
  ENEMY_CRASH_DAMAGE, 
  ENEMY_LASER_DAMAGE,
  PLAYER_LASER_DAMAGE,
  POINTS_PER_KILL,
  WAVE_COOLDOWN_DURATION
} from './constants';

// Helper function to handle game over state - this ensures consistency and can be expanded
function setGameOver(prevState: GameState, isOver: boolean): GameState {
  // If the game is already over, don't change the state unless explicitly reset by restart
  if (prevState.over && isOver) {
    // Game is already over, maintain the state
    console.log("Game already in 'over' state, maintaining state");
    return prevState;
  }
  
  // Only allow changing to game over if not already over
  return {
    ...prevState,
    over: isOver
  };
}

export function shootLaser(
  playerShip: THREE.Object3D,
  lasers: Laser[],
  scene: THREE.Scene
) {
  // Create laser geometry and material
  const laserGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
  laserGeometry.rotateX(Math.PI / 2);
  const laserMaterial = new THREE.MeshBasicMaterial({
    color: COLORS.PLAYER_LASER,
    transparent: true,
    opacity: 0.8
  });

  // Create two lasers (one from each cannon)
  const leftLaser = new THREE.Mesh(laserGeometry, laserMaterial);
  const rightLaser = new THREE.Mesh(laserGeometry, laserMaterial);

  // Get cannon positions in world space
  const leftCannonPos = new THREE.Vector3(-0.3, -0.1, -0.6);
  const rightCannonPos = new THREE.Vector3(0.3, -0.1, -0.6);
  
  // Create a matrix that represents the ship's current world transform
  const shipMatrix: THREE.Matrix4 = new THREE.Matrix4();
  shipMatrix.compose(
    playerShip.position.clone(),  // Ensure we have a clean copy
    playerShip.quaternion.clone(),  // Ensure we have a clean copy
    new THREE.Vector3(1, 1, 1)  // Unit scale
  );
  
  // Apply the ship's transform to get world positions
  leftCannonPos.applyMatrix4(shipMatrix);
  rightCannonPos.applyMatrix4(shipMatrix);

  leftLaser.position.copy(leftCannonPos);
  rightLaser.position.copy(rightCannonPos);

  leftLaser.scale.z = 2;
  rightLaser.scale.z = 2;

  // Direction is forward from the player view
  const forwardDir = new THREE.Vector3(0, 0, -1)
    .applyQuaternion(playerShip.quaternion)
    .normalize();

  scene.add(leftLaser);
  scene.add(rightLaser);

  // Add slight spread to lasers
  const spreadFactor = 0.01;
  const leftDir = forwardDir.clone().add(new THREE.Vector3(
    (Math.random() - 0.5) * spreadFactor,
    (Math.random() - 0.5) * spreadFactor,
    (Math.random() - 0.5) * spreadFactor
  )).normalize();

  const rightDir = forwardDir.clone().add(new THREE.Vector3(
    (Math.random() - 0.5) * spreadFactor,
    (Math.random() - 0.5) * spreadFactor,
    (Math.random() - 0.5) * spreadFactor
  )).normalize();

  // Align lasers with their directions
  leftLaser.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), leftDir);
  rightLaser.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), rightDir);

  lasers.push(
    { mesh: leftLaser, direction: leftDir },
    { mesh: rightLaser, direction: rightDir }
  );
}

export function enemyShootLaser(
  enemy: Enemy,
  enemyLasers: Laser[],
  scene: THREE.Scene,
  level: number,
  playerShip: THREE.Object3D
) {
  const laserGeom = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
  laserGeom.rotateX(Math.PI / 2);

  // Adjust laser color based on level - brighter and more orange at higher levels
  const baseColor = COLORS.ENEMY_LASER;
  const levelColor = Math.min(0xff9900, baseColor + (level * 0x001100));

  const laserMat = new THREE.MeshPhongMaterial({
    color: levelColor,
    emissive: levelColor,
    emissiveIntensity: 1.5
  });

  const laser = new THREE.Mesh(laserGeom, laserMat);

  // Position laser at the front of the enemy
  const laserOffset = new THREE.Vector3(0, 0, -0.5);
  
  // Save original rotation of enemy if not in siege mode and targeting player
  let originalRotation = null;
  if (!enemy.userData.isFiringMode) {
    // Save original rotation
    originalRotation = enemy.rotation.clone();
    
    // Temporarily face the player for more accurate aiming
    enemy.lookAt(playerShip.position);
  }
  
  const worldPos = enemy.localToWorld(laserOffset.clone());
  laser.position.copy(worldPos);

  // Calculate direction based on target (player if not in siege mode, dyson sphere if in siege mode)
  let direction;
  if (enemy.userData.isFiringMode) {
    // Target Dyson sphere in siege mode (center of the scene)
    direction = new THREE.Vector3(0, 0, 0)
      .subVectors(new THREE.Vector3(), enemy.position)
      .normalize();
  } else {
    // Target player when not in siege mode
    direction = new THREE.Vector3()
      .subVectors(playerShip.position, enemy.position)
      .normalize();
  }

  scene.add(laser);
  enemyLasers.push({ mesh: laser, direction });
  
  // Restore original rotation if it was saved
  if (originalRotation && !enemy.userData.isFiringMode) {
    // After a short delay to make the rotation change visible
    setTimeout(() => {
      if (enemy.parent) { // Check if enemy still exists
        enemy.rotation.copy(originalRotation);
      }
    }, 150);
  }
}

export function updateLasers(
  lasers: Laser[],
  enemies: Enemy[],
  scene: THREE.Scene,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  setShowLevelUp: React.Dispatch<React.SetStateAction<boolean>>,
  explosions: ExplosionEffect[] = []
) {
  for (let i = lasers.length - 1; i >= 0; i--) {
    const laser = lasers[i];
    laser.mesh.position.add(
      laser.direction.clone().multiplyScalar(LASER_SPEED)
    );

    // Remove laser if it's too far
    if (laser.mesh.position.length() > 150) {
      scene.remove(laser.mesh);
      lasers.splice(i, 1);
      continue;
    }

    // Check for collisions with enemies
    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      const distance = laser.mesh.position.distanceTo(enemy.position);

      if (distance < 1.2) { // Increased collision radius for squid aliens
        // Enemy hit
        setGameState(prev => {
          const newScore = prev.score + POINTS_PER_KILL;
          // We no longer level up based on score, but on completing waves
          return { ...prev, score: newScore };
        });

        scene.remove(laser.mesh);
        lasers.splice(i, 1);

        enemy.userData.health--;

        if (enemy.userData.health <= 0) {
          // Add balloon animation before explosion
          enemy.userData.isExploding = true;
          enemy.userData.explosionStartTime = Date.now();
          enemy.userData.explosionDuration = 300; // 300ms for the balloon effect
          
          // Store the original scale to restore it if needed
          enemy.userData.originalScale = enemy.scale.clone();
          
          // Schedule the actual explosion after the balloon effect
          setTimeout(() => {
            // Only proceed if the enemy still exists in the scene
            if (enemy.parent) {
              // Create explosion effect at enemy position with shockwave for fatal hit
              const explosion = new ExplosionEffect(
                enemy.position.clone(),
                COLORS.ENEMY_GLOW,
                1.0, // Duration in seconds
                true // Include shockwave
              );
              explosion.addToScene(scene);
              explosions.push(explosion);
              
              // Clean up lightning effect if it exists
              if (enemy.userData.lightning) {
                enemy.userData.lightning.removeFromScene(scene);
                enemy.userData.lightning.dispose();
                enemy.userData.lightning = undefined;
              }
              scene.remove(enemy);
              
              // Find and remove the enemy from the array
              const enemyIndex = enemies.findIndex(e => e === enemy);
              if (enemyIndex !== -1) {
                enemies.splice(enemyIndex, 1);
              }
              
              // Decrease the enemy count when an enemy is killed
              // This is a critical update for wave progression
              setGameState(prev => {
                const newRemainingCount = Math.max(0, prev.enemiesRemainingInWave - 1);
                console.log(`Enemy killed. Active enemies left: ${enemies.length}, Remaining to kill: ${newRemainingCount}`);
                
                // Check if this was the last enemy
                const isLastEnemy = newRemainingCount === 0;
                if (isLastEnemy) {
                  console.log("*** LAST ENEMY KILLED! Should trigger wave completion ***");
                  
                  // Directly set wave completed state if it's the last enemy and all enemies were spawned
                  if (prev.waveActive) {
                    console.log("DIRECT WAVE COMPLETION: This was the last enemy, initiating wave cooldown");
                    
                    // Also trigger the level up notification here
                    setShowLevelUp(true);
                    
                    return {
                      ...prev,
                      enemiesRemainingInWave: 0,
                      waveActive: false,
                      waveCooldown: true,
                      waveCooldownTimer: WAVE_COOLDOWN_DURATION / 1000, // Convert to seconds for countdown
                      score: prev.score + POINTS_PER_KILL
                    };
                  }
                }
                
                return {
                  ...prev,
                  enemiesRemainingInWave: newRemainingCount,
                  score: prev.score + POINTS_PER_KILL // Also update score here
                };
              });
            }
          }, enemy.userData.explosionDuration);
        } else {
          // Create a smaller hit effect for non-fatal hits without shockwave
          const hitEffect = new ExplosionEffect(
            laser.mesh.position.clone(),
            COLORS.ENEMY_GLOW,
            0.5, // Shorter duration
            false // No shockwave for non-fatal hits
          );
          hitEffect.addToScene(scene);
          explosions.push(hitEffect);
          
          // Add a quick pulse effect to the enemy
          const originalScale = enemy.scale.clone();
          const hitPulse = () => {
            // Quick expand
            enemy.scale.multiplyScalar(1.2);
            
            // Make the glow brighter
            const glowMesh = enemy.children[1] as THREE.Mesh;
            if (glowMesh && glowMesh.material instanceof THREE.MeshBasicMaterial) {
              glowMesh.material.opacity = 0.8; // Temporarily increase opacity
            }
            
            // Return to normal after a short delay
            setTimeout(() => {
              if (enemy.parent) { // Check if enemy still exists
                enemy.scale.copy(originalScale);
                
                // Reset glow
                if (glowMesh && glowMesh.material instanceof THREE.MeshBasicMaterial) {
                  glowMesh.material.opacity = 0.2 + (enemy.userData.pulseValue * 0.3);
                }
              }
            }, 100);
          };
          
          // Execute the pulse effect
          hitPulse();
        }
        break;
      }
    }
  }
}

export function updateEnemyLasers(
  enemyLasers: Laser[],
  dysonSphere: THREE.Mesh,
  playerShip: THREE.Object3D,
  scene: THREE.Scene,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) {
  for (let i = enemyLasers.length - 1; i >= 0; i--) {
    const laser = enemyLasers[i];
    laser.mesh.position.add(
      laser.direction.clone().multiplyScalar(ENEMY_LASER_SPEED)
    );

    // Rotate the laser to point in its direction of travel
    laser.mesh.lookAt(
      laser.mesh.position.clone().add(laser.direction)
    );

    // Remove laser if it's too far
    if (laser.mesh.position.length() > 60) { // Increased from 30 to 60 to exceed player's max distance (40)
      scene.remove(laser.mesh);
      enemyLasers.splice(i, 1);
      continue;
    }

    // Check for collision with Dyson sphere
    const distance = laser.mesh.position.distanceTo(dysonSphere.position);

    if (distance < 5.5) { // Slightly larger than Dyson sphere radius
      setGameState(prev => {
        if (prev.dysonsphereShield > 0) {
          // Hit shield first
          const newShield = Math.max(0, prev.dysonsphereShield - ENEMY_LASER_DAMAGE);
          return {
            ...prev,
            dysonsphereShield: newShield,
            lastHitTime: Date.now()
          };
        } else {
          // Shield depleted, damage the Dyson sphere
          const newHealth = prev.dysonsphereHealth - ENEMY_LASER_DAMAGE;
          // If health reaches 0, set game over
          if (newHealth <= 0) {
            return setGameOver({
              ...prev,
              dysonsphereHealth: newHealth,
              lastHitTime: Date.now()
            }, true);
          }
          
          return {
            ...prev,
            dysonsphereHealth: newHealth,
            lastHitTime: Date.now()
          };
        }
      });

      scene.remove(laser.mesh);
      enemyLasers.splice(i, 1);
    }

    // Check for collision with player
    const playerDistance = laser.mesh.position.distanceTo(playerShip.position);
    if (playerDistance < 0.7) {
      // Apply damage to player when hit
      setGameState(prev => {
        const newPlayerHealth = Math.max(0, prev.playerHealth - PLAYER_LASER_DAMAGE);
        
        // If player health reaches 0, set game over
        if (newPlayerHealth <= 0) {
          return setGameOver({
            ...prev,
            playerHealth: newPlayerHealth,
            lastHitTime: Date.now()
          }, true);
        }
        
        return {
          ...prev,
          playerHealth: newPlayerHealth,
          lastHitTime: Date.now()
        };
      });
      
      scene.remove(laser.mesh);
      enemyLasers.splice(i, 1);
    }
  }
}

export function updateEnemy(
  enemy: Enemy,
  delta: number,
  dysonSphere: THREE.Mesh,
  enemyLasers: Laser[],
  scene: THREE.Scene,
  level: number,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  explosions: ExplosionEffect[] = [],
  playerShip: THREE.Object3D
) {
  // Handle explosion animation if enemy is exploding
  if (enemy.userData.isExploding) {
    const elapsed = Date.now() - enemy.userData.explosionStartTime!;
    const progress = Math.min(elapsed / enemy.userData.explosionDuration!, 1.0);
    
    // Balloon effect - scale up to 1.5x original size
    const scaleFactor = 1.0 + (progress * 0.5); // Scale from 1.0 to 1.5
    enemy.scale.set(scaleFactor, scaleFactor, scaleFactor);
    
    // Also make the enemy glow brighter as it's about to explode
    const glowMesh = enemy.children[1] as THREE.Mesh;
    if (glowMesh && glowMesh.material instanceof THREE.MeshBasicMaterial) {
      glowMesh.material.opacity = 0.2 + (progress * 0.8); // Increase opacity for brighter glow
    }
    
    // No need to process other updates if exploding
    return false;
  }

  // Update pulsating glow
  const glowMesh = enemy.children[1] as THREE.Mesh;
  if (glowMesh && glowMesh.material instanceof THREE.Material) {
    enemy.userData.pulseValue += 0.03 * enemy.userData.pulseDirection;

    if (enemy.userData.pulseValue >= 1) {
      enemy.userData.pulseDirection = -1;
    } else if (enemy.userData.pulseValue <= 0) {
      enemy.userData.pulseDirection = 1;
    }

    if (glowMesh.material instanceof THREE.MeshBasicMaterial) {
      glowMesh.material.opacity = 0.2 + (enemy.userData.pulseValue * 0.3);
    }

    const pulseScale = 1 + (enemy.userData.pulseValue * 0.1);
    glowMesh.scale.set(pulseScale, pulseScale, pulseScale);

    // Add some wobble to the entire enemy based on pulse
    const wobbleAmount = 0.05;
    enemy.rotation.x = Math.sin(Date.now() * 0.002) * wobbleAmount;
    enemy.rotation.z = Math.cos(Date.now() * 0.0015) * wobbleAmount;
    
    // Pulse the eye glow for more visibility
    const head = enemy.children[0] as THREE.Mesh;
    if (head) {
      const eyesGroup = head.children.find(child => child.name === 'eyes');
      if (eyesGroup) {
        // Calculate a shared pulse value for syncing all eye effects
        const pulseValue = Math.sin(Date.now() * 0.004);
        const normalizedPulse = (pulseValue + 1) / 2; // Convert from -1..1 to 0..1 range
        
        eyesGroup.children.forEach(eye => {
          if (eye instanceof THREE.Mesh) {
            // For the actual eyes, pulse the emissive intensity
            if (eye.name === 'leftEye' || eye.name === 'rightEye') {
              if (eye.material instanceof THREE.MeshPhongMaterial) {
                // Pulse the emissive intensity with a more visible modulation
                const pulseIntensity = 2.5 + normalizedPulse * 1.2; // Ranges from 2.5 to 3.7
                eye.material.emissiveIntensity = pulseIntensity;
                eye.material.needsUpdate = true;
              }
            } 
            // For the glow meshes, pulse both opacity and scale
            else if (eye.material instanceof THREE.MeshBasicMaterial) {
              // Sync the glow opacity with eye pulsing
              const baseOpacity = 0.6;
              const pulseOpacity = baseOpacity + normalizedPulse * 0.3; // Ranges from 0.6 to 0.9
              eye.material.opacity = pulseOpacity;
              
              // Add a subtle scale pulsation to make the glow project outward as it brightens
              const baseScale = 1.0;
              const maxScaleIncrease = 0.12; // Max 12% increase in size during pulse
              const pulseScale = baseScale + normalizedPulse * maxScaleIncrease;
              
              // Apply the scale relative to the original mesh scale
              eye.scale.set(pulseScale, pulseScale, pulseScale);
              
              eye.material.needsUpdate = true;
            }
          }
        });
      }
    }
  }

  // Check distance to Dyson sphere
  const distance = enemy.position.distanceTo(dysonSphere.position);

  // If close enough, stop moving and just attack
  if (distance <= enemy.userData.attackDistance && !enemy.userData.isFiringMode) {
    // Enter siege mode
    enemy.userData.isFiringMode = true;
    
    try {
      // Initialize lightning effect
      const lightning = new Lightning(
        enemy.position.clone(),
        dysonSphere.position.clone()
      );
      lightning.addToScene(scene);
      enemy.userData.lightning = lightning;

      // Find and update eye materials - eyes are in the head's children
      const head = enemy.children[0] as THREE.Mesh;
      if (head) {
        const eyesGroup = head.children.find(child => child.name === 'eyes');
        if (eyesGroup) {
          // Set up pulsation for siege mode eyes
          const siegePulseValue = Math.sin(Date.now() * 0.005); // Slightly faster pulsation in siege mode
          const siegeNormalizedPulse = (siegePulseValue + 1) / 2; // 0..1 range
          
          eyesGroup.children.forEach(eye => {
            if (eye instanceof THREE.Mesh) {
              // Check if this is an actual eye or a glow mesh
              if (eye.name === 'leftEye' || eye.name === 'rightEye') {
                // This is an actual eye
                if (eye.material instanceof THREE.MeshPhongMaterial) {
                  eye.material.color.setHex(COLORS.ENEMY_EYES_SIEGE);
                  eye.material.emissive.setHex(COLORS.ENEMY_EYES_SIEGE_EMISSIVE);
                  
                  // Pulsating intensity between 3.5 and 5.0 for a dramatic effect
                  const siegePulseIntensity = 3.5 + siegeNormalizedPulse * 1.5;
                  eye.material.emissiveIntensity = siegePulseIntensity;
                  
                  eye.material.needsUpdate = true;
                }
              } else {
                // This is a glow mesh
                if (eye.material instanceof THREE.MeshBasicMaterial) {
                  // Make the glow bright red to match the eye
                  eye.material.color.setHex(COLORS.ENEMY_EYES_SIEGE_EMISSIVE);
                  
                  // Pulsating opacity between 0.7 and 1.0
                  const siegeGlowOpacity = 0.7 + siegeNormalizedPulse * 0.3;
                  eye.material.opacity = siegeGlowOpacity;
                  
                  // Pulsating scale for a more dramatic effect
                  const siegeGlowScale = 1.0 + siegeNormalizedPulse * 0.25; // Up to 25% increase
                  eye.scale.set(siegeGlowScale, siegeGlowScale, siegeGlowScale);
                  
                  eye.material.needsUpdate = true;
                }
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error entering siege mode:', error);
    }
  }

  // Move enemy toward Dyson sphere only if not in firing mode
  if (!enemy.userData.isFiringMode) {
    const direction = new THREE.Vector3()
      .subVectors(dysonSphere.position, enemy.position)
      .normalize();
    enemy.position.add(direction.multiplyScalar(enemy.userData.speed));
    
    // Make enemy face the player instead of the Dyson sphere when not in siege mode
    enemy.lookAt(playerShip.position);
  } else {
    // Make enemy face the Dyson sphere when in siege mode
    enemy.lookAt(dysonSphere.position);
  }

  // Check if enemy reached Dyson sphere
  if (distance < 6) {
    // Enemy crashed into Dyson sphere
    setGameState(prev => {
      if (prev.dysonsphereShield > 0) {
        const newShield = Math.max(0, prev.dysonsphereShield - ENEMY_CRASH_DAMAGE);
        return {
          ...prev,
          dysonsphereShield: newShield,
          lastHitTime: Date.now()
        };
      } else {
        const newHealth = prev.dysonsphereHealth - ENEMY_CRASH_DAMAGE;
        // If health reaches 0, set game over
        if (newHealth <= 0) {
          return setGameOver({
            ...prev,
            dysonsphereHealth: newHealth,
            lastHitTime: Date.now()
          }, true);
        }
        
        return {
          ...prev,
          dysonsphereHealth: newHealth,
          lastHitTime: Date.now()
        };
      }
    });

    // Add balloon animation before explosion
    enemy.userData.isExploding = true;
    enemy.userData.explosionStartTime = Date.now();
    enemy.userData.explosionDuration = 200; // Faster for crash (200ms)
    enemy.userData.originalScale = enemy.scale.clone();
    
    // Schedule the actual explosion after the balloon effect
    setTimeout(() => {
      // Only proceed if the enemy still exists in the scene
      if (enemy.parent) {
        // Create explosion effect for the crash
        const crashExplosion = new ExplosionEffect(
          enemy.position.clone(),
          COLORS.ENEMY_GLOW,
          1.2, // Slightly longer duration for crash
          true // Include shockwave
        );
        crashExplosion.addToScene(scene);
        explosions.push(crashExplosion);

        // Clean up lightning effect
        if (enemy.userData.lightning) {
          enemy.userData.lightning.removeFromScene(scene);
          enemy.userData.lightning.dispose();
        }
        scene.remove(enemy);
      }
    }, enemy.userData.explosionDuration);
    
    return true; // Enemy was removed (will be removed after animation)
  }

  // Update lightning and apply damage in siege mode
  if (enemy.userData.isFiringMode && enemy.userData.lightning) {
    enemy.userData.lightning.setOrigin(enemy.position.clone());
    enemy.userData.lightning.setTarget(dysonSphere.position.clone());
    enemy.userData.lightning.update(delta);

    // Apply damage more frequently with lightning
    enemy.userData.fireTimer += delta;
    if (enemy.userData.fireTimer > 0.3) { // Increased fire rate from 0.5 to 0.3
      setGameState(prev => {
        if (prev.dysonsphereShield > 0) {
          // Double damage to shield with lightning (2.0 multiplier instead of 0.3)
          const newShield = Math.max(0, prev.dysonsphereShield - (ENEMY_LASER_DAMAGE * 2.0));
          return {
            ...prev,
            dysonsphereShield: newShield,
            lastHitTime: Date.now()
          };
        } else {
          // Normal damage to core health (0.3 multiplier unchanged)
          const newHealth = prev.dysonsphereHealth - (ENEMY_LASER_DAMAGE * 0.3);
          // If health reaches 0, set game over
          if (newHealth <= 0) {
            return setGameOver({
              ...prev,
              dysonsphereHealth: newHealth,
              lastHitTime: Date.now()
            }, true);
          }
          
          return {
            ...prev,
            dysonsphereHealth: newHealth,
            lastHitTime: Date.now()
          };
        }
      });
      enemy.userData.fireTimer = 0;
    }
  } else if (!enemy.userData.isFiringMode) {
    // Regular mode: shoot lasers
    enemy.userData.fireTimer += delta;
    
    // Check if enough time has passed since spawn (0.3 seconds)
    const timeSinceSpawn = Date.now() - enemy.userData.spawnTime;
    const canFire = timeSinceSpawn >= 300; // 300ms = 0.3 seconds
    
    if (canFire && enemy.userData.fireTimer > 1.5 && distance <= enemy.userData.firingRange) {  // Increased fire rate from 2.5 to 1.5
      enemyShootLaser(enemy, enemyLasers, scene, level, playerShip);
      enemy.userData.fireTimer = 0;
    }
  }

  return false; // Enemy was not removed
}
