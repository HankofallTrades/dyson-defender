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
- `src/ui/`: React UI components

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

### World Class (ECS)
- Manages entities and components
- Coordinates system updates in order:
  1. InputSystem: Processes player input
  2. MovementSystem: Updates entity positions
  3. AutoRotateSystem: Handles automatic rotation
  4. RenderingSystem: Updates visual representations
- Provides efficient entity querying
- Implements component lifecycle management

## Systems

### RenderingSystem
- Creates and manages Three.js meshes
- Updates visual representations based on components
- Handles mesh cleanup
- Renders various entity types (player ship, Dyson sphere, lasers)

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

## Entities

### DysonSphereEntity
- Central game object
- Components: Position, Rotation, Renderable, Health, AutoRotate
- Wireframe sphere visualization

### PlayerShipEntity
- Player-controlled ship
- Components: Position, Velocity, Rotation, Renderable, InputReceiver, LaserCooldown
- Responds to keyboard input

### LaserEntity
- Player projectile
- Components: Position, Velocity, Rotation, Renderable, Projectile
- Travels in straight line with fixed lifetime

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
