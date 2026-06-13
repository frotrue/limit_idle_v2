import test from 'node:test';
import assert from 'node:assert/strict';
import Decimal from 'break_eternity.js';
import {
  SAVE_KEY,
  serializeGameState,
  saveSerializedGameState
} from '../src/game/persistence/saveSerializer.js';

const assertDecimalEq = (actual, expected) => {
  assert.equal(new Decimal(actual).eq(expected), true, `${actual} should equal ${expected}`);
};

const createMemoryStorage = () => {
  const data = new Map();
  return {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear()
  };
};

const createMockGame = () => ({
  save_version: 3,
  fv: new Decimal('1e10'),
  fx: [new Decimal(1), new Decimal(2)],
  fx_str: '2x + 1',
  current_x: new Decimal(3),
  max_x: new Decimal(10),
  x_increase: new Decimal('0.5'),
  prestige_x: new Decimal(1),
  dx_points: new Decimal('1e5'),
  ap_points: new Decimal(12),
  dx_multiplier: new Decimal(7),
  differentiationCount: new Decimal(2),
  unlocked_exp: true,
  exp_x: new Decimal('0.25'),
  exp_multiplier: new Decimal('1.25'),
  exp_milestone_points: 4,
  unlocked_integral: false,
  integral_c: new Decimal(0),
  integral_count: 0,
  stats: {
    total_fv: new Decimal('1e12'),
    total_dx: new Decimal('1e6'),
    play_time: 123,
    session_start: 1000,
    fv_per_sec: new Decimal('1e4')
  },
  is_2x_boost_owned: true,
  ap_research: ['auto_function'],
  achievements: ['start_1k'],
  auto_diff: {
    mode: 'dx',
    fv_threshold: '1e20',
    dx_threshold: '1e6',
    cooldown_ms: 1500,
    last_trigger_at: 10
  },
  auto_exp: {
    active: true,
    mode: 'always',
    dx_threshold: '1e15',
    cooldown_ms: 5000,
    last_trigger_at: 20
  },
  auto_integral: {
    active: false,
    mode: 'fv_threshold',
    fv_threshold: '1e50',
    cooldown_ms: 10000,
    last_trigger_at: 30
  },
  limit: {
    lp: new Decimal(3),
    constants: { euler_e: 1, pi: 2, gamma: 3 },
    limit_count: 4,
    future_field: 'keep-me'
  },
  history: {
    fv_per_sec: Array.from({ length: 80 }, (_, i) => i)
  },
  ui: {
    layoutMode: 'mobile'
  },
  x_upgrades: {
    0: { level: 2, price: new Decimal(100) }
  },
  other_upgrades: {
    1: { level: 'MAX', price: new Decimal('1e9999') }
  },
  exp_upgrades: {
    0: { level: 3, price: new Decimal('1e15') }
  },
  auto_upgrades: [
    { active: true, lastTick: 12, interval: 2000, idleUntil: 100, idleStreak: 2 }
  ],
  lastTick: 0
});

test('serializeGameState stores Decimal values as numeric strings', () => {
  const serialized = serializeGameState(createMockGame(), { now: 9999 });

  assertDecimalEq(serialized.fv, '1e10');
  assert.deepEqual(serialized.fx, ['1', '2']);
  assertDecimalEq(serialized.dx_points, '1e5');
  assertDecimalEq(serialized.stats.total_fv, '1e12');
  assertDecimalEq(serialized.limit.lp, '3');
  assertDecimalEq(serialized.x_upgrades[0].price, '100');
  assertDecimalEq(serialized.other_upgrades[1].price, '1e9999');
  assertDecimalEq(serialized.exp_upgrades[0].price, '1e15');
});

test('serializeGameState keeps only bounded history', () => {
  const serialized = serializeGameState(createMockGame(), { now: 9999 });

  assert.equal(serialized.history.fv_per_sec.length, 60);
  assert.equal(serialized.history.fv_per_sec[0], 20);
  assert.equal(serialized.history.fv_per_sec[59], 79);
});

test('serializeGameState preserves future limit fields', () => {
  const serialized = serializeGameState(createMockGame(), { now: 9999 });

  assert.equal(serialized.limit.future_field, 'keep-me');
  assert.deepEqual(serialized.limit.constants, { euler_e: 1, pi: 2, gamma: 3 });
  assert.equal(serialized.limit.limit_count, 4);
});

test('saveSerializedGameState writes the explicit save object', () => {
  const storage = createMemoryStorage();
  const result = saveSerializedGameState(createMockGame(), storage, { now: 12345 });

  assert.equal(result, true);
  const saved = JSON.parse(storage.getItem(SAVE_KEY));
  assert.equal(saved.lastTick, 12345);
  assertDecimalEq(saved.fv, '1e10');
  assert.equal(saved.ap_research[0], 'auto_function');
  assert.equal(saved.achievements[0], 'start_1k');
});

test('serializeGameState preserves ui layout mode', () => {
  const serialized = serializeGameState(createMockGame(), { now: 9999 });

  assert.deepEqual(serialized.ui, { layoutMode: 'mobile' });
});

test('legacy saveGame writes the explicit serializer format', async () => {
  globalThis.localStorage = createMemoryStorage();
  const { game, saveGame } = await import('../src/gameLogic.js');

  game.fv = new Decimal('12345');

  const result = saveGame();
  const saved = JSON.parse(globalThis.localStorage.getItem(SAVE_KEY));

  assert.equal(result, true);
  assert.equal(typeof saved.fv, 'string');
  assertDecimalEq(saved.fv, '12345');
  assert.equal(saved.fv.sign, undefined);
});

test('loadGame backs up malformed saves and starts fresh', async () => {
  globalThis.localStorage = createMemoryStorage();
  const raw = '{malformed';
  const originalWarn = console.warn;
  globalThis.localStorage.setItem(SAVE_KEY, raw);
  console.warn = () => {};

  try {
    const { loadGame } = await import('../src/gameLogic.js');

    assert.equal(loadGame(), false);
    assert.equal(globalThis.localStorage.getItem(SAVE_KEY), null);
    assert.equal(globalThis.localStorage.getItem(`${SAVE_KEY}_corrupt`), raw);
  } finally {
    console.warn = originalWarn;
  }
});

test('loadGame preserves achievements when legacy save has no limit data', async () => {
  globalThis.localStorage = createMemoryStorage();
  const legacySave = {
    save_version: 2,
    fv: '1e12',
    achievements: ['start_1k', 'diff_first'],
    ap_research: ['auto_function']
  };
  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(legacySave));

  const { game, loadGame } = await import('../src/gameLogic.js');

  assert.equal(loadGame(), true);
  assert.deepEqual(game.achievements, legacySave.achievements);
  assert.equal(game.limit.lp.eq(0), true);
  assert.deepEqual(game.limit.constants, { euler_e: 0, pi: 0, gamma: 0 });
  assert.equal(game.limit.limit_count, 0);
});
