const fs = require('fs');
let content = fs.readFileSync('src/App.vue', 'utf8');

content = content.replace(
  /<button v-if="\['exp', 'integral'\]\.includes\(tab\.id\) \? \(tab\.id === 'exp' \? game\.unlocked_exp : game\.unlocked_integral\) : true"/,
  `<button v-if="isTabVisible(tab.id)"`
);

content = content.replace(/const tabs = \[\r?\n\s*\{ id: 'limit', name: 'Limit', icon: '🛑' \},\r?\n\s*\{ id: 'fx', name: 'Variable', icon: '🧮' \},\r?\n\s*\{ id: 'fdx', name: 'Derivative', icon: '📉' \},\r?\n\s*\{ id: 'auto', name: 'Automation', icon: '⚙️' \},\r?\n\s*\{ id: 'exp', name: 'Exponential', icon: '📈' \},\r?\n\s*\{ id: 'integral', name: 'Integral', icon: '∫' \},\r?\n\s*\{ id: 'shop', name: 'Shop', icon: '🛒' \},\r?\n\s*\{ id: 'stats', name: 'Stats', icon: '📊' \},\r?\n\s*\{ id: 'settings', name: 'Settings', icon: '⚙️' \}\r?\n\]/, `const tabs = [
  { id: 'fx', name: 'Variable', icon: '🧮' },
  { id: 'fdx', name: 'Derivative', icon: '📉' },
  { id: 'auto', name: 'Automation', icon: '⚙️' },
  { id: 'exp', name: 'Exponential', icon: '📈' },
  { id: 'integral', name: 'Integral', icon: '∫' },
  { id: 'limit', name: 'Limit', icon: '🛑' },
  { id: 'shop', name: 'Shop', icon: '🛒' },
  { id: 'stats', name: 'Stats', icon: '📊' },
  { id: 'settings', name: 'Settings', icon: '⚙️' }
]`);

const isTabVisibleFunc = `
const isTabVisible = (tabId) => {
  if (tabId === 'exp') return game.unlocked_exp;
  if (tabId === 'integral') return game.unlocked_integral;
  if (tabId === 'limit') return game.integral_count >= 50 || (game.limit && game.limit.limit_count > 0);
  return true;
}
`;

content = content.replace(/const activeTab = ref\('fx'\)/, isTabVisibleFunc + '\nconst activeTab = ref(\'fx\')');

fs.writeFileSync('src/App.vue', content);
