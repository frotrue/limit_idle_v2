<template>
<!-- 3. Automation 탭 -->
        <div class="tab-pane">
          <div class="dx-header-card" style="margin-bottom: 12px;">
            <div class="label">AUTOMATION POINTS</div>
            <div class="dx-resource-display" style="font-size: 1.5rem;">{{ format(game.ap_points) }} AP</div>
            <div class="exp-desc" style="margin-top: 5px;">Differentiation Count: {{ format(game.differentiationCount) }}</div>
          </div>

          <nav class="tab-menu" style="margin-bottom: 12px;">
            <button :class="{ active: autoSubTab === 'automation' }" @click="autoSubTab = 'automation'">
              <span class="tab-label">자동화</span>
            </button>
            <button :class="{ active: autoSubTab === 'research' }" @click="autoSubTab = 'research'">
              <span class="tab-label">연구 트리</span>
            </button>
          </nav>

          <div v-if="autoSubTab === 'automation'">
            <!-- 해금된 자동화가 없을 때 안내 -->
            <div v-if="!game.ap_research.some(id => ['auto_function','auto_fv_utility','auto_dx_utility','auto_differentiate','auto_exp','auto_integral'].includes(id))"
                 class="stats-container" style="text-align: center; padding: 30px;">
              <div class="exp-desc" style="font-size: 1rem; color: #888;">🔒 해금된 자동화가 없습니다</div>
              <div class="exp-desc" style="margin-top: 8px;">연구 트리에서 자동화를 해금하세요!</div>
            </div>

            <!-- 기본 자동 업그레이드 (연구로 해금된 것만 표시) -->
            <template v-if="game.ap_research.some(id => ['auto_function','auto_fv_utility','auto_dx_utility','auto_differentiate'].includes(id))">
              <div class="section-title">⚙️ 기본 자동 업그레이드</div>
              <div class="upgrade-grid">
                <div v-for="auto in game.auto_upgrades" :key="auto.id"
                     v-show="isAutoNodeResearched(auto.id)"
                     class="upg-card-mini">
                  <div class="upg-name">{{ auto.name }}</div>
                  <div v-if="auto.targetType !== 'differentiate'" class="upg-level">Interval: {{ formatAutoInterval(auto.interval) }}</div>
                  <div v-else class="upg-level">Condition: {{ autoDiffConditionLabel }}</div>
                  <button class="sub-btn"
                          :style="{ backgroundColor: auto.active ? '#5e81ac' : '#1a1a1e', width: '100%' }"
                          @click="auto.active = !auto.active">
                    {{ auto.active ? 'ACTIVE' : 'INACTIVE' }}
                  </button>
                </div>
              </div>
            </template>

            <!-- 자동 미분 설정 (auto_differentiate 연구 해금 시) -->
            <div v-if="game.ap_research.includes('auto_differentiate')" class="stats-container" style="margin-top: 14px;">
              <div class="stats-item" style="display:block; border-bottom:none; padding-bottom:0;">
                <div class="stats-label" style="margin-bottom: 8px;">📉 Auto Differentiate Settings</div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                  <select v-model="game.auto_diff.mode" class="sub-input">
                    <option value="off">OFF (비활성)</option>
                    <option value="fv">FV 임계치</option>
                    <option value="dx">예상 DX 임계치</option>
                    <option value="either">FV 또는 DX 임계치</option>
                  </select>

                  <input
                    v-if="['fv', 'either'].includes(game.auto_diff.mode)"
                    v-model="game.auto_diff.fv_threshold"
                    class="sub-input"
                    type="text"
                    placeholder="FV threshold (예: 1e20)"
                  />

                  <input
                    v-if="['dx', 'either'].includes(game.auto_diff.mode)"
                    v-model="game.auto_diff.dx_threshold"
                    class="sub-input"
                    type="text"
                    placeholder="DX threshold (예: 1e6)"
                  />

                  <input
                    v-model.number="game.auto_diff.cooldown_ms"
                    class="sub-input"
                    type="number"
                    min="200"
                    step="100"
                    placeholder="Cooldown ms"
                  />

                  <div class="exp-desc">현재 설정: {{ autoDiffConditionLabel }}</div>
                </div>
              </div>
            </div>

            <!-- 자동 Tier 2 환생 (auto_exp 연구 해금 시) -->
            <div v-if="game.ap_research.includes('auto_exp')" class="stats-container" style="margin-top: 14px;">
              <div class="stats-item" style="display:block; border-bottom:none; padding-bottom:0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                  <div class="stats-label">📈 Auto Exponential Rebirth</div>
                  <button class="sub-btn"
                          :style="{ backgroundColor: game.auto_exp.active ? '#5e81ac' : '#1a1a1e', padding: '6px 14px', fontSize: '0.75rem' }"
                          @click="game.auto_exp.active = !game.auto_exp.active">
                    {{ game.auto_exp.active ? 'ON' : 'OFF' }}
                  </button>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                  <select v-model="game.auto_exp.mode" class="sub-input">
                    <option value="always">항상 (DX 충분 시)</option>
                    <option value="dx_threshold">DX 임계치 이상일 때</option>
                  </select>
                  <input v-if="game.auto_exp.mode === 'dx_threshold'" v-model="game.auto_exp.dx_threshold" class="sub-input" type="text" placeholder="DX threshold (예: 1e15)" />
                  <input v-model.number="game.auto_exp.cooldown_ms" class="sub-input" type="number" min="1000" step="1000" placeholder="쿨다운 (ms)" />
                  <div class="exp-desc">
                    모드: {{ game.auto_exp.mode === 'always' ? '항상' : `DX ≥ ${game.auto_exp.dx_threshold}` }}
                    / 쿨다운: {{ (game.auto_exp.cooldown_ms / 1000).toFixed(1) }}초
                  </div>
                </div>
              </div>
            </div>

            <!-- 자동 Tier 3 환생 (auto_integral 연구 해금 시) -->
            <div v-if="game.ap_research.includes('auto_integral')" class="stats-container" style="margin-top: 14px;">
              <div class="stats-item" style="display:block; border-bottom:none; padding-bottom:0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                  <div class="stats-label">∫ Auto Integration</div>
                  <button class="sub-btn"
                          :style="{ backgroundColor: game.auto_integral.active ? '#5e81ac' : '#1a1a1e', padding: '6px 14px', fontSize: '0.75rem' }"
                          @click="game.auto_integral.active = !game.auto_integral.active">
                    {{ game.auto_integral.active ? 'ON' : 'OFF' }}
                  </button>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                  <select v-model="game.auto_integral.mode" class="sub-input">
                    <option value="always">항상 (조건 충족 시)</option>
                    <option value="fv_threshold">FV 임계치 이상일 때</option>
                  </select>
                  <input v-if="game.auto_integral.mode === 'fv_threshold'" v-model="game.auto_integral.fv_threshold" class="sub-input" type="text" placeholder="FV threshold (예: 1e50)" />
                  <input v-model.number="game.auto_integral.cooldown_ms" class="sub-input" type="number" min="1000" step="1000" placeholder="쿨다운 (ms)" />
                  <div class="exp-desc">
                    모드: {{ game.auto_integral.mode === 'always' ? '항상' : `FV ≥ ${game.auto_integral.fv_threshold}` }}
                    / 쿨다운: {{ (game.auto_integral.cooldown_ms / 1000).toFixed(1) }}초
                  </div>
                </div>
              </div>
            </div>
          </div>


          <div v-else>
            <div class="section-title">AP Research Tree</div>
            <div class="exp-desc" style="margin-bottom: 12px; color: #88c0d0;">영구적인 자동화 연구를 해금하세요. 환생으로 절대 사라지지 않습니다.</div>
            <div class="upgrade-grid">
              <div v-for="node in AP_RESEARCH_NODES" :key="node.id"
                   class="upg-card-mini"
                   :class="{
                     'research-unlocked': game.ap_research.includes(node.id),
                     'can-buy': !game.ap_research.includes(node.id) && canBuyResearch(node.id),
                     'locked': !game.ap_research.includes(node.id) && !canBuyResearch(node.id)
                   }"
                   style="position: relative;">
                <div class="upg-name">{{ node.icon }} {{ node.name }}</div>
                <div class="upg-desc" style="font-size: 0.75rem; color: #d8dee9; margin: 4px 0;">{{ node.desc }}</div>
                <div v-if="node.requires.length > 0" class="upg-desc" style="font-size: 0.65rem; color: #666; margin-bottom: 4px;">
                  선행: {{ node.requires.map(r => getResearchNodeName(r)).join(', ') }}
                </div>
                <div v-if="game.ap_research.includes(node.id)" class="upg-level" style="color: #a3be8c;">✔ 해금됨</div>
                <template v-else>
                  <div class="upg-cost">
                    <span class="cost-val">{{ node.cost }}</span>
                    <span class="cost-unit">AP</span>
                  </div>
                  <button class="sub-btn"
                          :style="{ width: '100%', marginTop: '6px', backgroundColor: canBuyResearch(node.id) ? '#5e81ac' : '#2e3440' }"
                          :disabled="!canBuyResearch(node.id)"
                          @click="buyResearch(node.id)">
                    {{ canBuyResearch(node.id) ? '연구 해금' : '조건 미충족' }}
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { game, format, purchaseResearch, AP_RESEARCH_NODES, canPurchaseResearch, isAutoResearched } from '@/game'

