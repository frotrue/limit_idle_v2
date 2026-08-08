import test from 'node:test';
import assert from 'node:assert/strict';
import Decimal from 'break_eternity.js';
import * as calcFacade from '../src/calc.js';
import * as polynomial from '../src/game/math/polynomial.js';

const resetTickState = (api) => {
  const { game } = api;
  game.fv = new Decimal(10);
  game.fx = [new Decimal(1), ...Array.from({ length: 9 }, () => new Decimal(0))];
  game.current_x = new Decimal(0);
  game.max_x = new Decimal(1);
  game.x_increase = new Decimal(0.1);
  game.dx_points = new Decimal(0);
  game.ap_points = new Decimal(0);
  game.dx_multiplier = new Decimal(0);
  game.differentiationCount = new Decimal(0);
  game.prestige_x = new Decimal(1);
  game.unlocked_exp = false;
  game.exp_x = new Decimal(0);
  game.exp_multiplier = new Decimal(1);
  game.unlocked_integral = false;
  game.integral_c = new Decimal(0);
  game.integral_count = 0;
  game.exp_milestone_points = 0;
  game.ap_research = [];
  game.achievements = [];
  game.limit.lp = new Decimal(0);
  game.limit.constants = { euler_e: 0, pi: 0, gamma: 0 };
  game.stats.total_fv = new Decimal(0);
  game.stats.total_dx = new Decimal(0);
  game.stats.play_time = 0;
  game.stats.fv_per_sec = new Decimal(0);
  game.auto_upgrades.forEach((auto) => {
    auto.active = false;
  });
  game.auto_exp.active = false;
  game.auto_integral.active = false;
};

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

test('public manualTick preserves x overflow instead of discarding it', async () => {
  const api = await import('../src/game/index.js');
  resetTickState(api);
  api.game.current_x = new Decimal('0.8');
  api.game.x_increase = new Decimal('0.3');

  api.manualTick();

  assert.equal(api.game.current_x.eq('0.1'), true);
  assert.equal(api.game.fv.eq(11), true);
  assert.equal(api.game.stats.total_fv.eq(1), true);
});

test('public manualTick awards every completed cycle when x increase exceeds max x', async () => {
  const api = await import('../src/game/index.js');
  resetTickState(api);
  api.game.x_increase = new Decimal('2.5');

  api.manualTick();

  assert.equal(api.game.current_x.eq('0.5'), true);
  assert.equal(api.game.fv.eq(12), true);
  assert.equal(api.game.stats.total_fv.eq(2), true);
});

test('integration confirm revalidates the requirement before mutating progress', async () => {
  const api = await import('../src/game/index.js');
  resetTickState(api);
  api.game.unlocked_integral = true;
  api.game.exp_multiplier = new Decimal('1.5');
  api.game.fv = new Decimal('1e100');

  let confirmCallback = null;
  const alerts = [];
  api.setAlertCallbacks(
    (message, title) => alerts.push({ message, title }),
    (_message, onConfirm) => {
      confirmCallback = onConfirm;
    }
  );

  assert.equal(api.integrate_bt(), true);
  assert.equal(typeof confirmCallback, 'function');

  api.game.exp_multiplier = new Decimal(1);
  confirmCallback();

  assert.equal(api.game.integral_count, 0);
  assert.equal(api.game.integral_c.eq(0), true);
  assert.ok(alerts.some(({ message }) => message.includes('조건이 변경')));

  api.setAlertCallbacks(() => {}, () => {});
});
