import * as THREE from 'three';
import { World } from '../World';
import { Position, Renderable, Health, AutoRotate, Rotation } from '../components';

export function createDysonSphere(world: World, scene: THREE.Scene): number {
  const entity = world.createEntity();

  const group = new THREE.Group();
  const outerGeometry = new THREE.SphereGeometry(50, 32, 32);
  const outerMaterial = new THREE.MeshStandardMaterial({
    color: 0x3388ff,
    metalness: 0.7,
    roughness: 0.2,
    emissive: 0x112244,
    wireframe: true,
  });
  const outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
  group.add(outerMesh);

  const innerGeometry = new THREE.SphereGeometry(48, 32, 32);
  const innerMaterial = new THREE.MeshStandardMaterial({
    color: 0x0055aa,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });
  const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
  group.add(innerMesh);

  scene.add(group);

  world.addComponent(entity, 'Position', { x: 0, y: 0, z: 0 });
  world.addComponent(entity, 'Rotation', { x: 0, y: 0, z: 0 });
  world.addComponent(entity, 'Renderable', { mesh: group });
  world.addComponent(entity, 'Health', { current: 100, max: 100 });
  world.addComponent(entity, 'AutoRotate', { speedX: 0, speedY: 0.05, speedZ: 0 });

  return entity;
} 