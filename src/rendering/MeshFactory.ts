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
    switch (renderable.modelId) {
      case 'dysonSphere':
        return this.createDysonSphereMesh(renderable);
      case 'playerShip':
        return this.createPlayerShipMesh(renderable);
      case 'laser':
        return this.createLaserMesh(renderable);
      case 'grunt':
        return this.createGruntMesh(renderable);
      default:
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
    
    // Rotate the cylinder to point forward along the z-axis (90 degrees around X axis)
    // We need to use a group to handle the rotation correctly
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ 
      color: renderable.color || COLORS.LASER_GREEN,
      emissive: renderable.color || COLORS.LASER_GREEN,
      emissiveIntensity: 2.0,
      shininess: 100
    }));
    
    // Rotate the mesh to point along z-axis (cylinders are normally aligned with y-axis)
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
} 