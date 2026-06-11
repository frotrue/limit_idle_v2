import test from 'node:test';
import assert from 'node:assert/strict';
import Decimal from 'break_eternity.js';
import {
  installDecimalPowCache,
  getDecimalPowCacheStats
} from '../src/game/performance/decimalPowCache.js';

const assertDecimalApprox = (actual, expected, tolerance = '1e-9') => {
  const diff = new Decimal(actual).minus(expected).abs();
  assert.equal(
    diff.lte(tolerance),
    true,
    `${actual} should be within ${tolerance} of ${expected}`
  );
};

test('installDecimalPowCache patches static Decimal.pow with cache stats', () => {
  const stats = installDecimalPowCache({ maxEntries: 16 });
  stats.clear();

  const first = Decimal.pow(2, 10);
  const second = Decimal.pow(2, 10);

  assertDecimalApprox(first, 1024);
  assert.equal(second.toString(), first.toString());
  assert.equal(stats.misses, 1);
  assert.equal(stats.hits, 1);
  assert.equal(getDecimalPowCacheStats(), stats);
});

test('installDecimalPowCache patches Decimal.prototype.pow with cache stats', () => {
  const stats = installDecimalPowCache({ maxEntries: 16 });
  stats.clear();

  const base = new Decimal(3);
  const first = base.pow(4);
  const second = base.pow(4);

  assertDecimalApprox(first, 81);
  assert.equal(second.toString(), first.toString());
  assert.equal(stats.misses, 1);
  assert.equal(stats.hits, 1);
});

test('installDecimalPowCache is idempotent', () => {
  const first = installDecimalPowCache({ maxEntries: 16 });
  const second = installDecimalPowCache({ maxEntries: 32 });

  assert.strictEqual(first, second);
  assert.equal(second.installed, true);
});
