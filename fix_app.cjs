const fs = require('fs');
let content = fs.readFileSync('src/App.vue', 'utf8');

content = content.replace(/<button :class="\{ active: activeTab === 'limit' \}" @click="activeTab = 'limit'" v-if="game\.unlocked_integral">\s*<span class="tab-label">LIMIT<\/span>\s*<span v-if="game\.limit\?\.lp\?\.gt\(0\)" class="tab-badge" style="background: #bf616a;">L<\/span>\s*<\/button>\s*/, '');

fs.writeFileSync('src/App.vue', content);
