import Decimal from 'break_eternity.js';

export const SAVE_KEY = 'math_idle_save';

const decimalToString = (value, fallback = '0') => {
  try {
    return new Decimal(value ?? fallback).toString();
  } catch (_err) {
    return new Decimal(fallback).toString();
  }
};

const clonePlain = (value, fallback) => {
  if (value === undefined || value === null) return fallback;
  return JSON.parse(JSON.stringify(value));
};

const serializeUpgradeMap = (upgrades = {}) => {
  const result = {};
  Object.keys(upgrades).forEach((key) => {
    const upg = upgrades[key];
    if (!upg) return;
    result[key] = {
      level: upg.level,
      price: decimalToString(upg.price, '0')
    };
  });
  return result;
};

const serializeAutoUpgrades = (autoUpgrades = []) => autoUpgrades.map((auto) => ({
  active: !!auto.active,
  lastTick: Number(auto.lastTick || 0),
  interval: Math.max(100, Number(auto.interval || 1000)),
  idleUntil: Number(auto.idleUntil || 0),
  idleStreak: Number(auto.idleStreak || 0)
}));

const serializeHistory = (history = {}) => ({
  fv_per_sec: Array.isArray(history.fv_per_sec) ? history.fv_per_sec.slice(-60) : []
});

export const serializeGameState = (game, { now = Date.now() } = {}) => ({
  save_version: Number(game.save_version || 1),
  fv: decimalToString(game.fv, '10'),
  fx: Array.isArray(game.fx) ? game.fx.map((value) => decimalToString(value, '0')) : [],
  fx_str: String(game.fx_str || '1'),
  current_x: decimalToString(game.current_x, '0'),
  max_x: decimalToString(game.max_x, '1'),
  x_increase: decimalToString(game.x_increase, '0.05'),
  prestige_x: decimalToString(game.prestige_x, '1'),
  dx_points: decimalToString(game.dx_points, '0'),
  ap_points: decimalToString(game.ap_points, '0'),
  dx_multiplier: decimalToString(game.dx_multiplier, '0'),
  differentiationCount: decimalToString(game.differentiationCount, '0'),

  unlocked_exp: !!game.unlocked_exp,
  exp_x: decimalToString(game.exp_x, '0'),
  exp_multiplier: decimalToString(game.exp_multiplier, '1'),
  exp_milestone_points: Math.max(0, Number(game.exp_milestone_points || 0)),

  unlocked_integral: !!game.unlocked_integral,
  integral_c: decimalToString(game.integral_c, '0'),
  integral_count: Math.max(0, Number(game.integral_count || 0)),

  stats: {
    total_fv: decimalToString(game.stats?.total_fv, '0'),
    total_dx: decimalToString(game.stats?.total_dx, '0'),
    play_time: Number(game.stats?.play_time || 0),
    session_start: Number(game.stats?.session_start || now),
    fv_per_sec: decimalToString(game.stats?.fv_per_sec, '0')
  },

  is_2x_boost_owned: !!game.is_2x_boost_owned,
  ap_research: Array.isArray(game.ap_research) ? [...game.ap_research] : [],
  achievements: Array.isArray(game.achievements) ? [...game.achievements] : [],

  auto_diff: {
    mode: game.auto_diff?.mode || 'dx',
    fv_threshold: String(game.auto_diff?.fv_threshold || '1e20'),
    dx_threshold: String(game.auto_diff?.dx_threshold || '1e6'),
    cooldown_ms: Math.max(200, Number(game.auto_diff?.cooldown_ms || 1500)),
    last_trigger_at: Number(game.auto_diff?.last_trigger_at || 0)
  },

  auto_exp: {
    active: !!game.auto_exp?.active,
    mode: game.auto_exp?.mode || 'always',
    dx_threshold: String(game.auto_exp?.dx_threshold || '1e15'),
    cooldown_ms: Math.max(1000, Number(game.auto_exp?.cooldown_ms || 5000)),
    last_trigger_at: Number(game.auto_exp?.last_trigger_at || 0)
  },

  auto_integral: {
    active: !!game.auto_integral?.active,
    mode: game.auto_integral?.mode || 'always',
    fv_threshold: String(game.auto_integral?.fv_threshold || '1e50'),
    cooldown_ms: Math.max(1000, Number(game.auto_integral?.cooldown_ms || 10000)),
    last_trigger_at: Number(game.auto_integral?.last_trigger_at || 0)
  },

  limit: {
    ...clonePlain(game.limit || {}, {}),
    lp: decimalToString(game.limit?.lp, '0'),
    constants: {
      euler_e: Number(game.limit?.constants?.euler_e || 0),
      pi: Number(game.limit?.constants?.pi || 0),
      gamma: Number(game.limit?.constants?.gamma || 0)
    },
    limit_count: Number(game.limit?.limit_count || 0)
  },

  history: serializeHistory(game.history),
  ui: {
    layoutMode: ['auto', 'mobile'].includes(game.ui?.layoutMode) ? game.ui.layoutMode : 'auto'
  },
  x_upgrades: serializeUpgradeMap(game.x_upgrades),
  other_upgrades: serializeUpgradeMap(game.other_upgrades),
  exp_upgrades: serializeUpgradeMap(game.exp_upgrades),
  auto_upgrades: serializeAutoUpgrades(game.auto_upgrades),
  lastTick: Number(now)
});

export const saveSerializedGameState = (game, storage = globalThis.localStorage, options = {}) => {
  if (!storage) return false;
  const serialized = serializeGameState(game, options);
  storage.setItem(SAVE_KEY, JSON.stringify(serialized));
  return true;
};
