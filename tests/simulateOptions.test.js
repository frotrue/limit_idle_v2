import test from 'node:test';
import assert from 'node:assert/strict';
import Decimal from 'break_eternity.js';
import { game } from '../src/game/state.js';
import {
  createOfflineStepPlan,
  simulateOfflineProgress
} from '../src/game/systems/offlineProgress.js';
import {
  evaluateExpectations,
  parseDuration,
  parseSimTime
} from '../scripts/simulate.js';

test('parseSimTime accepts seconds, minutes, hours, and milliseconds', () => {
  assert.equal(parseSimTime('30'), 30);
  assert.equal(parseSimTime('45s'), 45);
  assert.equal(parseSimTime('2m'), 120);
  assert.equal(parseSimTime('1.5h'), 5400);
  assert.equal(parseSimTime('500ms'), 0.5);
});

test('parseDuration supports json and repeated milestone expectations', () => {
  const options = parseDuration([
    '--hours=1',
    '--json',
    '--expect=firstDifferentiation:15m:25m',
    '--expect=firstResearch:40m:55m'
  ]);

  assert.equal(options.totalMs, 3600000);
  assert.equal(options.json, true);
  assert.equal(options.progress, false);
  assert.equal(options.expectations.length, 2);
  assert.deepEqual(options.expectations[0], {
    key: 'firstDifferentiation',
    minSeconds: 900,
    maxSeconds: 1500
  });
});

test('evaluateExpectations reports pass, fail, and missing milestones', () => {
  const results = evaluateExpectations([
    { key: 'firstDifferentiation', minSeconds: 900, maxSeconds: 1500 },
    { key: 'firstExp', minSeconds: 1000, maxSeconds: 1200 },
    { key: 'firstResearch', minSeconds: 2400, maxSeconds: 3300 }
  ], {
    firstDifferentiation: 1074,
    firstExp: 1300
  });

  assert.equal(results[0].passed, true);
  assert.equal(results[1].passed, false);
  assert.equal(results[2].passed, false);
  assert.equal(results[2].actualSeconds, null);
});

test('offline step plan covers a full day without a giant remainder step', () => {
  const dayMs = 24 * 60 * 60 * 1000;
  const plan = createOfflineStepPlan(dayMs, { maxSteps: 5000, minStepMs: 100 });

  assert.equal(plan.length, 5000);
  assert.equal(plan.reduce((sum, stepMs) => sum + stepMs, 0), dayMs);
  assert.ok(Math.max(...plan) - Math.min(...plan) <= 1);
});

test('bounded offline simulation produces every completed cycle across its full window', () => {
  game.fv = new Decimal(10);
  game.fx = [new Decimal(1), ...Array.from({ length: 9 }, () => new Decimal(0))];
  game.current_x = new Decimal(0);
  game.max_x = new Decimal(1);
  game.x_increase = new Decimal(1);
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
  game.is_2x_boost_owned = false;
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

  const result = simulateOfflineProgress({
    startMs: 1000,
    endMs: 2000,
    maxSteps: 10,
    minStepMs: 100
  });

  assert.equal(result.steps, 10);
  assert.equal(result.totalProduced.eq(10), true);
  assert.equal(game.fv.eq(20), true);
  assert.equal(game.current_x.eq(0), true);
  assert.equal(game.stats.play_time, 1);
});
