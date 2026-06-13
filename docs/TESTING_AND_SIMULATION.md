# Testing and Simulation

The project uses Node's built-in test runner and a lightweight simulation
harness. No extra test framework dependency is required.

## Test runner

```bash
npm test
```

Current coverage:

- `tests/polynomial.test.js`
  - polynomial evaluation, differentiation, integration, and zero coefficients
- `tests/facades.test.js`
  - legacy `src/calc.js` facade
  - public `src/game/index.js` API smoke checks
- `tests/stabilityPatches.test.js`
  - legacy save migration
  - Limit data normalization
  - runtime patch interval idempotency
- `tests/decimalPowCache.test.js`
  - Decimal pow cache installation and cache behavior
- `tests/buyMaxOtherUpgrade.test.js`
  - optimized buy-max behavior for utility upgrades
- `tests/saveSerializer.test.js`
  - explicit save serialization
  - bounded history serialization
  - legacy save path using the serializer
  - malformed save backup and recovery
- `tests/simulateOptions.test.js`
  - simulation duration parsing
  - milestone expectation parsing and pass/fail evaluation
- `tests/balanceFormulas.test.js`
  - shared price spike, softcap, hardcap, exponential price, and geometric
    bulk-buy formulas

## Simulation runner

The simulator imports the real game API and advances the tick loop in Node.

```bash
npm run sim
npm run sim:10m
npm run sim:1h
npm run sim:24h
```

Useful direct commands:

```bash
node scripts/simulate.js --minutes=30 --strategy=balanced
node scripts/simulate.js --hours=2 --strategy=active
node scripts/simulate.js --seconds=120 --strategy=passive
node scripts/simulate.js --hours=24 --long-run --purchase-every=600
node scripts/simulate.js --hours=1 --no-pow-cache
node scripts/simulate.js --minutes=10 --json
node scripts/simulate.js --hours=1 --expect=firstDifferentiation:8m:12m
```

Key options:

- `--progress=false` or `--no-progress`: disable progress output.
- `--progress-every-ms=500`: throttle progress redraws.
- `--purchase-every=600`: run the purchase strategy every N ticks.
- `--event-limit=200`: keep at most N alerts/milestones in memory.
- `--max-real-seconds=120`: abort and print a partial report after a real-time limit.
- `--long-run`: enable long-run defaults for expensive simulations.
- `--pow-cache=false` or `--no-pow-cache`: disable Decimal pow caching.
- `--pow-cache-size=4096`: set Decimal pow cache capacity.
- `--json`: print a machine-readable simulation report.
- `--expect=<milestone>:<min>:<max>`: assert a milestone happened in a duration
  window. This flag can be repeated.

Supported expectation milestones:

- `firstDifferentiation`
- `expUnlocked`
- `firstExp`
- `firstResearch`
- `integralUnlocked`
- `firstIntegral`

## Strategies

- `passive`: buys FV/variable upgrades only.
- `balanced`: buys FV/variable, DX/AP utility, AP research, and prestige layers
  when affordable.
- `active`: same as balanced, but differentiates at the lower active threshold.

## Recommended checks

Before ordinary refactors:

```bash
npm test
npm run build
npm audit --audit-level=moderate
```

Before balance or progression changes:

```bash
npm test
npm run sim:10m
npm run sim:check
npm run sim:1h
npm run build
```

For larger balance passes:

```bash
npm run sim:24h
```

## Next improvements

1. Add save/load roundtrip tests covering Decimal-heavy state.
2. Add max-buy equivalence tests against repeated single buys.
3. Add separate idle-only, automation-heavy, and late-game simulation strategies.
