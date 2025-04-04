import * as THREE from 'three';
import { COLORS } from '../constants/colors';
import { Renderable } from '../core/components';

/**
 * MeshFactory
 * 
 * Responsible for creating 3D meshes based on entity type and properties.
 * Follows the Factory pattern to centralize mesh creation logic.
 * This separation allows the RenderingSystem to focus on managing and updating
 * meshes rather than creating them.
 */
export class MeshFactory {
  /**
   * Creates a mesh based on the provided renderable component
   */
  public static createMesh(renderable: Renderable): THREE.Object3D {
    let mesh: THREE.Object3D;

    switch (renderable.modelId) {
      case 'playerShip':
        mesh = this.createPlayerShipMesh(renderable);
        break;
      case 'grunt':
        mesh = this.createGruntMesh(renderable);
        break;
      case 'dysonSphere':
        mesh = this.createDysonSphereMesh(renderable);
        break;
      case 'laser':
        mesh = this.createLaserMesh(renderable);
        break;
      case 'shieldGuardian':
        mesh = this.createShieldGuardianMesh(renderable);
        break;
      case 'shieldBubble':
        mesh = this.createShieldBubbleMesh(renderable);
        break;
      case 'warpRaider':
        mesh = this.createWarpRaiderMesh(renderable);
        break;
      case 'asteroid':
        mesh = this.createAsteroidMesh(renderable);
        break;
      case 'powerUpOrb':
        mesh = this.createPowerUpOrbMesh(renderable);
        break;
      case 'starfield':
        mesh = this.createStarfieldMesh(renderable);
        break;
      case 'centralStar':
        mesh = this.createCentralStarMesh(renderable);
        break;
      case 'portal':
        mesh = this.createPortalMesh(renderable);
        break;
      default:
        console.warn(`Unknown model ID: ${renderable.modelId}`);
        mesh = new THREE.Object3D();
    }

    // Store the mesh UUID in the renderable component
    renderable.meshId = mesh.uuid;
    
    return mesh;
  }

  private static createDefaultMesh(renderable: Renderable): THREE.Object3D {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: renderable.color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(renderable.scale, renderable.scale, renderable.scale);
    return mesh;
  }

  private static createPlayerShipMesh(renderable: Renderable): THREE.Object3D {
    // Create a simple ship model
    const group = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.ConeGeometry(1, 4, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: renderable.color || COLORS.PLAYER_BASE,
      emissive: 0x00ffff,  // Cyan emissive color for boost effect
      emissiveIntensity: 0.0  // Start with no emission, will be controlled by boost
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);

    // Wing
    const wingGeometry = new THREE.BoxGeometry(6, 0.5, 2);
    const wingMaterial = new THREE.MeshPhongMaterial({ 
      color: renderable.color || COLORS.PLAYER_BASE,
      emissive: 0x00ffff,  // Cyan emissive color for boost effect
      emissiveIntensity: 0.0  // Start with no emission, will be controlled by boost
    });
    const wing = new THREE.Mesh(wingGeometry, wingMaterial);
    wing.position.y = -1;
    group.add(wing);
    
    // Add dual laser cannons on each side of the ship
    [-1.5, 1.5].forEach(x => {
      const cannonGroup = new THREE.Group();
      // Position cannons on front sides
      cannonGroup.position.set(x, -0.5, 1.0);
      group.add(cannonGroup);

      // Main cannon barrel
      const barrelGeometry = new THREE.CylinderGeometry(0.12, 0.15, 1.0, 8);
      const barrelMaterial = new THREE.MeshPhongMaterial({
        color: 0x444444, // Dark gray for cannons
        shininess: 90
      });
      const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      
      // Rotate barrel to point forward (along positive Z)
      barrel.rotation.x = Math.PI / 2;
      cannonGroup.add(barrel);

      // Energy glow at barrel end
      const glowGeometry = new THREE.SphereGeometry(0.14, 8, 8);
      const glowMaterial = new THREE.MeshPhongMaterial({
        color: COLORS.LASER_GREEN,
        emissive: COLORS.LASER_GREEN,
        emissiveIntensity: 0.7,
        transparent: true,
        opacity: 0.8
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.z = 0.5; // Position at the end of the barrel
      cannonGroup.add(glow);
    });

    // Apply scale
    group.scale.set(renderable.scale, renderable.scale, renderable.scale);
    
    return group;
  }

  private static createDysonSphereMesh(renderable: Renderable): THREE.Object3D {
    const group = new THREE.Group();
    
    // Outer wireframe sphere - enhanced wireframe appearance
    const outerGeometry = new THREE.SphereGeometry(50, 32, 32);
    const outerMaterial = new THREE.MeshStandardMaterial({
      color: renderable.color || COLORS.DYSON_PRIMARY,
      metalness: 0.9,
      roughness: 0.1,
      emissive: COLORS.DYSON_EMISSIVE,
      wireframe: true,
      transparent: true,
      opacity: 1.0,
      depthWrite: true,
    });
    const outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
    outerMesh.renderOrder = 0;
    group.add(outerMesh);
    
    // Add a second wireframe with different segment count for more complex pattern
    const outerGeometry2 = new THREE.SphereGeometry(50, 16, 16);
    const outerMaterial2 = new THREE.MeshStandardMaterial({
      color: renderable.color || COLORS.DYSON_PRIMARY,
      metalness: 0.9,
      roughness: 0.1,
      emissive: COLORS.DYSON_EMISSIVE,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: true,
    });
    const outerMesh2 = new THREE.Mesh(outerGeometry2, outerMaterial2);
    outerMesh2.rotation.y = Math.PI / 4; // Rotate slightly to create offset pattern
    outerMesh2.renderOrder = 0;
    group.add(outerMesh2);
    
    // Apply scale
    group.scale.set(renderable.scale, renderable.scale, renderable.scale);
    
    return group;
  }

  private static createLaserMesh(renderable: Renderable): THREE.Object3D {
    // Create a laser cylinder that's long and thin
    const geometry = new THREE.CylinderGeometry(0.25, 0.25, 5, 16);
    
    // Create a group to handle the rotation correctly
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ 
      color: renderable.color || COLORS.LASER_GREEN,
      emissive: renderable.color || COLORS.LASER_GREEN,
      emissiveIntensity: 2.0,
      shininess: 100
    }));
    
    // Rotate the cylinder geometry to point along the z-axis 
    // (cylinders are created along the y-axis by default)
    mesh.rotation.x = Math.PI / 2;
    
