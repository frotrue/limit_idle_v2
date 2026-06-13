# Limit Idle Architecture

## Current status

Limit Idle is a Vue incremental game with a stable public game API under
`src/game/`. The app UI imports gameplay behavior from `@/game`, while the
large legacy `src/gameLogic.js` file still owns much of the implementation.

The current architecture is intentionally transitional: new code should depend
on `src/game/` boundaries, and implementation can move out of `gameLogic.js`
one subsystem at a time with tests.

## Source layout

```text
src/
  App.vue                  Main UI shell and tab views
  main.js                  App startup, pow cache, save compatibility patches
  gameLogic.js             Legacy gameplay implementation and state source
  calc.js                  Legacy math facade
  utils.js                 Legacy formatting facade
  achievements.js          Legacy achievement data/source
  apResearch.js            Legacy AP research data/source
  tier2/                   Legacy Tier 2 milestone data
  tier3/                   Legacy Tier 3 milestone data
  tier4/                   Legacy Limit data and formulas

  components/
    CustomAlert.vue        Modal alert/confirm UI
    LineChart.vue          FV/sec history chart

  game/
    index.js               Public game API for UI, scripts, and tests
    state.js               Reactive game state facade
    formatting.js          Formatting facade
    math/                  Pure math helpers
    systems/               Gameplay system modules and facades
    data/                  Stable data import paths
    performance/           Runtime performance patches
    persistence/           Save serialization and compatibility patches
```

## Module boundaries

- `@/game` is the only import path UI code should use for gameplay state,
  actions, data, and formatting.
- `game/math` must stay pure: no Vue state, DOM, localStorage, timers, or alerts.
- `game/persistence/saveSerializer.js` owns the explicit save object shape.
  Both legacy and public save paths write through this serializer.
- `game/persistence/stabilityPatches.js` owns startup/runtime compatibility
  patches before and after Vue mounts.
- `game/systems/*` should become the long-term home for implementation. Some
  files still delegate to `gameLogic.js`; move those implementations gradually.

## Cleanup state

Completed cleanup:

- `App.vue` imports gameplay through `@/game`.
- The old Vite alias that rewired `./gameLogic.js` was removed.
- Save writes now use explicit serialization instead of `JSON.stringify(game)`.
- Corrupt saves are backed up to `math_idle_save_corrupt` and ignored safely.
- Unused Vue starter components and icon examples were removed.
- The unused Vue devtools plugin dependency was removed.

## Next safe PRs

1. Add simulation JSON output and expected milestone windows.
2. Add full save/load roundtrip tests for Decimal-heavy game state.
3. Extract balance formulas from `gameLogic.js` into pure modules.
4. Split `App.vue` tab panes into focused components.
5. Move one `game/systems/*` facade at a time from delegation to real
   implementation.
