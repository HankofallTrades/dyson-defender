import * as THREE from 'three';
import { Enemy, Laser, GameState } from './types';
import { Lightning } from './effects/Lightning';
import { 
  LASER_SPEED, 
  ENEMY_LASER_SPEED, 
  ENEMY_CRASH_DAMAGE, 
  ENEMY_LASER_DAMAGE,
  POINTS_PER_KILL,
  POINTS_PER_LEVEL,
  COLORS
} from './constants';

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
  leftCannonPos.applyMatrix4(playerShip.matrixWorld);
  rightCannonPos.applyMatrix4(playerShip.matrixWorld);

  leftLaser.position.copy(leftCannonPos);
  rightLaser.position.copy(rightCannonPos);

  leftLaser.scale.z = 2;
  rightLaser.scale.z = 2;

  // Direction is forward from the player view
  const forwardDir = new THREE.Vector3(0, 0, -1)
    .applyQuaternion(playerShip.quaternion);

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
  level: number
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
  const worldPos = enemy.localToWorld(laserOffset.clone());
  laser.position.copy(worldPos);

  // Calculate direction toward Dyson sphere
  const direction = new THREE.Vector3(0, 0, 0)
    .subVectors(new THREE.Vector3(), enemy.position)
    .normalize();

  scene.add(laser);
  enemyLasers.push({ mesh: laser, direction });
}

export function updateLasers(
  lasers: Laser[],
  enemies: Enemy[],
  scene: THREE.Scene,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  setShowLevelUp: React.Dispatch<React.SetStateAction<boolean>>
) {
  for (let i = lasers.length - 1; i >= 0; i--) {
    const laser = lasers[i];
    laser.mesh.position.add(
      laser.direction.clone().multiplyScalar(LASER_SPEED)
    );

    // Remove laser if it's too far
    if (laser.mesh.position.length() > 30) {
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
          // Check if we should level up
          if (newScore >= prev.level * POINTS_PER_LEVEL) {
            // Level up detected, trigger the notification
            setShowLevelUp(true);
            return {
              ...prev,
              score: newScore,
              level: prev.level + 1
            };
          }
          return { ...prev, score: newScore };
        });

        scene.remove(laser.mesh);
        lasers.splice(i, 1);

        enemy.userData.health--;

        if (enemy.userData.health <= 0) {
          // Clean up lightning effect if it exists
          if (enemy.userData.lightning) {
            enemy.userData.lightning.removeFromScene(scene);
            enemy.userData.lightning.dispose();
            enemy.userData.lightning = undefined;
          }
          scene.remove(enemy);
          enemies.splice(j, 1);
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
    if (laser.mesh.position.length() > 30) {
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
          return {
            ...prev,
            dysonsphereHealth: newHealth,
            lastHitTime: Date.now(),
            over: newHealth <= 0
          };
        }
      });

      scene.remove(laser.mesh);
      enemyLasers.splice(i, 1);
    }

    // Check for collision with player
    const playerDistance = laser.mesh.position.distanceTo(playerShip.position);
    if (playerDistance < 0.7) {
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
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) {
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
          eyesGroup.children.forEach(eye => {
            if (eye instanceof THREE.Mesh && eye.material instanceof THREE.MeshPhongMaterial) {
              eye.material.color.setHex(COLORS.ENEMY_EYES_SIEGE);
              eye.material.emissive.setHex(COLORS.ENEMY_EYES_SIEGE_EMISSIVE);
              eye.material.emissiveIntensity = 3.0;
              eye.material.needsUpdate = true;
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
  }

  // Make enemy face the Dyson sphere
  enemy.lookAt(dysonSphere.position);

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
        return {
          ...prev,
          dysonsphereHealth: newHealth,
          lastHitTime: Date.now(),
          over: newHealth <= 0
        };
      }
    });

    // Clean up lightning effect
    if (enemy.userData.lightning) {
      enemy.userData.lightning.removeFromScene(scene);
      enemy.userData.lightning.dispose();
    }
    scene.remove(enemy);
    return true; // Enemy was removed
  }

  // Update lightning and apply damage in siege mode
  if (enemy.userData.isFiringMode && enemy.userData.lightning) {
    enemy.userData.lightning.setOrigin(enemy.position.clone());
    enemy.userData.lightning.setTarget(dysonSphere.position.clone());
    enemy.userData.lightning.update(delta);

    // Apply damage more frequently with lightning
    enemy.userData.fireTimer += delta;
    if (enemy.userData.fireTimer > 0.5) { // Faster damage rate
      setGameState(prev => {
        if (prev.dysonsphereShield > 0) {
          const newShield = Math.max(0, prev.dysonsphereShield - (ENEMY_LASER_DAMAGE * 0.3));
          return {
            ...prev,
            dysonsphereShield: newShield,
            lastHitTime: Date.now()
          };
        } else {
          const newHealth = prev.dysonsphereHealth - (ENEMY_LASER_DAMAGE * 0.3);
          return {
            ...prev,
            dysonsphereHealth: newHealth,
            lastHitTime: Date.now(),
            over: newHealth <= 0
          };
        }
      });
      enemy.userData.fireTimer = 0;
    }
  } else if (!enemy.userData.isFiringMode) {
    // Regular mode: shoot lasers
    enemy.userData.fireTimer += delta;
    if (enemy.userData.fireTimer > 2.5) {
      enemyShootLaser(enemy, enemyLasers, scene, level);
      enemy.userData.fireTimer = 0;
    }
  }

  return false; // Enemy was not removed
}
