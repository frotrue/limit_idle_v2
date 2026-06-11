import Decimal from 'break_eternity.js';
import { game } from '../state.js';
import { LIMIT_CONSTANTS } from '../data/limitConstants.js';
import {
  buyUpgrade,
  buyOtherUpgrade as legacyBuyOtherUpgrade,
  buyMaxUpgrade
} from '../../gameLogic.js';

const PRICE_SPIKE_FACTOR = 10;
const BASE_MAX_X_HARD_CAP = new Decimal(300);
const MAX_X_SOFTCAP_START = new Decimal(10);
const MAX_X_SOFTCAP_POWER = 2.2;
const MAX_X_MIN_GAIN = new Decimal(0.005);
const MAX_OTHER_ITERATIONS = 2000;

const getPriceSpikeMultiplier = (level, every = 15) => {
  const lv = Number(level || 0);
  if (lv <= 0 || lv % every !== 0) return new Decimal(1);
  return new Decimal(PRICE_SPIKE_FACTOR);
};

const getUpgradeCurrency = (upg) => upg.currency || (upg.type === 'ddx' ? 'DX' : 'FV');

const getCurrencyAmount = (currency) => {
  if (currency === 'AP') return game.ap_points;
  if (currency === 'DX') return game.dx_points;
  return game.fv;
};

const spendCurrency = (currency, amount) => {
  if (currency === 'AP') game.ap_points = game.ap_points.minus(amount);
  else if (currency === 'DX') game.dx_points = game.dx_points.minus(amount);
  else game.fv = game.fv.minus(amount);
};

const getMaxXHardCap = () => {
  const piLevel = game.limit?.constants?.pi || 0;
  const piEffect = LIMIT_CONSTANTS.find(c => c.id === 'pi').getEffect(piLevel);
  return BASE_MAX_X_HARD_CAP.plus(piEffect);
};

const getMaxXUpgradeGain = (currentMaxX) => {
  const current = new Decimal(currentMaxX || 1);
  if (current.gte(getMaxXHardCap())) return new Decimal(0);
  if (current.lte(MAX_X_SOFTCAP_START)) return new Decimal(1);
  const reduced = Decimal.pow(MAX_X_SOFTCAP_START.div(current), MAX_X_SOFTCAP_POWER);
  const clampedReduced = Decimal.max(MAX_X_MIN_GAIN, reduced);
  return Decimal.min(clampedReduced, getMaxXHardCap().minus(current));
};

const geometricBulkCost = (price, ratio, count) => {
  if (count <= 0) return new Decimal(0);
  if (ratio === 1) return price.times(count).ceil();
  return price.times(Decimal.pow(ratio, count).minus(1)).div(ratio - 1).ceil();
};

const maxAffordableGeometricCount = (budget, price, ratio, cap) => {
  if (cap <= 0 || budget.lt(price)) return 0;
  if (ratio <= 1) return Math.min(cap, budget.div(price).floor().toNumber());

  const estimate = budget.times(ratio - 1).div(price).plus(1).log10().toNumber() / Math.log10(ratio);
  let count = Math.max(0, Math.min(cap, Math.floor(Number.isFinite(estimate) ? estimate : 0)));

  while (count < cap && budget.gte(geometricBulkCost(price, ratio, count + 1))) count += 1;
  while (count > 0 && budget.lt(geometricBulkCost(price, ratio, count))) count -= 1;
  return count;
};

