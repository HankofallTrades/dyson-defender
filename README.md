
# Dyson Defender

**Dyson Defender** is a retro-futuristic 3D space shooter built with React, TypeScript, Three.js, and Vite. Take control of a spaceship, defend the Dyson Sphere from waves of alien enemies, and blast your way through space with lasers and boosts. With a modular design and an Entity-Component-System (ECS) architecture, this game is both fun to play and easy to extend.

## Features

- **Gameplay Mechanics**:
  - Fly your spaceship using mouse and keyboard controls.
  - Fire lasers to eliminate enemies and protect the Dyson Sphere.
  - Battle waves of enemies with unique patterns and behaviors.
  - Activate a boost for temporary speed bursts.

- **Visuals**:
  - Retro-futuristic style with neon colors and glitchy effects.
  - 3D models for the Dyson Sphere, spaceship, and enemies.
  - Dynamic lighting and particle effects for an immersive feel.

- **Architecture**:
  - Entity-Component-System (ECS) pattern for scalable game logic.
  - Three.js for stunning 3D rendering.
  - React-powered user interface (HUD).
  - Modular codebase for easy updates and additions.

- **Performance**:
  - Optimized with Three.js best practices.
  - Smooth gameplay with a frame-rate-independent loop.

## Getting Started

### Prerequisites

- **Node.js**: Version 14 or higher.
- **npm** or **yarn**: Package manager of your choice.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/dyson-sphere-defender.git
   cd dyson-sphere-defender
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   or
   ```bash
   yarn dev
   ```

4. **Play the game**:
   Open your browser and go to `http://localhost:5173`.

### Building for Production

To generate a production-ready build, run:
```bash
npm run build
```
or
```bash
yarn build
```

The output will be saved in the `dist/` folder.

## Usage

- **Controls**:
  - **Move**: `W`, `A`, `S`, `D` or arrow keys.
  - **Aim**: Move the mouse.
  - **Shoot**: `Space` or left mouse button.
  - **Boost**: Hold `Shift` for a speed boost.

- **Objective**:
  - Protect the Dyson Sphere from enemy waves.
  - Destroy enemies to score points and advance.
  - Keep the Dyson Sphere's health above zero to win.

## Project Structure

Here’s how the codebase is organized:

- **`src/core/`**: Game logic (entities, systems, components, and ECS manager `World.ts`).
- **`src/rendering/`**: Three.js scene setup and 3D mesh creation.
- **`src/ui/`**: React components for the HUD, start screen, and more.
- **`src/constants/`**: Game settings and constants.
- **`src/types/`**: TypeScript type definitions.

This separation keeps the logic, rendering, and UI distinct, making the project easier to work on.

## Contributing

We’d love your help improving Dyson Sphere Defender! Here’s how to contribute:

1. **Fork the repository**.
2. **Create a branch** for your changes.
3. **Implement your feature or fix**, testing it thoroughly.
4. **Submit a pull request** with a detailed explanation of your work.

Check the project documentation for coding guidelines.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

## Acknowledgments

- **Three.js**: For powerful 3D rendering capabilities.
- **React**: For a slick and responsive UI.
- **Vite**: For lightning-fast development and builds.
- **TypeScript**: For safer, more reliable code.

---

This `README.md` gives you everything you need to dive into "Dyson Sphere Defender"—whether you’re here to play, develop, or contribute. Enjoy defending the sphere!