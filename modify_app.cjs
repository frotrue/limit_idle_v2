const fs = require('fs');
let content = fs.readFileSync('src/App.vue', 'utf8');

// Insert tab button
content = content.replace(/<button :class="\{ active: activeTab === 'settings' \}" @click="activeTab = 'settings'">/, `<button :class="{ active: activeTab === 'limit' }" @click="activeTab = 'limit'" v-if="game.unlocked_integral">
            <span class="tab-label">LIMIT</span>
            <span v-if="game.limit?.lp?.gt(0)" class="tab-badge" style="background: #bf616a;">L</span>
          </button>
          <button :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">`);

// Insert limit tab pane before settings pane
const limitPane = `
          <!-- [Limit 탭] -->
          <div v-if="activeTab === 'limit'" class="tab-pane">
            <div class="dx-header-card" style="margin-bottom: 12px; background-color: #bf616a; color: white;">
              <div class="label">LIMIT: THE FINAL HORIZON</div>
              <div class="dx-resource-display" style="font-size: 1.4rem;">보유 LP: {{ format(game.limit.lp) }}</div>
            </div>

            <div v-if="canLimit(game.integral_count)" class="limit-reset-box" style="padding: 20px; background: #3b4252; border-radius: 8px; text-align: center; margin-bottom: 20px; border: 2px solid #d08770;">
              <h3 style="color: #d08770; margin-top: 0;">x → ∞</h3>
              <p style="color: #eceff4;">현재 상태로 극한에 도달할 수 있습니다.<br>
              수행 시 업적과 연구 트리를 제외한 **모든 것이 초기화**됩니다.</p>
              <p style="color: #a3be8c; font-size: 1.2rem; font-weight: bold;">예상 획득 LP: +{{ format(getLpGain(game.fv)) }}</p>
              <button class="upgrade-btn" style="background: #bf616a; font-size: 1.2rem; padding: 15px;" @click="performLimitBtn">
                극한으로 향하기 (Limit Reset)
              </button>
            </div>
            <div v-else class="limit-reset-box" style="padding: 20px; background: #2e3440; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <p style="color: #4c566a;">극한에 도달하기 위해서는 적분 50회 이상이 필요합니다.<br>(현재 {{ game.integral_count }} / 50)</p>
            </div>

            <div class="section-title" style="color: #b48ead;">Transcendental Constants (초월 상수)</div>
            <div class="upgrade-grid">
              <div v-for="constant in LIMIT_CONSTANTS" :key="constant.id" class="upg-card">
                <div class="upg-name">{{ constant.name }} <span style="color: #88c0d0;">(Lv.{{ game.limit.constants[constant.id] || 0 }})</span></div>
                <div class="upg-desc">{{ constant.desc }}</div>
                <div class="upg-effect" style="color: #ebcb8b; margin: 5px 0;">현재 효과: {{ constant.effectDesc(game.limit.constants[constant.id] || 0) }}</div>
                <button class="upgrade-btn" 
                        :disabled="game.limit.lp.lt(constant.price(game.limit.constants[constant.id] || 0))"
                        @click="buyLimitConstant(constant.id)">
                  업그레이드 (비용: {{ format(constant.price(game.limit.constants[constant.id] || 0)) }} LP)
                </button>
              </div>
            </div>
            
            <div class="section-title" style="margin-top: 20px; color: #bf616a;">L'Hôpital's Rule (로피탈의 정리 패시브)</div>
            <div class="upg-card" style="width: 100%; border: 1px solid #bf616a;">
              <div class="upg-name" style="color: #bf616a;">극한의 한계 돌파</div>
              <div class="upg-desc">성장이 정체되었을 때, 미분과 적분 횟수를 사용하여 거대한 배율로 치환합니다. (상수 총합 5레벨 이상부터 1 이상의 효과 적용)</div>
              <div class="upg-effect" style="color: #ebcb8b; font-size: 1.1rem;">
                현재 적용 배율: ×{{ format(getLpHospitalMultiplier(game.differentiationCount, game.integral_count, (game.limit.constants.euler_e||0) + (game.limit.constants.pi||0) + (game.limit.constants.gamma||0))) }}
              </div>
            </div>
          </div>
`;
content = content.replace(/<!-- \[Settings 탭\] -->/, limitPane + '\n          <!-- [Settings 탭] -->');

// Update imports
content = content.replace(/LIMIT_CONSTANTS, getLpGain, canLimit \} from '\.\/gameLogic\.js'/, `LIMIT_CONSTANTS, getLpHospitalMultiplier, getLpGain, canLimit, purchaseLimitConstant, performLimitReset } from './gameLogic.js'`);
content = content.replace(/setAlertCallbacks, manualTick, saveGame, loadGame, resetGame\r?\n\} from '\.\/gameLogic\.js'/, `setAlertCallbacks, manualTick, saveGame, loadGame, resetGame, LIMIT_CONSTANTS, getLpHospitalMultiplier, getLpGain, canLimit, purchaseLimitConstant, performLimitReset\n} from './gameLogic.js'`);

// Add methods
content = content.replace(/const activeTab = ref\('fx'\)/, `const activeTab = ref('fx')
const performLimitBtn = () => {
  if (confirm("정말 극한(Limit)에 도달하시겠습니까? 업적과 AP 연구를 제외한 모든 것이 초기화됩니다!")) {
    performLimitReset()
    activeTab.value = 'fx'
  }
}
const buyLimitConstant = (id) => purchaseLimitConstant(id)
`);

fs.writeFileSync('src/App.vue', content);
