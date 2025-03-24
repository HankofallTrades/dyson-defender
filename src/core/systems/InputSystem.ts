// src/core/systems/InputSystem.ts
import * as THREE from 'three';
import { World, System } from '../World';
import { Velocity, InputReceiver } from '../components';
import { SceneManager } from '../../rendering/SceneManager';

export class InputSystem implements System {
  private sceneManager: SceneManager;
  private world: World;
  private readonly BASE_SPEED = 20.0;

  constructor(sceneManager: SceneManager, world: World) {
    this.sceneManager = sceneManager;
    this.world = world;
  }

  public update(deltaTime: number): void {
    const inputState = this.sceneManager.getInputState();
    const hasInput = Object.values(inputState).some(v => v);
    
    const entities = this.world.getEntitiesWith(['InputReceiver', 'Velocity']);
    
    if (entities.length === 0) {
      return;
    }
    
    for (const entity of entities) {
      const velocity = this.world.getComponent<Velocity>(entity, 'Velocity');
      if (velocity) {
        // Get direction from input
        const inputDirection = {
          x: inputState.left ? -1 : inputState.right ? 1 : 0,
          y: inputState.down ? -1 : inputState.up ? 1 : 0,
          z: inputState.backward ? 1 : inputState.forward ? -1 : 0
        };
        
        // If there's input, directly set the velocity based on input direction
        if (inputDirection.x !== 0 || inputDirection.y !== 0 || inputDirection.z !== 0) {
          const direction = new THREE.Vector3(
            inputDirection.x, 
            inputDirection.y, 
            inputDirection.z
          ).normalize();
          
          // Set velocity based on direction and speed
          velocity.x = direction.x * this.BASE_SPEED;
          velocity.y = direction.y * this.BASE_SPEED;
          velocity.z = direction.z * this.BASE_SPEED;
        }
      }
    }
  }
}