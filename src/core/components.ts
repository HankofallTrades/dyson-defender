export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Velocity {
  x: number;
  y: number;
  z: number;
}

export interface Renderable {
  modelId: string;  // Identifier for the model to render
  scale: number;    // Scale of the model
  color: number;    // Color in hex format
}

export interface AutoRotate {
  speedX: number;
  speedY: number;
  speedZ: number;
}

export interface Rotation {
  x: number;
  y: number;
  z: number;
}

export interface Health {
  current: number;
  max: number;
}

export interface InputReceiver {
  // Marker component; could add data like control scheme later
}

export interface Transform {
  position: Position;
  rotation: Rotation;
  scale: number;
}

export interface Camera {
  offset: Position;  // Offset from the parent entity (ship)
  fov: number;      // Field of view
  near: number;     // Near clipping plane
  far: number;      // Far clipping plane
}

export interface MouseLook {
  sensitivity: number;  // Mouse movement sensitivity
  pitchMin: number;     // Minimum pitch angle (looking up)
  pitchMax: number;     // Maximum pitch angle (looking down)
  yaw: number;         // Current yaw angle (left/right)
  pitch: number;       // Current pitch angle (up/down)
}

export interface CameraMount {
  parentEntity: number;  // ID of the entity this camera is mounted to
}
