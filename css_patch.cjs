const fs = require('fs');
let content = fs.readFileSync('src/App.vue', 'utf8');

const css = `
.limit-reset-btn {
  background: linear-gradient(135deg, #bf616a, #d08770);
  color: white;
  font-size: 1.3rem;
  font-weight: bold;
  padding: 16px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(191, 97, 106, 0.4);
  transition: all 0.2s ease;
  animation: pulse-glow 2s infinite;
}
.limit-reset-btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(191, 97, 106, 0.6);
}
.limit-upgrade-btn {
  background: #3b4252;
  color: #eceff4;
  font-size: 1rem;
  font-weight: bold;
  padding: 10px 16px;
  border: 1px solid #88c0d0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 10px;
}
.limit-upgrade-btn:not(:disabled):hover {
  background: #88c0d0;
  color: #2e3440;
}
.limit-upgrade-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #4c566a;
}
@keyframes pulse-glow {
  0% { box-shadow: 0 0 0 0 rgba(191, 97, 106, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(191, 97, 106, 0); }
  100% { box-shadow: 0 0 0 0 rgba(191, 97, 106, 0); }
}
`;

content = content.replace(/<\/style>/, css + '</style>');
fs.writeFileSync('src/App.vue', content);
