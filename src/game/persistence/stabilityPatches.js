import Decimal from 'break_eternity.js';
import { getExpUpgradePrice } from '../balance/formulas.js';

const SAVE_KEY = 'math_idle_save';
const DEFAULT_LIMIT = {
  lp: '0',
  constants: { euler_e: 0, pi: 0, gamma: 0 },
  limit_count: 0
};

let runtimePatchesApplied = false;

const getStorage = () => {
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage;
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  return null;
};

const normalizeLimitShape = (limit = {}) => ({
  ...limit,
  lp: limit.lp ?? DEFAULT_LIMIT.lp,
  constants: {
    ...(limit.constants || {}),
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
  const storage = getStorage();
  if (!storage) return;

  const raw = storage.getItem(SAVE_KEY);
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
      storage.setItem(SAVE_KEY, JSON.stringify(data));
    }
  } catch (err) {
    console.warn('[Limit Idle] Failed to apply save stability patches:', err);
  }
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
  if (runtimePatchesApplied) return false;
  runtimePatchesApplied = true;
  applyIapProductionLogPatch();
  return true;
};
