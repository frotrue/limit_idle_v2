import test from 'node:test';
import assert from 'node:assert/strict';
import * as calcFacade from '../src/calc.js';
import * as polynomial from '../src/game/math/polynomial.js';

test('legacy calc facade re-exports polynomial helpers', () => {
  assert.strictEqual(calcFacade.equationCalc, polynomial.equationCalc);
  assert.strictEqual(calcFacade.differentiateEquation, polynomial.differentiateEquation);
  assert.strictEqual(calcFacade.integrateEquationAt, polynomial.integrateEquationAt);
});

test('game public API exposes stable system entry points', async () => {
  const api = await import('../src/game/index.js');

  assert.equal(typeof api.game, 'object');
  assert.equal(typeof api.manualTick, 'function');
  assert.equal(typeof api.buyUpgrade, 'function');
  assert.equal(typeof api.buyMaxUpgrade, 'function');
  assert.equal(typeof api.differentiate_bt, 'function');
  assert.equal(typeof api.integrate_bt, 'function');
  assert.equal(typeof api.saveGame, 'function');
  assert.ok(Array.isArray(api.AP_RESEARCH_NODES));
  assert.ok(Array.isArray(api.ACHIEVEMENTS));
});
