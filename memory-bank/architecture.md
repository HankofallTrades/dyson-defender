# Dyson Sphere Defender - Architecture (Updated)

## Project Structure

The game follows a modular architecture separating core game logic, rendering, and UI:

- `src/core/`: Core game logic and state management
  - `entities/`: Entity factory functions (e.g., `PlayerShipEntity.ts`, `GruntEntity.ts`)
  - `systems/`: Entity processing systems (e.g., `MovementSystem.ts`, `CollisionSystem.ts`)
  - `input/`: Input handling (`InputManager.ts`)
  - `components.ts`: Component definitions (pure data interfaces)
  - `World.ts`: ECS (Entity-Component-System) manager
  - `Game.ts`: Main game controller, orchestrates the game loop and systems
  - `State.ts`: Game state management
- `src/rendering/`: Three.js rendering logic
  - `SceneManager.ts`: Singleton managing the Three.js scene, camera, renderer, and lighting
  - `MeshFactory.ts`: Factory for creating and caching Three.js meshes for entities
- `src/ui/`: React UI components (e.g., HUD, menus)
- `src/constants/`: Game constants and configurations (e.g., `colors.ts`)
- `src/types/`: Shared TypeScript type definitions (e.g., `meshDefinitions.ts`)
- `src/assets/`: Static assets like models or textures

## Core Components

### Game Class (`src/core/Game.ts`)
- Initializes and coordinates the main game loop.
- Integrates core components like `World`, `SceneManager`, `InputManager`.
- Manages game state transitions (e.g., playing, paused, game over).
- Orchestrates the execution order of ECS systems.
- Implements frame-rate independent updates (`deltaTime`).

### World Class (`src/core/World.ts`) (ECS Manager)
- Manages entities, components, and systems based on the ECS pattern.
- Provides methods for creating/destroying entities (`createEntity`, `destroyEntity`).
- Handles adding/removing components from entities (`addComponent`, `removeComponent`).
- Stores component data efficiently.
- Provides querying capabilities to retrieve entities based on their components (`getEntitiesWith`).
- Executes the `update` method of all registered systems in a defined order each frame.

### SceneManager (`src/rendering/SceneManager.ts`)
- Singleton responsible for managing the Three.js environment.
- Handles scene creation, camera setup, renderer configuration, and lighting.
- Manages adding/removing Three.js objects (meshes, lights) to the scene.
- Handles viewport resizing and updates the renderer/camera accordingly.
- Provides access to the core Three.js objects (scene, camera, renderer).
- Implements resource cleanup for Three.js objects.

### MeshFactory (`src/rendering/MeshFactory.ts`)
- Responsible for creating and caching Three.js `Object3D` instances (meshes, groups) for different entity types.
- Uses entity component data (like `Renderable`) to determine the appearance.
- Implements the Factory pattern to centralize mesh creation logic.
- Supports various visual representations defined in `src/types/meshDefinitions.ts`.
- Provides methods to get or create meshes based on a model ID.

### InputManager (`src/core/input/InputManager.ts`)
- Manages user input from keyboard and mouse.
- Tracks the state of keys and mouse buttons (pressed, held, released).
- Provides methods for systems (like `InputSystem`) to query input state.
- Handles event listener setup and cleanup.

### State (`src/core/State.ts`)
- Defines and manages the overall game state (e.g., score, wave number, game status).
- Designed to be serializable for potential future networking.
- Provides methods or a structure for systems to read and modify game state.

## Systems (`src/core/systems/`)

Systems implement game logic by operating on entities possessing specific components. They are updated by the `World` class each frame.

