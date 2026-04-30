import { reactive } from 'vue';
import Decimal from 'break_eternity.js';
import { equationCalc, differentiateEquation, integrateEquationAt } from './calc.js';
import { TIER3_MILESTONES, getTier3MilestoneBonuses, getTier3MilestoneProgress } from './tier3/milestones.js';
import { TIER2_MILESTONES, getTier2MilestoneBonuses, getTier2MilestoneProgress } from './tier2/milestones.js';
import { SUPERSCRIPT_MAP, format } from './utils.js';

export { SUPERSCRIPT_MAP, format };

const SAVE_VERSION = 3;
const EXP_PRICE_BASE_MULT = 3;
const EXP_PRICE_GROWTH = 12;
const MIN_EXP_REBIRTH_PRICE = new Decimal('1e10');
const EXP_REBIRTH_BASE_GAIN = 0.05;
const INTEGRAL_UNLOCK_EXP_REQ = 1.5;

export const game = reactive({
  save_version: SAVE_VERSION,
  fv: new Decimal(10),
  fx: [new Decimal(1), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)],
  fx_str: "1",
  current_x: new Decimal(0),
  max_x: new Decimal(1),
  x_increase: new Decimal(0.05),
  x_upgrades: {
    0: { id: 0, name: 'Upgrade x⁰', price: new Decimal(10), effect: 0.01, type: 'add', level: 0 },
    1: { id: 1, name: 'Upgrade x¹', price: new Decimal(100), effect: 0.05, type: 'add', level: 0 },
    2: { id: 2, name: 'Upgrade x²', price: new Decimal(1000), effect: 0.05, type: 'add', level: 0 },
    3: { id: 3, name: 'Upgrade x³', price: new Decimal(10000), effect: 0.2, type: 'add', level: 0 },
    4: { id: 4, name: 'Upgrade x⁴', price: new Decimal(100000), effect: 0.2, type: 'add', level: 0 },
    5: { id: 5, name: 'Upgrade x⁵', price: new Decimal(1000000), effect: 0.2, type: 'add', level: 0 },
    6: { id: 6, name: 'Upgrade x⁶', price: new Decimal(100000000), effect: 0.2, type: 'add', level: 0 },
    7: { id: 7, name: 'Upgrade x⁷', price: new Decimal(10000000000), effect: 0.2, type: 'add', level: 0 },
    8: { id: 8, name: 'Upgrade x⁸', price: new Decimal(1000000000000), effect: 0.2, type: 'add', level: 0 },
    9: { id: 9, name: 'Upgrade x⁹', price: new Decimal(100000000000000), effect: 0.2, type: 'add', level: 0 }
  },
  other_upgrades: {
    0: { id: 0, name: 'Upgrade max x', price: new Decimal(1000), type: 'fx', level: 0 },
    1: { id: 1, name: 'Upgrade x increase', price: new Decimal(100), type: 'fx', level: 0 },
    2: { id: 2, name: 'Increase x in f\'(x)', price: new Decimal(10), type:'ddx', currency: 'DX', level: 0 },
    3: { id: 3, name: 'Optimize All Auto Intervals', price: new Decimal(5), type:'ddx', currency: 'AP', level: 0 }
  },
  prestige_x: new Decimal(1),
  dx_points: new Decimal(0),
  ap_points: new Decimal(0),
  dx_multiplier: new Decimal(0),
  differentiationCount: new Decimal(0),
  auto_upgrades: [
    { id: 0, name: 'Auto Function Upgrade', targetType: 'x_upgrades', interval: 10000, lastTick: 0, unlockedAt: 1, active: false },
    { id: 1, name: 'Auto FV Utility Upgrade', targetType: 'other_upgrades_fx', interval: 2000, lastTick: 0, unlockedAt: 3, active: false },
    { id: 2, name: 'Auto DX Utility Upgrade', targetType: 'other_upgrades_ddx', interval: 5000, lastTick: 0, unlockedAt: 5, active: false },
    { id: 3, name: 'Auto Differentiate', targetType: 'differentiate', interval: 15000, lastTick: 0, unlockedAt: 7, active: false },
  ],
  auto_diff: {
    mode: 'dx', // off | fv | dx | either
    fv_threshold: '1e20',
    dx_threshold: '1e6',
    cooldown_ms: 1500,
    last_trigger_at: 0
  },
  unlocked_exp: false,
  exp_x: new Decimal(0),
  exp_multiplier: new Decimal(1),
  exp_milestone_points: 0,
  exp_upgrades: {
    0: { id: 0, name: 'Exponential Rebirth', price: new Decimal("1e10"), base_price: new Decimal("1e10"), type: 'exp', level: 0 }
  },
  unlocked_integral: false,
  integral_c: new Decimal(0),
  integral_count: 0,
  stats: {
    total_fv: new Decimal(0),
    total_dx: new Decimal(0),
    play_time: 0,
    session_start: Date.now(),
    fv_per_sec: new Decimal(0)
  },
  is_2x_boost_owned: false,
  lastTick: Date.now()
});

const getTier3StartBonuses = () => {
  const count = Math.max(0, Number(game.integral_count || 0));
  if (cachedTier3Bonuses && cachedTier3BonusCount === count) return cachedTier3Bonuses;

  const raw = getTier3MilestoneBonuses(game.integral_count);
  // Start speed bonus has a cap to prevent runaway acceleration in early loops.
  const cappedXIncrease = Decimal.min(new Decimal(1.2), raw.startXIncrease);
  cachedTier3Bonuses = {
    startFv: raw.startFv,
    startXIncrease: cappedXIncrease,
    startMaxX: raw.startMaxX,
    fvProductionMultiplier: raw.fvProductionMultiplier || new Decimal(1)
  };
  cachedTier3BonusCount = count;
  return cachedTier3Bonuses;
};

const refreshIntegralCache = () => {
  const count = Math.max(0, Number(game.integral_count || 0));
  const cChanged = !cachedIntegralCSource || !game.integral_c.eq(cachedIntegralCSource);
  if (!cChanged && cachedIntegralCountSource === count) return;

  const tier3 = getTier3StartBonuses();
  cachedIntegralEffectiveC = Decimal.max(0, game.integral_c.times(tier3.fvProductionMultiplier || 1));
  cachedIntegralEffectiveCSquare = cachedIntegralEffectiveC.times(cachedIntegralEffectiveC);
  cachedIntegralCSource = new Decimal(game.integral_c);
  cachedIntegralCountSource = count;
};

