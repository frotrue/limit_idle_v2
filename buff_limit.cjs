const fs = require('fs');
let content = fs.readFileSync('src/gameLogic.js', 'utf8');

content = content.replace(/const totalConstants = eLevel \+ pLevel \+ gLevel;\r?\n  result = result\.times\(getLpHospitalMultiplier\(game\.differentiationCount, game\.integral_count, totalConstants\)\);/, `const totalConstants = eLevel + pLevel + gLevel;
  result = result.times(getLpHospitalMultiplier(game.differentiationCount, game.integral_count, totalConstants));
  
  if (game.limit?.lp && game.limit.lp.gt(0)) {
    result = result.times(Decimal.pow(10, game.limit.lp));
  }`);

fs.writeFileSync('src/gameLogic.js', content);
