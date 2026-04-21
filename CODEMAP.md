# Code Map

This map is intended for fast orientation before changing the game.

## Runtime Flow

1. `src/main.tsx` mounts React.
2. `src/App.tsx` creates the shared `AudioManager`, initializes `SceneManager`, creates `Game`, and passes `World`/camera refs into `HUD`.
3. `src/core/Game.ts` owns the main `requestAnimationFrame` loop, starts/stops gameplay, and calls `world.update(deltaTime)` while playing.
4. `src/core/World.ts` stores entities, components, systems, the shared `GameState`, and cached component queries.
5. Systems in `src/core/systems` mutate component data.
6. `src/core/systems/RenderingSystem.ts` reads renderable components and updates Three.js objects in the scene.
7. `src/ui/HUD.tsx` reads ECS/HUD components for React overlays and forwards UI actions back to `Game`.

## Key Files

- `src/core/Game.ts`: lifecycle, system registration order, pause/resume/restart/reset, pointer-lock transitions.
- `src/core/World.ts`: ECS storage, component query cache, system update loop.
- `src/core/State.ts`: authoritative global state manager.
- `src/core/components.ts`: all component interfaces.
- `src/core/input/InputManager.ts`: keyboard, mouse, pointer-lock, and mobile input state.
- `src/rendering/SceneManager.ts`: Three.js scene, camera, renderer, resize, pixel ratio cap, scene cleanup.
- `src/rendering/MeshFactory.ts`: mesh/group creation for every `Renderable.modelId`.
- `src/ui/HUD.tsx`: React HUD loop, menus, game-over/pause/start rendering.

## System Map

- `InputSystem`: Converts keyboard/mouse/mobile input into player rotation, velocity, and fire intent.
- `MovementSystem`: Applies velocity, boost, movement bounds, and boost state updates.
- `CameraSystem`: Follows/mounts camera behavior.
- `CollisionSystem`: Builds collision layer groups, detects overlap, applies damage/power-up/shield responses.
- `PowerUpSystem`: Spawns, applies, expires, and deactivates power-up effects.
- `WeaponSystem`: Handles player projectiles, enemy lasers, projectile lifetime, and lightning weapons.
- `EnemySystem`: Enemy movement, targeting, siege behavior, shooting, guardian behavior, and asteroid impacts.
- `ShieldSystem`: Dyson shield regeneration and hit timing.
- `ShieldBubbleSystem`: Guardian shield bubble sync/pulse/flash cleanup.
- `HealthBarSystem`: Enemy health bar visibility and related state.
- `HUDSystem`: Updates HUD ECS data, messages, damage effects, radar, and game-over state.
- `WaveSystem`: Wave countdown, deterministic delayed spawns, enemy mix, asteroid starts, wave resets.
- `AnimationSystem`: Wormhole, growth, explosion, and visual effect lifecycle.
- `FloatingScoreSystem`: Floating score movement/fade/removal.
- `UISystem`: Projects selected world positions to screen coordinates.
- `AutoRotateSystem`: Applies simple rotation components.
- `DevSystem`: Dev/free-camera mode.
- `DysonDamageZoneSystem`: Player damage near Dyson danger zones.
- `RenderingSystem`: Creates, updates, tracks, and disposes scene meshes.

System registration order is in `Game.initSystems()`. Be careful changing it; collisions, weapon lifetimes, UI projection, and rendering are order-sensitive.

## Entity Factories

Factories live in `src/core/entities` and are the preferred way to create entities.

- `PlayerShipEntity.ts`: Player ship, input receiver, health, boost, collider, laser cooldown.
- `DysonSphereEntity.ts`: Central objective with shield, health, collider, renderable.
- `HUDEntity.ts`: Singleton HUD components.
- `CameraEntity.ts` and `DevCameraEntity.ts`: Camera ECS entities.
- `GruntEntity.ts`, `ShieldGuardianEntity.ts`, `WarpRaiderEntity.ts`, `AsteroidEntity.ts`: Enemy variants.
- `LaserEntity.ts`: Projectile entity.
- `PowerUpEntity.ts`: Power-up variants.
- `WormholeEntity.ts`, `FloatingScoreEntity.ts`, `StarfieldEntity.ts`, `StarEntity.ts`: Effects/background/UI-adjacent entities.

## State Invariants

- `GameStateManager.getStateReference()` is installed into `World` and is the mutable authoritative global state.
- `GameStateManager.getState()` returns a copy for snapshots. Do not pass it to `World.setGameState`.
- `GameStateDisplay` on the HUD entity controls React screen state: `not_started`, `playing`, `paused`, `game_over`.
- Simulation timers should be expressed as component/system fields reduced by `deltaTime`.
- Restart/reset creates a new `World`, reinitializes systems/entities, and reinstalls the state reference.

## Rendering Invariants

- `Renderable.modelId` selects mesh construction in `MeshFactory`.
- `RenderingSystem` owns entity-to-mesh tracking and writes `renderable.mesh`/`meshId` for systems that need visual references.
- Entity mesh removal should dispose geometries, materials, and textures.
- `SceneManager.clearScene()` is for full scene reset; per-entity cleanup belongs in `RenderingSystem`.
- Pixel ratio is capped in `SceneManager` to avoid high-DPI fill-rate spikes.

## Hot Paths

- `World.getEntitiesWith(...)`: called by most systems. Query results are cached until component topology changes.
- `CollisionSystem.update(...)`: collision grouping and pair checks; next optimization should be broadphase/spatial hash.
- `HUD.tsx` animation loop: reads ECS state for React overlays. Avoid expensive comparisons or unconditional state writes.
- `WeaponSystem.updateLightningStrands(...)`: recreates lightning geometries periodically; pooling or buffer updates would reduce hitches.
- `MeshFactory`: heavy mesh construction; avoid calling it from per-frame paths.

## Known Follow-Ups

- Add collision broadphase and canonical layer-pair iteration.
- Pool projectiles, floating scores, and short-lived visual effects.
- Split large systems/files: `MeshFactory`, `CollisionSystem`, `EnemySystem`, `WeaponSystem`, and `HUD.tsx`.
- Move tuning constants from systems/entities into `src/constants`.
- Consider a push-based HUD snapshot/event bridge to reduce React polling further.
- Add browser smoke tests for start, pause/resume, restart, wave spawn, power-up pickup, and game-over.

## Verification Checklist

- `npm run build`
- If gameplay logic changed, manually smoke test:
- Start from menu.
- Move/aim/shoot.
- Pause and resume.
- Lose and restart.
- Reach at least wave 2 to exercise delayed guardian spawn.
- Pick up a power-up.
- Reset to menu and start again.