const getTier2Bonuses = () => getTier2MilestoneBonuses(game.exp_milestone_points);
const hasPermanentAutoUnlock = () => !!getTier2Bonuses().permanentAutoUnlock;
const hasAutoUpgradeUsesMaxBuy = () => !!getTier2Bonuses().autoUpgradeUsesMaxBuy;
const START_LEVEL_CAP = 10;
const AUTO_IDLE_BACKOFF_MAX_MS = 60000;
const MAX_X_HARD_CAP = new Decimal(300);
const MAX_X_SOFTCAP_START = new Decimal(10);
const MAX_X_SOFTCAP_POWER = 2.2;
const MAX_X_MIN_GAIN = new Decimal(0.005);
const PRICE_SPIKE_FACTOR = 10;
const EXP_PRICE_SPIKE_EVERY = 5;
const MAX_BUY_SIMULATION_STEPS = 50000;

let cachedTier3BonusCount = null;
let cachedTier3Bonuses = null;

let cachedIntegralCSource = null;
let cachedIntegralCountSource = null;
let cachedIntegralEffectiveC = new Decimal(1);
let cachedIntegralEffectiveCSquare = new Decimal(1);

const getMaxXUpgradeGain = (currentMaxX) => {
  const current = new Decimal(currentMaxX || 1);
  if (current.gte(MAX_X_HARD_CAP)) return new Decimal(0);
  if (current.lte(MAX_X_SOFTCAP_START)) return new Decimal(1);
  const reduced = Decimal.pow(MAX_X_SOFTCAP_START.div(current), MAX_X_SOFTCAP_POWER);
  const clampedReduced = Decimal.max(MAX_X_MIN_GAIN, reduced);
  return Decimal.min(clampedReduced, MAX_X_HARD_CAP.minus(current));
};

const getPriceSpikeMultiplier = (level, every = 15) => {
  const lv = Number(level || 0);
  if (lv <= 0 || lv % every !== 0) return new Decimal(1);
  return new Decimal(PRICE_SPIKE_FACTOR);
};

const getExpUpgradePrice = (upg) => {
  const scaled = upg.base_price
    .times(EXP_PRICE_BASE_MULT)
    .times(Decimal.pow(EXP_PRICE_GROWTH, upg.level))
    .times(getPriceSpikeMultiplier(upg.level, EXP_PRICE_SPIKE_EVERY))
    .floor();
  return Decimal.max(MIN_EXP_REBIRTH_PRICE, scaled);
};

const getTier2StartBonuses = () => {
  const t2 = getTier2Bonuses();
  const levelMap = {};
  Object.keys(t2.startXUpgradeLevels || {}).forEach((id) => {
    levelMap[id] = Math.min(START_LEVEL_CAP, Math.max(0, Number(t2.startXUpgradeLevels[id] || 0)));
  });
  return {
    startFv: new Decimal(t2.startFv || 0),
    startXUpgradeLevels: levelMap
  };
};

const applyStartingXUpgradeLevels = (tier2) => {
  const start = getTier2StartBonuses().startXUpgradeLevels;
  Object.keys(start).forEach((idKey) => {
    const id = Number(idKey);
    const upg = game.x_upgrades[id];
    if (!upg) return;
    const levels = start[idKey];
    for (let lv = 1; lv <= levels; lv++) {
      game.fx[id] = game.fx[id].plus(1);
      if (lv % 10 === 0) game.fx[id] = game.fx[id].times(2).floor();
      else if (lv % 5 === 0) game.fx[id] = game.fx[id].times(1.5).floor();

      let multiplier = getXUpgradePriceMultiplierByLevel(lv);
      upg.price = Decimal.max(1, upg.price.times(multiplier).times(getPriceSpikeMultiplier(lv)).ceil());
    }
    upg.level = levels;
  });
};

const applyRunStartState = (tier2) => {
  const t3Bonus = getTier3StartBonuses();
  const t2Start = getTier2StartBonuses();

  game.fv = new Decimal(10).plus(t3Bonus.startFv).plus(t2Start.startFv);
  game.fx = [new Decimal(1), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)];
  game.current_x = new Decimal(0);
  game.max_x = Decimal.min(MAX_X_HARD_CAP, new Decimal(1).plus(t3Bonus.startMaxX));
  game.x_increase = Decimal.min(game.max_x, new Decimal(0.05).plus(t3Bonus.startXIncrease));

  Object.values(game.x_upgrades).forEach(upg => {
    upg.level = 0;
    upg.price = Decimal.pow(10, upg.id + 1).ceil();
  });
  applyStartingXUpgradeLevels(tier2);

  game.other_upgrades[0].level = 0;
  game.other_upgrades[0].price = new Decimal(1000);
  game.other_upgrades[1].level = 0;
  game.other_upgrades[1].price = new Decimal(100);
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

export const getTier3MilestoneState = () => {
  const progress = getTier3MilestoneProgress(game.integral_count);
  return {
    ...progress,
    bonuses: getTier3StartBonuses()
  };
};

export const getTier3MilestoneTable = () => {
  const count = Math.max(0, Number(game.integral_count || 0));
  return TIER3_MILESTONES.map((ms) => ({
    ...ms,
    unlocked: count >= ms.at,
    remaining: Math.max(0, ms.at - count)
  }));
};

export const getTier2MilestoneState = () => {
  const progress = getTier2MilestoneProgress(game.exp_milestone_points);
  return {
    ...progress,
    bonuses: getTier2Bonuses()
  };
};

export const getTier2MilestoneTable = () => {
  const count = Math.max(0, Number(game.exp_milestone_points || 0));
  return TIER2_MILESTONES.map((ms) => ({
    ...ms,
    unlocked: count >= ms.at,
    remaining: Math.max(0, ms.at - count)
  }));
};

export const makefx = () => {
  let parts = [];
  for (let i = game.fx.length - 1; i >= 0; i--) {
    if (game.fx[i].neq(0)) {
      let valStr = format(game.fx[i]);
      if (i === 0) parts.push(`${valStr}`);
      else if (i === 1) parts.push(`${valStr}x`);
      else parts.push(`${valStr}x${SUPERSCRIPT_MAP[i]}`);
    }
  }
  let base_str = parts.join(" + ") || "0";
  if (game.dx_multiplier.gt(0)) {
    game.fx_str = `( ${base_str} ) + ${format(game.dx_multiplier)}`;
  } else {
    game.fx_str = base_str;
  }
};

export const equation_calc = (equation, x) => equationCalc(equation, x);

export const differentiate = (equation, x) => differentiateEquation(equation, x);

export const integrate_calc = (equation, x) => integrateEquationAt(equation, x);

let showAlertFn = (msg, title) => console.log(title, msg);
let showConfirmFn = (msg, onConfirm, title) => { if(confirm(msg)) onConfirm(); };

