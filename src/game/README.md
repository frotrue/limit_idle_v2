# Game Module Boundaries

This directory is the new architecture boundary for the core Limit Idle game code.

The current project still keeps the legacy `src/gameLogic.js` file as the source of truth. Phase 2 introduces stable facades under `src/game/` so UI components and future systems can depend on smaller modules instead of importing the large legacy file directly.

## Directory map

```text
src/game/
  index.js                 Public API for game-facing imports
  state.js                 Reactive game state facade
  formatting.js            Number/text formatting facade
  math/                    Pure math helpers
  systems/                 Gameplay system facades
  data/                    Static game data facades
  persistence/             Save/load and startup stability patches
```

## Migration rule

New code should prefer imports from `src/game/`:

```js
import { game, manualTick, buyUpgrade } from '@/game'
```

Existing code can keep using `src/gameLogic.js` until it is migrated in smaller follow-up PRs.

## Next safe extraction targets

1. Move pure constants and price formulas out of `gameLogic.js`.
2. Move save/load into `game/persistence/`.
3. Move auto-upgrade behavior into `game/systems/automation.js`.
4. Move prestige reset logic into `game/systems/prestige.js`.
5. Replace direct `gameLogic.js` imports in UI components with `@/game` imports.
