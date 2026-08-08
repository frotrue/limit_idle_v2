import Decimal from 'break_eternity.js';
import { game } from '../state.js';
import { equationCalc } from '../math/polynomial.js';
import { getTier3MilestoneBonuses } from '../data/tier3Milestones.js';
import { getResearchBonuses } from '../data/apResearch.js';
import { ACHIEVEMENTS, getAchievementFvMultiplier } from '../data/achievements.js';
import { LIMIT_CONSTANTS, getLpHospitalMultiplier } from '../data/limitConstants.js';
import { runAutomationTick } from './progression.js';

const EXP_UNLOCK_DX_REQUIREMENT = new Decimal('1e4');
const EXP_UNLOCK_FV_REQUIREMENT = new Decimal('1e24');
const INTEGRAL_UNLOCK_EXP_REQUIREMENT = new Decimal('1.5');

export const createOfflineStepPlan = (
  offlineMs,
  { maxSteps = 5000, minStepMs = 100 } = {}
) => {
  const totalMs = Math.max(0, Math.floor(Number(offlineMs) || 0));
  const boundedMaxSteps = Math.max(1, Math.floor(Number(maxSteps) || 1));
  const boundedMinStepMs = Math.max(1, Math.floor(Number(minStepMs) || 1));
  if (totalMs <= 0) return [];

  const stepCount = Math.max(1, Math.min(boundedMaxSteps, Math.ceil(totalMs / boundedMinStepMs)));
  const baseStepMs = Math.floor(totalMs / stepCount);
  const remainderMs = totalMs - (baseStepMs * stepCount);

  return Array.from(
    { length: stepCount },
    (_, index) => baseStepMs + (index < remainderMs ? 1 : 0)
  );
};

export const getCurrentGainPerCycle = () => {
  let baseGain = equationCalc(game.fx, game.max_x);
  if (baseGain.lt(1)) baseGain = new Decimal(1);
  if (game.dx_multiplier.gt(0)) baseGain = baseGain.plus(game.dx_multiplier);
  if (game.is_2x_boost_owned) baseGain = baseGain.times(2);

  const tier3 = getTier3MilestoneBonuses(game.integral_count);
  const tier3FvMultiplier = tier3.fvProductionMultiplier || new Decimal(1);
  const effectiveC = Decimal.max(0, game.integral_c.times(tier3FvMultiplier));
  const cBonus = effectiveC.times(0.1);

  const eulerLevel = game.limit?.constants?.euler_e || 0;
  const eulerBonus = LIMIT_CONSTANTS.find((constant) => constant.id === 'euler_e').getEffect(eulerLevel);
  const totalExp = new Decimal(game.exp_multiplier || 1).plus(cBonus).plus(eulerBonus);

  let result = baseGain.pow(totalExp);
  if (tier3FvMultiplier.gt(1)) result = result.times(tier3FvMultiplier);

  const researchBonuses = getResearchBonuses(game.ap_research);
  if (researchBonuses.fvProductionMultiplier.gt(1)) {
    result = result.times(researchBonuses.fvProductionMultiplier);
  }

  result = result.times(getAchievementFvMultiplier(game.achievements));

  const eLevel = game.limit?.constants?.euler_e || 0;
  const pLevel = game.limit?.constants?.pi || 0;
  const gLevel = game.limit?.constants?.gamma || 0;
  const totalConstants = eLevel + pLevel + gLevel;
  result = result.times(
    getLpHospitalMultiplier(game.differentiationCount, game.integral_count, totalConstants)
  );

  if (game.limit?.lp && game.limit.lp.gt(0)) {
    result = result.times(Decimal.pow(10, game.limit.lp));
  }

  return result;
};

const refreshUnlocks = () => {
  if (!game.unlocked_exp && (
    game.dx_points.gte(EXP_UNLOCK_DX_REQUIREMENT) ||
    game.fv.gte(EXP_UNLOCK_FV_REQUIREMENT)
  )) {
    game.unlocked_exp = true;
  }

  if (!game.unlocked_integral && game.exp_multiplier.gte(INTEGRAL_UNLOCK_EXP_REQUIREMENT)) {
    game.unlocked_integral = true;
  }
};

const refreshAchievements = () => {
  ACHIEVEMENTS.forEach((achievement) => {
    if (!game.achievements.includes(achievement.id) && achievement.check(game)) {
      game.achievements.push(achievement.id);
    }
  });
};

const simulateProductionStep = (durationMs) => {
  const maxX = new Decimal(game.max_x || 1);
  const xIncrease = new Decimal(game.x_increase || 0);
  const gainPerCycle = getCurrentGainPerCycle();
  const researchBonuses = getResearchBonuses(game.ap_research);
  const offlineMultiplier = researchBonuses.offlineMultiplier || new Decimal(1);

  if (maxX.lte(0) || xIncrease.lte(0)) {
    game.stats.fv_per_sec = new Decimal(0);
    game.stats.play_time += durationMs / 1000;
    return false;
  }

  game.stats.fv_per_sec = gainPerCycle.times(xIncrease.div(maxX)).times(10);

  const totalProgress = new Decimal(game.current_x || 0)
    .plus(xIncrease.times(durationMs / 100));
  const completedCycles = totalProgress.div(maxX).floor();
  const remainder = totalProgress.minus(maxX.times(completedCycles));
  game.current_x = Decimal.max(0, remainder);

  if (completedCycles.gt(0)) {
    const produced = gainPerCycle.times(completedCycles).times(offlineMultiplier);
    game.fv = game.fv.plus(produced);
    game.stats.total_fv = game.stats.total_fv.plus(produced);
  }

  game.stats.play_time += durationMs / 1000;
  return completedCycles.gt(0);
};

export const simulateOfflineProgress = ({
  startMs,
  endMs = Date.now(),
  maxSteps = 5000,
  minStepMs = 100
} = {}) => {
  const start = Number(startMs || 0);
  const end = Math.max(start, Number(endMs || Date.now()));
  const offlineMs = Math.max(0, end - start);
  const stepPlan = createOfflineStepPlan(offlineMs, { maxSteps, minStepMs });
  const initialTotalFv = new Decimal(game.stats.total_fv || 0);

  let simulatedNow = start;
  stepPlan.forEach((durationMs) => {
    simulatedNow += durationMs;
    const completedCycle = simulateProductionStep(durationMs);
    refreshUnlocks();
    refreshAchievements();
    runAutomationTick(simulatedNow, completedCycle);
    refreshUnlocks();
    refreshAchievements();
  });

  return {
    offlineMs,
    steps: stepPlan.length,
    totalProduced: new Decimal(game.stats.total_fv || 0).minus(initialTotalFv)
  };
};
