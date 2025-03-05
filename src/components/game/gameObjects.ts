import * as THREE from 'three';
import { Enemy } from './types';
import { COLORS, BASE_ENEMY_SPEED, SPEED_INCREASE_PER_LEVEL, ENEMY_SPAWN_DISTANCE } from './constants';

export function createGameObjects(playerPosition?: THREE.Vector3, playerRotation?: THREE.Euler) {
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
  const playerShip = createPlayerShip(playerPosition, playerRotation);

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

function createPlayerShip(position?: THREE.Vector3, rotation?: THREE.Euler) {
  const ship = new THREE.Group();

  // Main body
  const bodyGeometry = new THREE.ConeGeometry(0.5, 1.5, 4);
  bodyGeometry.rotateX(Math.PI / 2);
  const bodyMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x00ff00,
    emissive: 0x00ffff,
    emissiveIntensity: 0,
    shininess: 50,
    specular: 0x666666
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  ship.add(body);

  // Cannons
  const cannons = createShipCannons();
  cannons.forEach(cannon => ship.add(cannon));

  // Apply position and rotation from game state, or use defaults
  if (position) {
    ship.position.copy(position);
  } else {
    ship.position.set(0, 0, 25);
  }
  
  if (rotation) {
    ship.rotation.copy(rotation);
  }
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

  // Create a shared material for all reticle elements
  const reticleMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    depthTest: false
  });

  // Outer ring
  const outerRingGeometry = new THREE.RingGeometry(0.015, 0.02, 32);
  const outerRing = new THREE.Mesh(outerRingGeometry, reticleMaterial);
  reticleGroup.add(outerRing);

  // Inner crosshair - using planes instead of lines
  const crossThickness = 0.002; // Thickness of the cross lines
  const crossLength = 0.025;    // Length of the cross lines

  // Horizontal line
  const horizontalGeometry = new THREE.PlaneGeometry(crossLength * 2, crossThickness);
  const horizontalLine = new THREE.Mesh(horizontalGeometry, reticleMaterial);
  reticleGroup.add(horizontalLine);

  // Vertical line
  const verticalGeometry = new THREE.PlaneGeometry(crossThickness, crossLength * 2);
  const verticalLine = new THREE.Mesh(verticalGeometry, reticleMaterial);
  reticleGroup.add(verticalLine);

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
    attackDistance: 8 + (Math.random() * 2),
    firingRange: Math.random() ? 18 + (Math.random() * 4) : 20  // Ensure a default value of 20 if random fails
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

  // Create a more squid-like head shape
  const headGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  // Make it wider at the bottom and narrower at the top
  const headVertices = headGeometry.attributes.position.array;
  for (let i = 0; i < headVertices.length; i += 3) {
    const y = headVertices[i + 1];
    // Scale x and z based on y position to create a more bulbous bottom
    const scale = 1 + Math.pow(Math.max(-y, 0), 1.5);
    headVertices[i] *= scale;     // x
    headVertices[i + 2] *= scale; // z
  }
  headGeometry.computeVertexNormals();
  
  const headMaterial = new THREE.MeshPhongMaterial({
    color: COLORS.ENEMY_BASE,
    shininess: 50,
    specular: 0x444444
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  meshes.push(head);

  // Create matching glow
  const glowGeometry = headGeometry.clone();
  const glowScale = 1.1;
  glowGeometry.scale(glowScale, glowScale, glowScale);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: COLORS.ENEMY_GLOW,
    transparent: true,
    opacity: 0.4,
    side: THREE.BackSide
  });
  const headGlow = new THREE.Mesh(glowGeometry, glowMaterial);
  meshes.push(headGlow);

  // Eyes (slightly more alien)
  const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  eyeGeometry.scale(1.5, 1, 1); // Make eyes more oval
  const eyeMaterial = new THREE.MeshPhongMaterial({
    color: COLORS.ENEMY_EYES,
    emissive: COLORS.ENEMY_EYES_EMISSIVE,
    shininess: 100
  });

  // Create eyes group
  const eyesGroup = new THREE.Group();
  eyesGroup.name = 'eyes';

  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial.clone());
  leftEye.name = 'leftEye';
  leftEye.position.set(0.25, 0.2, 0.3);
  leftEye.rotation.z = -0.3;
  eyesGroup.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial.clone());
  rightEye.name = 'rightEye';
  rightEye.position.set(-0.25, 0.2, 0.3);
  rightEye.rotation.z = 0.3;
  eyesGroup.add(rightEye);

  head.add(eyesGroup);

  // Add tentacles
  const numTentacles = 8;
  const tentacleMaterial = new THREE.MeshPhongMaterial({
    color: COLORS.ENEMY_BASE,
    shininess: 20
  });

  for (let i = 0; i < numTentacles; i++) {
    const angle = (i / numTentacles) * Math.PI * 2;
    const tentacleGroup = new THREE.Group();

    // Position tentacles at the very bottom of the head
    const headRadius = 0.5;
    // Attach all tentacles at the bottom
    tentacleGroup.position.set(0, -headRadius, 0);

    // Create a curve that starts at the bottom and spreads outward
    const spreadRadius = 0.8; // How far the tentacles spread
    const tentacleCurve = new THREE.CatmullRomCurve3([
      // Start at the bottom center
      new THREE.Vector3(0, 0, 0),
      
      // First spread outward slightly
      new THREE.Vector3(
        Math.sin(angle) * 0.3,
        -0.3,
        Math.cos(angle) * 0.3
      ),
      
      // Continue spreading and curving down
      new THREE.Vector3(
        Math.sin(angle) * spreadRadius * 0.6,
        -0.8,
        Math.cos(angle) * spreadRadius * 0.6
      ),
      
      // Maximum spread
      new THREE.Vector3(
        Math.sin(angle) * spreadRadius,
        -1.4,
        Math.cos(angle) * spreadRadius
      ),
      
      // Start curling inward at the tip
      new THREE.Vector3(
        Math.sin(angle) * spreadRadius * 0.8,
        -1.8,
        Math.cos(angle) * spreadRadius * 0.8
      )
    ]);

    // Make the curve tension tighter for smoother bends
    tentacleCurve.tension = 0.4;

    // Create geometry
    const geometry = new THREE.TubeGeometry(
      tentacleCurve,
      32,
      0.08,  // Thinner tentacles
      8,     // Fewer radial segments for better performance
      false
    );

    // Apply tapering
    const vertexPositions = geometry.attributes.position.array;
    for (let i = 0; i < vertexPositions.length; i += 3) {
      const progress = i / vertexPositions.length;
      const scale = Math.pow(1 - progress, 1.5); // More aggressive taper towards tip
      vertexPositions[i] *= scale;
      vertexPositions[i + 2] *= scale;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    const tentacleMesh = new THREE.Mesh(geometry, tentacleMaterial);

    // No need for additional rotation since the curve defines the shape
    tentacleGroup.add(tentacleMesh);

    tentacleGroup.add(tentacleMesh);
    head.add(tentacleGroup);
  }

  return meshes;
}
