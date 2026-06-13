<template>
  <div class="tab-pane">
    <section class="resource-card automation-card">
      <div class="label">Automation Points</div>
      <div class="resource-card__value">{{ format(game.ap_points) }} AP</div>
      <div class="resource-card__sub">Differentiation Count: {{ format(game.differentiationCount) }}</div>
    </section>

    <nav class="segmented-tabs">
      <button :class="{ active: autoSubTab === 'automation' }" @click="autoSubTab = 'automation'">
        Automation
      </button>
      <button :class="{ active: autoSubTab === 'research' }" @click="autoSubTab = 'research'">
        Research
      </button>
    </nav>

    <section v-if="autoSubTab === 'automation'" class="panel-section">
      <div v-if="!hasUnlockedAutomation" class="empty-state">
        <Bot :size="28" />
        <strong>자동화가 아직 없습니다.</strong>
        <span>Research에서 자동화 노드를 먼저 해금하세요.</span>
      </div>

      <template v-else>
        <div class="section-title">Automation Controls</div>
        <div class="upgrade-grid">
          <article v-for="auto in game.auto_upgrades" :key="auto.id" v-show="isAutoNodeResearched(auto.id)" class="control-card">
            <div class="control-card__header">
              <component :is="autoIcon(auto.id)" :size="18" />
              <strong>{{ auto.name }}</strong>
            </div>
            <p v-if="auto.targetType !== 'differentiate'" class="control-card__meta">
              Interval: {{ formatAutoInterval(auto.interval) }}
            </p>
            <p v-else class="control-card__meta">Condition: {{ autoDiffConditionLabel }}</p>
            <button class="sub-btn compact" :class="{ active: auto.active }" @click="auto.active = !auto.active">
              {{ auto.active ? 'Active' : 'Inactive' }}
            </button>
          </article>
        </div>
      </template>

      <div v-if="game.ap_research.includes('auto_differentiate')" class="settings-panel">
        <div class="settings-panel__title">Auto Differentiate</div>
        <select v-model="game.auto_diff.mode" class="sub-input">
          <option value="off">OFF</option>
          <option value="fv">FV threshold</option>
          <option value="dx">Expected DX threshold</option>
          <option value="either">FV or expected DX threshold</option>
        </select>
        <input v-if="['fv', 'either'].includes(game.auto_diff.mode)" v-model="game.auto_diff.fv_threshold" class="sub-input" type="text" placeholder="FV threshold, e.g. 1e20" />
        <input v-if="['dx', 'either'].includes(game.auto_diff.mode)" v-model="game.auto_diff.dx_threshold" class="sub-input" type="text" placeholder="DX threshold, e.g. 1e6" />
        <input v-model.number="game.auto_diff.cooldown_ms" class="sub-input" type="number" min="200" step="100" placeholder="Cooldown ms" />
        <p class="settings-panel__hint">현재 설정: {{ autoDiffConditionLabel }}</p>
      </div>

      <div v-if="game.ap_research.includes('auto_exp')" class="settings-panel">
        <div class="settings-panel__row">
          <div class="settings-panel__title">Auto Exponential Rebirth</div>
          <button class="sub-btn compact" :class="{ active: game.auto_exp.active }" @click="game.auto_exp.active = !game.auto_exp.active">
            {{ game.auto_exp.active ? 'ON' : 'OFF' }}
          </button>
        </div>
        <select v-model="game.auto_exp.mode" class="sub-input">
          <option value="always">Always when affordable</option>
          <option value="dx_threshold">Only above DX threshold</option>
        </select>
        <input v-if="game.auto_exp.mode === 'dx_threshold'" v-model="game.auto_exp.dx_threshold" class="sub-input" type="text" placeholder="DX threshold, e.g. 1e15" />
        <input v-model.number="game.auto_exp.cooldown_ms" class="sub-input" type="number" min="1000" step="1000" placeholder="Cooldown ms" />
      </div>

      <div v-if="game.ap_research.includes('auto_integral')" class="settings-panel">
        <div class="settings-panel__row">
          <div class="settings-panel__title">Auto Integration</div>
          <button class="sub-btn compact" :class="{ active: game.auto_integral.active }" @click="game.auto_integral.active = !game.auto_integral.active">
            {{ game.auto_integral.active ? 'ON' : 'OFF' }}
          </button>
        </div>
        <select v-model="game.auto_integral.mode" class="sub-input">
          <option value="always">Always when conditions are met</option>
          <option value="fv_threshold">Only above FV threshold</option>
        </select>
        <input v-if="game.auto_integral.mode === 'fv_threshold'" v-model="game.auto_integral.fv_threshold" class="sub-input" type="text" placeholder="FV threshold, e.g. 1e50" />
        <input v-model.number="game.auto_integral.cooldown_ms" class="sub-input" type="number" min="1000" step="1000" placeholder="Cooldown ms" />
      </div>
    </section>

    <section v-else class="panel-section">
      <div class="section-title">AP Research Tree</div>
      <p class="section-subtitle">AP로 영구 자동화와 생산 보너스를 해금합니다.</p>

      <div class="research-grid">
        <article
          v-for="node in AP_RESEARCH_NODES"
          :key="node.id"
          class="research-card"
          :class="{
            unlocked: game.ap_research.includes(node.id),
            'can-buy': !game.ap_research.includes(node.id) && canBuyResearch(node.id),
            locked: !game.ap_research.includes(node.id) && !canBuyResearch(node.id)
          }"
        >
          <div class="research-card__header">
            <component :is="researchIcon(node)" :size="18" />
            <strong>{{ node.name }}</strong>
          </div>
          <p>{{ node.desc }}</p>
          <small v-if="node.requires.length > 0">필요: {{ node.requires.map(r => getResearchNodeName(r)).join(', ') }}</small>
          <div class="research-card__footer">
            <span v-if="game.ap_research.includes(node.id)" class="unlocked-label">
              <Check :size="14" /> Unlocked
            </span>
            <template v-else>
              <span>{{ node.cost }} AP</span>
              <button class="sub-btn compact" :disabled="!canBuyResearch(node.id)" @click="buyResearch(node.id)">
                {{ canBuyResearch(node.id) ? 'Unlock' : 'Locked' }}
              </button>
            </template>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Bot, Check, FlaskConical, Gauge, LockKeyhole, Settings2, Zap } from 'lucide-vue-next'
