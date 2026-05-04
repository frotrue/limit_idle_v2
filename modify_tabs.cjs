const fs = require('fs');
let content = fs.readFileSync('src/App.vue', 'utf8');

if (!content.includes("{ id: 'limit', name: 'Limit', icon: '🛑' }")) {
  content = content.replace(/const tabs = \[/, `const tabs = [
  { id: 'limit', name: 'Limit', icon: '🛑' },`);
  fs.writeFileSync('src/App.vue', content);
}
