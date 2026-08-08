import Decimal from 'break_eternity.js';
import { game } from '../state.js';
import { getResearchBonuses, isAutoResearched } from '../data/apResearch.js';
import { autoTick, performAutoUpgrade } from './automation.js';
import {
  makefx,
  equation_calc,
  differentiate,
  integrate_calc,
  manualTick as legacyManualTick,
  getIntegralBonusValue,
  getTier2MilestoneState,
  getTier2MilestoneTable,
  getTier3MilestoneState,
  getTier3MilestoneTable,
  canDifferentiateNow
} from '../../gameLogic.js';

const suspendAutomationForBaseTick = () => {
  const autoActive = game.auto_upgrades.map((auto) => !!auto.active);
  const autoExpActive = !!game.auto_exp?.active;
  const autoIntegralActive = !!game.auto_integral?.active;

  game.auto_upgrades.forEach((auto) => {
    auto.active = false;
  });
  if (game.auto_exp) game.auto_exp.active = false;
  if (game.auto_integral) game.auto_integral.active = false;

  return () => {
    game.auto_upgrades.forEach((auto, index) => {
      auto.active = autoActive[index] || false;
    });
    if (game.auto_exp) game.auto_exp.active = autoExpActive;
    if (game.auto_integral) game.auto_integral.active = autoIntegralActive;
  };
};

const getGainPerCycleFromDisplayedRate = (maxX, xIncrease) => {
  if (maxX.lte(0) || xIncrease.lte(0)) return new Decimal(0);
  const cyclesPerTick = xIncrease.div(maxX);
  if (cyclesPerTick.lte(0)) return new Decimal(0);
  return new Decimal(game.stats.fv_per_sec || 0).div(cyclesPerTick.times(10));
};

const restoreExactCycleProgress = ({ currentX, maxX, xIncrease }) => {
  if (maxX.lte(0) || xIncrease.lte(0)) return false;

  const totalProgress = currentX.plus(xIncrease);
  const completedCycles = totalProgress.div(maxX).floor();
  const remainder = totalProgress.minus(maxX.times(completedCycles));
  game.current_x = Decimal.max(0, remainder);

  if (completedCycles.lte(1)) return completedCycles.gt(0);

  const gainPerCycle = getGainPerCycleFromDisplayedRate(maxX, xIncrease);
  const missedCycles = completedCycles.minus(1);
  const missedGain = gainPerCycle.times(missedCycles);
  game.fv = game.fv.plus(missedGain);
  game.stats.total_fv = game.stats.total_fv.plus(missedGain);
  return true;
};

const autoDifferentiateConditionMet = () => {
  const cfg = game.auto_diff || {};
  const mode = cfg.mode || 'dx';
  if (mode === 'off' || !canDifferentiateNow()) return false;

  const fvReady = game.fv.gte(new Decimal(cfg.fv_threshold || '1e20'));
  if (mode === 'fv') return fvReady;

  const dxReady = differentiate(game.fx, game.prestige_x).gte(new Decimal(cfg.dx_threshold || '1e6'));
  if (mode === 'dx') return dxReady;
  if (mode === 'either') return fvReady || dxReady;
  return false;
};

const tryAutoDifferentiate = (nowMs, completedCycle) => {
  if (!completedCycle) return false;

  const auto = game.auto_upgrades.find((entry) => entry.targetType === 'differentiate');
  if (!auto || !auto.active || !isAutoResearched(auto.id, game.ap_research)) return false;
  if ((game.auto_diff?.mode || 'dx') === 'off') return false;

  const researchBonuses = getResearchBonuses(game.ap_research);
  const baseCooldown = Math.max(200, Number(game.auto_diff?.cooldown_ms || 1500));
  const cooldownMs = Math.floor(baseCooldown * researchBonuses.autoDiffCooldownMultiplier);
  const lastAt = Number(game.auto_diff?.last_trigger_at || 0);
  if (nowMs - lastAt < cooldownMs) return false;

  const intervalMs = Math.max(100, Number(auto.interval || 15000));
  const lastIntervalTick = Number(auto.lastTick || 0);
  if (nowMs - lastIntervalTick < intervalMs || !autoDifferentiateConditionMet()) return false;

  const changed = performAutoUpgrade(auto);
  if (!changed) return false;

  game.auto_diff.last_trigger_at = nowMs;
  auto.lastTick = nowMs;
  return true;
};

export const runAutomationTick = (nowMs = Date.now(), completedCycle = true) => {
  const differentiated = tryAutoDifferentiate(nowMs, completedCycle);
  autoTick(nowMs);
  return differentiated;
};

export const manualTick = (nowMs = Date.now()) => {
  const beforeCurrentX = new Decimal(game.current_x || 0);
  const beforeMaxX = new Decimal(game.max_x || 1);
  const beforeXIncrease = new Decimal(game.x_increase || 0);
  const restoreAutomation = suspendAutomationForBaseTick();

  try {
    legacyManualTick();
  } finally {
    restoreAutomation();
  }

  const completedCycle = restoreExactCycleProgress({
    currentX: beforeCurrentX,
    maxX: beforeMaxX,
    xIncrease: beforeXIncrease
  });

  runAutomationTick(nowMs, completedCycle);
};

export {
  makefx,
  equation_calc,
  differentiate,
  integrate_calc,
  getIntegralBonusValue,
  getTier2MilestoneState,
  getTier2MilestoneTable,
  getTier3MilestoneState,
  getTier3MilestoneTable
};
