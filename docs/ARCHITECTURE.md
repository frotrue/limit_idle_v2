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
      saveSerializer.js
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
- `persistence`: save/load/reset alert callback facade. The `@/game` save path now uses explicit serialization instead of `JSON.stringify(game)`.

At this stage, most of these files are still facades over `gameLogic.js`. Future PRs should move implementation code into these modules one system at a time.

### `game/data`

Stable import paths for static game data such as achievements, AP research nodes, milestones, and Limit constants.

### `game/persistence`

Persistence helpers and compatibility fixes:

- `saveSerializer.js`: explicit save object creation and localStorage writing.
- `stabilityPatches.js`: startup/runtime save migration and compatibility patches.

Legacy internal calls inside `gameLogic.js` still use the old save function until the remaining reset/save call sites are extracted.

## UI routing status

`App.vue` still contains a legacy `./gameLogic.js` import in source. For now, Vite routes that UI import to `src/game/index.js` through `vite.config.js`. This lets the running app use optimized `src/game` facades without rewriting the large `App.vue` file in one risky change.

The next cleanup should replace the source import directly and then split tab panes into smaller components.

## Migration strategy

The safest migration order is:

1. Keep `gameLogic.js` as the source of truth.
2. Add facades under `src/game/`.
3. Route or migrate UI imports to `src/game/index.js`.
4. Extract one pure subsystem at a time.
5. Add test coverage for each extracted subsystem before moving the next one.

## Suggested next PRs

1. Replace the remaining `App.vue` source import with direct `src/game/index.js` imports when the file is split or edited safely.
2. Extract price formulas and softcap/hardcap helpers into `game/balance/formulas.js`.
3. Move reset/save call sites inside `gameLogic.js` toward the persistence facade.
4. Add save/load roundtrip tests once load migration is extracted.
5. Split tab panes into components after import migration.
