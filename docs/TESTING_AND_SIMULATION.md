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
npm run sim:1h
npm run build
```

For larger balance passes:

```bash
npm run sim:24h
```

## Next improvements

1. Add `--json` output for automated before/after comparison.
2. Add milestone window assertions, such as first differentiation between
   expected minute ranges.
3. Add save/load roundtrip tests covering Decimal-heavy state.
4. Add max-buy equivalence tests against repeated single buys.
5. Add separate idle-only, automation-heavy, and late-game simulation strategies.
