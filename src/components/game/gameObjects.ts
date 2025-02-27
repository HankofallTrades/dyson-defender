import * as THREE from 'three';
import { Enemy } from './types';
import { COLORS, BASE_ENEMY_SPEED, SPEED_INCREASE_PER_LEVEL, ENEMY_SPAWN_DISTANCE } from './constants';

export function createGameObjects() {
  // Dyson Sphere
  const dysonSphereGeometry = new THREE.IcosahedronGeometry(5, 2);
  const dysonSphereMaterial = new THREE.MeshPhongMaterial({
    color: COLORS.DYSON_SPHERE,
    emissive: COLORS.DYSON_SPHERE_EMISSIVE,
    wireframe: true,
    transparent: true,
    opacity: 0.7
  });
  const dysonSphere = new THREE.Mesh(dysonSphereGeometry, dysonSphereMaterial);

  // Core (White Dwarf star)
  const coreGeometry = new THREE.SphereGeometry(4, 32, 32);
  const coreMaterial = new THREE.MeshPhongMaterial({
    color: COLORS.CORE,
    emissive: COLORS.CORE_EMISSIVE,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.9
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);

  // Core glow effect
  const glowGeometry = new THREE.SphereGeometry(4.2, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: COLORS.CORE_GLOW,
    transparent: true,
    opacity: 0.4,
    side: THREE.BackSide
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);

  // Player ship
  const playerShip = createPlayerShip();

  // Stars background
  const stars = createStarfield();

  // Reticle
  const reticle = createReticle();

  return {
    dysonSphere,
    core,
    glow,
    playerShip,
    stars,
    reticle
  };
}

function createPlayerShip() {
  const ship = new THREE.Group();

  // Main body
  const bodyGeometry = new THREE.ConeGeometry(0.5, 1.5, 4);
  bodyGeometry.rotateX(Math.PI / 2);
  const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  ship.add(body);

  // Cannons
  const cannons = createShipCannons();
  cannons.forEach(cannon => ship.add(cannon));

  ship.position.set(0, 0, 10);
  return ship;
}

function createShipCannons() {
  const cannonGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 16);
  const cannonMaterial = new THREE.MeshPhongMaterial({
    color: 0x666666,
    shininess: 30,
    specular: 0x333333
  });
  const baseGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16);
  const baseMaterial = new THREE.MeshPhongMaterial({
    color: 0x444444,
    shininess: 50,
    specular: 0x222222
  });

  const cannons = [];

  // Left cannon
  const leftCannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
  leftCannon.rotation.x = Math.PI / 2;
  leftCannon.position.set(-0.3, -0.1, -0.6);
  cannons.push(leftCannon);

  // Right cannon
  const rightCannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
  rightCannon.rotation.x = Math.PI / 2;
  rightCannon.position.set(0.3, -0.1, -0.6);
  cannons.push(rightCannon);

  // Cannon bases
  const leftBase = new THREE.Mesh(baseGeometry, baseMaterial);
  leftBase.position.set(-0.3, -0.1, -0.3);
  leftBase.rotation.x = Math.PI / 2;
  cannons.push(leftBase);

  const rightBase = new THREE.Mesh(baseGeometry, baseMaterial);
  rightBase.position.set(0.3, -0.1, -0.3);
  rightBase.rotation.x = Math.PI / 2;
  cannons.push(rightBase);

  return cannons;
}

function createStarfield() {
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1
  });

  const starVertices = [];
  for (let i = 0; i < 1000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starVertices.push(x, y, z);
  }

  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  return new THREE.Points(starGeometry, starMaterial);
}

function createReticle() {
  const reticleGroup = new THREE.Group();

  // Outer ring
  const outerRingGeometry = new THREE.RingGeometry(0.015, 0.02, 32);
  const reticleMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
    depthTest: false
  });
  const outerRing = new THREE.Mesh(outerRingGeometry, reticleMaterial);
  reticleGroup.add(outerRing);

  // Inner crosshair
  const innerCrosshairGeometry = new THREE.BufferGeometry();
  const linePositions = new Float32Array([
    -0.025, 0, 0,    // Left horizontal line
    0.025, 0, 0,     // Right horizontal line
    0, -0.025, 0,    // Bottom vertical line
    0, 0.025, 0      // Top vertical line
  ]);
  innerCrosshairGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  innerCrosshairGeometry.setIndex([0, 1, 2, 3]);

  const crosshairMaterial = new THREE.LineBasicMaterial({
    color: 0xff0000,
    linewidth: 2,
    depthTest: false
  });

  const innerCrosshair = new THREE.LineSegments(innerCrosshairGeometry, crosshairMaterial);
  reticleGroup.add(innerCrosshair);

  // Center dot
  const centerDotGeometry = new THREE.CircleGeometry(0.005, 16);
  const centerDot = new THREE.Mesh(centerDotGeometry, reticleMaterial);
  reticleGroup.add(centerDot);

  reticleGroup.position.set(0, 0, -0.5);
  return reticleGroup;
}

export function createEnemy(scene: THREE.Scene, level: number): Enemy {
  const angle = Math.random() * Math.PI * 2;
  const distance = ENEMY_SPAWN_DISTANCE + Math.random() * 10;
  
  const x = Math.sin(angle) * distance;
  const y = (Math.random() - 0.5) * distance;
  const z = Math.cos(angle) * distance;

  const enemy = new THREE.Group() as Enemy;
  enemy.userData = {
    health: 1,
    speed: BASE_ENEMY_SPEED + (SPEED_INCREASE_PER_LEVEL * (level - 1)),
    fireTimer: Math.random() * 100,
    pulseDirection: 1,
    pulseValue: 0,
    isFiringMode: false,
    attackDistance: 8 + (Math.random() * 2)
  };

  // Create enemy meshes
  const meshes = createEnemyMeshes();
  meshes.forEach(mesh => enemy.add(mesh));

  enemy.position.set(x, y, z);
  scene.add(enemy);

  return enemy;
}

function createEnemyMeshes() {
  const meshes = [];

  // Base head
  const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
  const headMaterial = new THREE.MeshPhongMaterial({
    color: COLORS.ENEMY_BASE,
    shininess: 30
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  meshes.push(head);

  // Head glow
  const glowGeometry = new THREE.SphereGeometry(0.6, 16, 16);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: COLORS.ENEMY_GLOW,
    transparent: true,
    opacity: 0.4,
    side: THREE.BackSide
  });
  const headGlow = new THREE.Mesh(glowGeometry, glowMaterial);
  meshes.push(headGlow);

  // Eyes
  const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const eyeMaterial = new THREE.MeshPhongMaterial({
    color: COLORS.ENEMY_EYES,
    emissive: COLORS.ENEMY_EYES_EMISSIVE,
    shininess: 100
  });

  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(0.25, 0.2, 0.3);
  meshes.push(leftEye);

  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(-0.25, 0.2, 0.3);
  meshes.push(rightEye);

  return meshes;
}
