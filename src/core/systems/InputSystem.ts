// src/core/systems/InputSystem.ts
import * as THREE from 'three';
import { World, System } from '../World';
import { Velocity, InputReceiver } from '../components';
import { SceneManager } from '../../rendering/SceneManager';

export class InputSystem implements System {
  private sceneManager: SceneManager;
  private world: World;

  constructor(sceneManager: SceneManager, world: World) {
    this.sceneManager = sceneManager;
    this.world = world;
  }

  public update(deltaTime: number): void {
    const inputState = this.sceneManager.getInputState();
    const entities = this.world.getEntitiesWith(['InputReceiver', 'Velocity']);
    for (const entity of entities) {
      const velocity = this.world.getComponent<Velocity>(entity, 'Velocity');
      if (velocity) {
        velocity.x = inputState.left ? -1 : inputState.right ? 1 : 0;
        velocity.y = inputState.down ? -1 : inputState.up ? 1 : 0;
        velocity.z = inputState.backward ? 1 : inputState.forward ? -1 : 0;

        const speed = 10;
        const direction = new THREE.Vector3(velocity.x, velocity.y, velocity.z).normalize();
        velocity.x = direction.x * speed;
        velocity.y = direction.y * speed;
        velocity.z = direction.z * speed;
      }
    }
  }
}