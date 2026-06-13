import Decimal from 'break_eternity.js';

export const PRICE_SPIKE_FACTOR = 10;
export const EXP_PRICE_BASE_MULT = 3;
export const EXP_PRICE_GROWTH = 12;
export const MIN_EXP_REBIRTH_PRICE = new Decimal('1e10');
export const EXP_PRICE_SPIKE_EVERY = 5;
export const BASE_MAX_X_HARD_CAP = new Decimal(300);
export const MAX_X_SOFTCAP_START = new Decimal(10);
export const MAX_X_SOFTCAP_POWER = 2.2;
export const MAX_X_MIN_GAIN = new Decimal(0.005);
export const MAX_PRICE = new Decimal('1e9999');

export const getPriceSpikeMultiplier = (level, every = 15) => {
  const lv = Number(level || 0);
  if (lv <= 0 || lv % every !== 0) return new Decimal(1);
  return new Decimal(PRICE_SPIKE_FACTOR);
};

export const getXUpgradePriceMultiplierByLevel = (level) => {
  if (level <= 10) return 1.1;
  if (level <= 50) return 1.2;
  if (level <= 100) return 1.25;
  return 1.35 + Math.floor((level - 100) / 50) * 0.1;
};

export const getMaxXHardCap = (piEffect = 0) => BASE_MAX_X_HARD_CAP.plus(piEffect);

export const getMaxXUpgradeGain = (currentMaxX, hardCap = BASE_MAX_X_HARD_CAP) => {
  const current = new Decimal(currentMaxX || 1);
  const cap = new Decimal(hardCap || BASE_MAX_X_HARD_CAP);
  if (current.gte(cap)) return new Decimal(0);
  if (current.lte(MAX_X_SOFTCAP_START)) return new Decimal(1);
  const reduced = Decimal.pow(MAX_X_SOFTCAP_START.div(current), MAX_X_SOFTCAP_POWER);
  const clampedReduced = Decimal.max(MAX_X_MIN_GAIN, reduced);
  return Decimal.min(clampedReduced, cap.minus(current));
};

export const getExpUpgradePrice = (upg = {}) => {
  const basePrice = new Decimal(upg.base_price || '1e10');
  const level = Number(upg.level || 0);
  const scaled = basePrice
    .times(EXP_PRICE_BASE_MULT)
    .times(Decimal.pow(EXP_PRICE_GROWTH, level))
    .times(getPriceSpikeMultiplier(level, EXP_PRICE_SPIKE_EVERY))
    .floor();
  return Decimal.max(MIN_EXP_REBIRTH_PRICE, scaled);
};

export const geometricBulkCost = (price, ratio, count) => {
  const normalizedPrice = new Decimal(price);
  if (count <= 0) return new Decimal(0);
  if (ratio === 1) return normalizedPrice.times(count).ceil();
  return normalizedPrice.times(Decimal.pow(ratio, count).minus(1)).div(ratio - 1).ceil();
};

export const maxAffordableGeometricCount = (budget, price, ratio, cap) => {
  const normalizedBudget = new Decimal(budget);
  const normalizedPrice = new Decimal(price);
  if (cap <= 0 || normalizedBudget.lt(normalizedPrice)) return 0;
  if (ratio <= 1) return Math.min(cap, normalizedBudget.div(normalizedPrice).floor().toNumber());

  const estimate = normalizedBudget
    .times(ratio - 1)
    .div(normalizedPrice)
    .plus(1)
    .log10()
    .toNumber() / Math.log10(ratio);
  let count = Math.max(0, Math.min(cap, Math.floor(Number.isFinite(estimate) ? estimate : 0)));

  while (count < cap && normalizedBudget.gte(geometricBulkCost(normalizedPrice, ratio, count + 1))) count += 1;
  while (count > 0 && normalizedBudget.lt(geometricBulkCost(normalizedPrice, ratio, count))) count -= 1;
  return count;
};
