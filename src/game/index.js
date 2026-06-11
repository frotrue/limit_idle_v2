export { game } from './state.js';
export { SUPERSCRIPT_MAP, format } from './formatting.js';

export {
  equationCalc,
  differentiateEquation,
  integrateEquationAt
} from './math/polynomial.js';

export {
  makefx,
  equation_calc,
  differentiate,
  integrate_calc,
  manualTick,
  getIntegralBonusValue,
  getTier2MilestoneState,
  getTier2MilestoneTable,
  getTier3MilestoneState,
  getTier3MilestoneTable
} from './systems/progression.js';

export {
  buyUpgrade,
  buyOtherUpgrade,
  buyMaxUpgrade,
  buyMaxOtherUpgrade,
  buyMaxAllOtherUpgrades
} from './systems/upgrades.js';

export {
  differentiate_bt,
  integrate_bt,
  buyExpUpgrade,
  performTier2Reset,
  performTier3Reset,
  canIntegrate
} from './systems/prestige.js';

export {
  performAutoUpgrade,
  autoTick
} from './systems/automation.js';

export {
  purchaseResearch,
  getResearchState
} from './systems/research.js';

export {
  LIMIT_CONSTANTS,
  getLpHospitalMultiplier,
  getLpGain,
  getLpPassiveBonus,
  canLimit,
  purchaseLimitConstant,
  performLimitReset
} from './systems/limitSystem.js';

export {
  saveGame,
  loadGame,
  resetGame,
  setAlertCallbacks
} from './systems/persistence.js';

export {
  AP_RESEARCH_NODES,
  AUTO_RESEARCH_MAP,
  canPurchaseResearch,
  isAutoResearched,
  hasAnyAutoResearch,
  getResearchBonuses
} from './data/apResearch.js';

export {
  ACHIEVEMENTS,
  getAchievementFvMultiplier,
  getAchievementExtraAp,
  getAchievementStartFv
} from './data/achievements.js';

export {
  TIER2_MILESTONES,
  getUnlockedTier2Milestones,
  getTier2MilestoneBonuses,
  getTier2MilestoneProgress
} from './data/tier2Milestones.js';

export {
  TIER3_MILESTONES,
  getUnlockedTier3Milestones,
  getTier3MilestoneBonuses,
  getTier3MilestoneProgress
} from './data/tier3Milestones.js';
