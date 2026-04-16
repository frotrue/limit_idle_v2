<!--
Limit Idle
reference : gemini 3.1 and codex 5.3
github : frotrue/limit-idle
using tech : vue.js, break_eternity.js
made by frotrue
-->

<template>
  <div id="app" class="app-wrapper">
    <div class="container">

      <!-- [상단 헤더] 현재 진행도 및 f(x) 수식 표시 -->
      <header class="header-card">
        <div class="label">CURRENT PROGRESS</div>
        <h1 class="resource-display">{{ format(game.fv) }}</h1>
        <div class="income-rate">f(x) = {{ game.fx_str }}</div>

        <div class="progress-section">
          <div class="progress-info">
            <span>X-Axis: {{ format(game.current_x) }} / {{ format(game.max_x) }}</span>
          </div>
        </div>
      </header>

      <!-- [네비게이션] 탭 메뉴 버튼 -->
      <nav class="tab-menu">
        <template v-for="tab in tabs" :key="tab.id">
          <button v-if="['exp', 'integral'].includes(tab.id) ? (tab.id === 'exp' ? game.unlocked_exp : game.unlocked_integral) : true"
                  :class="{ active: activeTab === tab.id }"
                  @click="activeTab = tab.id">
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-label">{{ tab.name }}</span>
          </button>
        </template>
      </nav>

      <!-- [메인 콘텐츠 영역] 선택된 탭에 따라 내용 변경 -->
      <main class="main-content">
        
        <!-- 1. Variable 탭 (f(x) 관련 업그레이드) -->
        <div v-if="activeTab === 'fx'" class="tab-pane">
          <div class="section-header">
            <div class="section-title">Variable Upgrades</div>
            <button class="buy-max-btn" @click="Object.values(game.x_upgrades).reverse().forEach(u => buyMaxUpgrade(u))">BUY MAX</button>
          </div>
          <div class="upgrade-grid">
            <button v-for="upg in game.x_upgrades"
                    :key="upg.id"
                    class="upg-card-mini"
                    :class="{
                      'can-buy': game.fv.gte(upg.price),
                      'locked': game.fv.lt(upg.price)
                    }"
                    @click="buyUpgrade(upg)"
                    @contextmenu.prevent="buyMaxUpgrade(upg)">
              <div class="upg-name">{{ upg.name }}</div>
              <div class="upg-cost">
                <span class="cost-val">{{ format(upg.price) }}</span>
                <span class="cost-unit">FV</span>
              </div>
              <div class="upg-level">Lv.{{ upg.level }}</div>
            </button>
          </div>

          <br>
          
          <div class="section-header">
            <div class="section-title">Other Upgrades</div>
            <button class="buy-max-btn" @click="buyMaxAllOtherUpgrades('fx')">BUY MAX</button>
          </div>
          <div class="upgrade-grid">
            <template v-for="upg in game.other_upgrades" :key="upg.id">
              <button v-if="upg.type === 'fx'"
                      class="upg-card-mini"
                      :class="{
                        'can-buy': game.fv.gte(upg.price),
                        'locked': game.fv.lt(upg.price)
                      }"
                      @click="buyOtherUpgrade(upg)"
                      @contextmenu.prevent="buyMaxOtherUpgrade(upg)">
                <div class="upg-name">{{ upg.name }}</div>
                <div class="upg-cost">
                  <span class="cost-val">{{ format(upg.price) }}</span>
                  <span class="cost-unit">FV</span>
                </div>
                <div class="upg-level">Lv.{{ upg.level }}</div>
              </button>
            </template>
          </div>
        </div>

        <!-- 2. Derivative 탭 (환생 및 미분 보상) -->
        <div v-if="activeTab === 'fdx'" class="tab-pane">
          <div class="dx-header-card">
            <div class="label">DERIVATIVE POINTS</div>
            <div class="dx-resource-display">{{ format(game.dx_points) }} DX</div>
            <div class="exp-desc" style="margin-top: 5px; color: #88c0d0;">Automation Points: {{ format(game.ap_points) }} AP</div>
          </div>

          <div class="section-title">Differentiation</div>
          <div class="upgrade-grid">
            <button class="upg-card-mini full-row prestige-btn" @click="differentiate_bt">
              <div class="upg-name">Differentiate f(x)</div>
              <div class="upg-desc">Reset progress to gain DX points</div>
            </button>
          </div>

          <div class="section-header">
            <div class="section-title">Derivative Upgrades</div>
            <button class="buy-max-btn" @click="buyMaxAllOtherUpgrades('ddx')">BUY MAX</button>
          </div>
          <div class="upgrade-grid">
            <template v-for="upg in game.other_upgrades" :key="upg.id">
              <button v-if="upg.type === 'ddx'"
                      class="upg-card-mini"
                      :class="{
                        'can-buy': canAffordUpgrade(upg),
                        'locked': !canAffordUpgrade(upg)
                      }"
                      @click="buyOtherUpgrade(upg)"
                      @contextmenu.prevent="buyMaxOtherUpgrade(upg)">
                <div class="upg-name">{{ upg.name }}</div>
                <div class="upg-cost">
                  <span class="cost-val">{{ format(upg.price) }}</span>
                  <span class="cost-unit">{{ getUpgradeCurrencyLabel(upg) }}</span>
                </div>
                <div class="upg-level">Lv.{{ upg.level }}</div>
              </button>
            </template>
          </div>
        </div>

        <!-- 3. Automation 탭 -->
        <div v-if="activeTab === 'auto'" class="tab-pane">
          <div class="section-title">Automation</div>
          <div class="dx-header-card" style="margin-bottom: 20px;">
            <div class="label">DIFFERENTIATION COUNT</div>
            <div class="dx-resource-display" style="font-size: 1.5rem;">{{ format(game.differentiationCount) }}</div>
          </div>

          <div class="upgrade-grid">
            <div v-for="auto in game.auto_upgrades" :key="auto.id"
                 class="upg-card-mini"
                 :class="{ 'locked': !tier2MilestoneState.bonuses.permanentAutoUnlock && game.differentiationCount.lt(auto.unlockedAt) }">
              <div class="upg-name">{{ auto.name }}</div>
              
              <template v-if="tier2MilestoneState.bonuses.permanentAutoUnlock || game.differentiationCount.gte(auto.unlockedAt)">
                <div v-if="auto.targetType !== 'differentiate'" class="upg-level">Interval: {{ formatAutoInterval(auto.interval) }}</div>
                <div v-else class="upg-level">Condition: {{ autoDiffConditionLabel }}</div>
                <button class="sub-btn"
                        :style="{ backgroundColor: auto.active ? '#5e81ac' : '#1a1a1e', width: '100%' }"
                        @click="auto.active = !auto.active">
                  {{ auto.active ? 'ACTIVE' : 'INACTIVE' }}
                </button>
              </template>
              <template v-else>
                <div class="upg-desc" style="font-size: 0.7rem; color: #666;">
                  Unlock at {{ auto.unlockedAt }} Diffs
                </div>
              </template>
            </div>
          </div>

          <div class="stats-container" style="margin-top: 14px;">
            <div class="stats-item" style="display:block; border-bottom:none; padding-bottom:0;">
              <div class="stats-label" style="margin-bottom: 8px;">Auto Differentiate Settings</div>
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
        </div>

        <!-- 4. Exponential 탭 (지수 함수 레이어) -->
        <div v-if="activeTab === 'exp'" class="tab-pane">
          <div class="exp-header-card">
            <div class="label">EXPONENTIAL POWER (E)</div>
            <div class="exp-resource-display">^{{ format(game.exp_multiplier) }}</div>
            <div class="exp-desc">생산량 증폭: (f(x) + DX)^{{ format(game.exp_multiplier) }}</div>
            <div class="exp-desc" style="margin-top: 5px; color: #ff79c6;">E = e^{{ format(game.exp_x) }}</div>
            <div class="exp-desc" style="margin-top: 5px; color: #88c0d0;">Tier2 마일스톤 포인트: {{ tier2MilestoneState.count }}</div>
          </div>

          <div class="section-header">
            <div class="section-title">Exponential Rebirth (Tier 2)</div>
          </div>
          <div class="upgrade-grid">
            <button class="upg-card-mini full-row prestige-btn"
                    :class="{
                      'can-buy': game.dx_points.gte(game.exp_upgrades[0].price),
                      'locked': game.dx_points.lt(game.exp_upgrades[0].price)
                    }"
                    @click="buyExpUpgrade(game.exp_upgrades[0])">
              <div class="upg-name">{{ game.exp_upgrades[0].name }}</div>
              <div class="upg-desc">Increase exp_x by {{ expGainPreview() }} <br><span style="color:#bf616a; font-size:0.7em;">(모든 진행도 초기화)</span></div>
              <div class="upg-cost">
                <span class="cost-val">{{ format(game.exp_upgrades[0].price) }}</span>
                <span class="cost-unit">DX</span>
              </div>
              <div class="upg-level">Lv.{{ game.exp_upgrades[0].level }}</div>
            </button>
          </div>

          <div class="section-header" style="margin-top: 20px; margin-bottom: 10px;">
            <div class="section-title">Tier 2 Milestones (영구 유지)</div>
          </div>
          <div class="stats-container">
            <div v-for="ms in tier2MilestoneTable" :key="ms.id" class="stats-item" style="align-items: flex-start; flex-direction: column; gap: 4px;">
              <span class="stats-label">{{ ms.name }} - 포인트 {{ ms.at }}</span>
              <span class="exp-desc" style="color: #d8dee9;">{{ tier2MilestoneEffectText(ms.bonus) }}</span>
              <span class="stats-value" :style="{ color: ms.unlocked ? '#a3be8c' : '#bf616a' }">
                {{ ms.unlocked ? '해금 완료' : `남은 포인트: ${ms.remaining}` }}
              </span>
            </div>
            <div v-if="tier2MilestoneState.next" class="exp-desc" style="margin-top: 10px; color: #ebcb8b;">
              다음 마일스톤: {{ tier2MilestoneState.next.name }} (포인트 {{ tier2MilestoneState.next.at }})
            </div>
          </div>
        </div>

        <!-- 4.5. Integral 탭 (적분 3차 환생) -->
        <div v-if="activeTab === 'integral'" class="tab-pane">
          <div class="exp-header-card" style="background-color: #2F3241;">
            <div class="label" style="color: #A3BE8C;">INTEGRAL MULTIPLIER</div>
            <div class="exp-resource-display" style="color: #A3BE8C;">C = {{ format(getIntegralBonusValue()) }}</div>
            <div class="exp-desc">적분 효과: (원함수 + C) × C</div>
            <div class="exp-desc" style="margin-top: 5px; color: #A3BE8C;">원함수는 DX/2x/지수 계산까지 반영된 값입니다.</div>
            <div class="exp-desc" style="margin-top: 5px; color: #A3BE8C;">적분 횟수: {{ game.integral_count }}회</div>
            <div class="exp-desc" style="margin-top: 5px; color: #88c0d0;">
              리셋 시작 보너스: +{{ format(tier3MilestoneState.bonuses.startFv) }} FV,
              +{{ format(tier3MilestoneState.bonuses.startXIncrease) }} x 증가,
              +{{ format(tier3MilestoneState.bonuses.startMaxX) }} Max x
            </div>
            <div class="exp-desc" style="margin-top: 5px; color: #a3be8c;">
              FV 생산 보너스: ×{{ format(tier3MilestoneState.bonuses.fvProductionMultiplier || 1) }}
            </div>
          </div>

          <nav class="tab-menu" style="margin-bottom: 12px;">
            <button :class="{ active: integralSubTab === 'rebirth' }" @click="integralSubTab = 'rebirth'">
              <span class="tab-label">환생</span>
            </button>
            <button :class="{ active: integralSubTab === 'milestones' }" @click="integralSubTab = 'milestones'">
              <span class="tab-label">마일스톤</span>
            </button>
          </nav>

          <div v-if="integralSubTab === 'rebirth'">
            <div class="section-title">Integration (Tier 3)</div>
            <div class="upgrade-grid">
              <button class="upg-card-mini full-row prestige-btn"
                      :class="{ locked: !canIntegrateNow }"
                      :disabled="!canIntegrateNow"
                      @click="integrate_bt"
                      style="background-color: rgb(32, 25, 30); border-color: #d08770; color: #d08770;">
                <div class="upg-name">Integrate ∫f(x)dx</div>
                <div class="upg-desc" style="color: #d08770;">Reset EVERYTHING (including DX and Exp) to gain Integral Constant C</div>
                <div v-if="!canIntegrateNow" class="upg-desc" style="font-size: 0.7rem; color: #bf616a; margin-top: 4px;">조건: Exp 증폭 2.00 이상</div>
              </button>
            </div>
          </div>

          <div v-else>
            <div class="section-header" style="margin-bottom: 10px;">
              <div class="section-title">Tier 3 Milestones</div>
            </div>
            <div class="stats-container" style="margin-bottom: 20px;">
              <div v-for="ms in tier3MilestoneTable" :key="ms.id" class="stats-item" style="align-items: flex-start; flex-direction: column; gap: 4px;">
                <span class="stats-label">{{ ms.name }} - 적분 {{ ms.at }}회</span>
                <span class="exp-desc" style="color: #d8dee9;">{{ milestoneEffectText(ms.bonus) }}</span>
                <span class="stats-value" :style="{ color: ms.unlocked ? '#a3be8c' : '#bf616a' }">
                  {{ ms.unlocked ? '해금 완료' : `남은 횟수: ${ms.remaining}` }}
                </span>
              </div>
              <div v-if="tier3MilestoneState.next" class="exp-desc" style="margin-top: 10px; color: #ebcb8b;">
                다음 마일스톤: {{ tier3MilestoneState.next.name }} (적분 {{ tier3MilestoneState.next.at }}회)
              </div>
            </div>
          </div>
        </div>

          <!-- 5. Shop 탭 -->
          <div v-if="activeTab === 'shop'" class="tab-pane">
            <div class="section-title">Shop</div>
            <div class="upgrade-grid">
              <div class="upg-card-mini full-row" :class="{ 'locked': game.is_2x_boost_owned }">
                <div class="upg-name">Permanent 2x Boost</div>
                <div class="upg-desc" style="font-size: 0.8rem; color: #aaa; margin: 5px 0;">영구적으로 f(x) 생산량이 2배 증가합니다.</div>
                <button class="sub-btn"
                        :style="{ width: '100%', marginTop: '10px', backgroundColor: game.is_2x_boost_owned ? '#4c566a' : '#5e81ac' }"
                        :disabled="game.is_2x_boost_owned"
                        @click="buyPermanentBoost">
                  {{ game.is_2x_boost_owned ? '구매 완료 (적용 중)' : '구매하기 ($0.99)' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 6. Stats 탭 -->
          <div v-if="activeTab === 'stats'" class="tab-pane">
            <div class="section-title">Statistics</div>
            <div class="stats-container">
              <div class="stats-item">
                <span class="stats-label">Total FV Earned:</span>
                <span class="stats-value">{{ format(game.stats.total_fv) }}</span>
              </div>
              <div class="stats-item">
                <span class="stats-label">Current FV/sec:</span>
                <span class="stats-value">{{ format(game.stats.fv_per_sec) }}</span>
              </div>
              <div class="stats-item">
                <span class="stats-label">Differentiation Count:</span>
                <span class="stats-value">{{ format(game.differentiationCount) }}</span>
              </div>
              <div class="stats-item">
                <span class="stats-label">Total Play Time:</span>
                <span class="stats-value">{{ Math.floor(game.stats.play_time / 3600) }}h {{ Math.floor((game.stats.play_time % 3600) / 60) }}m {{ Math.floor(game.stats.play_time % 60) }}s</span>
              </div>
            </div>
          </div>

          <!-- [Settings 탭] -->
          <div v-if="activeTab === 'settings'" class="tab-pane">
            <div class="settings-group">
              <button class="sub-btn" @click="saveGame">SAVE GAME</button>
              <button class="sub-btn danger" @click="resetGame">RESET DATA</button>
            </div>
          </div>

        </main>

      <!-- 커스텀 알림 컴포넌트 -->
      <CustomAlert
        :visible="alertState.visible"
        :message="alertState.message"
        :title="alertState.title"
        :is-confirm="alertState.isConfirm"
        @close="handleAlertClose"
        @confirm="handleAlertConfirm"
        @cancel="handleAlertCancel"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import CustomAlert from './components/CustomAlert.vue'

import {
  game, format, makefx, differentiate_bt,
  integrate_bt,
  buyUpgrade, buyOtherUpgrade, buyExpUpgrade,
  buyMaxUpgrade, buyMaxOtherUpgrade,
  buyMaxAllOtherUpgrades,
  getIntegralBonusValue, canIntegrate,
  getTier2MilestoneState, getTier2MilestoneTable,
  getTier3MilestoneState, getTier3MilestoneTable,
  setAlertCallbacks, manualTick, saveGame, loadGame, resetGame
} from './gameLogic.js'

const PRODUCT_2X_BOOST = 'fv_permanent_x2';
const PRODUCT_2X_BOOST_ALT = 'fv-permanent-x2';

const activeTab = ref('fx')
const integralSubTab = ref('rebirth')
const canIntegrateNow = computed(() => canIntegrate())
const tier2MilestoneState = computed(() => getTier2MilestoneState())
const tier2MilestoneTable = computed(() => getTier2MilestoneTable())
const tier3MilestoneState = computed(() => getTier3MilestoneState())
const tier3MilestoneTable = computed(() => getTier3MilestoneTable())
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

const expGainPreview = () => {
  const base = 0.04
  return (base + (tier2MilestoneState.value.bonuses.extraExpX || 0)).toFixed(2)
}

const tier2MilestoneEffectText = (bonus = {}) => {
  const chunks = []
  if (bonus.extraExpX) chunks.push(`Exp 구매당 exp_x +${bonus.extraExpX.toFixed(2)}`)
  if (bonus.expPriceMultiplier) chunks.push(`Exp 업그레이드 가격 x${Number(bonus.expPriceMultiplier).toFixed(2)}`)
  if (bonus.apGainMultiplier) chunks.push(`미분 AP 획득 x${Number(bonus.apGainMultiplier).toFixed(2)}`)
  if (bonus.xUpgradePriceMultiplier) chunks.push(`Variable 업그레이드 가격 x${Number(bonus.xUpgradePriceMultiplier).toFixed(2)}`)
  if (bonus.fxUpgradePriceMultiplier) chunks.push(`Variable 기타 업그레이드 가격 x${Number(bonus.fxUpgradePriceMultiplier).toFixed(2)}`)
  if (bonus.startFv) chunks.push(`환생 시작 FV +${format(bonus.startFv)}`)
  if (bonus.startXUpgradeLevels) {
    const levels = Object.keys(bonus.startXUpgradeLevels)
      .map((id) => `x${id} Lv+${bonus.startXUpgradeLevels[id]}`)
      .join(', ')
    if (levels) chunks.push(`시작 레벨 보너스: ${levels}`)
  }
  if (bonus.permanentAutoUnlock) chunks.push('자동 업그레이드 영구 잠금 해제')
  if (bonus.autoUpgradeUsesMaxBuy) chunks.push('자동 업그레이드가 Buy Max 방식으로 동작')
  return chunks.join(' / ') || '보상 없음'
}

const milestoneEffectText = (bonus = {}) => {
  const chunks = []
  if (bonus.startFv) chunks.push(`시작 FV +${format(bonus.startFv)}`)
  if (bonus.startXIncrease) chunks.push(`시작 x 증가 +${format(bonus.startXIncrease)}`)
  if (bonus.startMaxX) chunks.push(`시작 Max x +${format(bonus.startMaxX)}`)
  if (bonus.fvProductionMultiplier) chunks.push(`FV 생산량 x${Number(bonus.fvProductionMultiplier).toFixed(2)}`)
  return chunks.join(' / ') || '보상 없음'
}

const formatAutoInterval = (intervalMs) => {
  const ms = Number(intervalMs || 0)
  if (ms > 0 && ms < 100) return 'per tick'
  return `${(ms / 1000).toFixed(1)}s`
}

const getUpgradeCurrencyLabel = (upg) => {
  if (upg.currency) return upg.currency
  if (upg.type === 'ddx') return 'DX'
  if (upg.type === 'fx') return 'FV'
  return 'FV'
}

const canAffordUpgrade = (upg) => {
  const currency = getUpgradeCurrencyLabel(upg)
  if (currency === 'AP') return game.ap_points.gte(upg.price)
  if (currency === 'DX') return game.dx_points.gte(upg.price)
  return game.fv.gte(upg.price)
}

// 알림 상태 관리
const alertState = reactive({
  visible: false,
  message: '',
  title: '',
  isConfirm: false,
  onConfirm: () => {},
  onCancel: () => {}
})

const resetAlertCallbacks = () => {
  alertState.onConfirm = () => {}
  alertState.onCancel = () => {}
}

const handleAlertClose = () => {
  alertState.visible = false
  alertState.isConfirm = false
  resetAlertCallbacks()
}

const handleAlertConfirm = () => {
  const cb = alertState.isConfirm ? alertState.onConfirm : null
  handleAlertClose()
  if (typeof cb === 'function') cb()
}

const handleAlertCancel = () => {
  const cb = alertState.isConfirm ? alertState.onCancel : null
  handleAlertClose()
  if (typeof cb === 'function') cb()
}

const showAlert = (message, title = '알림') => {
  alertState.message = message
  alertState.title = title
  alertState.isConfirm = false
  resetAlertCallbacks()
  alertState.visible = true
}

const showConfirm = (message, onConfirm, title = '확인') => {
  alertState.message = message
  alertState.title = title
  alertState.isConfirm = true
  alertState.onConfirm = typeof onConfirm === 'function' ? onConfirm : () => {}
  alertState.onCancel = () => {}
  alertState.visible = true
}

// 게임 로직에 알림 콜백 주입
setAlertCallbacks(showAlert, showConfirm);

const tabs = [
  { id: 'fx', name: 'Variable', icon: '🧮' },
  { id: 'fdx', name: 'Derivative', icon: '📉' },
  { id: 'auto', name: 'Automation', icon: '⚙️' },
  { id: 'exp', name: 'Exponential', icon: '📈' },
  { id: 'integral', name: 'Integral', icon: '∫' },
  { id: 'shop', name: 'Shop', icon: '🛒' },
  { id: 'stats', name: 'Stats', icon: '📊' },
  { id: 'settings', name: 'Settings', icon: '⚙️' }
]

const initStore = () => {
  const CdvPurchase = window.CdvPurchase;
  if (!CdvPurchase) {
    console.warn("CdvPurchase is not defined.");
    return;
  }

  const { store, ProductType, Platform, LogLevel } = CdvPurchase;

  // 1. 디버그 로그 (개발 중에는 DEBUG, 배포 시에는 ERROR 권장)
  store.verbosity = LogLevel.DEBUG;

  // 2. 상품 등록
  store.register([{
    id: PRODUCT_2X_BOOST,
    type: ProductType.NON_CONSUMABLE,
    platform: Platform.GOOGLE_PLAY
  }, {
    id: PRODUCT_2X_BOOST,
    type: ProductType.NON_CONSUMABLE,
    platform: Platform.APPLE_APPSTORE
  }, {
    // Alternative ID for the same product
    id: PRODUCT_2X_BOOST_ALT,
    type: ProductType.NON_CONSUMABLE,
    platform: Platform.GOOGLE_PLAY
  }, {
    id: PRODUCT_2X_BOOST_ALT,
    type: ProductType.NON_CONSUMABLE,
    platform: Platform.APPLE_APPSTORE
  }]);

  // 3. 결제 승인 핸들러
  store.when().approved(transaction => {
    console.log("Transaction approved:", transaction);
    transaction.verify();
  });

  // 4. 검증 완료 및 아이템 지급
  store.when().verified(receipt => {
    console.log("Transaction verified:", receipt);
    receipt.finish(); // 반드시 호출해서 트랜잭션을 닫아야 합니다.
  });

  // 5. 상품 정보 로드 상태 감시 및 구매 확인
  store.when().productUpdated(product => {
    if (product.id === PRODUCT_2X_BOOST || product.id === PRODUCT_2X_BOOST_ALT) {
      console.log(`상품 상태 업데이트: ${product.id} [Valid: ${product.valid}, Owned: ${product.owned}]`);
      if (product.owned && !game.is_2x_boost_owned) {
        game.is_2x_boost_owned = true;
        saveGame();
        showAlert("영구 2배 부스트 구매가 완료(또는 복원)되었습니다!");
      }
    }
  });

  // 6. 에러 처리
  store.error(err => {
    console.error("Store Error:", err);
  });

  // 7. 초기화 실행
  store.initialize([
    Platform.GOOGLE_PLAY,
    Platform.APPLE_APPSTORE
  ]).then(() => {
    console.log("Store initialized successfully");
  }).catch(err => {
    console.error("Store initialization failed", err);
  });
}

const buyPermanentBoost = () => {
  if (!window.CdvPurchase) {
    showAlert("스토어를 사용할 수 없는 환경입니다.");
    return;
  }

  const { store } = window.CdvPurchase;
  if (!store) {
    showAlert("스토어가 초기화되지 않았습니다.");
    return;
  }

  const p1 = store.get(PRODUCT_2X_BOOST);
  const p2 = store.get(PRODUCT_2X_BOOST_ALT);

  let product = (p1 && p1.canPurchase) ? p1 : (p2 && p2.canPurchase) ? p2 : (p1 || p2);

  if (!product) {
    showAlert("스토어 상품 정보를 찾을 수 없습니다. 다시 시도해 주세요.");
    store.update(); // 정보 강제 갱신 요청
    return;
  }

  if (product.canPurchase) {
    // 상품 객체 대신 명시적으로 상품의 ID를 넘기거나, v13+의 경우 offer를 통해 구매를 진행합니다.
    const offer = product.getOffer ? product.getOffer() : null;
    if (offer) {
      store.order(offer);
    } else {
      store.order(product.id); // product.id를 사용하도록 수정
    }
  } else if (product.owned) {
    showAlert("이미 구매한 상품입니다.");
  } else {
    let msg = "현재 이 앱(기기)에서는 스토어가 상품을 내려주지 않고 있습니다.\n\n";
    if (p1) msg += `[${p1.id}] state: ${p1.state}\n`;
    if (p2) msg += `[${p2.id}] state: ${p2.state}\n`;
    msg += "\n(state가 invalid나 registered면 스토어 서버 측 거부 상태입니다. 테스트 트랙에서 다시 다운로드 해보세요.)";
    showAlert(msg);
    store.update();
  }
}

onMounted(() => {
  loadGame();
  makefx();

  const startStore = () => {
    console.log("Starting IAP Store...");
    initStore();
  };

  if (window.cordova || window.Capacitor) {
    if (window.cordova) {
      document.addEventListener('deviceready', startStore, false);
    } else {
      // Capacitor 환경에서는 바로 실행 (또는 플러그인 로드 후)
      startStore();
    }
  } else {
    console.log("Not in a Cordova/Capacitor environment.");
  }

  setInterval(manualTick, 150);
  setInterval(saveGame, 30000);
})
</script>

<style scoped>
@import url('https://webfontworld.github.io/gmarket/GmarketSans.css');
/* 전역 스크롤 방지 및 높이 고정 (Capacitor 대응) */
:deep(html), :deep(body) {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  position: fixed;
  width: 100%;
}

#app, .app-wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background-color: #050505;
  /* 화면 전체 고정 */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.container {
  width: 100%;
  max-width: 450px;
  background-color: #0f0f11;
  display: flex;
  flex-direction: column;
  /* 시스템 바 가려짐 방지: 최소 상단 44px, 하단 34px 여백 강제 확보 */
  padding-top: max(44px, env(safe-area-inset-top, 44px));
  padding-bottom: max(34px, env(safe-area-inset-bottom, 34px));
  padding-left: 16px;
  padding-right: 16px;
  gap: 20px;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
@media (min-width: 451px) { .container { border-left: 1px solid #2a2a2e; border-right: 1px solid #2a2a2e; } }
.header-card { background: linear-gradient(145deg, #1a1a1e, #141417); padding: 24px; border-radius: 20px; border: 1px solid #2a2a2e; text-align: center; }
.resource-display { font-size: 2.8rem; color: #fff; margin: 10px 0; }
.tab-menu { display: flex; background: #1a1a1e; padding: 8px; border-radius: 15px; gap: 5px; }
.tab-menu button { flex: 1; border: none; background: transparent; padding: 10px 0; border-radius: 10px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.tab-menu button.active { background: #2a2a2e; }
.tab-label { font-size: 0.65rem; color: #888; }
.upgrade-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.upg-card-mini { background: #16161a; border: 1px solid #2a2a2e; border-radius: 12px; padding: 15px; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: 0.2s; font-family: inherit; }
.upg-card-mini.can-buy:hover { border-color: #5e81ac; transform: translateY(-3px); background: #1c1c22; }
.upg-card-mini.locked { opacity: 0.4; cursor: not-allowed; filter: grayscale(1); }
.upg-name { color: #fff; font-size: 0.9rem; font-weight: bold; }
.cost-val { color: #ebcb8b; font-weight: bold; font-size: 0.95rem; }
.cost-unit { color: #666; font-size: 0.7rem; margin-left: 2px; }
.upg-level { font-size: 0.7rem; color: #5e81ac; }
.settings-group { display: flex; flex-direction: column; gap: 10px; }
.sub-btn { padding: 15px; border-radius: 10px; border: 1px solid #333; background: #1a1a1e; color: white; cursor: pointer; font-family: inherit; }
.sub-input { padding: 10px; border-radius: 8px; border: 1px solid #333; background: #121216; color: #e5e9f0; font-family: inherit; }
.sub-btn.danger { border-color: #bf616a; color: #bf616a; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.buy-max-btn { background: #2e3440; border: 1px solid #4c566a; color: #eceff4; padding: 4px 12px; border-radius: 8px; font-size: 0.7rem; cursor: pointer; }
.stats-container { background: #16161a; border: 1px solid #2a2a2e; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 15px; }
.stats-item { display: flex; justify-content: space-between; border-bottom: 1px solid #2a2a2e; padding-bottom: 8px; }
.stats-value { color: #fff; font-weight: bold; }
.exp-header-card { background: linear-gradient(145deg, #2e1a1e, #1a0f11); padding: 24px; border-radius: 20px; border: 1px solid #4e2a2e; text-align: center; margin-bottom: 20px; }
.exp-resource-display { font-size: 2.2rem; color: #ff79c6; margin: 10px 0; font-weight: bold; text-shadow: 0 0 10px rgba(255, 121, 198, 0.3); }
.exp-desc { font-size: 0.8rem; color: #a89984; }
.full-row { grid-column: 1 / -1; }
</style>

