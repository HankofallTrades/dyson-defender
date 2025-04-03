Below is a generalized implementation strategy for introducing new enemy types to *Dyson Defender*, a 3D space shooter built with an Entity-Component-System (ECS) architecture. This strategy ensures that new enemies integrate seamlessly into the existing codebase, maintain modularity, and adhere to the ECS pattern outlined in the project’s design rules. The approach is designed to be repeatable and scalable, allowing developers to add diverse enemy types efficiently.

---

## Implementation Strategy for Adding New Enemy Types

### 1. Define Enemy Characteristics
- **Objective**: Establish what makes the new enemy unique compared to existing types (e.g., the `GruntEntity`).
- **Steps**:
  - Identify key attributes such as:
    - **Movement Patterns**: Does it move faster, dodge, or follow a specific path?
    - **Attack Mechanisms**: Does it shoot projectiles, ram the Dyson Sphere, or have a special ability?
    - **Appearance**: What visual design distinguishes it (e.g., size, shape, color)?
    - **Stats**: Health, speed, damage output, etc.
  - Example: A "FastDodger" enemy might move quickly, evade player lasers, and have a sleek, angular design.
- **Output**: A clear specification of the enemy’s behavior, visuals, and stats.

### 2. Create an Entity Factory Function
- **Objective**: Define the new enemy type as an entity within the ECS framework.
- **Location**: `src/core/entities/`
- **Steps**:
  - Create a new file, e.g., `FastDodgerEntity.ts`.
  - Implement a factory function that:
    - Creates a unique entity ID using `world.createEntity()`.
    - Adds required components (e.g., `Position`, `Velocity`, `Health`, `Renderable`, `Enemy`, `Collider`).
    - Configures component values based on the enemy’s characteristics (e.g., higher speed in `Velocity`).
    - Returns the entity ID.
  - Include a `dispose()` method for cleanup, adhering to the ECS pattern rules.
- **Example**:
  ```typescript
  // src/core/entities/FastDodgerEntity.ts
  import { World } from '../World';
  import { COLORS } from '../../constants/colors';

  export function createFastDodger(world: World): number {
    const entity = world.createEntity();
    world.addComponent(entity, 'Position', { x: 100, y: 0, z: 0 });
    world.addComponent(entity, 'Velocity', { x: -5, y: 0, z: 0 });
    world.addComponent(entity, 'Rotation', { x: 0, y: 0, z: 0 });
    world.addComponent(entity, 'Health', { value: 50, max: 50 });
    world.addComponent(entity, 'Renderable', { meshType: 'fastDodger' });
    world.addComponent(entity, 'Enemy', { type: 'fastDodger', attackDistance: 20 });
    world.addComponent(entity, 'Collider', { radius: 1 });
    return entity;
  }

  export function disposeFastDodger(world: World, entity: number) {
    world.removeEntity(entity);
  }
  ```

### 3. Component Management
- **Objective**: Ensure the new enemy uses existing components or define new ones for unique behaviors.
- **Location**: `src/core/components.ts`
- **Steps**:
  - Use existing components where possible (e.g., `Position`, `Health`).
  - For unique behaviors, define new components:
    - Example: A `Dodge` component for evasion behavior with properties like `dodgeCooldown` and `dodgeSpeed`.
    - Ensure components are pure data structures (no methods) and serializable, per ECS rules.
  - Example:
    ```typescript
    // src/core/components.ts
    export interface Dodge {
      dodgeCooldown: number; // Time between dodges (seconds)
      dodgeSpeed: number;    // Speed of dodge movement
      lastDodge: number;     // Timestamp of last dodge
    }
    ```
  - Add the new component in the factory function if needed:
    ```typescript
    world.addComponent(entity, 'Dodge', { dodgeCooldown: 2, dodgeSpeed: 10, lastDodge: 0 });
    ```

### 4. Update Systems to Handle the New Enemy
- **Objective**: Modify or extend systems to process the new enemy’s components and behaviors.
- **Location**: `src/core/systems/`
- **Steps**:
  - **Existing Systems**:
    - Update `MovementSystem` to handle unique movement (e.g., higher speed or dodging).
    - Update `EnemySystem` to manage the new enemy’s behavior (e.g., stopping at attack distance, targeting logic).
    - Update `CollisionSystem` to ensure proper collision detection with the new enemy’s `Collider`.
  - **New Systems** (if needed):
    - Create a system like `DodgeSystem` for the `Dodge` component:
      ```typescript
      // src/core/systems/DodgeSystem.ts
      import { World, System } from '../World';

      export class DodgeSystem implements System {
        constructor(private world: World) {}

        update(deltaTime: number) {
          const entities = this.world.getEntitiesWith(['Dodge', 'Velocity', 'Position']);
          for (const entity of entities) {
            const dodge = this.world.getComponent(entity, 'Dodge')!;
            const velocity = this.world.getComponent(entity, 'Velocity')!;
            if (Date.now() - dodge.lastDodge > dodge.dodgeCooldown * 1000) {
              velocity.y += dodge.dodgeSpeed; // Simple dodge upward
              dodge.lastDodge = Date.now();
            }
          }
        }
      }
      ```
    - Register the new system in `World.ts`:
      ```typescript
      world.addSystem(new DodgeSystem(world));
      ```