- `AnimationSystem`: Manages entity animations defined by the `Animation` component. Handles different animation types like wormholes, explosions, lightning.
- `AutoRotateSystem`: Rotates entities based on the `AutoRotate` component.
- `CameraSystem`: Manages camera position and behavior, potentially following the player ship or using cinematic views. Uses `Camera` and `CameraMount` components.
- `CollisionSystem`: Detects and resolves collisions between entities with `Collider` components. Uses collision layers and types (sphere, box) to determine interactions and triggers events (e.g., damage).
- `DevSystem`: Provides debugging functionalities, potentially including a free camera controlled by `MouseLook`. Uses the `DevMode` component.
- `EnemySystem`: Controls AI behavior for entities with the `Enemy` component. Manages movement towards targets, attack patterns, and state changes.
- `FloatingScoreSystem`: Manages the display and lifecycle of `FloatingScore` entities.
- `HUDSystem`: Updates UI elements based on game state and entity components (e.g., `ScoreDisplay`, `WaveInfo`, `Reticle`, `Radar`, `DysonSphereStatus`). Interacts with React UI.
- `HealthBarSystem`: Manages the visibility and position of health bars for entities, using the `HealthBarComponent`.
- `InputSystem`: Processes player input via `InputManager` and updates relevant components (e.g., `Velocity` for `PlayerShipEntity`). Handles firing actions based on `LaserCooldown`.
- `MovementSystem`: Updates entity `Position` based on `Velocity` and `deltaTime`. Enforces boundaries. Handles boost logic using the `Boost` component.
- `PowerUpSystem`: Manages the lifecycle and effects of `PowerUp` entities and applies buffs/effects to the player or other entities.
- `RenderingSystem`: Creates, updates, and removes Three.js visual representations (meshes) for entities based on components like `Renderable`, `Position`, `Rotation`. Uses `MeshFactory` and `SceneManager`.
- `ShieldBubbleSystem`: Manages the behavior of shield bubbles, likely linked to `ShieldGuardianEntity`. Uses `ShieldBubbleComponent`.
- `ShieldSystem`: Manages shield regeneration and state for entities with the `Shield` component.
- `WaveSystem`: Manages the spawning of enemy waves based on configurations. Tracks wave progress, timing, and triggers new waves. Uses `WaveInfo` component.
- `WeaponSystem`: Handles weapon firing logic, projectile creation (`LaserEntity`), cooldowns (`LaserCooldown`), and projectile lifetime (`Projectile`).

## Components (`src/core/components.ts`)

Components are pure data structures defining the properties of entities.

- `Position`: World-space coordinates (x, y, z).
- `Velocity`: Movement vector (dx, dy, dz) per second.
- `Rotation`: Orientation (Euler angles or quaternion).
- `Renderable`: Defines visual appearance (model ID, scale, color, visibility).
- `Health`: Current and maximum health points.
- `AutoRotate`: Specifies automatic rotation speeds.
- `InputReceiver`: Marker for entities that accept player input.
- `Shield`: Defines shield properties (current, max, regeneration).
- `Transform`: Combines Position, Rotation, Scale (often used internally).
- `Camera`: Properties for a camera entity (FOV, near/far planes, offset).
- `MouseLook`: Controls camera orientation based on mouse movement (for dev/free camera).
- `CameraMount`: Links a camera entity to a parent entity.
- `Projectile`: Data for projectiles (speed, damage, lifetime, owner).
- `LaserCooldown`: Manages weapon firing rate.
- `Collider`: Defines physics collision shape (type, dimensions, layer, trigger status).
- `Enemy`: AI-specific data (target, speed, damage, state, cooldowns).
- `WaveInfo`: Tracks current wave status (number, enemies remaining).
- `UIDisplay`: Marker/data for entities represented in the UI.
- `HealthDisplay`: Links an entity to a UI health display element.
- `ScoreDisplay`: Holds the player's current score.
- `MessageDisplay`: Data for displaying temporary messages on screen.
- `DysonSphereStatus`: Tracks health/shield percentage for the Dyson Sphere UI.
- `DamageEffect`: Data for visual damage indicators.
- `GameStateDisplay`: Represents the current state of the game for UI.
- `GameOverStats`: Stores stats for the game over screen.
- `Reticle`: Properties for the aiming reticle UI.
- `Radar`: Data for the radar UI, including tracked entities.
- `FloatingScore`: Data for score popups when enemies are destroyed.
- `Boost`: Player ship boost properties (active, remaining time, cooldown).
- `Animation`: Defines an active animation on an entity (type, progress, duration).
- `WormholeAnimationData`, `ExplosionAnimationData`, `LightningAnimationData`, `GrowthAnimationData`: Specific data for different animation types.
- `ShieldComponent`: Represents a shield's hit points (distinct from regenerating `Shield`).
- `ShieldBubbleComponent`: Data for a protective shield bubble effect.
- `ShieldBarComponent`: Properties for displaying a shield bar UI element above an entity.
- `HealthBarComponent`: Properties for displaying a health bar UI element above an entity.
- `DevMode`: State for developer/debug mode.
- `PowerUp`: Data for collectible power-ups (type, duration, active status).

