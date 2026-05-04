const fs = require('fs');
let content = fs.readFileSync('src/gameLogic.js', 'utf8');

content = content.replace(/import \{ ACHIEVEMENTS, getAchievementFvMultiplier, getAchievementExtraAp, getAchievementStartFv \} from '\.\/achievements\.js';\r?\nexport \{ SUPERSCRIPT_MAP, format, AP_RESEARCH_NODES, ACHIEVEMENTS \};/, `import { ACHIEVEMENTS, getAchievementFvMultiplier, getAchievementExtraAp, getAchievementStartFv } from './achievements.js';
import { LIMIT_CONSTANTS, getLpHospitalMultiplier, getLpGain, canLimit } from './tier4/limit.js';

export { SUPERSCRIPT_MAP, format, AP_RESEARCH_NODES, ACHIEVEMENTS, LIMIT_CONSTANTS, getLpGain, canLimit };`);

content = content.replace(/achievements: \[\],\r?\n  history: \{/, `achievements: [],
  limit: {
    lp: new Decimal(0),
    constants: { euler_e: 0, pi: 0, gamma: 0 },
    limit_count: 0
  },
  history: {`);

content = content.replace(/const MAX_X_HARD_CAP = new Decimal\(300\);/, `const BASE_MAX_X_HARD_CAP = new Decimal(300);
const getMaxXHardCap = () => {
  const piLevel = game.limit?.constants?.pi || 0;
  const piEffect = LIMIT_CONSTANTS.find(c => c.id === 'pi').getEffect(piLevel);
  return BASE_MAX_X_HARD_CAP.plus(piEffect);
};`);

content = content.replace(/MAX_X_HARD_CAP/g, 'getMaxXHardCap()');
// Re-fix the definition
content = content.replace(/const BASE_getMaxXHardCap\(\) = new Decimal\(300\);/, 'const BASE_MAX_X_HARD_CAP = new Decimal(300);');

content = content.replace(/const totalExp = \(game\.exp_multiplier \|\| new Decimal\(1\)\)\.plus\(cBonus\);/, `const eulerLevel = game.limit?.constants?.euler_e || 0;
  const eulerBonus = LIMIT_CONSTANTS.find(c => c.id === 'euler_e').getEffect(eulerLevel);
  const totalExp = (game.exp_multiplier || new Decimal(1)).plus(cBonus).plus(eulerBonus);`);

content = content.replace(/result = result\.times\(getAchievementFvMultiplier\(game\.achievements\)\);/, `result = result.times(getAchievementFvMultiplier(game.achievements));
  
  const eLevel = game.limit?.constants?.euler_e || 0;
  const pLevel = game.limit?.constants?.pi || 0;
  const gLevel = game.limit?.constants?.gamma || 0;
  const totalConstants = eLevel + pLevel + gLevel;
  result = result.times(getLpHospitalMultiplier(game.differentiationCount, game.integral_count, totalConstants));`);

content = content.replace(/const gain = rawGain\.times\(researchBonuses\.dxGainMultiplier\);/, `const gammaLevel = game.limit?.constants?.gamma || 0;
  const gammaMult = LIMIT_CONSTANTS.find(c => c.id === 'gamma').getEffect(gammaLevel);
  const gain = rawGain.times(researchBonuses.dxGainMultiplier).times(gammaMult);`);
content = content.replace(/const apGain = Decimal\.max\(1, gain\.plus\(1\)\.log10\(\)\.floor\(\)\.times\(tier2\.apGainMultiplier\)\.floor\(\)\)\.plus\(getAchievementExtraAp\(game\.achievements\)\);/, `const apGain = Decimal.max(1, gain.plus(1).log10().floor().times(tier2.apGainMultiplier).floor()).times(gammaMult).plus(getAchievementExtraAp(game.achievements));`);

const limitFunctions = `
export const purchaseLimitConstant = (id) => {
  const constant = LIMIT_CONSTANTS.find(c => c.id === id);
  if (!constant) return false;
  
  const level = game.limit.constants[id] || 0;
  const price = constant.price(level);
  
  if (game.limit.lp.gte(price)) {
    game.limit.lp = game.limit.lp.minus(price);
    game.limit.constants[id] = level + 1;
    return true;
  }
  return false;
};

export const performLimitReset = () => {
  if (!canLimit(game.integral_count)) return;
  
  const earnedLp = getLpGain(game.fv);
  game.limit.lp = game.limit.lp.plus(earnedLp);
  game.limit.limit_count++;
  
  // Hard reset Tier 1 ~ 3
  game.fv = new Decimal(10);
  game.dx_points = new Decimal(0);
  game.ap_points = new Decimal(0);
  game.dx_multiplier = new Decimal(0);
  game.differentiationCount = new Decimal(0);
  game.prestige_x = new Decimal(1);
  
  game.unlocked_exp = false;
  game.exp_x = new Decimal(0);
  game.exp_multiplier = new Decimal(1);
  game.exp_milestone_points = 0;
  Object.values(game.exp_upgrades).forEach(u => u.level = 0);
  
  game.unlocked_integral = false;
  game.integral_c = new Decimal(0);
  game.integral_count = 0;
  
  applyRunStartState(getTier2MilestoneBonuses(0));
  
  game.history.fv_per_sec = [];
  
  saveGame();
};
`;

content += limitFunctions;

content = content.replace(/game\.achievements = data\.achievements;/, `game.achievements = data.achievements;
  } else {
    game.achievements = [];
  }

  if (data.limit) {
    game.limit.lp = new Decimal(data.limit.lp || 0);
    game.limit.constants = data.limit.constants || { euler_e: 0, pi: 0, gamma: 0 };
    game.limit.limit_count = Number(data.limit.limit_count || 0);`);

fs.writeFileSync('src/gameLogic.js', content);
