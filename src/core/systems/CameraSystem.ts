import * as THREE from 'three';
import { World, System } from '../World';
import { Camera, CameraMount, Position, Rotation } from '../components';
import { SceneManager } from '../../rendering/SceneManager';

export class CameraSystem implements System {
  private sceneManager: SceneManager;
  private world: World;
  private camera: THREE.PerspectiveCamera;

  constructor(sceneManager: SceneManager, world: World) {
    this.sceneManager = sceneManager;
    this.world = world;
    
    // Initialize with default values
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.sceneManager.setActiveCamera(this.camera);
  }

  update(deltaTime: number): void {
    // Find the camera entity
    const cameraEntities = this.world.getEntitiesWith(['Camera', 'CameraMount']);
    if (cameraEntities.length === 0) return;

    const cameraEntity = cameraEntities[0];
    const camera = this.world.getComponent<Camera>(cameraEntity, 'Camera');
    const cameraMount = this.world.getComponent<CameraMount>(cameraEntity, 'CameraMount');
    
    if (!camera || !cameraMount) return;

    // Update camera properties from component
    this.camera.fov = camera.fov;
    this.camera.near = camera.near;
    this.camera.far = camera.far;
    this.camera.updateProjectionMatrix();

    // Get the parent entity's position and rotation
    const parentEntity = cameraMount.parentEntity;
    const parentPosition = this.world.getComponent<Position>(parentEntity, 'Position');
    const parentRotation = this.world.getComponent<Rotation>(parentEntity, 'Rotation');
    
    if (!parentPosition || !parentRotation) return;

    // Simply position the camera at the parent's position
    this.camera.position.x = parentPosition.x;
    this.camera.position.y = parentPosition.y;
    this.camera.position.z = parentPosition.z;

    // Set up proper rotation order and method
    // This follows Three.js's expected rotation order: YXZ for FPS-style camera
    this.camera.rotation.order = 'YXZ';
    
    // Apply rotation as Euler angles for proper camera orientation
    this.camera.rotation.x = parentRotation.x; // Pitch
    this.camera.rotation.y = parentRotation.y; // Yaw
    this.camera.rotation.z = parentRotation.z; // Roll
    
    // Force camera matrix update
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld(true);
  }
} 