- **Considerations**: Ensure systems only process entities with the required components and avoid direct Three.js manipulation.

### 5. Implement Rendering
- **Objective**: Define how the new enemy looks in the game.
- **Location**: `src/rendering/MeshFactory.ts` and `src/core/systems/RenderingSystem.ts`
- **Steps**:
  - In `MeshFactory.ts`, add a new mesh creation function:
    ```typescript
    // src/rendering/MeshFactory.ts
    import * as THREE from 'three';
    import { COLORS } from '../constants/colors';

    export class MeshFactory {
      static createFastDodgerMesh(): THREE.Mesh {
        const geometry = new THREE.ConeGeometry(1, 2, 8);
        const material = new THREE.MeshBasicMaterial({ color: COLORS.ENEMY_FAST });
        return new THREE.Mesh(geometry, material);
      }
    }
    ```
  - In `RenderingSystem.ts`, update the rendering logic to recognize the new `meshType`:
    ```typescript
    if (renderable.meshType === 'fastDodger') {
      mesh = MeshFactory.createFastDodgerMesh();
    }
    ```
- **Considerations**: Use instancing for performance if multiple enemies of this type will appear simultaneously.

### 6. Integrate into the Wave System
- **Objective**: Add the new enemy to the game’s wave progression.
- **Location**: `src/core/systems/WaveSystem.ts`
- **Steps**:
  - Update the spawning logic to include the new enemy type:
    ```typescript
    // src/core/systems/WaveSystem.ts
    if (this.currentWave === 3) {
      for (let i = 0; i < 5; i++) {
        this.spawnEnemy('fastDodger');
      }
    }
    ```
  - Implement the `spawnEnemy` method to support the new type:
    ```typescript
    private spawnEnemy(type: string) {
      if (type === 'fastDodger') {
        const entity = createFastDodger(this.world);
        // Randomize spawn position
        const position = this.world.getComponent(entity, 'Position')!;
        position.x = Math.random() * 200 - 100;
        position.y = Math.random() * 200 - 100;
        position.z = Math.random() * 200 - 100;
      }
    }
    ```
  - Define spawn frequency and wave conditions (e.g., introduce "FastDodgers" in wave 3 with increasing numbers).

### 7. Testing and Balancing
- **Objective**: Verify the new enemy works as intended and fits the game’s balance.
- **Steps**:
  - Test in-game:
    - Confirm the enemy spawns, moves, attacks, and renders correctly.
    - Check for performance issues (e.g., frame rate drops with many instances).
  - Adjust parameters:
    - Tweak health, speed, or damage in the factory function for balance.
    - Example: Reduce `Health.value` to 30 if the enemy is too durable.
  - Validate ECS integrity:
    - Ensure no direct Three.js manipulation occurs outside `RenderingSystem`.
    - Verify component data remains serializable.

---

## Optimization Suggestions
- **Base Enemy Factory**: Create a reusable `createBaseEnemy` function in `src/core/entities/` to handle common components, reducing duplication:
  ```typescript
  function createBaseEnemy(world: World, type: string) {
    const entity = world.createEntity();
    world.addComponent(entity, 'Position', { x: 0, y: 0, z: 0 });
    world.addComponent(entity, 'Velocity', { x: 0, y: 0, z: 0 });
    world.addComponent(entity, 'Rotation', { x: 0, y: 0, z: 0 });
    world.addComponent(entity, 'Renderable', { meshType: type });
    world.addComponent(entity, 'Enemy', { type, attackDistance: 10 });
    world.addComponent(entity, 'Collider', { radius: 1 });
    return entity;
  }
  ```
  Then extend it in specific factories:
  ```typescript
  export function createFastDodger(world: World) {
    const entity = createBaseEnemy(world, 'fastDodger');
    world.addComponent(entity, 'Health', { value: 50, max: 50 });
    world.addComponent(entity, 'Velocity', { x: -5, y: 0, z: 0 });
    world.addComponent(entity, 'Dodge', { dodgeCooldown: 2, dodgeSpeed: 10, lastDodge: 0 });
    return entity;
  }
  ```
- **Data-Driven Waves**: Use a configuration file (e.g., JSON) for wave definitions to avoid hardcoding:
  ```json
  {
    "waves": [
      { "number": 3, "enemies": { "fastDodger": 5, "grunt": 2 } }
    ]
  }
  ```
- **Parameterized Meshes**: In `MeshFactory`, allow variations (e.g., color, scale) based on parameters to reuse mesh logic.

---

This strategy ensures new enemy types are added systematically, leveraging the ECS architecture for scalability and maintainability while aligning with *Dyson Defender*’s technical requirements and design principles.