import { game, format, purchaseResearch, AP_RESEARCH_NODES, canPurchaseResearch, isAutoResearched } from '@/game'

const emit = defineEmits(['alert'])
const autoSubTab = ref('automation')

const canBuyResearch = (nodeId) => canPurchaseResearch(nodeId, game.ap_research, game.ap_points)
const isAutoNodeResearched = (autoId) => isAutoResearched(autoId, game.ap_research)
const hasUnlockedAutomation = computed(() => game.ap_research.some(id => ['auto_function', 'auto_fv_utility', 'auto_dx_utility', 'auto_differentiate', 'auto_exp', 'auto_integral'].includes(id)))

const buyResearch = (nodeId) => {
  if (purchaseResearch(nodeId)) {
    const node = AP_RESEARCH_NODES.find(n => n.id === nodeId)
    if (node) emit('alert', `${node.name} 연구가 해금되었습니다.\n효과: ${node.desc}`, '연구 해금')
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

  if (mode === 'off') return `OFF / cooldown ${cooldown}ms`
  if (mode === 'fv') return `FV >= ${fv} / cooldown ${cooldown}ms`
  if (mode === 'dx') return `expected DX >= ${dx} / cooldown ${cooldown}ms`
  return `FV >= ${fv} or expected DX >= ${dx} / cooldown ${cooldown}ms`
})

const formatAutoInterval = (intervalMs) => {
  const ms = Number(intervalMs || 0)
  if (ms > 0 && ms < 100) return 'per tick'
  return `${(ms / 1000).toFixed(1)}s`
}

const autoIcon = (id) => {
  if (id === 3) return Gauge
  if (id === 2) return Zap
  if (id === 1) return Settings2
  return Bot
}

const researchIcon = (node) => {
  if (game.ap_research.includes(node.id)) return Check
  if (!canBuyResearch(node.id)) return LockKeyhole
  return node.category === 'boost' ? Zap : FlaskConical
}
</script>
