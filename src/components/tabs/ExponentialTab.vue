<template>
<!-- 4. Exponential 탭 (지수 함수 레이어) -->
        <div class="tab-pane">
          <div class="exp-header-card">
            <div class="label">EXPONENTIAL POWER (E)</div>
            <div class="exp-resource-display">^{{ format(new Decimal(game.exp_multiplier || 1).plus(getIntegralBonusValue().times(0.1))) }}</div>
            <div class="exp-desc">생산량 증폭: (f(x) + DX)^{{ format(new Decimal(game.exp_multiplier || 1).plus(getIntegralBonusValue().times(0.1))) }}</div>
            <div class="exp-desc" style="margin-top: 5px; color: #ff79c6;">기본 지수(E) = 1.0 + {{ format(game.exp_x) }} / 적분 보너스 = +{{ format(getIntegralBonusValue().times(0.1)) }}</div>
            <div class="exp-desc" style="margin-top: 5px; color: #88c0d0;">Tier2 마일스톤 포인트: {{ tier2MilestoneState.count }}</div>
          </div>

          <nav class="tab-menu" style="margin-bottom: 12px;">
            <button :class="{ active: expSubTab === 'rebirth' }" @click="expSubTab = 'rebirth'">
              <span class="tab-label">환생</span>
            </button>
            <button :class="{ active: expSubTab === 'milestones' }" @click="expSubTab = 'milestones'">
              <span class="tab-label">마일스톤</span>
            </button>
          </nav>

          <div v-if="expSubTab === 'rebirth'">
            <div class="section-title">Exponential Rebirth (Tier 2)</div>
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
          </div>

          <div v-else>
            <div class="section-header" style="margin-bottom: 10px;">
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
        </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import Decimal from 'break_eternity.js'
import { game, format, buyExpUpgrade, getIntegralBonusValue, getTier2MilestoneState, getTier2MilestoneTable } from '@/game'

const expSubTab = ref('rebirth')
const tier2MilestoneState = computed(() => getTier2MilestoneState())
const tier2MilestoneTable = computed(() => getTier2MilestoneTable())

const expGainPreview = () => {
  const base = 0.05
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
</script>