export const setAlertCallbacks = (alertCb, confirmCb) => {
  showAlertFn = alertCb;
  showConfirmFn = confirmCb;
};

const canDifferentiateNow = () => game.fv.gte('1e10');

const isAutoDifferentiateUnlocked = () => {
  const auto = game.auto_upgrades.find((a) => a.targetType === 'differentiate');
  if (!auto || !auto.active) return false;
  return hasPermanentAutoUnlock() || game.differentiationCount.gte(auto.unlockedAt);
};

const getAutoDifferentiateUpgrade = () => game.auto_upgrades.find((a) => a.targetType === 'differentiate');

const isAutoDifferentiateConditionMet = () => {
  const cfg = game.auto_diff || {};
  const mode = cfg.mode || 'dx';
  if (mode === 'off') return false;
  if (!canDifferentiateNow()) return false;

  const fvThreshold = new Decimal(cfg.fv_threshold || '1e20');
  const fvReady = game.fv.gte(fvThreshold);
  if (mode === 'fv') return fvReady;

  const dxThreshold = new Decimal(cfg.dx_threshold || '1e6');
  const expectedDx = differentiate(game.fx, game.prestige_x);
  const dxReady = expectedDx.gte(dxThreshold);

  if (mode === 'dx') return dxReady;
  if (mode === 'either') return fvReady || dxReady;
  return false;
};

const tryAutoDifferentiateByCondition = (nowMs = Date.now()) => {
  if (!isAutoDifferentiateUnlocked()) return false;
  if ((game.auto_diff?.mode || 'dx') === 'off') return false;

  const now = nowMs;
  const cooldownMs = Math.max(200, Number(game.auto_diff?.cooldown_ms || 1500));
  const lastAt = Number(game.auto_diff?.last_trigger_at || 0);
  if (now - lastAt < cooldownMs) return false;

  const auto = getAutoDifferentiateUpgrade();
  const intervalMs = Math.max(100, Number(auto?.interval || 15000));
  const lastIntervalTick = Number(auto?.lastTick || 0);
  const periodReady = now - lastIntervalTick >= intervalMs;
  const conditionReady = isAutoDifferentiateConditionMet();

  // 유저가 설정한 수치 조건 또는 기간 조건 중 하나라도 만족하면 자동 미분 실행
  if (!conditionReady && !periodReady) return false;

  const result = performDifferentiation();
  if (!result) return false;
  game.auto_diff.last_trigger_at = now;
  if (auto) auto.lastTick = now;
  return true;
};

const performDifferentiation = () => {
  // Hard guard: never allow differentiation below requirement, regardless of UI state.
  if (!canDifferentiateNow()) return null;

  const gain = differentiate(game.fx, game.prestige_x);
  const tier2 = getTier2Bonuses();
  const apGain = Decimal.max(1, gain.plus(1).log10().floor().times(tier2.apGainMultiplier).floor());
  game.dx_points = game.dx_points.plus(gain);
  game.ap_points = game.ap_points.plus(apGain);
  game.dx_multiplier = game.dx_multiplier.plus(gain);
  game.differentiationCount = game.differentiationCount.plus(1);

  applyRunStartState(tier2);

  makefx();
  return { gain, apGain };
};

export const differentiate_bt = () => {
  if (canDifferentiateNow()) {
    showConfirmFn("미분 시 현재 모든 함수가 초기화되고 보상을 얻습니다.\n미분 시 f'("+game.prestige_x+") = "+format(differentiate(game.fx,game.prestige_x))+" 만큼의 DX를 얻습니다", () => {
      const result = performDifferentiation();
      if (!result) {
        showAlertFn("미분하려면 최소 1.00e10 FV가 필요합니다.", '알림');
        return;
      }
      const { gain, apGain } = result;
      showAlertFn(`${format(gain)} DX, ${format(apGain)} AP를 획득했습니다!`, '알림');
    }, "미분 확인");
  } else {
    showAlertFn("미분하려면 최소 1.00e10 FV가 필요합니다.", '알림');
  }
};

export const buyUpgrade = (upg) => {
  if (game.fv.gte(upg.price)) {
    const tier2 = getTier2Bonuses();
    game.fv = game.fv.minus(upg.price);
    upg.level++;
    if (upg.type === 'add') {
      game.fx[upg.id] = game.fx[upg.id].plus(1);
      
      // 함수 업그레이드 밸런스 패치
      // 초기 진행을 시원하게 하기 위해 초반(100레벨 이하)은 5레벨마다 1.5배, 10레벨마다 2배로 파격적 보너스
      if (upg.level % 10 === 0) {
        game.fx[upg.id] = game.fx[upg.id].times(2).floor();
      } else if (upg.level % 5 === 0) {
        game.fx[upg.id] = game.fx[upg.id].times(1.5).floor();
      }
      
      // 가격 스케일링: 초반에는 덜 오르게, 후반으로 갈수록 1.5배로 수렴되도록
      // 10레벨 이하: 1.1배 / 50레벨 이하: 1.2배 / 100레벨 이하: 1.25배 / 그 이후: 1.35배
      let multiplier = 1.35;
      if (upg.level <= 10) {
        multiplier = 1.1;
      } else if (upg.level <= 50) {
        multiplier = 1.2;
      } else if (upg.level <= 100) {
        multiplier = 1.25;
      }
      
      upg.price = Decimal.max(1, upg.price.times(multiplier).times(getPriceSpikeMultiplier(upg.level)).ceil());

      makefx();
    }
  }
};

