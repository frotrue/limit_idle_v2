const fs = require('fs');
let content = fs.readFileSync('src/gameLogic.js', 'utf8');

const prefix = `import { reactive } from 'vue';
import Decimal from 'break_eternity.js';
import { equationCalc, differentiateEquation, integrateEquationAt } from './calc.js';
import { TIER3_MILESTONES, getTier3MilestoneBonuses, getTier3MilestoneProgress } from './tier3/milestones.js';
import { TIER2_MILESTONES, getTier2MilestoneBonuses, getTier2MilestoneProgress } from './tier2/milestones.js';
import { SUPERSCRIPT_MAP, format } from './utils.js';
import { AP_RESEARCH_NODES, canPurchaseResearch, getResearchBonuses, isAutoResearched, hasAnyAutoResearch } from './apResearch.js';
import { ACHIEVEMENTS, getAchievementFvMultiplier, getAchievementExtraAp, getAchievementStartFv } from './achievements.js';
import { LIMIT_CONSTANTS, getLpHospitalMultiplier, getLpGain, canLimit } from './tier4/limit.js';

export { SUPERSCRIPT_MAP, format, AP_RESEARCH_NODES, ACHIEVEMENTS, LIMIT_CONSTANTS, getLpHospitalMultiplier, getLpGain, canLimit };

const SAVE_VERSION = 3;
const EXP_PRICE_BASE_MULT = 3;
const EXP_PRICE_GROWTH = 12;
const MIN_EXP_REBIRTH_PRICE = new Decimal('1e10');
const EXP_REBIRTH_BASE_GAIN = 0.05;
const INTEGRAL_UNLOCK_EXP_REQ = 1.5;

export const game = reactive({
  save_version: SAVE_VERSION,
  fv: new Decimal(10),
`;

fs.writeFileSync('src/gameLogic.js', prefix + content);
