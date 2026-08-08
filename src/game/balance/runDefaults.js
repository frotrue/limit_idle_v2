import Decimal from 'break_eternity.js';
import { getTier3MilestoneBonuses } from '../data/tier3Milestones.js';

export const BASE_RUN_X_INCREASE = new Decimal('0.105');

export const getCanonicalRunStartXIncrease = (game) => {
  const maxX = new Decimal(game?.max_x || 1);
  const tier3 = getTier3MilestoneBonuses(game?.integral_count || 0);
  return Decimal.min(maxX, BASE_RUN_X_INCREASE.plus(tier3.startXIncrease || 0));
};

export const normalizeRunStartXIncrease = (game) => {
  if (!game) return new Decimal(0);
  const next = getCanonicalRunStartXIncrease(game);
  game.x_increase = next;
  return next;
};

export const ensureCanonicalRunStartXIncrease = (game) => {
  if (!game) return false;
  const minimum = getCanonicalRunStartXIncrease(game);
  const current = new Decimal(game.x_increase || 0);
  if (current.gte(minimum)) return false;
  game.x_increase = minimum;
  return true;
};

export const snapshotPrestigeCounters = (game) => ({
  differentiationCount: new Decimal(game?.differentiationCount || 0),
  expMilestonePoints: Number(game?.exp_milestone_points || 0),
  integralCount: Number(game?.integral_count || 0),
  limitCount: Number(game?.limit?.limit_count || 0)
});

export const didPrestigeCounterAdvance = (before, game) => {
  if (!before || !game) return false;
  return game.differentiationCount.gt(before.differentiationCount) ||
    Number(game.exp_milestone_points || 0) > before.expMilestonePoints ||
    Number(game.integral_count || 0) > before.integralCount ||
    Number(game.limit?.limit_count || 0) > before.limitCount;
};

export const normalizeAfterPrestigeAdvance = (before, game) => {
  if (!didPrestigeCounterAdvance(before, game)) return false;
  normalizeRunStartXIncrease(game);
  return true;
};
