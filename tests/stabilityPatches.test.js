import test from 'node:test';
import assert from 'node:assert/strict';
import Decimal from 'break_eternity.js';
import { game } from '../src/game/state.js';
import { getExpUpgradePrice } from '../src/game/balance/formulas.js';
import { performLimitReset } from '../src/game/systems/limitSystem.js';
import { applyPreLoadSavePatches, applyRuntimeStabilityPatches } from '../src/game/persistence/stabilityPatches.js';

const SAVE_KEY = 'math_idle_save';

const createMemoryStorage = () => {
  const data = new Map();
  return {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear()
  };
};

test('applyPreLoadSavePatches adds missing limit data without clearing achievements', () => {
  globalThis.localStorage = createMemoryStorage();

  const legacySave = {
    save_version: 1,
    fv: '1e12',
    achievements: ['start_1k', 'diff_first'],
    ap_research: ['auto_function']
  };

  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(legacySave));

  applyPreLoadSavePatches();

  const patched = JSON.parse(globalThis.localStorage.getItem(SAVE_KEY));
  assert.deepEqual(patched.achievements, legacySave.achievements);
  assert.deepEqual(patched.ap_research, legacySave.ap_research);
  assert.equal(patched.limit.lp, '0');
  assert.deepEqual(patched.limit.constants, { euler_e: 0, pi: 0, gamma: 0 });
  assert.equal(patched.limit.limit_count, 0);
});

test('applyPreLoadSavePatches preserves extra limit fields', () => {
  globalThis.localStorage = createMemoryStorage();

  const save = {
    save_version: 3,
    limit: {
      lp: '3',
      constants: { euler_e: 1, pi: 2, gamma: 3 },
      limit_count: 4,
      future_field: 'keep-me'
    }
  };

  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(save));

  applyPreLoadSavePatches();

  const patched = JSON.parse(globalThis.localStorage.getItem(SAVE_KEY));
  assert.equal(patched.limit.future_field, 'keep-me');
  assert.equal(patched.limit.lp, '3');
  assert.deepEqual(patched.limit.constants, { euler_e: 1, pi: 2, gamma: 3 });
  assert.equal(patched.limit.limit_count, 4);
});

test('performLimitReset immediately restores transient upgrade state', () => {
  globalThis.localStorage = createMemoryStorage();

  game.fv = new Decimal('1e100');
  game.integral_count = 50;
  game.limit.lp = new Decimal(0);
  game.limit.limit_count = 0;
  game.limit.constants = { euler_e: 0, pi: 0, gamma: 0 };

  game.prestige_x = new Decimal(7);
  game.other_upgrades[2].level = 12;
  game.other_upgrades[2].price = new Decimal('1e6');

  const expUpg = game.exp_upgrades[0];
  expUpg.level = 4;
  expUpg.price = new Decimal('1e90');
  game.exp_x = new Decimal('0.8');
  game.exp_multiplier = new Decimal('1.8');

  assert.equal(performLimitReset(), true);
  assert.equal(game.limit.limit_count, 1);
  assert.equal(game.prestige_x.eq(1), true);
  assert.equal(game.other_upgrades[2].level, 0);
  assert.equal(game.other_upgrades[2].price.eq(10), true);
  assert.equal(expUpg.level, 0);
  assert.equal(expUpg.price.eq(getExpUpgradePrice(expUpg)), true);
});

test('applyRuntimeStabilityPatches installs its interval once', () => {
  const originalSetInterval = globalThis.setInterval;
  const originalClearInterval = globalThis.clearInterval;
  let intervalCount = 0;

  globalThis.setInterval = () => {
    intervalCount += 1;
    return intervalCount;
  };
  globalThis.clearInterval = () => {};

  try {
    applyRuntimeStabilityPatches();
    applyRuntimeStabilityPatches();
  } finally {
    globalThis.setInterval = originalSetInterval;
    globalThis.clearInterval = originalClearInterval;
  }

  assert.equal(intervalCount, 1);
});
