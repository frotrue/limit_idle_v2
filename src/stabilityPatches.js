import Decimal from 'break_eternity.js';
import { game, saveGame } from './gameLogic.js';

const SAVE_KEY = 'math_idle_save';
const DEFAULT_LIMIT = {
  lp: '0',
  constants: { euler_e: 0, pi: 0, gamma: 0 },
  limit_count: 0
};

const EXP_PRICE_BASE_MULT = 3;
const EXP_PRICE_GROWTH = 12;
const MIN_EXP_REBIRTH_PRICE = new Decimal('1e10');
const EXP_PRICE_SPIKE_EVERY = 5;
const PRICE_SPIKE_FACTOR = 10;

const getPriceSpikeMultiplier = (level, every = 15) => {
  const lv = Number(level || 0);
  if (lv <= 0 || lv % every !== 0) return new Decimal(1);
  return new Decimal(PRICE_SPIKE_FACTOR);
};

const getExpUpgradePrice = (upg) => {
  const basePrice = new Decimal(upg?.base_price || '1e10');
  const level = Number(upg?.level || 0);
  const scaled = basePrice
    .times(EXP_PRICE_BASE_MULT)
    .times(Decimal.pow(EXP_PRICE_GROWTH, level))
    .times(getPriceSpikeMultiplier(level, EXP_PRICE_SPIKE_EVERY))
    .floor();

  return Decimal.max(MIN_EXP_REBIRTH_PRICE, scaled);
};

const normalizeLimitShape = (limit = {}) => ({
  lp: limit.lp ?? DEFAULT_LIMIT.lp,
  constants: {
    euler_e: Number(limit.constants?.euler_e || 0),
    pi: Number(limit.constants?.pi || 0),
    gamma: Number(limit.constants?.gamma || 0)
  },
  limit_count: Number(limit.limit_count || 0)
});

const normalizeSerializedExpPrice = (data) => {
  const expUpgrade = data?.exp_upgrades?.[0] || data?.exp_upgrades?.['0'];
  const limitCount = Number(data?.limit?.limit_count || 0);
  const expLevel = Number(expUpgrade?.level || 0);
  const expX = new Decimal(data?.exp_x || 0);
  const expMultiplier = new Decimal(data?.exp_multiplier || 1);

  if (!expUpgrade || limitCount <= 0 || expLevel !== 0 || !expX.eq(0) || !expMultiplier.eq(1)) {
    return false;
  }

  const expected = getExpUpgradePrice(expUpgrade).toString();
  if (new Decimal(expUpgrade.price || 0).eq(expected)) return false;

  expUpgrade.price = expected;
  return true;
};

export const applyPreLoadSavePatches = () => {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const raw = window.localStorage.getItem(SAVE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    let changed = false;

    if (!data.limit) {
      data.limit = { ...DEFAULT_LIMIT, constants: { ...DEFAULT_LIMIT.constants } };
      changed = true;
    } else {
      const normalizedLimit = normalizeLimitShape(data.limit);
      if (JSON.stringify(normalizedLimit) !== JSON.stringify(data.limit)) {
        data.limit = normalizedLimit;
        changed = true;
      }
    }

    if (normalizeSerializedExpPrice(data)) changed = true;

    if (changed) {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    }
  } catch (err) {
    console.warn('[Limit Idle] Failed to apply save stability patches:', err);
  }
};

const normalizeRuntimeExpPrice = () => {
  const expUpgrade = game.exp_upgrades?.[0];
  if (!expUpgrade) return false;

  const limitCount = Number(game.limit?.limit_count || 0);
  const expLevel = Number(expUpgrade.level || 0);
  const isPostLimitFreshExpLayer =
    limitCount > 0 &&
    expLevel === 0 &&
    game.exp_x.eq(0) &&
    game.exp_multiplier.eq(1);

  if (!isPostLimitFreshExpLayer) return false;

  const expected = getExpUpgradePrice(expUpgrade);
  if (new Decimal(expUpgrade.price || 0).eq(expected)) return false;

  expUpgrade.price = expected;
  return true;
};

const applyIapProductionLogPatch = () => {
  if (typeof window === 'undefined' || import.meta.env.DEV) return;

  let attempts = 0;
  const maxAttempts = 120;
  const timer = window.setInterval(() => {
    attempts += 1;
    const purchase = window.CdvPurchase;
    if (purchase?.store && purchase?.LogLevel?.ERROR !== undefined) {
      purchase.store.verbosity = purchase.LogLevel.ERROR;
    }

    if (attempts >= maxAttempts) {
      window.clearInterval(timer);
    }
  }, 250);
};

export const applyRuntimeStabilityPatches = () => {
  if (typeof window === 'undefined') return;

  applyIapProductionLogPatch();

  window.setInterval(() => {
    if (normalizeRuntimeExpPrice()) {
      saveGame();
    }
  }, 500);
};
