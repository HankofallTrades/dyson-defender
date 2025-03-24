# Dyson Sphere Defender - Architecture

## Project Structure

The Dyson Sphere Defender game is built using a modular architecture that separates game logic, rendering, and UI into distinct components. This separation allows for better maintainability, testability, and scalability.

### Directory Structure

- `src/core/`: Contains the core game logic and state management
- `src/rendering/`: Houses Three.js rendering logic and scene management
- `src/ui/`: React components for UI elements and HUD

## Core Architecture Components

### Game Class (`src/core/Game.ts`)

The central class that coordinates the game loop and integrates all components. It:

- Initializes the game state using GameStateManager
- Connects to the SceneManager for rendering capabilities
- Manages the game loop using requestAnimationFrame
- Handles game state updates based on delta time
- Provides game control methods (start, stop, pause, resume)
- Implements frame-rate independent updates using delta time

The Game class implements a clean separation between game state updates and rendering, ensuring a consistent frame rate independent of UI updates.

### SceneManager Class (`src/rendering/SceneManager.ts`)

A dedicated class implementing the singleton pattern that manages all Three.js rendering aspects. It:

- Initializes and manages the Three.js scene, camera, and renderer
- Handles viewport resizing and maintains proper aspect ratio
- Sets up lighting and basic scene objects
- Provides an interface for rendering and updating the scene
- Manages scene object addition and removal
- Implements proper resource disposal to prevent memory leaks

The SceneManager follows the singleton pattern to ensure efficient resource management while providing a clear separation between game logic and rendering concerns.

### GameState and GameStateManager (`src/core/State.ts`)

The game state management system that:

- Defines a TypeScript interface for the game state
- Provides a centralized state management approach
- Implements serialization/deserialization for state persistence and future networking
- Enables partial state updates for optimized performance
- Keeps the state serializable (JSON-compatible) for easy networking

The GameStateManager follows the Observer Pattern, allowing React components to be notified of state changes without tightly coupling game logic to UI.

### React Integration

React is used for UI components while Three.js handles the 3D rendering. This separation allows:

- The game loop to run independently of React's rendering cycle
- UI updates to occur in response to state changes without affecting game performance
- Clean separation of concerns between game logic and UI presentation
- State updates to flow from the Game class to React components via shared state

## Technical Decisions

### Separation of Concerns

- Using a dedicated SceneManager for all rendering-related functionality
- Keeping Game class focused on game state management and logic
- Isolating UI components to React for better maintainability

### Design Patterns

- Implementing the singleton pattern for SceneManager to ensure efficient resource management
- Using the observer pattern for game state updates
- Following modular design principles for better scalability and maintainability

### State Management

- Using a dedicated GameStateManager instead of React state for game-specific state
- Keeping state serializable to support future multiplayer functionality
- Implementing a partial update pattern to minimize overhead
- Separating UI state (in React) from game state (in GameStateManager)

### Game Loop

- Using requestAnimationFrame for efficient animation
- Implementing delta time calculations for frame-rate independent movement
- Separating update logic from rendering for better performance
- Providing pause/resume capabilities without disrupting the rendering pipeline

### Renderer Configuration

- Using WebGLRenderer with antialiasing enabled for smoother graphics
- Setting pixel ratio based on device capabilities for optimal clarity
- Explicitly setting the clear color to ensure consistent background
- Managing canvas size to properly fill the container element

### Resource Management

- Proper disposal of Three.js resources to prevent memory leaks
- Clean event listener removal on component unmount
- Object pooling (to be implemented) for frequently created/destroyed objects

### Responsive Design

- Handling window resize events to maintain proper aspect ratio
- Using container dimensions rather than window dimensions for more flexible embedding
- Setting canvas to fill available space with appropriate CSS

## File Purposes

- `src/core/Game.ts`: Main game engine class managing the game loop and integrating components
- `src/core/State.ts`: Defines the game state interface and provides state management
- `src/rendering/SceneManager.ts`: Manages Three.js scene, camera, renderer, and lighting
- `src/App.tsx`: React component that initializes the game and provides the container
- `src/index.css` & `src/App.css`: Styling to ensure proper layout and full-screen rendering
- Configuration files (tsconfig.json, vite.config.ts, etc.): Project setup for TypeScript and tooling

## Debugging Insights

### Rendering Issues
When implementing Three.js in a React application, several common issues can arise:

1. **Container Dimensions**: The Three.js renderer must have a properly sized container with explicitly set dimensions. Using container dimensions instead of window dimensions ensures proper sizing regardless of layout.

2. **DOM Attachment**: The renderer's DOM element must be properly attached to the container element and styled to fill it completely.

3. **React Component Lifecycle**: Initialize Three.js in useEffect hooks to ensure the DOM is ready, and provide cleanup functions to prevent memory leaks.

4. **Debug Logging**: Adding console logs to track container dimensions and initialization helps diagnose rendering issues.

### State Management Considerations

1. **Game State vs. UI State**: Keeping game state separate from UI state ensures that game logic remains independent of the UI framework.

2. **Serialization**: Avoiding non-serializable elements (functions, DOM elements, etc.) in the game state enables easy persistence and networking.

3. **Performance**: Updating the DOM too frequently can impact performance. Using a lower frequency for UI updates than game logic updates helps maintain smooth gameplay.

4. **State Synchronization**: When game state changes rapidly, throttling UI updates prevents React from re-rendering too often while still keeping the UI accurate.
