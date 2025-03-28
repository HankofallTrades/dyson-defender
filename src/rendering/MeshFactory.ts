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
    // Create the appropriate mesh based on the model type
    if (renderable.modelId === 'player') {
      return this.createPlayerShipMesh(renderable);
    } else if (renderable.modelId === 'dysonSphere') {
      return this.createDysonSphereMesh(renderable);
    } else if (renderable.modelId === 'laser') {
      return this.createLaserMesh(renderable);
    } else if (renderable.modelId === 'grunt') {
      return this.createGruntMesh(renderable);
    } else if (renderable.modelId === 'shieldGuardian') {
      return this.createShieldGuardianMesh(renderable);
    } else if (renderable.modelId === 'shieldBubble') {
      return this.createShieldBubbleMesh(renderable);
    } else if (renderable.modelId === 'warpRaider') {
      return this.createWarpRaiderMesh(renderable);
    } else if (renderable.modelId === 'asteroid') {
      return this.createAsteroidMesh(renderable);
    } else if (renderable.modelId === 'powerUpOrb') {
      return this.createPowerUpOrbMesh(renderable);
    } else {
      return this.createDefaultMesh(renderable);
    }
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
    
    // Outer wireframe sphere
    const outerGeometry = new THREE.SphereGeometry(50, 32, 32);
    const outerMaterial = new THREE.MeshStandardMaterial({
      color: renderable.color || COLORS.DYSON_PRIMARY,
      metalness: 0.7,
      roughness: 0.2,
      emissive: COLORS.DYSON_EMISSIVE,
      wireframe: true,
    });
    const outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
    group.add(outerMesh);
    
    // Inner transparent sphere
    const innerGeometry = new THREE.SphereGeometry(48, 32, 32);
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.DYSON_SECONDARY,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    group.add(innerMesh);
    
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
    
    // Add a subtle outer glow using a slightly larger, transparent head
    const glowGeometry = headGeometry.clone();
    const glowMaterial = new THREE.MeshPhongMaterial({
      color: COLORS.GRUNT_GLOW,
      transparent: true,
      opacity: 0.3,
      shininess: 20,
      emissive: COLORS.GRUNT_GLOW,
      emissiveIntensity: 0.2
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.scale.set(1.1, 1.1, 1.1); // Slightly larger than the head
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
      for (let j = 0; j < vertexPositions.length; j += 3) {
        const progress = j / vertexPositions.length;
        const scale = Math.pow(1 - progress, 1.5); // More aggressive taper towards tip
        vertexPositions[j] *= scale;
        vertexPositions[j + 2] *= scale;
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();

      const tentacleMesh = new THREE.Mesh(geometry, tentacleMaterial);
      
      // Add to the tentacle group
      tentacleGroup.add(tentacleMesh);
      meshes.push(tentacleMesh);
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
      opacity: 0.4, // Moderate opacity
      side: THREE.DoubleSide,
      emissive: 0x0088ff, // Blue emissive for glow
      emissiveIntensity: 0.5,
      shininess: 100,
      specular: 0xffffff,
      flatShading: false,
    });
    const shieldMesh = new THREE.Mesh(icosaGeometry, shieldMaterial);
    group.add(shieldMesh);
    
    // Inner energy field
    const innerGeometry = new THREE.SphereGeometry(0.94, 32, 32);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0x66ffff, 
      transparent: true,
      opacity: 0.3,
    });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    group.add(innerMesh);
    
    // Add hexagonal grid pattern covering the entire surface with outlines
    const hexGroup = new THREE.Group();
    
    // Use Fibonacci lattice for even distribution on a sphere
    const hexCount = 300; // Increased number for better coverage
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
        color: 0x33ffff,
        transparent: true,
        opacity: 0.2, // Very transparent, barely visible
      });
      
      // Create line loop
      const hexagon = new THREE.Line(geometry, material);
      
      // Position on the sphere at the given position
      hexagon.position.copy(position);
      
      // Orient to face outward from the sphere center
      hexagon.lookAt(new THREE.Vector3(0, 0, 0));
      
      return hexagon;
    };
    
    for (let i = 0; i < hexCount; i++) {
      // Fibonacci lattice calculations to evenly distribute points on a sphere
      const y = 1 - (i / (hexCount - 1)) * 2; // y goes from 1 to -1
      const radius = Math.sqrt(1 - y * y); // radius at y position
      
      const theta = 2 * Math.PI * i / goldenRatio; // Golden angle in radians
      
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      
      // Position on the sphere
      const position = new THREE.Vector3(x, y, z);
      
      // Size based on position (slightly smaller near poles)
      const size = 0.05 - Math.abs(y) * 0.02;
      
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
} 