const emit = defineEmits(['alert'])
const autoSubTab = ref('automation')

const canBuyResearch = (nodeId) => canPurchaseResearch(nodeId, game.ap_research, game.ap_points)
const isAutoNodeResearched = (autoId) => isAutoResearched(autoId, game.ap_research)

const buyResearch = (nodeId) => {
  if (purchaseResearch(nodeId)) {
    const node = AP_RESEARCH_NODES.find(n => n.id === nodeId)
    if (node) emit('alert', `${node.icon} ${node.name} 연구가 해금되었습니다!\n효과: ${node.desc}`, '연구 해금')
  }
}

const getResearchNodeName = (nodeId) => {
  const node = AP_RESEARCH_NODES.find(n => n.id === nodeId)
  return node ? node.name : nodeId
}

const autoDiffConditionLabel = computed(() => {
  const mode = game.auto_diff?.mode || 'dx'
  const fv = game.auto_diff?.fv_threshold || '1e20'
  const dx = game.auto_diff?.dx_threshold || '1e6'
  const cooldown = Math.max(200, Number(game.auto_diff?.cooldown_ms || 1500))

  if (mode === 'off') return `OFF / 쿨다운 ${cooldown}ms`
  if (mode === 'fv') return `FV >= ${fv} / 쿨다운 ${cooldown}ms`
  if (mode === 'dx') return `예상 DX >= ${dx} / 쿨다운 ${cooldown}ms`
  return `FV >= ${fv} 또는 예상 DX >= ${dx} / 쿨다운 ${cooldown}ms`
})

const formatAutoInterval = (intervalMs) => {
  const ms = Number(intervalMs || 0)
  if (ms > 0 && ms < 100) return 'per tick'
  return `${(ms / 1000).toFixed(1)}s`
}
</script>
