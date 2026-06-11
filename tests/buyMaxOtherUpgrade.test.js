import test from 'node:test';
import assert from 'node:assert/strict';
import Decimal from 'break_eternity.js';
import { game } from '../src/game/state.js';
import { buyMaxOtherUpgrade } from '../src/game/systems/upgrades.js';

const resetCommonState = () => {
  game.fv = new Decimal(10);
  game.dx_points = new Decimal(0);
  game.ap_points = new Decimal(0);
  game.max_x = new Decimal(10);
  game.x_increase = new Decimal(0.05);
  game.prestige_x = new Decimal(1);
  game.limit.constants = { euler_e: 0, pi: 0, gamma: 0 };

  game.other_upgrades[0].level = 0;
  game.other_upgrades[0].price = new Decimal(1000);
  game.other_upgrades[1].level = 0;
  game.other_upgrades[1].price = new Decimal(100);
  game.other_upgrades[2].level = 0;
  game.other_upgrades[2].price = new Decimal(10);
  game.other_upgrades[3].level = 0;
  game.other_upgrades[3].price = new Decimal(5);

  game.auto_upgrades[0].interval = 2000;
  game.auto_upgrades[1].interval = 2000;
  game.auto_upgrades[2].interval = 5000;
  game.auto_upgrades[3].interval = 15000;
};

test('optimized buyMaxOtherUpgrade maxes x increase utility without long looping', () => {
  resetCommonState();
  game.fv = new Decimal('1e100');

  const upg = game.other_upgrades[1];
  buyMaxOtherUpgrade(upg);

  assert.equal(upg.level, 'MAX');
  assert.equal(upg.price.toString(), '1e9999');
  assert.equal(game.x_increase.toString(), game.max_x.toString());
});

test('optimized buyMaxOtherUpgrade maxes auto interval utility', () => {
  resetCommonState();
  game.ap_points = new Decimal('1e100');

  const upg = game.other_upgrades[3];
  buyMaxOtherUpgrade(upg);

  assert.equal(upg.level, 'MAX');
  assert.equal(upg.price.toString(), '1e9999');
  assert.ok(game.auto_upgrades.every((auto) => auto.interval <= 100));
});

test('optimized buyMaxOtherUpgrade bulk-buys prestige x utility', () => {
  resetCommonState();
  game.dx_points = new Decimal('1e12');

  const upg = game.other_upgrades[2];
  buyMaxOtherUpgrade(upg);

  assert.equal(typeof upg.level, 'number');
  assert.ok(upg.level > 1);
  assert.ok(game.prestige_x.gt(1));
  assert.ok(game.dx_points.lt('1e12'));
});
