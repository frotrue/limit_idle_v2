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
      <!-- 워프 인디케이터 배너 -->
      <div v-if="game.limit && game.limit.warp_active" class="warp-banner">
        🚀 점근적 시간 워프 가동 중! (목표 FV: {{ format(game.limit.warp_target_fv) }}) - 현재 게임 배속: x{{ game.limit.current_warp_mult.toLocaleString() }} 🚀
      </div>


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
          <button v-if="isTabVisible(tab.id)"
                  :class="{ active: activeTab === tab.id }"
                  @click="activeTab = tab.id">
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-label">{{ tab.name }}</span>
          </button>
        </template>
      </nav>

      <!-- [메인 콘텐츠 영역] 선택된 탭에 따라 내용 변경 -->
      <main class="main-content">
        
                <VariableTab v-if="activeTab === 'fx'" />
        <DerivativeTab v-else-if="activeTab === 'fdx'" />
        <AutomationTab v-else-if="activeTab === 'auto'" @alert="showAlert" />
        <ExponentialTab v-else-if="activeTab === 'exp'" />
        <IntegralTab v-else-if="activeTab === 'integral'" />
        <ShopTab v-else-if="activeTab === 'shop'" @alert="showAlert" />
        <StatsTab v-else-if="activeTab === 'stats'" />
        <LimitTab v-else-if="activeTab === 'limit'" @select-tab="activeTab = $event" />
        <SettingsTab v-else-if="activeTab === 'settings'" />

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
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import CustomAlert from './components/CustomAlert.vue'
import VariableTab from './components/tabs/VariableTab.vue'
import DerivativeTab from './components/tabs/DerivativeTab.vue'
import AutomationTab from './components/tabs/AutomationTab.vue'
import ExponentialTab from './components/tabs/ExponentialTab.vue'
import IntegralTab from './components/tabs/IntegralTab.vue'
import ShopTab from './components/tabs/ShopTab.vue'
import StatsTab from './components/tabs/StatsTab.vue'
import LimitTab from './components/tabs/LimitTab.vue'
import SettingsTab from './components/tabs/SettingsTab.vue'

import { game, format, makefx, setAlertCallbacks, manualTick, saveGame, loadGame } from '@/game'

const isTabVisible = (tabId) => {
  if (tabId === 'exp') return game.unlocked_exp
  if (tabId === 'integral') return game.unlocked_integral
  if (tabId === 'limit') return game.integral_count >= 50 || (game.limit && game.limit.limit_count > 0)
  return true
}

const activeTab = ref('fx')

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

setAlertCallbacks(showAlert, showConfirm)

const tabs = [
  { id: 'fx', name: 'Variable', icon: '🧮' },
  { id: 'fdx', name: 'Derivative', icon: '📉' },
  { id: 'auto', name: 'Automation', icon: '⚙️' },
  { id: 'exp', name: 'Exponential', icon: '📈' },
  { id: 'integral', name: 'Integral', icon: '∫' },
  { id: 'limit', name: 'Limit', icon: '🛑' },
  { id: 'shop', name: 'Shop', icon: '🛒' },
  { id: 'stats', name: 'Stats', icon: '📊' },
  { id: 'settings', name: 'Settings', icon: '⚙️' }
]

onMounted(() => {
  loadGame()
  makefx()
  manualTickTimer = window.setInterval(manualTick, 100)
  saveTimer = window.setInterval(saveGame, 30000)
})

let manualTickTimer = null
let saveTimer = null

onUnmounted(() => {
  if (manualTickTimer !== null) {
    window.clearInterval(manualTickTimer)
    manualTickTimer = null
  }
  if (saveTimer !== null) {
    window.clearInterval(saveTimer)
    saveTimer = null
  }
})
</script>

<style>
@import url('https://webfontworld.github.io/gmarket/GmarketSans.css');
/* 전역 스크롤 방지 및 높이 고정 (Capacitor 대응) */
html, body {
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
.upg-card-mini.research-unlocked { background: linear-gradient(145deg, #1a2e1a, #162016); border-color: #4a7c59; opacity: 1; cursor: default; }
.upg-card-mini.research-unlocked .upg-name { color: #a3be8c; }

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
</style>

