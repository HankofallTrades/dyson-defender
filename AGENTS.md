# Agent Instructions

This file is the first stop for agents working in this repository. Keep changes focused, deterministic, and easy to verify.

## Project

Dyson Defender is a Vite + React + TypeScript + Three.js game using a small ECS-style runtime.

- Core simulation lives in `src/core`.
- Three.js scene and mesh construction live in `src/rendering`.
- React overlays and menus live in `src/ui`.
- Game docs live in `docs`.
- A quick code map lives in `CODEMAP.md`.

## Commands

- Install dependencies: `npm install`
- Build/typecheck: `npm run build`
- Lint: `npm run lint`
- Dev server: `npm run dev`

Always run `npm run build` after engine, rendering, state, or TypeScript changes. Run `npm run lint` when touching larger TS/TSX areas if practical.

## Architecture Rules

- Treat `GameStateManager.getStateReference()` as the authoritative global game state shared with `World`.
- Use `GameStateManager.getState()` only for read-only snapshots, not for reinstallation into `World`.
- Keep gameplay timing deterministic inside system `update(deltaTime)` methods. Do not use `setTimeout` or `setInterval` for simulation events.
- Use entity factories in `src/core/entities` to create game entities.
- Keep component definitions as pure data in `src/core/components.ts`.
- Keep systems focused on simulation behavior and component mutation.
- Keep React UI as a consumer/controller layer. Avoid putting gameplay rules in React components.
- Do not reintroduce `window.gameWorld`; pass `World` explicitly.
- Avoid direct scene mutations from gameplay systems unless that system is explicitly visual/effect oriented.

## Performance Rules

- Avoid allocations in per-frame loops. Reuse `THREE.Vector3`, arrays, and temporary data where reasonable.
- Prefer cached entity ids or cached ECS queries for hot singleton lookups like player, HUD, camera, Dyson sphere, and wave entity.
- `World.getEntitiesWith(...)` has query caching; adding/removing components invalidates the cache. Mutating component object fields does not.
- Avoid repeated `JSON.stringify` comparisons inside animation-frame loops.
- Dispose Three.js geometries, materials, and textures when removing meshes.
- Cap or tune rendering work before adding visual complexity. High-DPI fill rate matters.
- Collision work should avoid duplicate layer-pair checks and should use broadphase/spatial partitioning before adding lots of colliders.

## Race-Condition Rules

- Do not schedule gameplay callbacks that can outlive a reset/restart.
- Pointer lock state changes should be handled from actual browser events, not time-based grace periods.
- Input listeners should use stable handler references and must be removed on dispose.
- If adding async asset loading, guard against disposal/restart before applying loaded results.
- Keep restart/reset paths responsible for fully replacing world-local systems and entities.

## Git Hygiene

- The default branch is currently `main`.
- Keep commits focused and buildable.
- Do not revert user changes unless explicitly asked.
- Before committing, inspect `git status --short` and stage only intended files.