const simulateCappedGeometricUpgrade = ({ budget, price, level, capLevel, ratio, onAfterLevel }) => {
  let remaining = new Decimal(budget);
  let nextPrice = new Decimal(price);
  let nextLevel = Number(level || 0);
  let bought = 0;

  while (remaining.gte(nextPrice) && nextLevel < capLevel) {
    const nextTargetLevel = nextLevel + 1;
    const distToSpike = 15 - (nextLevel % 15);
    const maxBulk = Math.min(distToSpike, capLevel - nextLevel);
    const nextLevelSpike = getPriceSpikeMultiplier(nextTargetLevel).gt(1);
    const affordable = nextLevelSpike
      ? 1
      : maxAffordableGeometricCount(remaining, nextPrice, ratio, maxBulk);

    if (affordable <= 0) break;

    const cost = nextLevelSpike
      ? nextPrice
      : geometricBulkCost(nextPrice, ratio, affordable);

    if (remaining.lt(cost)) break;

    remaining = remaining.minus(cost);
    bought += affordable;

    for (let i = 0; i < affordable; i += 1) {
      nextLevel += 1;
      if (typeof onAfterLevel === 'function') onAfterLevel(nextLevel);
    }

    nextPrice = nextPrice
      .times(Decimal.pow(ratio, affordable))
      .times(getPriceSpikeMultiplier(nextLevel))
      .floor();
  }

  return {
    bought,
    spent: budget.minus(remaining),
    nextPrice,
    nextLevel: nextLevel >= capLevel ? 'MAX' : nextLevel
  };
};

const simulatePrestigeXUpgrade = (upg, budget) => {
  let remaining = new Decimal(budget);
  let price = new Decimal(upg.price);
  let level = Number(upg.level || 0);
  let bought = 0;

  while (remaining.gte(price) && bought < MAX_OTHER_ITERATIONS) {
    const nextTargetLevel = level + 1;
    const currentRatio = 1.5 + Math.floor(nextTargetLevel / 50) * 0.1;
    const distToSpike = 15 - (level % 15);
    const nextSegmentLevel = nextTargetLevel <= 50
      ? 50
      : Math.ceil(nextTargetLevel / 50) * 50;
    const distToSegment = Math.max(1, nextSegmentLevel - level);
    const maxBulk = Math.min(distToSpike, distToSegment);
    const nextLevelSpike = getPriceSpikeMultiplier(nextTargetLevel).gt(1);
    const affordable = nextLevelSpike
      ? 1
      : maxAffordableGeometricCount(remaining, price, currentRatio, maxBulk);

    if (affordable <= 0) break;

    const cost = nextLevelSpike
      ? price
      : geometricBulkCost(price, currentRatio, affordable);

    if (remaining.lt(cost)) break;

    remaining = remaining.minus(cost);
    bought += affordable;
    level += affordable;
    price = price
      .times(Decimal.pow(currentRatio, affordable))
      .times(getPriceSpikeMultiplier(level))
      .floor();
  }

  return {
    bought,
    spent: budget.minus(remaining),
    nextPrice: price,
    nextLevel: level
  };
};

const simulateMaxXUpgrade = (upg, budget) => {
  let remaining = new Decimal(budget);
  let price = new Decimal(upg.price);
  let nextLevel = Number(upg.level || 0);
  let bought = 0;
  let simulatedMaxX = new Decimal(game.max_x);
  let totalMaxXGain = new Decimal(0);
  let nextXIncrease = new Decimal(game.x_increase);
  const hardCap = getMaxXHardCap();

  while (remaining.gte(price) && bought < MAX_OTHER_ITERATIONS) {
    const gain = getMaxXUpgradeGain(simulatedMaxX);
    if (gain.lte(0)) {
      return {
        bought,
        spent: budget.minus(remaining),
        nextPrice: new Decimal('1e9999'),
        nextLevel: 'MAX',
        totalMaxXGain,
        nextXIncrease,
        simulatedMaxX
      };
    }

    remaining = remaining.minus(price);
    bought += 1;
    nextLevel += 1;
    totalMaxXGain = totalMaxXGain.plus(gain);
    simulatedMaxX = Decimal.min(hardCap, simulatedMaxX.plus(gain));
    nextXIncrease = nextXIncrease.times(1.1);
    if (nextXIncrease.gt(simulatedMaxX)) nextXIncrease = simulatedMaxX;
    price = Decimal.max(1, price.times(1.6).times(getPriceSpikeMultiplier(nextLevel)).floor());

    if (simulatedMaxX.gte(hardCap)) {
      return {
        bought,
        spent: budget.minus(remaining),
        nextPrice: new Decimal('1e9999'),
        nextLevel: 'MAX',
        totalMaxXGain,
        nextXIncrease,
        simulatedMaxX
      };
    }
  }

  return {
    bought,
    spent: budget.minus(remaining),
    nextPrice: price,
    nextLevel,
    totalMaxXGain,
    nextXIncrease,
    simulatedMaxX
  };
};

