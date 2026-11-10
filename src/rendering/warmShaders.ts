import * as THREE from 'three';
import { MeshFactory } from './MeshFactory';

/**
 * Shader warm-up.
 *
 * Three.js compiles a shader program the first time a material variant is drawn, which
 * stalls that frame (100-300ms here). Without warm-up that happens mid-fight: the first
 * grunt, power-up, explosion or lightning strike each freezes the game.
 *
 * This builds one of every mesh and effect material the game uses, compiles them against
 * the live scene (so the light setup matches), and keeps them alive. Live objects keep
 * their programs referenced, so effects that are created and disposed during play reuse
 * them instead of recompiling.
 *
 * Effect materials mirror those in AnimationSystem and WeaponSystem. If you add a material
 * with a new combination of type / transparency / side / blending / map, add it here.
 */

const ENTITY_MODELS: Array<{ modelId: string; variant?: string }> = [
  { modelId: 'grunt' },
  { modelId: 'laser' },
  { modelId: 'shieldGuardian' },
  { modelId: 'shieldBubble' },
  { modelId: 'warpRaider' },
  { modelId: 'asteroid' },
  { modelId: 'powerUpOrb', variant: 'fireRate' },
  { modelId: 'powerUpOrb', variant: 'speed' },
  { modelId: 'powerUpOrb', variant: 'health' },
];

const effectMaterials = (): Array<{ material: THREE.Material; kind: 'mesh' | 'line' | 'points' }> => {
  const additive = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false };
  return [
    { kind: 'mesh', material: new THREE.MeshBasicMaterial() },
    { kind: 'mesh', material: new THREE.MeshBasicMaterial({ transparent: true }) },
    { kind: 'mesh', material: new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide }) },
    { kind: 'mesh', material: new THREE.MeshBasicMaterial({ ...additive }) },
    { kind: 'mesh', material: new THREE.MeshBasicMaterial({ ...additive, side: THREE.DoubleSide, depthTest: false }) },
    { kind: 'mesh', material: new THREE.MeshPhongMaterial({ transparent: true }) },
    { kind: 'mesh', material: new THREE.MeshPhongMaterial({ ...additive, side: THREE.DoubleSide, depthTest: false }) },
    { kind: 'line', material: new THREE.LineBasicMaterial() },
    { kind: 'line', material: new THREE.LineBasicMaterial({ transparent: true }) },
    { kind: 'line', material: new THREE.LineBasicMaterial({ ...additive, depthTest: false }) },
    { kind: 'points', material: new THREE.PointsMaterial({ ...additive }) },
  ];
};

let warmGroup: THREE.Group | null = null;

const buildWarmGroup = (): THREE.Group => {
  const group = new THREE.Group();
  for (const { modelId, variant } of ENTITY_MODELS) {
    group.add(MeshFactory.createMesh({ modelId, variant, scale: 1, color: 0xffffff }));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 1, 0, 1, 0, 0], 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  for (const { material, kind } of effectMaterials()) {
    if (kind === 'mesh') group.add(new THREE.Mesh(geometry, material));
    else if (kind === 'line') group.add(new THREE.Line(geometry, material));
    else group.add(new THREE.Points(geometry, material));
  }
  return group;
};

/**
 * Compile every shader the game will need, against the current scene and lights.
 * Call once the scene's permanent lights and meshes are in place.
 */
export const warmShaders = (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera): void => {
  warmGroup ??= buildWarmGroup();
  scene.add(warmGroup);
  renderer.compile(scene, camera);
  scene.remove(warmGroup);
};
