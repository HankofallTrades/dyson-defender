// src/core/systems/MovementSystem.ts
import { System, World } from '../World';
import { Position, Velocity, InputReceiver } from '../components';
import { SceneManager } from '../../rendering/SceneManager';

export class MovementSystem implements System {
  private sceneManager: SceneManager;
  private world: World;
  private readonly MOVEMENT_SPEED = 0.5;
  private readonly MAX_SPEED = 2.0;
  private readonly MIN_DISTANCE = 20; // Minimum distance from Dyson Sphere
  private readonly MAX_DISTANCE = 100; // Maximum distance from Dyson Sphere

  constructor(sceneManager: SceneManager, world: World) {
    this.sceneManager = sceneManager;
    this.world = world;
  }

  update(deltaTime: number): void {
    const entities = this.world.getEntitiesWith(['Position', 'Velocity', 'InputReceiver']);
    const inputState = this.sceneManager.getInputState();

    for (const entity of entities) {
      const position = this.world.getComponent<Position>(entity, 'Position');
      const velocity = this.world.getComponent<Velocity>(entity, 'Velocity');

      if (!position || !velocity) continue;

      // Calculate movement based on input
      const movement = {
        x: (inputState.right ? 1 : 0) - (inputState.left ? 1 : 0),
        y: (inputState.up ? 1 : 0) - (inputState.down ? 1 : 0),
        z: (inputState.forward ? 1 : 0) - (inputState.backward ? 1 : 0)
      };

      // Apply movement to velocity
      velocity.x += movement.x * this.MOVEMENT_SPEED * deltaTime;
      velocity.y += movement.y * this.MOVEMENT_SPEED * deltaTime;
      velocity.z += movement.z * this.MOVEMENT_SPEED * deltaTime;

      // Apply speed limits
      const speed = Math.sqrt(
        velocity.x * velocity.x + 
        velocity.y * velocity.y + 
        velocity.z * velocity.z
      );

      if (speed > this.MAX_SPEED) {
        const scale = this.MAX_SPEED / speed;
        velocity.x *= scale;
        velocity.y *= scale;
        velocity.z *= scale;
      }

      // Apply friction
      const friction = 0.95;
      velocity.x *= friction;
      velocity.y *= friction;
      velocity.z *= friction;

      // Update position
      position.x += velocity.x * deltaTime;
      position.y += velocity.y * deltaTime;
      position.z += velocity.z * deltaTime;

      // Enforce distance limits from Dyson Sphere
      const distanceFromCenter = Math.sqrt(
        position.x * position.x + 
        position.y * position.y + 
        position.z * position.z
      );

      if (distanceFromCenter < this.MIN_DISTANCE) {
        const scale = this.MIN_DISTANCE / distanceFromCenter;
        position.x *= scale;
        position.y *= scale;
        position.z *= scale;
      } else if (distanceFromCenter > this.MAX_DISTANCE) {
        const scale = this.MAX_DISTANCE / distanceFromCenter;
        position.x *= scale;
        position.y *= scale;
        position.z *= scale;
      }
    }
  }
}