    group.add(mesh);
    
    // Apply scale
    group.scale.set(renderable.scale, renderable.scale, renderable.scale);
    
    return group;
  }

  private static createGruntMesh(renderable: Renderable): THREE.Object3D {
    const group = new THREE.Group();
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
      color: COLORS.GRUNT_BASE,
      shininess: 50,
      specular: 0x444444
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    meshes.push(head);
    group.add(head);
    
    // Create a shared glow material configuration to ensure consistency
    const createGlowMaterial = () => new THREE.MeshPhongMaterial({
      color: COLORS.GRUNT_GLOW,
      transparent: true,
      opacity: 0.5,
      shininess: 0,
      emissive: COLORS.GRUNT_GLOW,
      emissiveIntensity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    // Add a single, stronger outer glow using a slightly larger, transparent head
    const glowGeometry = headGeometry.clone();
    const glowMaterial = createGlowMaterial();
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.scale.set(1.3, 1.3, 1.3); // Make the glow larger for more visibility
    meshes.push(glow);
    group.add(glow);
    
    // Eyes (two small glowing spheres)
    const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeMaterial = new THREE.MeshPhongMaterial({ 
      color: COLORS.GRUNT_EYES,
      emissive: COLORS.GRUNT_EYES_EMISSIVE,
      emissiveIntensity: 0.5
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.2, 0.1, 0.4);
    group.add(leftEye);
    meshes.push(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(-0.2, 0.1, 0.4);
    group.add(rightEye);
    meshes.push(rightEye);

    // Store references to eye meshes for siege mode color changes
    group.userData.leftEye = leftEye;
    group.userData.rightEye = rightEye;
    
    // Add tentacles
    const numTentacles = 8;
    const tentacleMaterial = new THREE.MeshPhongMaterial({
      color: COLORS.GRUNT_BASE,
      shininess: 20
    });

    const tentacleGroup = new THREE.Group();

    // Create tentacles distributed evenly around the alien
    for (let i = 0; i < numTentacles; i++) {
      const angle = (i / numTentacles) * Math.PI * 2;
      const spreadRadius = 0.5; // How wide the tentacles spread
      
      // Define tentacle curve with points
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

      // Create geometry for tentacle and its glow
      const geometry = new THREE.TubeGeometry(
        tentacleCurve,
        32,
        0.08,  // Thinner tentacles
        8,     // Fewer radial segments for better performance
        false
      );

      // Apply tapering
      const vertexPositions = geometry.attributes.position.array;
      for (let j = 0; j < vertexPositions.length; j += 3) {
        const progress = j / vertexPositions.length;
        const scale = Math.pow(1 - progress, 1.5); // More aggressive taper towards tip
        vertexPositions[j] *= scale;
        vertexPositions[j + 2] *= scale;
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();

      const tentacleMesh = new THREE.Mesh(geometry, tentacleMaterial);
      
      // Create glow for tentacle using the same material configuration
      const tentacleGlowMaterial = createGlowMaterial();
      const tentacleGlow = new THREE.Mesh(geometry, tentacleGlowMaterial);
      tentacleGlow.scale.set(1.3, 1.3, 1.3); // Match the head glow scale
      
      // Add to the tentacle group
      tentacleGroup.add(tentacleMesh);
      tentacleGroup.add(tentacleGlow);
      meshes.push(tentacleMesh);
      meshes.push(tentacleGlow);
    }
    
    // Position tentacle group at the bottom of the head
    tentacleGroup.position.y = -0.4;
    head.add(tentacleGroup);
    
    // Apply scale
    group.scale.set(renderable.scale, renderable.scale, renderable.scale);
    
    return group;
  }

  private static createShieldGuardianMesh(renderable: Renderable): THREE.Object3D {
    const group = new THREE.Group();
    
    // Create jagged octahedron for the Guardian
    const geometry = new THREE.OctahedronGeometry(1, 0); // Base octahedron
    
    // Make the octahedron jagged by displacing vertices
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      // Get vertex position
      const x = vertices[i];
      const y = vertices[i + 1];
      const z = vertices[i + 2];
      
      // Calculate distance from center (normalized)
      const dist = Math.sqrt(x * x + y * y + z * z);
      const normalizedDist = dist > 0 ? 1.0 / dist : 0;
      
      // Calculate jaggedness factor based on position
      const noise = Math.sin(x * 5) * Math.cos(y * 5) * Math.sin(z * 5) * 0.2;
      
      // Apply displacement
      vertices[i] = x * (normalizedDist + noise);
      vertices[i + 1] = y * (normalizedDist + noise);
      vertices[i + 2] = z * (normalizedDist + noise);
    }
    geometry.computeVertexNormals();
    
    // Create a crystalline material with refraction and high shininess
    const material = new THREE.MeshPhongMaterial({
      color: renderable.color || COLORS.SHIELD_GUARDIAN_CRYSTAL,
      transparent: true,
      opacity: 0.7,
      shininess: 200,
      specular: 0xffffff, // Add specular highlights for crystal effect
      emissive: COLORS.SHIELD_GUARDIAN_CRYSTAL, // Add emissive glow
      emissiveIntensity: 0.4, // Medium intensity glow
      flatShading: true, // Use flat shading for crystal faces
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Add additional crystal shards jutting out from the octahedron
    const shards = 6;
    for (let i = 0; i < shards; i++) {
      // Create sharp-edged shard
      const shardGeom = new THREE.TetrahedronGeometry(0.3, 0);
      const shardMat = new THREE.MeshPhongMaterial({
        color: COLORS.SHIELD_GUARDIAN_SHARD,
        transparent: true,
        opacity: 0.7,
        shininess: 100,
        emissive: COLORS.SHIELD_GUARDIAN_SHARD, // Add emissive glow
        emissiveIntensity: 0.3, // Light glow intensity
        flatShading: true,
      });
      
      const shard = new THREE.Mesh(shardGeom, shardMat);
      
      // Position shard on octahedron vertices
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      
      shard.position.x = 1.3 * Math.sin(phi) * Math.cos(theta);
      shard.position.y = 1.3 * Math.sin(phi) * Math.sin(theta);
      shard.position.z = 1.3 * Math.cos(phi);
      
      // Rotate shard randomly for more jagged appearance
      shard.rotation.x = Math.random() * Math.PI;
      shard.rotation.y = Math.random() * Math.PI;
      shard.rotation.z = Math.random() * Math.PI;
      
      mesh.add(shard);
    }
    
    group.add(mesh);
    
    // Add glowing core
    const coreGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const coreMaterial = new THREE.MeshBasicMaterial({ 
      color: COLORS.SHIELD_GUARDIAN_CORE,
    });
    
    // Add a point light inside the core for extra glow effect
    const coreLight = new THREE.PointLight(COLORS.SHIELD_GUARDIAN_CRYSTAL, 1.5, 10);
    coreLight.position.set(0, 0, 0);
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.add(coreLight); // Add light as a child of the core
    mesh.add(core);
    
    // Apply scale
    group.scale.set(renderable.scale, renderable.scale, renderable.scale);
    
    return group;
  }
  
  private static createShieldBubbleMesh(renderable: Renderable): THREE.Object3D {
    // Create a simple yet effective shield bubble
    const group = new THREE.Group();
    
    // Base shield bubble - main shield surface
    const icosaGeometry = new THREE.IcosahedronGeometry(1, 3); 
    const shieldMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffff, // Pure cyan color for shield
      transparent: true,
      opacity: 0.15, // Even more transparent
      side: THREE.DoubleSide,
      emissive: 0x0088ff, // Blue emissive for glow
      emissiveIntensity: 1.0, // Increased emissive intensity for brighter glow
      shininess: 200, // Increased shininess for more reflectivity
      specular: 0x4444ff, // More blue-tinted specular highlights
      flatShading: false,
      depthWrite: false, // Don't write to depth buffer
      depthTest: true, // But do test against it
    });
    const shieldMesh = new THREE.Mesh(icosaGeometry, shieldMaterial);
    shieldMesh.renderOrder = 1; // Render after Dyson Sphere
    group.add(shieldMesh);
    
    // Add outer glow effect with brighter blue
    const glowGeometry = new THREE.IcosahedronGeometry(1.05, 3); // Slightly larger than before
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x44bbff, // Brighter blue color
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, // Add additive blending for better glow
      depthWrite: false, // Don't write to depth buffer
      depthTest: true, // But do test against it
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.renderOrder = 1; // Render after Dyson Sphere
    group.add(glowMesh);
    
    // Inner energy field with adjusted properties
    const innerGeometry = new THREE.SphereGeometry(0.94, 32, 32);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0x66ffff,
      transparent: true,
      opacity: 0.15, // More transparent inner field
      blending: THREE.AdditiveBlending, // Add additive blending
      depthWrite: false, // Don't write to depth buffer
      depthTest: true, // But do test against it
    });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    innerMesh.renderOrder = 1; // Render after Dyson Sphere
    group.add(innerMesh);
    
    // Add hexagonal grid pattern covering the entire surface with outlines
    const hexGroup = new THREE.Group();
    
    // Increase hex count for better coverage
    const hexCount = 400; // Increased from 300 for denser coverage
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    
    // Helper function to create a hexagon outline at a point on the sphere
    const createHexagonOutline = (position: THREE.Vector3, radius: number) => {
      const hexPoints = [];
      // Create 6 points for hexagon
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i;
        hexPoints.push(
          new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            0
          )
        );
      }
      // Close the loop
      hexPoints.push(hexPoints[0].clone());
      
      // Create geometry from points
      const geometry = new THREE.BufferGeometry().setFromPoints(hexPoints);
      const material = new THREE.LineBasicMaterial({
        color: 0x88ddff, // Brighter blue for hexagons
        transparent: true,
        opacity: 0.3, // Slightly more visible
        blending: THREE.AdditiveBlending, // Add additive blending
      });
      
      // Create line loop
      const hexagon = new THREE.Line(geometry, material);
      
      // Position on the sphere at the given position
      hexagon.position.copy(position);
      
      // Orient to face outward from the sphere center
      hexagon.lookAt(new THREE.Vector3(0, 0, 0));
      
      return hexagon;
    };
    
    // Improved distribution of hexagons using spherical coordinates
    for (let i = 0; i < hexCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / hexCount);
      const theta = Math.PI * 2 * i * goldenRatio;
      
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);
      const z = Math.cos(phi);
      
      // Position on the sphere
      const position = new THREE.Vector3(x, y, z);
      
      // Uniform size for more consistent look
      const size = 0.04;
      
      // Create and add hexagon outline
      const hexagon = createHexagonOutline(position, size);
      hexGroup.add(hexagon);
    }
    
    group.add(hexGroup);
    
    // Add a few energy arcs - these will be static
    const arcGroup = new THREE.Group();
    const arcCount = 12;
    
    for (let i = 0; i < arcCount; i++) {
      // Create arc line
      const arcPoints = [];
      const segmentCount = 8;
      
      // Random start point on sphere
      const phiStart = Math.acos(2 * Math.random() - 1);
      const thetaStart = 2 * Math.PI * Math.random();
      
      const startPoint = new THREE.Vector3(
        Math.sin(phiStart) * Math.cos(thetaStart),
        Math.sin(phiStart) * Math.sin(thetaStart),
        Math.cos(phiStart)
      );
      
      // Random end point on sphere
      const phiEnd = Math.acos(2 * Math.random() - 1);
      const thetaEnd = 2 * Math.PI * Math.random();
      
      const endPoint = new THREE.Vector3(
        Math.sin(phiEnd) * Math.cos(thetaEnd),
        Math.sin(phiEnd) * Math.sin(thetaEnd),
        Math.cos(phiEnd)
      );
      
      // Create a zigzag line between start and end
      arcPoints.push(startPoint);
      
      for (let j = 1; j < segmentCount; j++) {
        const t = j / segmentCount;
        const basePoint = new THREE.Vector3().lerpVectors(startPoint, endPoint, t);
        
        // Add random offset for zigzag effect
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        );
        
        basePoint.add(offset).normalize();
        arcPoints.push(basePoint);
      }
      
      arcPoints.push(endPoint);
      
      // Create arc geometry
      const arcGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints);
      const arcMaterial = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: Math.random() > 0.7 ? 0.6 : 0, // Only some arcs visible
        linewidth: 2,
      });
      
      const arc = new THREE.Line(arcGeometry, arcMaterial);
      arcGroup.add(arc);
    }
    
    group.add(arcGroup);
    
    // Apply scale
    group.scale.set(renderable.scale, renderable.scale, renderable.scale);
    
    return group;
  }

  private static createWarpRaiderMesh(renderable: Renderable): THREE.Object3D {
    // Create a main group for the entire ship
    const group = new THREE.Group();
    
    // ==========================================
    // BODY CREATION - Angular prism-shaped hull
    // ==========================================
    // Create an angular prism body instead of the capsule
    const bodyGroup = new THREE.Group();
    
    // Main angular fuselage using BoxGeometry
    const mainBodyGeometry = new THREE.BoxGeometry(1.4, 0.8, 3.0);
    const mainBodyMaterial = new THREE.MeshPhongMaterial({
      color: renderable.color || COLORS.WARP_RAIDER_BASE,
      shininess: 90,
      specular: 0x666666,
      emissive: COLORS.WARP_RAIDER_BASE,
      emissiveIntensity: 0.2
    });
    
    // Taper the box vertices to create an angular fighter shape
    const positions = mainBodyGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      // Get vertex position
      const z = positions[i + 2];
      
      // Taper front to a point (vertices at the front/positive Z get narrower)
      if (z > 0) {
        const taperFactor = 1 - (z / 1.5) * 0.7; // Taper more aggressively toward the front
        positions[i] *= taperFactor; // Scale X
        positions[i + 1] *= taperFactor; // Scale Y
      }
      
      // Taper rear slightly
      if (z < -0.5) {
        const rearTaper = 0.9;
        positions[i] *= rearTaper;
        positions[i + 1] *= rearTaper;
      }
    }
    mainBodyGeometry.computeVertexNormals();
    
    const mainBody = new THREE.Mesh(mainBodyGeometry, mainBodyMaterial);
    bodyGroup.add(mainBody);
    
    // Add angular cockpit canopy on top
    const canopyGeometry = new THREE.BoxGeometry(0.6, 0.3, 1.2);
    // Modify canopy to be angular and sleek
    const canopyPositions = canopyGeometry.attributes.position.array;
    for (let i = 0; i < canopyPositions.length; i += 3) {
      const z = canopyPositions[i + 2];
      if (z > 0) {
        // Taper front of canopy to a point
        const taperFactor = 1 - (z / 0.6) * 0.8;
        canopyPositions[i] *= taperFactor;
      }
    }
    canopyGeometry.computeVertexNormals();
    
    const canopyMaterial = new THREE.MeshPhongMaterial({
      color: COLORS.WARP_RAIDER_ACCENT,
      shininess: 100,
      specular: 0x999999,
      emissive: COLORS.WARP_RAIDER_ACCENT,
      emissiveIntensity: 0.3
    });
    
    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.set(0, 0.5, 0.5); // Position on top front of main body
    bodyGroup.add(canopy);
    
    // Add angular nose section
    const noseGeometry = new THREE.ConeGeometry(0.3, 0.8, 4); // Fewer segments for angular look
    const noseMaterial = new THREE.MeshPhongMaterial({
      color: COLORS.WARP_RAIDER_DETAIL,
      shininess: 90,
      specular: 0x666666
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.rotation.x = -Math.PI / 2; // Rotate to point forward
    nose.position.z = 1.5; // Position at front of the ship
    bodyGroup.add(nose);
    
    // Add angular body panels and details
    const addBodyPanel = (width: number, height: number, depth: number, x: number, y: number, z: number, rotY: number = 0) => {
      const panelGeom = new THREE.BoxGeometry(width, height, depth);
      const panelMat = new THREE.MeshPhongMaterial({
        color: COLORS.WARP_RAIDER_DETAIL,
        shininess: 80,
        specular: 0x444444
      });
      const panel = new THREE.Mesh(panelGeom, panelMat);
      panel.position.set(x, y, z);
      panel.rotation.y = rotY;
      bodyGroup.add(panel);
      return panel;
    };
    
    // Add angular side panels
    addBodyPanel(0.1, 0.5, 1.8, 0.7, 0, 0, 0);
    addBodyPanel(0.1, 0.5, 1.8, -0.7, 0, 0, 0);
    
    // Add bottom hull extension
    addBodyPanel(0.8, 0.2, 1.5, 0, -0.5, -0.5, 0);
    
    // Add the body group to the main group
    group.add(bodyGroup);

    // ==========================================
    // WING CREATION - Horizontal wings
    // ==========================================
    // Wing design - angular and aggressive
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(2.5, -0.5);
    wingShape.lineTo(3.0, -0.3);
    wingShape.lineTo(3.2, 0.2);
    wingShape.lineTo(1.5, 0.4);
    wingShape.lineTo(0, 0);

    const wingExtrudeSettings = {
      steps: 1,
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3
    };

    const wingGeometry = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
    const wingMaterial = new THREE.MeshPhongMaterial({
      color: COLORS.WARP_RAIDER_ACCENT,
      shininess: 80,
      specular: 0x666666
    });

    // Create wings on left and right sides of the ship
    [-1, 1].forEach(side => {
      const wing = new THREE.Mesh(wingGeometry, wingMaterial);
      
      // Position wings on the sides, slightly toward the back of the ship
      wing.position.set(side * 0.8, 0, -0.5);
      
      // Apply rotations for both wings
      if (side === 1) { // Right wing
        // Point wing along positive X-axis
        wing.rotation.y = 0;
        // Rotate 90 degrees about X-axis
        wing.rotation.x = Math.PI / 2;
        // Flip 180 degrees about Z-axis
        wing.rotation.z = Math.PI;
      } else { // Left wing
        // Point wing along negative X-axis
        wing.rotation.y = Math.PI;
        // Rotate 90 degrees about X-axis PLUS an additional 180 degrees
        wing.rotation.x = Math.PI / 2 + Math.PI; // = 3 * Math.PI / 2
        // Flip 180 degrees about Z-axis
        wing.rotation.z = Math.PI;
      }
      
      group.add(wing);

      // Add wing accent lights
      const accentGeometry = new THREE.BoxGeometry(1.8, 0.05, 0.05);
      const accentMaterial = new THREE.MeshPhongMaterial({
        color: COLORS.WARP_RAIDER_ENGINE,
        emissive: COLORS.WARP_RAIDER_ENGINE,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8
      });
      const accent = new THREE.Mesh(accentGeometry, accentMaterial);
      accent.position.set(1.2, 0, 0);
      wing.add(accent);
    });

    // ==========================================
    // ENGINE CREATION - Pointing backward
    // ==========================================
    // Engine group positioned at the back of the ship
    const engineGroup = new THREE.Group();
    engineGroup.position.set(0, 0, -1.3); // Position at the back of the ship
    group.add(engineGroup);

    // Main engine housing - make it more angular
    const engineHousingGeometry = new THREE.CylinderGeometry(0.4, 0.5, 0.8, 6); // Fewer segments for angular look
    const engineHousingMaterial = new THREE.MeshPhongMaterial({
      color: COLORS.WARP_RAIDER_DETAIL,
      shininess: 90,
      specular: 0x666666
    });
    const engineHousing = new THREE.Mesh(engineHousingGeometry, engineHousingMaterial);
    
    // Rotate cylinder to point backward (along negative Z)
    engineHousing.rotation.x = Math.PI / 2;
    engineGroup.add(engineHousing);

    // Engine glow - multiple layers for more intense effect
    [0.3, 0.35, 0.4].forEach((radius, i) => {
      const glowGeometry = new THREE.CylinderGeometry(radius, radius * 1.2, 0.3, 16);
      const glowMaterial = new THREE.MeshPhongMaterial({
        color: COLORS.WARP_RAIDER_ENGINE,
        emissive: COLORS.WARP_RAIDER_ENGINE,
        emissiveIntensity: 1 - i * 0.2,
        transparent: true,
        opacity: 0.7 - i * 0.15
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      
      // Position the glow at the back end of the engine housing
      glow.position.z = -0.5;
      glow.rotation.x = Math.PI / 2; // Align with engine direction
      engineGroup.add(glow);
    });

    // Engine trail - multiple layers for more dynamic effect
    [0.3, 0.4, 0.5].forEach((radius, i) => {
      const trailGeometry = new THREE.ConeGeometry(radius, 2 + i * 0.5, 16);
      const trailMaterial = new THREE.MeshPhongMaterial({
        color: COLORS.WARP_RAIDER_ENGINE,
        emissive: COLORS.WARP_RAIDER_ENGINE,
        emissiveIntensity: 0.8 - i * 0.2,
        transparent: true,
        opacity: 0.4 - i * 0.1
      });
      const trail = new THREE.Mesh(trailGeometry, trailMaterial);
      
      // Position trail behind the engine
      trail.position.z = -1.5 - i * 0.2;
      
      // Rotate cone to point backward (along negative Z)
      trail.rotation.x = -Math.PI / 2;
      engineGroup.add(trail);
    });

    // ==========================================
    // WEAPON SYSTEMS - Front-mounted cannons
    // ==========================================
    // Dual heavy laser cannons
    [-0.4, 0.4].forEach(x => {
      const cannonGroup = new THREE.Group();
      // Position cannons on front sides
      cannonGroup.position.set(x, 0, 1.0);
      group.add(cannonGroup);

      // Main cannon barrel
      const barrelGeometry = new THREE.CylinderGeometry(0.08, 0.12, 1.2, 8);
      const barrelMaterial = new THREE.MeshPhongMaterial({
        color: COLORS.WARP_RAIDER_DETAIL,
        shininess: 90
      });
      const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      
      // Rotate barrel to point forward (along positive Z)
      barrel.rotation.x = Math.PI / 2;
      cannonGroup.add(barrel);

      // Energy coils around barrel
      for (let i = 0; i < 3; i++) {
        const coilGeometry = new THREE.TorusGeometry(0.15, 0.02, 8, 16);
        const coilMaterial = new THREE.MeshPhongMaterial({
          color: COLORS.WARP_RAIDER_ENGINE,
          emissive: COLORS.WARP_RAIDER_ENGINE,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.8
        });
        const coil = new THREE.Mesh(coilGeometry, coilMaterial);
        coil.position.z = 0.3 + i * 0.3; // Position along the barrel
        coil.rotation.y = Math.PI / 2; // Orient properly around barrel
        cannonGroup.add(coil);
      }
    });

    // Apply scale to the whole ship
    group.scale.set(renderable.scale, renderable.scale, renderable.scale);
    
    return group;
  }

  private static createAsteroidMesh(renderable: Renderable): THREE.Object3D {
    const group = new THREE.Group();
    
    // Create the main asteroid body (spheroid with irregular surface)
    const radius = 1.0;
    const detail = 2; // Higher detail for more vertices to deform
    const geometry = new THREE.IcosahedronGeometry(radius, detail);
    
    // Deform the sphere to create an irregular asteroid shape
    const positionAttribute = geometry.attributes.position;
    for (let i = 0; i < positionAttribute.count; i++) {
      const vertex = new THREE.Vector3();
      vertex.fromBufferAttribute(positionAttribute, i);
      
      // Apply random deformation to create a jagged, irregular shape
      const deformation = 0.2 + Math.random() * 0.3;
      const distance = vertex.length();
      
      vertex.normalize().multiplyScalar(distance + deformation);
      
      positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    // Update normals after deforming the geometry
    geometry.computeVertexNormals();
    
    // Create the asteroid material
    const material = new THREE.MeshStandardMaterial({
      color: renderable.color || 0x888888,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true, // Creates a more jagged appearance
    });
    
    const asteroidBody = new THREE.Mesh(geometry, material);
    group.add(asteroidBody);
    
    // Add some "craters" to the asteroid surface
    const numCraters = 5 + Math.floor(Math.random() * 5); // 5-9 craters
    
    for (let i = 0; i < numCraters; i++) {
      // Generate a random position on the asteroid's surface
      const craterPosition = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize().multiplyScalar(radius + 0.01); // Slightly above surface
      
      // Create a small crater geometry
      const craterSize = 0.2 + Math.random() * 0.3;
      const craterGeometry = new THREE.CircleGeometry(craterSize, 16);
      const craterMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555, // Darker color for craters
        roughness: 1.0,
        metalness: 0.0,
        side: THREE.DoubleSide
      });
      
      const crater = new THREE.Mesh(craterGeometry, craterMaterial);
      
      // Position and orient the crater to face outward
      crater.position.copy(craterPosition);
      crater.lookAt(new THREE.Vector3(0, 0, 0));
      crater.rotateX(Math.random() * Math.PI); // Random rotation for variety
      
      group.add(crater);
    }
    
    // Apply scale
    group.scale.set(renderable.scale, renderable.scale, renderable.scale);
    
    return group;
  }

  // Create a glowing orb mesh for power-ups
  private static createPowerUpOrbMesh(renderable: Renderable): THREE.Object3D {
    const group = new THREE.Group();
    
    // Create multiple layered glowing spheres for a more volumetric 3D effect
    
    // Create a radial gradient texture for more realistic glow
    const gradientCanvas = document.createElement('canvas');
    gradientCanvas.width = 128;
    gradientCanvas.height = 128;
    const ctx = gradientCanvas.getContext('2d');
    if (ctx) {
      // Create radial gradient
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      
      // Extract color components from renderable.color
      const color = new THREE.Color(renderable.color);
      const r = Math.floor(color.r * 255);
      const g = Math.floor(color.g * 255);
      const b = Math.floor(color.b * 255);
      
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`);
      gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.5)`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
    }
    
    const glowTexture = new THREE.CanvasTexture(gradientCanvas);
    
    // Outer volumetric glow layers
    for (let i = 0; i < 4; i++) {
      const size = 0.9 + i * 0.2; // Increasing sizes
      const glowGeometry = new THREE.SphereGeometry(size, 32, 32);
      const glowMaterial = new THREE.MeshPhongMaterial({
        color: renderable.color,
        emissive: renderable.color,
        emissiveIntensity: 0.7 - i * 0.15,
        transparent: true,
        opacity: 0.4 - i * 0.08,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending // For better glow effect
      });
      
      const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
      group.add(glowSphere);
    }
    
    // Add a brighter core
    const coreGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: renderable.color,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);
    
    // Add a point light inside for real glow effect
    const light = new THREE.PointLight(renderable.color, 1.0, 6);
    light.position.set(0, 0, 0);
    group.add(light);
    
    // Create a billboard group for the icon
    const symbolGroup = new THREE.Group();
    
    // Check power-up type based on color to determine which icon to show
    const isSpeedPowerUp = renderable.color === COLORS.POWERUP_SPEED;
    const isHealthPowerUp = renderable.color === COLORS.POWERUP_HEALTH;
    
    if (isSpeedPowerUp) {
      // Create lightning bolt shape for speed boost power-up
      const lightning = new THREE.Group();
      
      // Main bolt shape
      const boltGeometry = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        0, 0.3, 0,    // Top point
        -0.1, 0.05, 0, // Left bend
        0.05, 0.05, 0,  // Right after bend
        -0.15, -0.2, 0, // Left point at bottom
        0, -0.1, 0,    // Bottom center
        0.15, 0.1, 0    // Right point
      ]);
      const indices = [
        0, 1, 2,
        1, 3, 4,
        1, 4, 2,
        2, 4, 5
      ];
      boltGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      boltGeometry.setIndex(indices);
      boltGeometry.computeVertexNormals();
      
      const boltMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const boltMesh = new THREE.Mesh(boltGeometry, boltMaterial);
      boltMesh.scale.set(2.0, 2.0, 2.0); // Increased from 1.5 to 2.0 for better visibility
      lightning.add(boltMesh);
      
      symbolGroup.add(lightning);
    } else if (isHealthPowerUp) {
      // Create cross shape for health power-up
      const cross = new THREE.Group();
      
      // Vertical bar of cross
      const verticalBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.6, 0.15),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
      );
      cross.add(verticalBar);
      
      // Horizontal bar of cross
      const horizontalBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.2, 0.15),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
      );
      cross.add(horizontalBar);
      
      // Scale up the cross to make it more visible
      cross.scale.set(2.0, 2.0, 2.0);
      
      symbolGroup.add(cross);
    } else {
      // Create double arrow shape to indicate faster fire rate (default for fireRate power-up)
      // Arrow 1 (top)
      const arrow1 = new THREE.Group();
      
      // Arrow body - thicker
      const arrowLine1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.15, 0.15),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
      );
      arrowLine1.position.set(0, 0.18, 0);
      arrow1.add(arrowLine1);
      
      // Arrow head - larger
      const arrowHead1 = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.25, 8),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
      );
      arrowHead1.position.set(0.35, 0.18, 0);
      arrowHead1.rotation.z = -Math.PI / 2;
      arrow1.add(arrowHead1);
      
      // Arrow 2 (bottom)
      const arrow2 = new THREE.Group();
      
      // Arrow body - thicker
      const arrowLine2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.15, 0.15),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
      );
      arrowLine2.position.set(0, -0.18, 0);
      arrow2.add(arrowLine2);
      
      // Arrow head - larger
      const arrowHead2 = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.25, 8),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
      );
      arrowHead2.position.set(0.35, -0.18, 0);
      arrowHead2.rotation.z = -Math.PI / 2;
      arrow2.add(arrowHead2);
      
      // Increase size of the arrows
      arrow1.scale.set(1.5, 1.5, 1.5);
      arrow2.scale.set(1.5, 1.5, 1.5);
      
      symbolGroup.add(arrow1);
      symbolGroup.add(arrow2);
    }
    
    // Move symbol slightly further forward for better visibility
    symbolGroup.position.z = 0.3; // Increased from 0.2 to 0.3
    
    // Create a billboard effect to make symbol always face camera
    const billboardGroup = new THREE.Group();
    billboardGroup.add(symbolGroup);
    
    // Mark it as a billboard for the rendering system
    (billboardGroup as any).isBillboard = true;
    billboardGroup.name = 'billboard';
    
    group.add(billboardGroup);
    
    // First ring (horizontal orientation - XZ plane)
    const ring1Geometry = new THREE.TorusGeometry(1.5, 0.15, 8, 48);
    const ring1Material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      emissive: renderable.color,
      emissiveIntensity: 1.0,
    });
    const ring1 = new THREE.Mesh(ring1Geometry, ring1Material);
    ring1.rotation.x = Math.PI / 2; // This makes it lie flat on the XZ plane
    ring1.name = 'horizontalRing';
    group.add(ring1);
    
    // Second ring (vertical orientation - XY plane)
    const ring2Geometry = new THREE.TorusGeometry(1.5, 0.15, 8, 48);
    const ring2Material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      emissive: renderable.color,
      emissiveIntensity: 1.0,
    });
    const ring2 = new THREE.Mesh(ring2Geometry, ring2Material);
    // No rotation needed, torus is already in XY plane by default
    ring2.name = 'verticalRing';
    group.add(ring2);
    
    // Add auto-rotation to both rings on orthogonal axes - ensure both rotation properties are properly set
    ring1.userData = { 
      autoRotate: {
        speed: Math.PI * 1.5, // Rotate at 1.5π radians per second (fast)
        axis: 'y'  // Rotate around Y axis
      }
    };
    
    ring2.userData = {
      autoRotate: {
        speed: Math.PI * 1.2, // Slightly different speed for visual interest
        axis: 'z'  // Rotate around Z axis - orthogonal to ring1's Y axis
      }
    };
    
    // Also set using standard property to ensure compatibility
    (ring1 as any).autoRotate = { ...ring1.userData.autoRotate };
    (ring2 as any).autoRotate = { ...ring2.userData.autoRotate };
    
    // Add slight random motion to the orb position without changing initial Y
    const floatHeight = 0.2;
    const floatSpeed = 1.5;
    
    // Don't store position.y (which is 0 at mesh creation time)
    // We'll get the actual position from the entity later in RenderingSystem
    (group as any).floatData = {
      startTime: Date.now(),
      originalY: null, // Will be set the first time the rendering system updates
      height: floatHeight,
      speed: floatSpeed,
      initialized: false // Flag to track if we've initialized with real position
    };
    
    // Apply scale
    group.scale.set(renderable.scale, renderable.scale, renderable.scale);
    
    return group;
  }

  private static createStarfieldMesh(renderable: Renderable): THREE.Object3D {
    const group = new THREE.Group();
    
    // Get the World instance to access StarfieldBackground component data
    const world = (window as any).gameWorld;
    
    // Find the entity with the StarfieldBackground component
    const entities = world ? world.getEntitiesWith(['StarfieldBackground']) : [];
    if (entities.length === 0) {
      console.warn('No entity with StarfieldBackground component found');
      return group;
    }
    
    const starfieldConfig = world.getComponent(entities[0], 'StarfieldBackground');
    if (!starfieldConfig) {
      console.warn('StarfieldBackground component not found on entity');
      return group;
    }
    
    const radius = starfieldConfig.starfieldRadius || 900.0;
    
    // Create stars
    const starCount = starfieldConfig.starCount || 2000;
    const starSize = starfieldConfig.starSize || 1.0;
    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    const starColors = [];
    const starSizes = [];
    
    // Generate random stars across the sphere
    for (let i = 0; i < starCount; i++) {
      // Use random spherical coordinates for uniform distribution on a sphere
      const phi = Math.acos(2 * Math.random() - 1); // Latitude
      const theta = 2 * Math.PI * Math.random();    // Longitude
      
      // Convert to Cartesian coordinates
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      starVertices.push(x, y, z);
      
      // Randomly select colors (mostly white/blue, some yellow/red for variety)
      const colorType = Math.random();
      let r, g, b;
      
      if (colorType < 0.7) {
        // White/blue stars (most common)
        r = 0.8 + Math.random() * 0.2;
        g = 0.8 + Math.random() * 0.2;
        b = 0.9 + Math.random() * 0.1;
      } else if (colorType < 0.9) {
        // Yellow stars
        r = 0.9 + Math.random() * 0.1;
        g = 0.8 + Math.random() * 0.2;
        b = 0.4 + Math.random() * 0.3;
      } else {
        // Red stars (less common)
        r = 0.9 + Math.random() * 0.1;
        g = 0.2 + Math.random() * 0.3;
        b = 0.2 + Math.random() * 0.2;
      }
      
      starColors.push(r, g, b);
      
      // Random star sizes with some variation
      starSizes.push(Math.random() * 2 + 0.5);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));
    
    // Create a shader material for the stars
    const starMaterial = new THREE.PointsMaterial({
      size: starSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    group.add(stars);
    
    // Create distant galaxies - use large sprites
    const galaxyCount = starfieldConfig.galaxyCount || 25;
    const galaxySize = starfieldConfig.galaxySize || 150.0;
    
    // Create a shared galaxy texture
    const galaxyTexture = this.createGalaxyTexture(256);
    
    for (let i = 0; i < galaxyCount; i++) {
      // Random position on the sphere
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      
      const x = radius * 0.8 * Math.sin(phi) * Math.cos(theta);
      const y = radius * 0.8 * Math.sin(phi) * Math.sin(theta);
      const z = radius * 0.8 * Math.cos(phi);
      
      // Create a galaxy sprite with custom material
      const spriteMaterial = new THREE.SpriteMaterial({
        map: galaxyTexture,
        color: this.getRandomGalaxyColor(),
        transparent: true,
        opacity: 0.3, // Reduced from 0.7 to 0.3 for more transparency
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false // Important! Make sure galaxies are always visible
      });
      
      const sprite = new THREE.Sprite(spriteMaterial);
      
      // Position the sprite
      sprite.position.set(x, y, z);
      
      // Make galaxies much larger
      const scale = (Math.random() * 0.4 + 1.2) * galaxySize;
      sprite.scale.set(scale, scale, 1);
      
      // Random rotation for variety
      sprite.material.rotation = Math.random() * Math.PI * 2;
      
      // Add galaxy to group
      group.add(sprite);
    }
    
    return group;
  }
  
  // Create a more realistic galaxy texture with spiral arms
  private static createGalaxyTexture(size: number = 256): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2;
    
    // Fill with transparent black background
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create bright core with gradient - reduced brightness
    const coreGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius * 0.3
    );
    coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)'); // Reduced from 1.0 to 0.8
    coreGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.4)'); // Reduced from 0.6 to 0.4
    coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)'); // Reduced from 0.1 to 0.05
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Create outer disc with gradient - reduced brightness
    const discGradient = ctx.createRadialGradient(
      centerX, centerY, radius * 0.3,
      centerX, centerY, radius
    );
    discGradient.addColorStop(0, 'rgba(200, 200, 255, 0.2)'); // Reduced from 0.4 to 0.2
    discGradient.addColorStop(0.7, 'rgba(180, 180, 255, 0.05)'); // Reduced from 0.1 to 0.05
    discGradient.addColorStop(1, 'rgba(150, 150, 255, 0)');
    
    ctx.fillStyle = discGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add spiral arms - reduced brightness
    ctx.globalCompositeOperation = 'lighter';
    
    const armCount = 2 + Math.floor(Math.random() * 2); // 2-3 arms
    const armWidth = 0.2 + Math.random() * 0.1;
    const rotation = Math.random() * Math.PI * 2;
    const tightness = 3 + Math.random() * 2; // How tightly wound the spiral is
    
    for (let a = 0; a < armCount; a++) {
      const armAngle = (a / armCount) * Math.PI * 2 + rotation;
      
      // Draw the arm using many small particles
      for (let r = radius * 0.3; r < radius * 0.95; r += 2) {
        // Calculate angle based on distance from center (logarithmic spiral)
        const angle = armAngle + (r / radius) * tightness;
        
        // Position along the spiral arm
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        
        // Calculate perpendicular direction for arm width
        const perpX = -Math.sin(angle);
        const perpY = Math.cos(angle);
        
        // Thickness of arm decreases with distance
        const thickness = armWidth * (1 - r / radius) * radius * 0.5;
        
        // Add some fuzziness/randomness to the arm
        for (let p = 0; p < 3; p++) {
          // Random offset perpendicular to the arm direction
          const offsetDist = (Math.random() - 0.5) * thickness;
          const offsetX = perpX * offsetDist;
          const offsetY = perpY * offsetDist;
          
          // Random brightness decreasing with distance - reduced overall brightness
          const brightness = (1 - 0.7 * (r / radius)) * (0.3 + Math.random() * 0.3); // Reduced from 0.5-1.0 to 0.3-0.6
          const size = 1 + Math.random() * 2 + (1 - r / radius) * 3; // Slightly reduced particle size
          
          // Draw particle
          ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
          ctx.beginPath();
          ctx.arc(x + offsetX, y + offsetY, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    // Add some random stars throughout - fewer and less bright
    for (let i = 0; i < 70; i++) { // Reduced from 100 to 70
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius * 0.9;
      
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);
      
      const size = 0.5 + Math.random() * 1.5; // Reduced size
      const brightness = 0.3 + Math.random() * 0.3; // Reduced from 0.5-1.0 to 0.3-0.6
      
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
  
  // Helper to get random galaxy colors
  private static getRandomGalaxyColor(): number {
    const colors = [
      0xCCCCDD, // Very light blue-gray
      0xDDDDEE, // Even lighter blue
      0xEEEEDD, // Light cream
      0xDDDDDD, // Light gray
      0xE0E0E8  // Light blue-gray
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private static createCentralStarMesh(renderable: Renderable): THREE.Object3D {
    const group = new THREE.Group();
    
    // Create the core of the star - a sphere with emissive material
    const coreGeometry = new THREE.SphereGeometry(1, 32, 32);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: renderable.color || COLORS.STAR_CORE,
      emissive: renderable.color || COLORS.STAR_CORE,
      emissiveIntensity: 1.8,
      metalness: 0.0,
      roughness: 0.1,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);
    
    // Add a tighter inner glow around the star
    const glowGeometry = new THREE.SphereGeometry(1.3, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.STAR_GLOW,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);
    
    // Add a secondary glow layer - now closer to core
    const outerGlowGeometry = new THREE.SphereGeometry(1.4, 32, 32);
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.STAR_GLOW,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
    });
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    group.add(outerGlow);
    
    // Add a tertiary glow layer - also closer to core
    const farGlowGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const farGlowMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.STAR_GLOW,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
    });
    const farGlow = new THREE.Mesh(farGlowGeometry, farGlowMaterial);
    group.add(farGlow);
    
    // Add a point light as the light source with increased range
    const light = new THREE.PointLight(COLORS.STAR_LIGHT, 4.0, 800);
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    group.add(light);
    
    // Apply scale
    group.scale.set(renderable.scale, renderable.scale, renderable.scale);
    
    return group;
  }

  private static createPortalMesh(renderable: Renderable): THREE.Object3D {
    const group = new THREE.Group();
    
    // Create the main portal ring
    const ringGeometry = new THREE.TorusGeometry(1, 0.1, 16, 100);
    const ringMaterial = new THREE.MeshPhongMaterial({
      color: renderable.color,
      emissive: renderable.color,
      emissiveIntensity: 0.5,
      shininess: 100,
      transparent: true,
      opacity: 0.8
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2; // Match the inner field's orientation
    group.add(ring);
    
    // Add energy field inside the ring
    const fieldGeometry = new THREE.CircleGeometry(0.9, 32);
    const fieldMaterial = new THREE.MeshPhongMaterial({
      color: renderable.color,
      emissive: renderable.color,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    field.rotation.x = -Math.PI / 2; // Lay flat
    group.add(field);
    
    // Add text above the portal
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      canvas.width = 256;
      canvas.height = 64;
      
      // Fill with transparent background
      context.fillStyle = 'rgba(0, 0, 0, 0)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Set text style
      context.font = 'bold 24px "Press Start 2P", monospace';
      context.fillStyle = '#' + renderable.color.toString(16).padStart(6, '0');
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      
      // Draw text
      context.fillText('VIBEVERSE', canvas.width / 2, canvas.height / 2);
      
      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      const textGeometry = new THREE.PlaneGeometry(0.8, 0.2);
      const textMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.y = 0.1; // Position inside the portal
      textMesh.rotation.x = -Math.PI / 2; // Match portal orientation
      textMesh.rotation.z = -Math.PI / 2; // Rotate text to be right-side up
      group.add(textMesh);
    }
    
    // Add energy particles
    const particleCount = 50;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Random position within the ring
      const radius = Math.random() * 0.8;
      const angle = Math.random() * Math.PI * 2;
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = (Math.random() - 0.5) * 0.2; // Slight vertical spread
      positions[i3 + 2] = Math.sin(angle) * radius;
      
      // Color based on portal color
      const color = new THREE.Color(renderable.color);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    
    const particleSystem = new THREE.Points(particles, particleMaterial);
    group.add(particleSystem);
    
    // Add energy arcs
    const arcCount = 8;
    for (let i = 0; i < arcCount; i++) {
      const arcGeometry = new THREE.BufferGeometry();
      const arcPoints = [];
      const segments = 10;
      
      for (let j = 0; j <= segments; j++) {
        const t = j / segments;
        const angle = (i / arcCount) * Math.PI * 2 + t * Math.PI * 2;
        const radius = 0.8 + Math.sin(t * Math.PI * 4) * 0.1;
        arcPoints.push(
          Math.cos(angle) * radius,
          Math.sin(t * Math.PI * 2) * 0.1,
          Math.sin(angle) * radius
        );
      }
      
      arcGeometry.setAttribute('position', new THREE.Float32BufferAttribute(arcPoints, 3));
      
      const arcMaterial = new THREE.LineBasicMaterial({
        color: renderable.color,
        transparent: true,
        opacity: 0.5
      });
      
      const arc = new THREE.Line(arcGeometry, arcMaterial);
      group.add(arc);
    }
    
    // Apply scale
    group.scale.set(renderable.scale, renderable.scale, renderable.scale);
    
    return group;
  }
} 