export const buyOtherUpgrade = (upg) => {
  if (upg.level === 'MAX') return;
  let price = new Decimal(upg.price);
  const currency = getUpgradeCurrency(upg);
  if (upg.type ==='fx' && game.fv.gte(price)){
    if (upg.id === 0) {
      const gainPreview = getMaxXUpgradeGain(game.max_x);
      if (gainPreview.lte(0)) {
        upg.level = 'MAX';
        upg.price = new Decimal('1e9999');
        return;
      }
    }

    game.fv = game.fv.minus(price);
    upg.level++;
    if (upg.id === 0) {
      const gain = getMaxXUpgradeGain(game.max_x);
      game.max_x = Decimal.min(MAX_X_HARD_CAP, game.max_x.plus(gain));
      game.x_increase = game.x_increase.times(1.1);
      if (game.x_increase.gt(game.max_x)) game.x_increase = game.max_x;
      upg.price = Decimal.max(1, price.times(1.6).times(getPriceSpikeMultiplier(upg.level)).floor());
      if (game.max_x.gte(MAX_X_HARD_CAP)) {
        upg.level = 'MAX';
        upg.price = new Decimal('1e9999');
      }
    } else if (upg.id === 1) {
      game.x_increase = game.x_increase.plus(0.01);
      upg.price = Decimal.max(1, price.times(1.6).times(getPriceSpikeMultiplier(upg.level)).floor());
      if (upg.level >= 100) {
        game.x_increase = game.max_x;
        upg.level = 'MAX';
        upg.price = new Decimal('1e9999');
      }
    }
  } else if (upg.type ==='ddx' && getCurrencyAmount(currency).gte(price)) {
    spendCurrency(currency, price);
    upg.level++;
    if (upg.id === 2) {
      game.prestige_x = game.prestige_x.plus(0.1);
      let mult = 1.5 + Math.floor(upg.level / 50) * 0.1;
      upg.price = Decimal.max(1, price.times(mult).times(getPriceSpikeMultiplier(upg.level)).floor());
    } else if (upg.id === 3) {
      const canReduceAny = game.auto_upgrades.some(auto => auto.interval > 100);
      if (canReduceAny) {
        game.auto_upgrades.forEach(auto => {
          auto.interval = Math.max(100, Math.floor(auto.interval * 0.8));
        });
        upg.price = Decimal.max(1, price.times(2).times(getPriceSpikeMultiplier(upg.level)).floor());
      } else {
        upg.level = 'MAX';
        upg.price = new Decimal('1e9999');
      }
    }
  }
};

export const buyExpUpgrade = (upg) => {
  if (game.dx_points.gte(upg.price)) {
    showConfirmFn(`[경고: 초월 진화]\n강력한 지수 효과를 얻는 대신, 미분 재화(DX)를 포함한 게임의 모든 진행도가 초기화됩니다.\n\n정말 진행하시겠습니까?`, () => {
      // Hard guard: stale confirm callbacks must not bypass current DX cost.
      if (!game.dx_points.gte(upg.price)) {
        showAlertFn("DX가 부족하여 초월 진화를 진행할 수 없습니다.", '알림');
        return;
      }

      upg.level++;
      game.exp_milestone_points += 1;
      const tier2 = getTier2Bonuses();
      // 단일 지수 환생 버튼 기준 기본 증가량
      let expGain = EXP_REBIRTH_BASE_GAIN;
      expGain += tier2.extraExpX;
      game.exp_x = game.exp_x.plus(expGain);
      
      upg.price = getExpUpgradePrice(upg);
      game.exp_multiplier = new Decimal(1).plus(game.exp_x);

      performTier2Reset();
      showAlertFn(`초월 진화가 완료되었습니다!\n이제 f(x)가 ${format(game.exp_multiplier)} 승수만큼 증폭됩니다.`, '초월 진화');
    }, "초월 진화 확인");
  }
};

export const performTier2Reset = () => {
  const tier2 = getTier2Bonuses();
  const keepAutoProgress = hasPermanentAutoUnlock();
  const preservedIntervals = keepAutoProgress
    ? game.auto_upgrades.map((auto) => Number(auto.interval || 1000))
    : null;
  const preservedAutoOptimizeLevel = keepAutoProgress ? game.other_upgrades[3].level : null;
  const preservedAutoOptimizePrice = keepAutoProgress ? new Decimal(game.other_upgrades[3].price) : null;

  applyRunStartState(tier2);
  game.other_upgrades[2].level = 0;
  game.other_upgrades[2].price = new Decimal(10);
  if (keepAutoProgress) {
    game.other_upgrades[3].level = preservedAutoOptimizeLevel;
    game.other_upgrades[3].price = preservedAutoOptimizePrice;
  } else {
    game.other_upgrades[3].level = 0;
    game.other_upgrades[3].price = new Decimal(5);
  }

  game.dx_points = new Decimal(0);
  game.ap_points = new Decimal(0);
  game.dx_multiplier = new Decimal(0);
  game.differentiationCount = new Decimal(0);
  game.prestige_x = new Decimal(1);

  if (keepAutoProgress && preservedIntervals) {
    game.auto_upgrades.forEach((auto, index) => {
      auto.interval = Math.max(100, Number(preservedIntervals[index] || auto.interval));
    });
  } else {
    game.auto_upgrades[0].interval = 10000;
    game.auto_upgrades[1].interval = 2000;
    game.auto_upgrades[2].interval = 5000;
    game.auto_upgrades[3].interval = 15000;
  }

  if (hasPermanentAutoUnlock()) {
    game.auto_upgrades.forEach(auto => {
      auto.active = true;
    });
  }

  makefx();
  saveGame()
};

export const performTier3Reset = () => {
  performTier2Reset(); // 1, 2차 초기화 내용 포함
  
  // 지수(Exp) 관련 추가 초기화
  game.exp_x = new Decimal(0);
  game.exp_multiplier = new Decimal(1);
  
  Object.values(game.exp_upgrades).forEach(upg => {
    upg.level = 0;
    upg.price = getExpUpgradePrice(upg);
  });
  
  saveGame();
};

export const canIntegrate = () => game.unlocked_integral && game.exp_multiplier.gte(INTEGRAL_UNLOCK_EXP_REQ);

export const integrate_bt = () => {
  // 로직 레벨 가드: UI 상태와 무관하게 조건 미달이면 절대 실행되지 않도록 차단
  if (canIntegrate()) {
    let logFv = Decimal.max(0, game.fv.log10());
    let gain = logFv.pow(0.7).floor();
    if (gain.lt(1)) gain = new Decimal(1);

    showConfirmFn(`[경고: 적분 (3차 환생)]\n현재까지의 모든 f(x), 미분(DX), 지수(Exp)를 잃는 대신,\n영구적인 지수 보너스를 제공하는 '적분 상수(C)' ${format(gain)} 를 얻습니다.\n(C 1당 기본 지수 +0.1)\n\n정말 진행하시겠습니까?`, () => {
      game.integral_c = game.integral_c.plus(gain);
      game.integral_count += 1;
      
      performTier3Reset();
      showAlertFn(`적분 환생이 완료되었습니다!\n현재 C: ${format(game.integral_c)}, 적용 보너스: +${format(getIntegralBonusValue().times(0.1))}`, '적분 환생');
    }, "적분 환생 확인");
  } else {
    showAlertFn(`적분 환생을 하려면 최소 ${INTEGRAL_UNLOCK_EXP_REQ.toFixed(2)} 의 Exp 증폭이 필요합니다.`, '알림');
  }
};

// DX는 기본 생산량을 보정하고, 적분은 최종 생산량을 증폭해 역할을 분리한다.
export const getIntegralBonusValue = () => {
  refreshIntegralCache();
  return cachedIntegralEffectiveC;
};