## Entities (`src/core/entities/`)

Entities are created by factory functions, combining various components.

- `AsteroidEntity`: Represents an asteroid obstacle/object. Components likely include Position, Velocity, Rotation, Renderable, Collider, Health.
- `CameraEntity`: Represents the main game camera. Components: Position, Rotation, Camera, CameraMount.
- `DevCameraEntity`: A separate camera for debugging/developer mode. Components: Position, Rotation, Camera, MouseLook.
- `DysonSphereEntity`: The central objective the player defends. Components: Position, Rotation, Renderable, Health, Shield, AutoRotate, Collider, DysonSphereStatus.
- `FloatingScoreEntity`: Temporary entity displaying score points. Components: Position, FloatingScore.
- `GruntEntity`: A basic enemy type. Components: Position, Velocity, Rotation, Renderable, Enemy, Target, Health, Collider.
- `HUDEntity`: An entity representing the Heads-Up Display. Components might include UIDisplay, ScoreDisplay, WaveInfo, Reticle, Radar, etc.
- `LaserEntity`: Projectile fired by the player ship. Components: Position, Velocity, Rotation, Renderable, Projectile, Collider.
- `PlayerShipEntity`: The player-controlled ship. Components: Position, Velocity, Rotation, Renderable, InputReceiver, LaserCooldown, Collider, Health, Boost, Reticle?.
- `PowerUpEntity`: Collectible item providing buffs. Components: Position, Renderable, Collider (as trigger), PowerUp.
- `ShieldGuardianEntity`: An enemy type that potentially generates shields. Components: Position, Velocity, Rotation, Renderable, Enemy, Health, Collider, ShieldComponent?.
- `WarpRaiderEntity`: Another enemy type, potentially with unique movement or attack. Components: Position, Velocity, Rotation, Renderable, Enemy, Health, Collider.
- `WormholeEntity`: Visual effect entity, likely used for spawning enemies. Components: Position, Renderable, Animation (Wormhole type).

*(Note: Component lists for entities are inferred and may need verification)*

## Technical Implementation

### State Management
- Core game state (`score`, `wave`, etc.) managed in `src/core/State.ts` or via specific components on singleton entities (like `HUDEntity`).
- Entity state managed via Components within the `World`.
- UI state managed by React components in `src/ui/`.
- Aim for serializable state where possible.

### Performance Optimization
- ECS architecture provides efficient entity/component querying.
- Frame-rate independent logic via `deltaTime`.
- `MeshFactory` for potential mesh caching/instancing.
- Minimize object allocations/deallocations in critical loops (systems).
- Proper resource disposal in `SceneManager` and `RenderingSystem`.

### Resource Management
- `SceneManager` handles cleanup of Three.js objects (geometries, materials, textures).
- `MeshFactory` manages mesh lifecycle.
- Event listeners managed by `InputManager` are cleaned up.

### Responsive Design
- `SceneManager` handles viewport resizing, updating camera aspect ratio and renderer size.
- UI layout potentially uses CSS for responsiveness.

## Development Guidelines

### Code Organization (ECS Focus)
- **Entities**: Created ONLY via factory functions in `src/core/entities/`. Factories assign components.
- **Components**: MUST be pure data interfaces defined in `src/core/components.ts`. No methods.
- **Systems**: Implement logic in `src/core/systems/`. Operate on entities based on their components. Should ideally not hold state themselves, but modify components or global state.
- **World**: Central coordinator for ECS.

### Best Practices
- **Separation of Concerns**:
    - **Core (TS)**: Manages game state and logic via ECS. Does not directly interact with Three.js or React.
    - **Rendering (TS + Three.js)**: Reads component data (`Position`, `Renderable`, etc.) to update the `SceneManager` and display visuals. Does not modify game logic state.
    - **UI (React + TSX)**: Reads game state/component data (often via a dedicated system like `HUDSystem`) to display information. Sends user actions (like button clicks) back to the core logic (potentially via events or `InputManager`).
- **Type Safety**: Use TypeScript interfaces/types extensively (`src/types/`, `src/core/components.ts`).
- **Modularity**: Keep systems focused on single responsibilities.
- **Readability**: Follow consistent naming conventions and coding styles.
- **Immutability**: Prefer updating state by creating new objects/values where feasible, especially for components, although performance considerations in systems might necessitate mutation.
