# Testing and Simulation

Phase 3 adds a lightweight test and simulation harness without adding new npm dependencies.

## Test runner

The project uses Node's built-in test runner.

```bash
npm test
```

Current coverage:

- `tests/polynomial.test.js`
  - polynomial evaluation
  - derivative coefficient generation
  - derivative evaluation at x
  - antiderivative evaluation with C = 0
  - zero-coefficient handling
- `tests/facades.test.js`
  - legacy `src/calc.js` compatibility facade
  - public `src/game/index.js` API smoke checks

## Simulation runner

The simulation runner uses the real game modules and runs the tick loop in Node.

```bash
npm run sim
npm run sim:10m
npm run sim:1h
npm run sim:24h
```

You can also pass explicit options:

```bash
node scripts/simulate.js --minutes=30 --strategy=balanced
node scripts/simulate.js --hours=2 --strategy=active
node scripts/simulate.js --seconds=120 --strategy=passive
```

## Strategies

- `passive`
  - buys FV/variable upgrades only
  - does not manually prestige
- `balanced`
  - buys FV/variable upgrades
  - buys DX/AP utility upgrades when affordable
  - purchases AP research when affordable
  - differentiates at a higher FV threshold
  - buys Exponential and Integral rebirths when available
- `active`
  - same as balanced
  - differentiates at the minimum FV threshold

## Why this matters

Incremental games are difficult to balance manually. This harness makes it possible to compare changes by running the same duration and strategy before/after a balance patch.

Suggested checks before merging balance changes:

```bash
npm test
npm run sim:10m
npm run sim:1h
npm run build
```

For larger balancing passes, also run:

```bash
npm run sim:24h
```

## Next improvements

1. Add JSON output mode for automated comparison.
2. Add expected milestone windows, for example first differentiation should happen between X and Y minutes.
3. Add separate strategies for active clicker, idle-only, automation-heavy, and late-game runs.
4. Add save/load roundtrip tests once persistence is extracted from `gameLogic.js`.
5. Add max-buy equivalence tests comparing repeated single buys against buy-max results.
