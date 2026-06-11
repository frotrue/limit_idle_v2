# Limit Idle Architecture

## Current status

Limit Idle started as a compact Vue prototype. Most gameplay behavior still lives in `src/gameLogic.js`, while the UI is concentrated in `src/App.vue`.

Phase 2 does not rewrite those large files in one step. Instead, it introduces a safe module boundary under `src/game/` and keeps compatibility facades so existing behavior remains stable.

## New structure

```text
src/
  game/
    index.js
    state.js
    formatting.js
    math/
      polynomial.js
    systems/
      automation.js
      limitSystem.js
      persistence.js
      prestige.js
      progression.js
      research.js
      upgrades.js
    data/
      achievements.js
      apResearch.js
      limitConstants.js
      tier2Milestones.js
      tier3Milestones.js
    persistence/
      stabilityPatches.js
```

## Responsibilities

### `game/math`

Pure deterministic math helpers. These should stay free of Vue state, localStorage, DOM, timers, and alerts.

Current module:

- `polynomial.js`: polynomial evaluation, derivative, and integral helpers.

### `game/state`

The stable import path for the reactive game state.

### `game/systems`

Gameplay behavior grouped by responsibility:

- `progression`: ticks, formula string generation, milestone state, current production values.
- `upgrades`: buy one, buy max, and buy max all behavior.
- `prestige`: differentiation, exponential rebirth, integration, and prestige resets.
- `automation`: automatic purchases and automatic prestige actions.
- `research`: AP research tree behavior.
- `limitSystem`: Limit reset and LP/constant behavior.
- `persistence`: save/load/reset alert callback facade.

At this stage, these files are facades over `gameLogic.js`. Future PRs should move implementation code into these modules one system at a time.

### `game/data`

Stable import paths for static game data such as achievements, AP research nodes, milestones, and Limit constants.

### `game/persistence`

Startup and runtime stability patches. This is where save migration and compatibility fixes should live until the full persistence system is extracted from `gameLogic.js`.

## Migration strategy

The safest migration order is:

1. Keep `gameLogic.js` as the source of truth.
2. Add facades under `src/game/`.
3. Update new code to import from `@/game` instead of `gameLogic.js`.
4. Extract one pure subsystem at a time.
5. Add Vitest coverage for each extracted subsystem before moving the next one.

## Suggested next PRs

1. Extract save/load serialization helpers into `game/persistence/saveSerializer.js`.
2. Extract price formulas and softcap/hardcap helpers into `game/balance/formulas.js`.
3. Add Vitest tests for `game/math/polynomial.js`.
4. Add simulation scripts for 10 minutes, 1 hour, and 24 hours of idle progress.
5. Migrate `App.vue` imports from `gameLogic.js` to `@/game`, then split tab panes into components.
