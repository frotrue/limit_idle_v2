<template>
  <div class="tab-pane">
    <section class="resource-card integral-card">
      <div class="label">Integral Multiplier</div>
      <div class="resource-card__value">C = {{ format(getIntegralBonusValue()) }}</div>
      <div class="resource-card__sub">Integral 효과: 기본 지수 +{{ format(getIntegralBonusValue().times(0.1)) }}</div>
      <div class="resource-card__sub accent">Integral count: {{ game.integral_count }}</div>
    </section>

    <nav class="segmented-tabs">
      <button :class="{ active: integralSubTab === 'rebirth' }" @click="integralSubTab = 'rebirth'">Integration</button>
      <button :class="{ active: integralSubTab === 'milestones' }" @click="integralSubTab = 'milestones'">Milestones</button>
    </nav>

    <section v-if="integralSubTab === 'rebirth'" class="panel-section">
      <div class="section-title">Integration</div>
      <button class="prestige-action integral-action" :disabled="!canIntegrateNow" @click="integrate_bt">
        <span>Integrate f(x)dx</span>
        <small>DX와 Exp를 포함한 진행을 초기화하고 Integral Constant C를 얻습니다.</small>
        <small v-if="!canIntegrateNow" class="danger-text">조건: Exponential multiplier 1.50 이상</small>
      </button>
    </section>

    <section v-else class="panel-section">
      <div class="section-title">Tier 3 Milestones</div>
      <div class="milestone-list">
        <article v-for="ms in tier3MilestoneTable" :key="ms.id" class="milestone-row" :class="{ unlocked: ms.unlocked }">
          <div>
            <h3>{{ ms.name }} - Integral {{ ms.at }}</h3>
            <p>{{ milestoneEffectText(ms.bonus) }}</p>
          </div>
          <strong>{{ ms.unlocked ? 'Unlocked' : `${ms.remaining} left` }}</strong>
        </article>
      </div>

      <p v-if="tier3MilestoneState.next" class="next-goal">
        다음 목표: {{ tier3MilestoneState.next.name }} (Integral {{ tier3MilestoneState.next.at }})
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { game, format, integrate_bt, canIntegrate, getIntegralBonusValue, getTier3MilestoneState, getTier3MilestoneTable } from '@/game'

const integralSubTab = ref('rebirth')
const canIntegrateNow = computed(() => canIntegrate())
const tier3MilestoneState = computed(() => getTier3MilestoneState())
const tier3MilestoneTable = computed(() => getTier3MilestoneTable())

const milestoneEffectText = (bonus = {}) => {
  const chunks = []
  if (bonus.startFv) chunks.push(`시작 FV +${format(bonus.startFv)}`)
  if (bonus.startXIncrease) chunks.push(`시작 x 증가 +${format(bonus.startXIncrease)}`)
  if (bonus.startMaxX) chunks.push(`시작 Max x +${format(bonus.startMaxX)}`)
  if (bonus.fvProductionMultiplier) chunks.push(`FV 생산 x${Number(bonus.fvProductionMultiplier).toFixed(2)}`)
  return chunks.join(' / ') || '보상 없음'
}
</script>