const simulateAutoIntervalUpgrade = (upg, budget) => {
  let remaining = new Decimal(budget);
  let price = new Decimal(upg.price);
  let nextLevel = Number(upg.level || 0);
  let bought = 0;
  let intervals = game.auto_upgrades.map((a) => Number(a.interval || 10000));

  while (remaining.gte(price) && intervals.some((v) => v > 100) && bought < 64) {
    remaining = remaining.minus(price);
    bought += 1;
    nextLevel += 1;
    intervals = intervals.map((v) => Math.max(100, Math.floor(v * 0.8)));
    price = Decimal.max(1, price.times(2).times(getPriceSpikeMultiplier(nextLevel)).floor());
  }

  return {
    bought,
    spent: budget.minus(remaining),
    nextPrice: intervals.some((v) => v > 100) ? price : new Decimal('1e9999'),
    nextLevel: intervals.some((v) => v > 100) ? nextLevel : 'MAX',
    intervals
  };
};

const simulateOtherUpgradePurchase = (upg, budget) => {
  if (upg.level === 'MAX') {
    return { bought: 0, spent: new Decimal(0), nextPrice: new Decimal(upg.price), nextLevel: upg.level };
  }

  if (upg.type === 'fx' && upg.id === 0) return simulateMaxXUpgrade(upg, budget);
  if (upg.type === 'fx' && upg.id === 1) {
    return simulateCappedGeometricUpgrade({
      budget,
      price: upg.price,
      level: upg.level,
      capLevel: 100,
      ratio: 1.6
    });
  }

  if (upg.type === 'ddx' && upg.id === 2) return simulatePrestigeXUpgrade(upg, budget);
  if (upg.type === 'ddx' && upg.id === 3) return simulateAutoIntervalUpgrade(upg, budget);

  return { bought: 0, spent: new Decimal(0), nextPrice: new Decimal(upg.price), nextLevel: upg.level };
};

export const buyOtherUpgrade = legacyBuyOtherUpgrade;

export const buyMaxOtherUpgrade = (upg) => {
  if (!upg || upg.level === 'MAX') return;

  const currency = getUpgradeCurrency(upg);
  const budget = getCurrencyAmount(currency);
  if (budget.lt(upg.price)) return;

  const result = simulateOtherUpgradePurchase(upg, budget);
  if (result.bought <= 0) return;

  spendCurrency(currency, result.spent);
  upg.level = result.nextLevel;
  upg.price = result.nextPrice;

  if (upg.type === 'fx') {
    if (upg.id === 0) {
      game.max_x = Decimal.min(getMaxXHardCap(), game.max_x.plus(result.totalMaxXGain || 0));
      game.x_increase = Decimal.min(game.max_x, result.nextXIncrease || game.x_increase);
    } else if (upg.id === 1) {
      if (upg.level === 'MAX') {
        game.x_increase = game.max_x;
      } else {
        game.x_increase = game.x_increase.plus(new Decimal(0.01).times(result.bought));
      }
    }
  } else if (upg.type === 'ddx') {
    if (upg.id === 2) {
      game.prestige_x = game.prestige_x.plus(new Decimal(0.5).times(result.bought));
    } else if (upg.id === 3 && result.intervals) {
      game.auto_upgrades.forEach((auto, index) => {
        auto.interval = result.intervals[index] || auto.interval;
      });
    }
  }
};

export const buyMaxAllOtherUpgrades = (type) => {
  const upgrades = Object.values(game.other_upgrades)
    .filter((u) => u.type === type && u.level !== 'MAX')
    .sort((a, b) => {
      const ap = new Decimal(a.price);
      const bp = new Decimal(b.price);
      if (ap.lt(bp)) return -1;
      if (ap.gt(bp)) return 1;
      return Number(a.id || 0) - Number(b.id || 0);
    });

  upgrades.forEach((upg) => {
    if (getCurrencyAmount(getUpgradeCurrency(upg)).gte(upg.price)) {
      buyMaxOtherUpgrade(upg);
    }
  });
};

export {
  buyUpgrade,
  buyMaxUpgrade
};