const getPostExpBaseGain = () => {
  let baseGain = equation_calc(game.fx, game.max_x);
  if (baseGain.lt(1)) baseGain = new Decimal(1);
  if (game.dx_multiplier.gt(0)) baseGain = baseGain.plus(game.dx_multiplier);
  if (game.is_2x_boost_owned) baseGain = baseGain.times(2);
  
  refreshIntegralCache();
  const cBonus = cachedIntegralEffectiveC.times(0.1);
  const totalExp = (game.exp_multiplier || new Decimal(1)).plus(cBonus);
  
  return baseGain.pow(totalExp);
};

const getXUpgradePriceMultiplierByLevel = (level) => {
  if (level <= 10) return 1.1;
  if (level <= 50) return 1.2;
  if (level <= 100) return 1.25;
  return 1.35 + Math.floor((level - 100) / 50) * 0.1;
};

const simulateMaxXUpgradePurchase = (upg, budget, tier2) => {
  let remaining = new Decimal(budget);
  let price = new Decimal(upg.price);
  let nextLevel = Number(upg.level || 0);
  let nextFx = new Decimal(game.fx[upg.id] || 0);
  let bought = 0;

  // 등비수열 합 공식을 활용한 O(1) 블록 계산 로직 적용
  // 기존의 반복문을 제거하고, 배수가 변하거나 비용 스파이크가 발생하는 구간을 묶어 일괄 계산합니다.
  while (remaining.gte(price) && bought < MAX_BUY_SIMULATION_STEPS) {
    let nextTargetLevel = nextLevel + 1;
    let mult = getXUpgradePriceMultiplierByLevel(nextTargetLevel);
    let spikeMult = getPriceSpikeMultiplier(nextTargetLevel);

    // 일괄 구매 가능한 최대 레벨(현재 스케일링 구간 및 스파이크를 벗어나지 않는 범위) 계산
    let distToSpike = EXP_PRICE_SPIKE_EVERY - (nextLevel % EXP_PRICE_SPIKE_EVERY);
    let distToShift = Infinity;
    if (nextLevel < 10) distToShift = 10 - nextLevel;
    else if (nextLevel < 50) distToShift = 50 - nextLevel;
    else if (nextLevel < 100) distToShift = 100 - nextLevel;
    else {
      let currentSection = Math.floor((nextLevel - 100) / 50);
      let nextSectionLevel = 100 + (currentSection + 1) * 50;
      distToShift = nextSectionLevel - nextLevel;
    }

    let maxBulk = Math.min(distToSpike, distToShift);
    if (spikeMult.gt(1) && distToSpike === EXP_PRICE_SPIKE_EVERY) {
      maxBulk = 1; // 스파이크가 발생한 레벨은 단일 계산 처리
    }

    let r = mult;
    let affordable = maxBulk;

    // 공식: 등비수열의 합 = a(r^n - 1) / (r - 1)
    if (r > 1) {
      let maxKLog = remaining.times(r - 1).div(price).plus(1).log10().toNumber() / Math.log10(r);
      let maxK = isNaN(maxKLog) ? 0 : Math.floor(maxKLog);
      if (maxK < affordable) affordable = Math.max(1, maxK);
    } else {
      let maxK = remaining.div(price).floor().toNumber();
      if (maxK < affordable) affordable = Math.max(1, maxK);
    }

    let bulkCost;
    if (r > 1) {
      // 정확도를 위해 floor() 대신 누적값 계산 보정
      bulkCost = price.times( Decimal.pow(r, affordable).minus(1) ).div( r - 1 ).ceil();
    } else {
      bulkCost = price.times(affordable).ceil();
    }

    if (remaining.lt(bulkCost)) {
      // 실수 연산 오차로 인한 fallback
      if (affordable > 1) {
        affordable -= 1;
        bulkCost = price.times( Decimal.pow(r, affordable).minus(1) ).div( r - 1 ).ceil();
      } else {
        break;
      }
    }

    remaining = remaining.minus(bulkCost);
    bought += affordable;

    // 함수 2배/1.5배 보너스는 O(1) 공식을 적용하기 까다로우므로 해당 구간을 압축 반복하여 적용
    for (let j = 1; j <= affordable; j++) {
      let lv = nextLevel + j;
      nextFx = nextFx.plus(1);
      if (lv % 10 === 0) nextFx = nextFx.times(2).floor();
      else if (lv % 5 === 0) nextFx = nextFx.times(1.5).floor();
    }

    nextLevel += affordable;
    // spikeMult는 다음 레벨 기준으로 재계산하여 적용
    let nextSpikeMult = getPriceSpikeMultiplier(nextLevel, 15);
    price = price.times(Decimal.pow(r, affordable)).times(nextSpikeMult).ceil();

    if (affordable < maxBulk) break;
  }

  return {
    bought,
    spent: budget.minus(remaining),
    nextPrice: price,
    nextLevel,
    nextFx
  };
};

const simulateMaxOtherUpgradePurchase = (upg, budget, tier2) => {
  if (upg.level === 'MAX') return { bought: 0, spent: new Decimal(0), nextPrice: new Decimal(upg.price), nextLevel: upg.level };

  let remaining = new Decimal(budget);
  let price = new Decimal(upg.price);
  let nextLevel = Number(upg.level || 0);
  let bought = 0;
  let hitsMax = false;
  let simulatedMaxX = new Decimal(game.max_x);
  let totalMaxXGain = new Decimal(0);
  let nextXIncrease = new Decimal(game.x_increase);

  let intervals = game.auto_upgrades.map((a) => Number(a.interval || 10000));

  for (let i = 0; i < 50000; i++) {
    if (upg.type === 'fx' && upg.id === 0) {
      const gainPreview = getMaxXUpgradeGain(simulatedMaxX);
      if (gainPreview.lte(0)) {
        nextLevel = 'MAX';
        price = new Decimal('1e9999');
        hitsMax = true;
        break;
      }
    }

    if (remaining.lt(price) || hitsMax) break;
    remaining = remaining.minus(price);
    bought += 1;
    nextLevel += 1;

    if (upg.type === 'fx') {
      if (upg.id === 0) {
        const gain = getMaxXUpgradeGain(simulatedMaxX);
        totalMaxXGain = totalMaxXGain.plus(gain);
        simulatedMaxX = Decimal.min(MAX_X_HARD_CAP, simulatedMaxX.plus(gain));
        nextXIncrease = nextXIncrease.times(1.1);
        if (nextXIncrease.gt(simulatedMaxX)) nextXIncrease = simulatedMaxX;
        price = Decimal.max(1, price.times(1.6).times(getPriceSpikeMultiplier(nextLevel)).floor());
        if (simulatedMaxX.gte(MAX_X_HARD_CAP)) {
          nextLevel = 'MAX';
          price = new Decimal('1e9999');
          hitsMax = true;
        }
      } else if (upg.id === 1) {
        price = Decimal.max(1, price.times(1.6).times(getPriceSpikeMultiplier(nextLevel)).floor());
        if (nextLevel >= 100) {
          nextLevel = 'MAX';
          price = new Decimal('1e9999');
          hitsMax = true;
        }
      }
    } else if (upg.type === 'ddx') {
      if (upg.id === 2) {
        let mult = 1.5 + Math.floor(nextLevel / 50) * 0.1;
        price = Decimal.max(1, price.times(mult).times(getPriceSpikeMultiplier(nextLevel)).floor());
      } else if (upg.id === 3) {
        const canReduceAny = intervals.some((v) => v > 100);
        if (canReduceAny) {
          intervals = intervals.map((v) => Math.max(100, Math.floor(v * 0.8)));
          price = Decimal.max(1, price.times(2).times(getPriceSpikeMultiplier(nextLevel)).floor());
        } else {
          nextLevel = 'MAX';
          price = new Decimal('1e9999');
          hitsMax = true;
        }
      }
    }
  }

  return {
    bought,
    spent: budget.minus(remaining),
    nextPrice: price,
    nextLevel,
    intervals,
    totalMaxXGain,
    nextXIncrease,
    simulatedMaxX
  };
};

