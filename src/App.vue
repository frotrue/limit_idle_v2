<!--
Limit Idle
reference : gemini 3.1 and codex 5.3
github : frotrue/limit-idle
using tech : vue.js, break_eternity.js
made by frotrue
-->

<template>
  <div id="app" class="app-wrapper" :class="appClass">
    <div class="container">
      <div v-if="game.limit && game.limit.warp_active" class="warp-banner">
        접근 시간 루프가 가속 중입니다. 목표 FV: {{ format(game.limit.warp_target_fv) }} / 현재 배속:
        x{{ game.limit.current_warp_mult.toLocaleString() }}
      </div>

      <header class="hud">
        <div class="hud__primary">
          <span class="label">FV</span>
          <strong>{{ format(game.fv) }}</strong>
          <small>{{ format(game.stats.fv_per_sec) }} FV/sec</small>
        </div>
        <div class="hud__grid">
          <div class="hud-stat">
            <span>f(x)</span>
            <strong>{{ game.fx_str }}</strong>
          </div>
          <div class="hud-stat">
            <span>X Progress</span>
            <strong>{{ format(game.current_x) }} / {{ format(game.max_x) }}</strong>
            <div class="progress-bar" aria-hidden="true">
              <div :style="{ width: `${xProgressPercent}%` }"></div>
            </div>
          </div>
          <div class="hud-stat">
            <span>Next Goal</span>
            <strong>{{ nextGoal }}</strong>
          </div>
        </div>
      </header>

      <nav class="tab-menu main-tabs" aria-label="Main tabs">
        <button
          v-for="tab in mainTabs"
          :key="tab.id"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" :size="18" />
          <span class="tab-label">{{ tab.name }}</span>
        </button>
      </nav>

      <main class="main-content">
        <VariableTab v-if="activeTab === 'fx'" />
        <AutomationTab v-else-if="activeTab === 'auto'" @alert="showAlert" />

        <section v-else-if="activeTab === 'systems'" class="systems-shell">
          <nav class="segmented-tabs system-tabs" aria-label="System tabs">
            <button
              v-for="tab in visibleSystemTabs"
              :key="tab.id"
              :class="{ active: activeSystemTab === tab.id }"
              @click="activeSystemTab = tab.id"
            >
              <component :is="tab.icon" :size="16" />
              {{ tab.name }}
            </button>
          </nav>

          <DerivativeTab v-if="activeSystemTab === 'fdx'" />
          <ShopTab v-else-if="activeSystemTab === 'shop'" @alert="showAlert" />
          <ExponentialTab v-else-if="activeSystemTab === 'exp'" />
          <IntegralTab v-else-if="activeSystemTab === 'integral'" />
          <LimitTab v-else-if="activeSystemTab === 'limit'" @select-tab="activeTab = $event" />
        </section>

        <StatsTab v-else-if="activeTab === 'stats'" />
        <SettingsTab v-else-if="activeTab === 'settings'" />
      </main>

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
import { computed, reactive, ref, onMounted, onUnmounted, watchEffect } from 'vue'
import { Activity, Bot, Calculator, Gauge, Infinity, Layers, Settings, ShoppingBag, Sigma } from 'lucide-vue-next'
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

const activeTab = ref('fx')
const activeSystemTab = ref('fdx')

const isSystemTabVisible = (tabId) => {
  if (tabId === 'exp') return game.unlocked_exp
  if (tabId === 'integral') return game.unlocked_integral
  if (tabId === 'limit') return game.integral_count >= 50 || (game.limit && game.limit.limit_count > 0)
  return true
}

const mainTabs = [
  { id: 'fx', name: 'Variable', icon: Calculator },
  { id: 'auto', name: 'Auto', icon: Bot },
  { id: 'systems', name: 'Systems', icon: Layers },
  { id: 'stats', name: 'Stats', icon: Activity },
  { id: 'settings', name: 'Settings', icon: Settings }
]

const systemTabs = [
  { id: 'fdx', name: 'Derivative', icon: Sigma },
  { id: 'shop', name: 'Shop', icon: ShoppingBag },
  { id: 'exp', name: 'Exponential', icon: Activity },
  { id: 'integral', name: 'Integral', icon: Gauge },
  { id: 'limit', name: 'Limit', icon: Infinity }
]

const visibleSystemTabs = computed(() => systemTabs.filter((tab) => isSystemTabVisible(tab.id)))

watchEffect(() => {
  if (!visibleSystemTabs.value.some((tab) => tab.id === activeSystemTab.value)) {
    activeSystemTab.value = 'fdx'
  }
})

const xProgressPercent = computed(() => {
  if (!game.max_x || game.max_x.lte(0)) return 0
  const pct = game.current_x.div(game.max_x).times(100).toNumber()
  return Math.max(0, Math.min(100, pct))
})

const nextGoal = computed(() => {
  if (!game.unlocked_exp) return `Unlock Exponential: ${format(game.dx_points)} / 1e10 DX`
  if (!game.unlocked_integral) return 'Reach exponent 1.50 for Integration'
  if (game.integral_count < 50) return `Limit unlock: Integral ${game.integral_count} / 50`
  if (game.limit && game.limit.limit_count <= 0) return 'Build enough FV for first LP'
  return 'Push FV and LP upgrades'
})

const appClass = computed(() => ({
  'layout-mobile': game.ui?.layoutMode === 'mobile',
  'layout-auto': game.ui?.layoutMode !== 'mobile'
}))

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

let manualTickTimer = null
let saveTimer = null

onMounted(() => {
  loadGame()
  makefx()
  manualTickTimer = window.setInterval(manualTick, 100)
  saveTimer = window.setInterval(saveGame, 30000)
})

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
