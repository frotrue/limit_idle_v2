<template>
<!-- 4.5. Integral 탭 (적분 3차 환생) -->
        <div class="tab-pane">
          <div class="exp-header-card" style="background-color: #2F3241;">
            <div class="label" style="color: #A3BE8C;">INTEGRAL MULTIPLIER</div>
            <div class="exp-resource-display" style="color: #A3BE8C;">C = {{ format(getIntegralBonusValue()) }}</div>
            <div class="exp-desc">적분 효과: 영구 기본 지수 +{{ format(getIntegralBonusValue().times(0.1)) }} 증가</div>
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
                <div v-if="!canIntegrateNow" class="upg-desc" style="font-size: 0.7rem; color: #bf616a; margin-top: 4px;">조건: Exp 증폭 1.50 이상</div>
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
</template>

<script setup>
import { computed, ref } from 'vue'
import { game, format, integrate_bt, canIntegrate, getTier3MilestoneState, getTier3MilestoneTable } from '@/game'

const integralSubTab = ref('rebirth')
const canIntegrateNow = computed(() => canIntegrate())
const tier3MilestoneState = computed(() => getTier3MilestoneState())
const tier3MilestoneTable = computed(() => getTier3MilestoneTable())

const milestoneEffectText = (bonus = {}) => {
  const chunks = []
  if (bonus.startFv) chunks.push(`시작 FV +${format(bonus.startFv)}`)
  if (bonus.startXIncrease) chunks.push(`시작 x 증가 +${format(bonus.startXIncrease)}`)
  if (bonus.startMaxX) chunks.push(`시작 Max x +${format(bonus.startMaxX)}`)
  if (bonus.fvProductionMultiplier) chunks.push(`FV 생산량 x${Number(bonus.fvProductionMultiplier).toFixed(2)}`)
  return chunks.join(' / ') || '보상 없음'
}
</script>
