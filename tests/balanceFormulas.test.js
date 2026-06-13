import test from 'node:test';
import assert from 'node:assert/strict';
import Decimal from 'break_eternity.js';
import {
  BASE_MAX_X_HARD_CAP,
  geometricBulkCost,
  getExpUpgradePrice,
  getMaxXHardCap,
  getMaxXUpgradeGain,
  getPriceSpikeMultiplier,
  getXUpgradePriceMultiplierByLevel,
  maxAffordableGeometricCount
} from '../src/game/balance/formulas.js';

const assertDecimalEq = (actual, expected) => {
  assert.equal(new Decimal(actual).eq(expected), true, `${actual} should equal ${expected}`);
};

test('getPriceSpikeMultiplier applies spikes only on positive boundaries', () => {
  assertDecimalEq(getPriceSpikeMultiplier(0), 1);
  assertDecimalEq(getPriceSpikeMultiplier(14), 1);
  assertDecimalEq(getPriceSpikeMultiplier(15), 10);
  assertDecimalEq(getPriceSpikeMultiplier(10, 5), 10);
});

test('getXUpgradePriceMultiplierByLevel preserves level bands', () => {
  assert.equal(getXUpgradePriceMultiplierByLevel(10), 1.1);
  assert.equal(getXUpgradePriceMultiplierByLevel(11), 1.2);
  assert.equal(getXUpgradePriceMultiplierByLevel(51), 1.25);
  assert.equal(Number(getXUpgradePriceMultiplierByLevel(151).toFixed(2)), 1.45);
});

test('getMaxXHardCap adds pi effect to the base cap', () => {
  assertDecimalEq(getMaxXHardCap(25), BASE_MAX_X_HARD_CAP.plus(25));
});

test('getMaxXUpgradeGain handles pre-softcap, softcap, and cap', () => {
  assertDecimalEq(getMaxXUpgradeGain(5, 300), 1);
  assert.equal(getMaxXUpgradeGain(20, 300).lt(1), true);
  assertDecimalEq(getMaxXUpgradeGain(300, 300), 0);
});

test('getExpUpgradePrice applies minimum, growth, and spike', () => {
  assertDecimalEq(getExpUpgradePrice({ base_price: new Decimal('1e10'), level: 0 }), '3e10');
  assertDecimalEq(getExpUpgradePrice({ base_price: new Decimal('1e10'), level: 1 }), '3.6e11');
  assertDecimalEq(getExpUpgradePrice({ base_price: new Decimal('1e10'), level: 5 }), '74649600000000000');
});

test('geometric bulk helpers preserve affordability edges', () => {
  assertDecimalEq(geometricBulkCost(new Decimal(10), 2, 3), 70);
  assert.equal(maxAffordableGeometricCount(new Decimal(69), new Decimal(10), 2, 10), 2);
  assert.equal(maxAffordableGeometricCount(new Decimal(70), new Decimal(10), 2, 10), 3);
  assert.equal(maxAffordableGeometricCount(new Decimal(50), new Decimal(10), 1, 10), 5);
});
