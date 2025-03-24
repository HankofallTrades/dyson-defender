# Dyson Sphere Defender - Architecture

## Project Structure

The game follows a modular architecture separating core game logic, rendering, and UI:

- `src/core/`: Core game logic and state management
  - `entities/`: Entity factory functions
  - `systems/`: Entity processing systems
  - `components.ts`: Component definitions
  - `World.ts`: ECS manager
  - `Game.ts`: Main game controller
  - `State.ts`: Game state management
- `src/rendering/`: Three.js rendering logic
  - `SceneManager.ts`: Scene management singleton
  - `MeshFactory.ts`: Factory for creating entity meshes
- `src/ui/`: React UI components
- `src/constants/`: Game constants and configurations
- `src/types/`: TypeScript type definitions

## Core Components

### Game Class
- Coordinates game loop and integrates components
- Manages game state and ECS world
- Provides game control methods
- Implements frame-rate independent updates

### SceneManager
- Singleton managing Three.js scene, camera, and renderer
- Handles viewport resizing and input state
- Manages scene objects and lighting
- Implements resource cleanup

### MeshFactory
- Creates Three.js meshes for different entity types
- Implements Factory pattern for mesh generation
- Centralizes mesh creation logic
- Supports various entity visual representations

### World Class (ECS)
- Manages entities and components
- Coordinates system updates in order:
  1. InputSystem: Processes player input
  2. MovementSystem: Updates entity positions
  3. WeaponSystem: Handles weapon firing and cooldowns
  4. EnemySystem: Controls enemy behavior
  5. AutoRotateSystem: Handles automatic rotation
  6. WaveSystem: Manages enemy wave spawning
  7. CollisionSystem: Detects and resolves collisions
  8. RenderingSystem: Updates visual representations
- Provides efficient entity querying
- Implements component lifecycle management

## Systems

### RenderingSystem
- Creates and manages Three.js meshes via MeshFactory
- Updates visual representations based on components
- Handles mesh cleanup
- Renders various entity types (player ship, Dyson sphere, lasers, enemies)

### InputSystem
- Processes keyboard and mouse input
- Updates entity velocity based on input
- Captures shooting input (space key and left mouse button)
- Implements normalized movement vectors

### MovementSystem
- Applies velocity to position
- Implements physics-based movement
- Enforces gameplay boundaries (except for projectiles)
- Handles smooth acceleration/deceleration

### AutoRotateSystem
- Manages automatic entity rotation
- Updates rotation based on delta time

### WeaponSystem
- Manages weapon firing mechanics
- Handles cooldown timing
- Creates projectile entities
- Updates projectile lifetime
- Removes expired projectiles

### CollisionSystem
- Detects collisions between entities with Collider components
- Processes different collision types based on entity layers
- Applies damage to entities when hit by projectiles
- Uses efficient collision detection algorithms for different collider shapes
- Maintains a collision matrix for filtering collision checks

### EnemySystem
- Controls enemy movement and behavior
- Manages enemy targeting and orientation
- Implements attack positioning and targeting
- Makes enemies face the player during approach
- Controls enemy stopping at defined attack distances

### WaveSystem
- Manages enemy wave spawning
- Controls wave timing and progression
- Determines enemy types and quantities per wave
- Handles wave completion and next wave triggering
- Implements difficulty progression

## Components

Components are pure data structures:

- `Position`: Location (x, y, z)
- `Velocity`: Movement vector
- `Rotation`: Orientation
- `Renderable`: Visual properties
- `Health`: Entity health state
- `AutoRotate`: Rotation behavior
- `InputReceiver`: Input handling flag
- `Projectile`: Projectile behavior and lifetime
- `LaserCooldown`: Weapon cooldown management
- `Collider`: Collision shape and properties for physics interactions
- `Enemy`: Enemy-specific behavior data
- `Target`: Entity targeting information
- `CollisionLayer`: Defines collision filtering

## Entities

### DysonSphereEntity
- Central game object
- Components: Position, Rotation, Renderable, Health, AutoRotate, Collider
- Wireframe sphere visualization

### PlayerShipEntity
- Player-controlled ship
- Components: Position, Velocity, Rotation, Renderable, InputReceiver, LaserCooldown, Collider
- Responds to keyboard input

### LaserEntity
- Player projectile
- Components: Position, Velocity, Rotation, Renderable, Projectile, Collider
- Travels in straight line with fixed lifetime

### GruntEntity
- Basic enemy type
- Components: Position, Velocity, Rotation, Renderable, Enemy, Target, Health, Collider
- Features curved tentacles and custom behavior
- Moves toward Dyson Sphere and stops at attack distance

## Technical Implementation

### State Management
- GameStateManager for game state
- React state for UI
- Serializable state for future multiplayer

### Performance Optimization
- Frame-rate independent movement
- Efficient entity querying
- Minimal debug output
- Optimized input processing
- Clean component lifecycle management

### Resource Management
- Proper Three.js resource disposal
- Event listener cleanup
- Efficient mesh management
- Memory leak prevention

### Responsive Design
- Dynamic viewport resizing
- Proper aspect ratio maintenance
- Container-based dimensions

## Development Guidelines

### Code Organization
- Keep components as pure data
- Maintain system independence
- Use factory functions for entities
- Implement proper cleanup
- Follow TypeScript best practices

### Best Practices
- Separate game logic from rendering
- Maintain serializable state
- Use efficient data structures
- Implement proper error handling
- Follow consistent naming conventions
