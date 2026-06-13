# Game Module Boundary

`src/game/` is the stable boundary for game-facing imports. UI, scripts, and
tests should import from `@/game` or specific `src/game/*` modules instead of
reaching directly into legacy source files.

## Public API

Use the aggregate API for app-level gameplay access:

```js
import { game, manualTick, buyUpgrade, saveGame } from '@/game'
```

`index.js` re-exports stable state, actions, data, formatting, performance, and
persistence entry points.

## Directory map

```text
src/game/
  index.js          Public API surface
  state.js          Reactive state facade backed by gameLogic.js
  balance/          Pure deterministic balance formulas
  formatting.js     Formatting facade
  math/             Pure deterministic helpers
  systems/          Gameplay systems and transitional facades
  data/             Stable data import paths
  performance/      Runtime performance helpers
  persistence/      Save serialization and compatibility patches
```

## Rules

- New UI code imports gameplay through `@/game`.
- Pure math and balance helpers should not import Vue state or browser APIs.
- Price, softcap, hardcap, and bulk-cost logic should live in `balance/` unless
  it is still intentionally transitional.
- Save writes go through `persistence/saveSerializer.js`.
- Compatibility patches live in `persistence/stabilityPatches.js`.
- Direct `gameLogic.js` imports are allowed only inside transitional facades or
  tests that explicitly cover legacy compatibility.

## Next extraction targets

1. Move load/reset behavior fully into persistence modules.
2. Move `manualTick` and production calculations into progression modules.
3. Move prestige reset behavior into prestige modules.
4. Move automation behavior into automation modules.
