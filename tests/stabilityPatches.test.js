import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPreLoadSavePatches } from '../src/game/persistence/stabilityPatches.js';

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
