// src/types/meshDefinitions.ts
// Defines the structure and properties of meshes used in the game

/**
 * MeshType - Identifiers for different types of meshes in the game
 */
export enum MeshType {
  DYSON_SPHERE = 'dysonSphere',
  PLAYER_SHIP = 'playerShip',
  GRUNT = 'grunt',
  LASER = 'laser',
  DEBRIS = 'debris'
}

/**
 * MeshParams - Parameters for creating meshes
 * Can be extended with additional parameters for specific mesh types
 */
export interface MeshParams {
  type: MeshType;
  scale?: number;
  color?: number;
  segments?: number;
  detail?: number;
  wireframe?: boolean;
  emissiveIntensity?: number;
  opacity?: number;
  customProperties?: Record<string, any>;
}

/**
 * Model definitions can be expanded to include different
 * rendering paths, customization options, etc.
 */
export const DEFAULT_MESH_PARAMS: Record<MeshType, Partial<MeshParams>> = {
  [MeshType.DYSON_SPHERE]: {
    scale: 1.0,
    segments: 32,
    wireframe: true
  },
  [MeshType.PLAYER_SHIP]: {
    scale: 2.0
  },
  [MeshType.GRUNT]: {
    scale: 3.0,
    segments: 32
  },
  [MeshType.LASER]: {
    scale: 0.5,
    emissiveIntensity: 2.0
  },
  [MeshType.DEBRIS]: {
    scale: 0.5
  }
};

/**
 * In a more advanced implementation, mesh definitions could include:
 * - Paths to actual 3D model files
 * - Material properties
 * - Animation definitions
 * - Particle effects
 * - Sound effects for model interactions
 */ 