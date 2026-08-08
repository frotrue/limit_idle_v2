import Decimal from 'break_eternity.js';
import { game } from '../state.js';
import { getExpUpgradePrice } from '../balance/formulas.js';
import { normalizeRunStartXIncrease } from '../balance/runDefaults.js';
import { saveGame } from './persistence.js';
import {
  LIMIT_CONSTANTS,
  getLpHospitalMultiplier,
  getLpGain,
  getLpPassiveBonus,
  canLimit,
  purchaseLimitConstant,
  performLimitReset as legacyPerformLimitReset
} from '../../gameLogic.js';

const restorePostLimitTransientState = () => {
  const prestigeXUpgrade = game.other_upgrades?.[2];
  if (prestigeXUpgrade) {
    prestigeXUpgrade.level = 0;
    prestigeXUpgrade.price = new Decimal(10);
  }
  game.prestige_x = new Decimal(1);

  Object.values(game.exp_upgrades || {}).forEach((upg) => {
    if (!upg) return;
    upg.level = 0;
    upg.price = getExpUpgradePrice(upg);
  });

  normalizeRunStartXIncrease(game);
};

export const performLimitReset = () => {
  const beforeLimitCount = Number(game.limit?.limit_count || 0);
  legacyPerformLimitReset();

  if (Number(game.limit?.limit_count || 0) <= beforeLimitCount) return false;

  restorePostLimitTransientState();
  saveGame();
  return true;
};

export {
  LIMIT_CONSTANTS,
  getLpHospitalMultiplier,
  getLpGain,
  getLpPassiveBonus,
  canLimit,
  purchaseLimitConstant
};
