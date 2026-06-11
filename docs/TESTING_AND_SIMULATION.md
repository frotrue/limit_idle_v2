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
- `tests/stabilityPatches.test.js`
  - legacy save patch behavior
  - default Limit data migration without clearing achievements/research
- `tests/decimalPowCache.test.js`
  - Decimal pow cache installation
  - static `Decimal.pow` caching
  - instance `.pow()` caching

## Simulation runner

The simulation runner uses the real game modules and runs the tick loop in Node.

```bash
npm run sim
npm run sim:10m
npm run sim:1h
npm run sim:24h
```

The runner now prints CLI progress while it runs. In an interactive terminal it rewrites a single progress line with:

- simulated progress percentage
- simulated time / total simulated time
- real elapsed time
- estimated remaining real time
- FV, DX, Exp points, and Integral count

`sim:24h` uses long-run defaults so it does not run the expensive purchase strategy every simulated second.

The simulator also installs the Decimal pow cache by default and prints cache hit/miss statistics in the final report.

## Useful options

```bash
node scripts/simulate.js --minutes=30 --strategy=balanced
node scripts/simulate.js --hours=2 --strategy=active
node scripts/simulate.js --seconds=120 --strategy=passive
node scripts/simulate.js --hours=24 --long-run --purchase-every=600
node scripts/simulate.js --hours=1 --no-pow-cache
```

Options:

- `--progress=false` or `--no-progress`: disable progress output.
- `--progress-every-ms=500`: throttle progress redraws.
- `--purchase-every=600`: run the purchase strategy every N ticks.
- `--event-limit=200`: keep at most N alerts/milestones in memory.
- `--max-real-seconds=120`: abort and print a partial report if real runtime exceeds N seconds.
- `--long-run`: enables long-run defaults, including less frequent purchasing when no explicit purchase interval is provided.
- `--pow-cache=false` or `--no-pow-cache`: disable Decimal pow caching for A/B comparison.
- `--pow-cache-size=4096`: set Decimal pow cache entry capacity.

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
6. Add event-based long-run simulation for 7-day and 30-day balance checks.