export const buyMaxUpgrade = (upg) => {
  if (!upg || upg.type !== 'add' || !game.fv.gte(upg.price)) return;
  const tier2 = getTier2Bonuses();
  const result = simulateMaxXUpgradePurchase(upg, game.fv, tier2);
  if (result.bought <= 0) return;

  game.fv = game.fv.minus(result.spent);
  upg.level = result.nextLevel;
  upg.price = result.nextPrice;
  game.fx[upg.id] = result.nextFx;
  makefx();
};

export const buyMaxOtherUpgrade = (upg) => {
  if (!upg || upg.level === 'MAX') return;

  const tier2 = getTier2Bonuses();
  const currency = getUpgradeCurrency(upg);
  const budget = getCurrencyAmount(currency);
  if (budget.lt(upg.price)) return;

  const result = simulateMaxOtherUpgradePurchase(upg, budget, tier2);
  if (result.bought <= 0) return;

  spendCurrency(currency, result.spent);
  upg.level = result.nextLevel;
  upg.price = result.nextPrice;

  if (upg.type === 'fx') {
    if (upg.id === 0) {
      game.max_x = Decimal.min(MAX_X_HARD_CAP, game.max_x.plus(result.totalMaxXGain || 0));
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
      game.prestige_x = game.prestige_x.plus(new Decimal(0.1).times(result.bought));
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

export const performAutoUpgrade = (auto) => {
  if (auto.targetType === 'differentiate') {
    if (canDifferentiateNow()) {
      performDifferentiation();
      return true;
    }
    return false;
  }

  let changed = false;
  if (hasAutoUpgradeUsesMaxBuy()) {
    if (auto.targetType === 'x_upgrades') {
      Object.values(game.x_upgrades).reverse().forEach(upg => {
        const before = Number(upg.level || 0);
        buyMaxUpgrade(upg);
        if (Number(upg.level || 0) > before) changed = true;
      });
    } else if (auto.targetType === 'other_upgrades_fx') {
      const before = Object.values(game.other_upgrades)
        .filter(u => u.type === 'fx')
        .reduce((sum, u) => sum + (u.level === 'MAX' ? 999999 : Number(u.level || 0)), 0);
      buyMaxAllOtherUpgrades('fx');
      const after = Object.values(game.other_upgrades)
        .filter(u => u.type === 'fx')
        .reduce((sum, u) => sum + (u.level === 'MAX' ? 999999 : Number(u.level || 0)), 0);
      changed = after > before;
    } else if (auto.targetType === 'other_upgrades_ddx') {
      const before = Object.values(game.other_upgrades)
        .filter(u => u.type === 'ddx')
        .reduce((sum, u) => sum + (u.level === 'MAX' ? 999999 : Number(u.level || 0)), 0);
      buyMaxAllOtherUpgrades('ddx');
      const after = Object.values(game.other_upgrades)
        .filter(u => u.type === 'ddx')
        .reduce((sum, u) => sum + (u.level === 'MAX' ? 999999 : Number(u.level || 0)), 0);
      changed = after > before;
    }
    return changed;
  }

  if (auto.targetType === 'x_upgrades') {
    Object.values(game.x_upgrades).reverse().forEach(upg => {
      const before = Number(upg.level || 0);
      buyUpgrade(upg);
      if (Number(upg.level || 0) > before) changed = true;
    });
  } else if (auto.targetType === 'other_upgrades_fx') {
    Object.values(game.other_upgrades).forEach(upg => {
      if (upg.type !== 'fx') return;
      const before = upg.level;
      buyOtherUpgrade(upg);
      if (before !== upg.level) changed = true;
    });
  } else if (auto.targetType === 'other_upgrades_ddx') {
    Object.values(game.other_upgrades).forEach(upg => {
      if (upg.type !== 'ddx') return;
      const before = upg.level;
      buyOtherUpgrade(upg);
      if (before !== upg.level) changed = true;
    });
  }
  return changed;
};

export const autoTick = (nowMs = Date.now()) => {
  const now = nowMs;
  const permanentAuto = hasPermanentAutoUnlock();
  game.auto_upgrades.forEach(auto => {
    if (auto.active && (permanentAuto || game.differentiationCount.gte(auto.unlockedAt))) {
      if (auto.targetType === 'differentiate') return;
      if (auto.idleUntil && now < auto.idleUntil) return;
      if (now - auto.lastTick >= auto.interval) {
        auto.lastTick = now;
        const changed = performAutoUpgrade(auto);
        if (changed) {
          auto.idleStreak = 0;
          auto.idleUntil = 0;
        } else {
          auto.idleStreak = Math.min(8, Number(auto.idleStreak || 0) + 1);
          const backoff = Math.min(AUTO_IDLE_BACKOFF_MAX_MS, auto.interval * Math.pow(2, auto.idleStreak));
          auto.idleUntil = now + backoff;
        }
      }
    }
  });
};

export const manualTick = () => {
  if (!game.unlocked_exp && (game.dx_points.gte(10000) || game.fv.gte("1e24"))) {
    game.unlocked_exp = true;
    showAlertFn("지수 함수가 해금되었습니다! Exponential 탭을 확인하세요.", '알림');
  }
  
  // 밸런스 조절: 1e5 -> 2
  if (!game.unlocked_integral && game.exp_multiplier.gte(INTEGRAL_UNLOCK_EXP_REQ)) {
    game.unlocked_integral = true;
    showAlertFn("적분 함수가 해금되었습니다! Integral 탭을 확인하세요.", '알림');
  }

  let gainPerCycle = getPostExpBaseGain();
  const cyclesPerTick = game.x_increase.div(game.max_x);
  game.stats.fv_per_sec = gainPerCycle.times(cyclesPerTick).times(10);

  let completedCycle = false;
  if (game.x_increase.gte(game.max_x)) {
    game.fv = game.fv.plus(gainPerCycle);
    game.stats.total_fv = game.stats.total_fv.plus(gainPerCycle);
    game.current_x = new Decimal(0);
    completedCycle = true;
  } else {
    game.current_x = game.current_x.plus(game.x_increase);
    if (game.current_x.gte(game.max_x)) {
      game.fv = game.fv.plus(gainPerCycle);
      game.stats.total_fv = game.stats.total_fv.plus(gainPerCycle);
      game.current_x = new Decimal(0);
      completedCycle = true;
    }
  }

  if (completedCycle && tryAutoDifferentiateByCondition()) {
    game.stats.play_time += 0.1;
    autoTick();
    return;
  }

  game.stats.play_time += 0.1;
  autoTick();
};

export const saveGame = () => {
  game.save_version = SAVE_VERSION;
  game.lastTick = Date.now();
  localStorage.setItem('math_idle_save', JSON.stringify(game));
};

export const loadGame = () => {
  const saved = localStorage.getItem('math_idle_save');
  if (!saved) return;
  const data = JSON.parse(saved);
  const loadedVersion = Number(data.save_version || 1);
  game.save_version = loadedVersion;
  game.fv = new Decimal(data.fv || 10);
  game.current_x = new Decimal(data.current_x || 0);
  game.max_x = Decimal.min(MAX_X_HARD_CAP, new Decimal(data.max_x || 1));
  game.x_increase = new Decimal(data.x_increase || 0.05);
  if (game.x_increase.gt(game.max_x)) game.x_increase = game.max_x;
  game.prestige_x = new Decimal(data.prestige_x || 1);
  game.dx_points = new Decimal(data.dx_points || 0);
  game.ap_points = new Decimal(data.ap_points || 0);
  game.dx_multiplier = new Decimal(data.dx_multiplier || 0);
  game.differentiationCount = new Decimal(data.differentiationCount || 0);
  
  game.unlocked_exp = data.unlocked_exp || false;
  game.exp_x = new Decimal(data.exp_x || 0);
  // v3 마이그레이션: exp_multiplier를 exp_x로부터 재계산 (구 공식 e^x → 신 공식 1+x)
  game.exp_multiplier = new Decimal(1).plus(game.exp_x);
  game.exp_milestone_points = Math.max(0, Number(data.exp_milestone_points || 0));
  
  game.unlocked_integral = data.unlocked_integral || false;
  game.integral_c = new Decimal(data.integral_c || 0);
  game.integral_count = Math.max(0, Number(data.integral_count || 0));

  // 통계 데이터 복원
  if (data.stats) {
    game.stats.total_fv = new Decimal(data.stats.total_fv || 0);
    game.stats.total_dx = new Decimal(data.stats.total_dx || 0);
    game.stats.play_time = Number(data.stats.play_time || 0);
  }

  const savedAutoDiff = data.auto_diff || {};
  game.auto_diff.mode = ['off', 'fv', 'dx', 'either'].includes(savedAutoDiff.mode) ? savedAutoDiff.mode : 'dx';
  game.auto_diff.fv_threshold = savedAutoDiff.fv_threshold || '1e20';
  game.auto_diff.dx_threshold = savedAutoDiff.dx_threshold || '1e6';
  game.auto_diff.cooldown_ms = Math.max(200, Number(savedAutoDiff.cooldown_ms || 1500));
  game.auto_diff.last_trigger_at = Number(savedAutoDiff.last_trigger_at || 0);

  if (loadedVersion < 2) {
    // Legacy saves had no version marker; milestone bonuses are derived from integral_count.
    game.save_version = SAVE_VERSION;
  }

  game.is_2x_boost_owned = data.is_2x_boost_owned || false;
  if (data.fx) game.fx = data.fx.map(val => new Decimal(val));
  if (data.x_upgrades) {
    for (let key in game.x_upgrades) {
      if (data.x_upgrades[key]) {
        game.x_upgrades[key].level = data.x_upgrades[key].level;
        game.x_upgrades[key].price = new Decimal(data.x_upgrades[key].price);
      }
    }
  }
  if (data.other_upgrades) {
    for (let key in game.other_upgrades) {
      if (data.other_upgrades[key]) {
        game.other_upgrades[key].level = data.other_upgrades[key].level;
        game.other_upgrades[key].price = new Decimal(data.other_upgrades[key].price);
      }
    }
  }
  if (data.exp_upgrades) {
    for (let key in game.exp_upgrades) {
      if (data.exp_upgrades[key] && game.exp_upgrades[key]) {
        game.exp_upgrades[key].level = data.exp_upgrades[key].level || 0;
        game.exp_upgrades[key].price = getExpUpgradePrice(game.exp_upgrades[key]);
      }
    }
  }
  if (data.auto_upgrades) {
    data.auto_upgrades.forEach((savedAuto, index) => {
      if (game.auto_upgrades[index]) {
        game.auto_upgrades[index].active = savedAuto.active;
        game.auto_upgrades[index].lastTick = savedAuto.lastTick || 0;
        if (savedAuto.interval !== undefined) {
          game.auto_upgrades[index].interval = Math.max(100, Number(savedAuto.interval || game.auto_upgrades[index].interval));
        }
      }
    });
  }
  if (hasPermanentAutoUnlock()) {
    game.auto_upgrades.forEach(auto => {
      auto.active = true;
    });
  }
  makefx();

  // 오프라인 보상(Offline Progress) 시뮬레이션 계산 로직
  if (data.lastTick) {
    const now = Date.now();
    const offlineMs = now - data.lastTick;
    
    if (offlineMs > 60000) {
      const maxSteps = 1000;
      let stepMs = Math.max(100, Math.floor(offlineMs / maxSteps));
      let steps = Math.floor(offlineMs / stepMs);
      let remainderMs = offlineMs % stepMs;

      let simulatedNow = data.lastTick;
      let initialTotalFv = new Decimal(game.stats.total_fv);

      for (let i = 0; i < steps; i++) {
        simulatedNow += stepMs;
        let gainPerCycle = getPostExpBaseGain();
        let stepCycles = game.x_increase.div(game.max_x).times(stepMs / 100);
        let stepGain = gainPerCycle.times(stepCycles);

        game.fv = game.fv.plus(stepGain);
        game.stats.total_fv = game.stats.total_fv.plus(stepGain);
        game.stats.play_time += stepMs / 1000;

        autoTick(simulatedNow);
        tryAutoDifferentiateByCondition(simulatedNow);
      }

      if (remainderMs > 0) {
        simulatedNow += remainderMs;
        let gainPerCycle = getPostExpBaseGain();
        let stepCycles = game.x_increase.div(game.max_x).times(remainderMs / 100);
        let stepGain = gainPerCycle.times(stepCycles);

        game.fv = game.fv.plus(stepGain);
        game.stats.total_fv = game.stats.total_fv.plus(stepGain);
        game.stats.play_time += remainderMs / 1000;

        autoTick(simulatedNow);
        tryAutoDifferentiateByCondition(simulatedNow);
      }

      let totalProduced = game.stats.total_fv.minus(initialTotalFv);
      const offlineSecs = offlineMs / 1000;

      setTimeout(() => {
        showAlertFn(`방치 환영합니다!\n${offlineSecs.toFixed(0)}초 동안의 정밀 오프라인 시뮬레이션 완료:\n총 약 ${format(totalProduced)} FV 생산 (모든 자동 기능 반영됨)`, '오프라인 보상');
      }, 1000);
    }
  }
  game.lastTick = Date.now();
};

export const resetGame = () => {
  showConfirmFn("모든 데이터를 초기화하시겠습니까?", () => {
    localStorage.removeItem('math_idle_save');
    location.reload();
  }, "초기화 확인");
};

// 디버깅 및 테스트용 콘솔 명령어
if (typeof window !== 'undefined') {
  const getMaxTier2MilestoneAt = () => TIER2_MILESTONES.reduce((max, ms) => Math.max(max, Number(ms.at || 0)), 0);
  const getMaxTier3MilestoneAt = () => TIER3_MILESTONES.reduce((max, ms) => Math.max(max, Number(ms.at || 0)), 0);

  window.debug = {
    addFV: (amount = "1e10") => {
      game.fv = game.fv.plus(amount);
      console.log(`${amount} FV가 추가되었습니다.`);
    },
    addDX: (amount = "1e10") => {
      game.dx_points = game.dx_points.plus(amount);
      game.unlocked_exp = true; // DX를 추가하면 Exp 탭도 같이 확인하기 편하도록 해금
      console.log(`${amount} DX가 추가되었습니다.`);
    },
    addAP: (amount = "100") => {
      game.ap_points = game.ap_points.plus(amount);
      console.log(`${amount} AP가 추가되었습니다.`);
    },
    forceTier2: (expAmount = "0.7") => {
      // 즉시 2차 환생(지수) 효과 부여 및 해금
      game.unlocked_exp = true;
      game.exp_x = game.exp_x.plus(expAmount);
      game.exp_multiplier = new Decimal(1).plus(game.exp_x);
      performTier2Reset();
      console.log(`2차 환생(초월)이 강제로 실행되었습니다! 현재 exp_multiplier: ${format(game.exp_multiplier)}`);
    },
    forceTier3: (cAmount = "100") => {
      // 즉시 3차 환생(적분) 효과 부여 및 해금
      game.unlocked_exp = true;
      game.unlocked_integral = true;
      game.integral_c = game.integral_c.plus(cAmount);
      game.integral_count += 1;
      performTier3Reset();
      console.log(`3차 환생(적분)이 강제로 실행되었습니다! 현재 적분 상수 C: ${format(game.integral_c)}, 적용 C 값: ${format(getIntegralBonusValue())}`);
    },
    unlockAll: () => {
      game.unlocked_exp = true;
      game.unlocked_integral = true;
      console.log("모든 탭(Exp, Integral)이 해금되었습니다.");
    },
    addMilestones: (tier2Points = 1, tier3Integrals = 1) => {
      const t2 = Math.max(0, Number(tier2Points || 0));
      const t3 = Math.max(0, Number(tier3Integrals || 0));

      game.exp_milestone_points += t2;
      game.integral_count += t3;
      game.unlocked_exp = game.unlocked_exp || game.exp_milestone_points > 0;
      game.unlocked_integral = game.unlocked_integral || game.integral_count > 0;

      console.log(`마일스톤 포인트 추가 완료: Tier2 +${t2}, Tier3 +${t3} (현재 Tier2=${game.exp_milestone_points}, Tier3=${game.integral_count})`);
    },
    unlockAllMilestones: () => {
      const t2Target = getMaxTier2MilestoneAt();
      const t3Target = getMaxTier3MilestoneAt();
      const addT2 = Math.max(0, t2Target - Number(game.exp_milestone_points || 0));
      const addT3 = Math.max(0, t3Target - Number(game.integral_count || 0));

      game.exp_milestone_points += addT2;
      game.integral_count += addT3;
      game.unlocked_exp = true;
      game.unlocked_integral = true;

      console.log(`모든 마일스톤 해금 완료: Tier2 +${addT2}, Tier3 +${addT3} (목표 Tier2=${t2Target}, Tier3=${t3Target})`);
    },
    tier3: () => {
      const info = getTier3MilestoneState();
      console.log('[Tier3 Milestone State]', {
        count: info.count,
        unlocked: info.unlocked.map(m => `${m.name}(at ${m.at})`),
        next: info.next ? `${info.next.name}(at ${info.next.at})` : 'all unlocked',
        bonuses: {
          startFv: format(info.bonuses.startFv),
          startXIncrease: format(info.bonuses.startXIncrease),
          startMaxX: format(info.bonuses.startMaxX),
          fvProductionMultiplier: format(info.bonuses.fvProductionMultiplier)
        }
      });
    },
    help: () => {
      console.log(`
[디버그 명령어 목록]
debug.addFV("1e10")     - FV 재화 추가 (기본값 1e10)
debug.addDX("1e10")     - DX 재화 추가 (기본값 1e10)
debug.addAP("100")      - AP 재화 추가 (기본값 100)
debug.forceTier2("0.7") - 즉시 2차 환생 트리거 & Exp 배율 획득
debug.forceTier3("100") - 즉시 3차 환생 트리거 & 적분 상수(C) 획득
debug.unlockAll()       - 모든 탭 해금
debug.addMilestones(5, 3) - 마일스톤 포인트/횟수 물리적 추가 (Tier2, Tier3)
debug.unlockAllMilestones() - 모든 Tier2/Tier3 마일스톤 즉시 해금
debug.tier3()           - 3티어 마일스톤/보너스 상태 출력
      `);
    }
  };
  console.log("🛠️ 테스트용 디버그 명령어가 로드되었습니다. 콘솔에 debug.help() 를 입력해보세요.");
}
