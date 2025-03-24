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
