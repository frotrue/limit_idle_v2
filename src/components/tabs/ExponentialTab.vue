<template>
  <div class="tab-pane">
    <section class="resource-card exponential-card">
      <div class="label">Exponential Power</div>
      <div class="resource-card__value">^{{ format(totalExponent) }}</div>
      <div class="resource-card__sub">
        생산식: (f(x) + DX)^{{ format(totalExponent) }}
      </div>
      <div class="resource-card__sub accent">
        기본 E = 1.0 + {{ format(game.exp_x) }} / Integral 보너스 +{{ format(getIntegralBonusValue().times(0.1)) }}
      </div>
    </section>

    <nav class="segmented-tabs">
      <button :class="{ active: expSubTab === 'rebirth' }" @click="expSubTab = 'rebirth'">Rebirth</button>
      <button :class="{ active: expSubTab === 'milestones' }" @click="expSubTab = 'milestones'">Milestones</button>
    </nav>

    <section v-if="expSubTab === 'rebirth'" class="panel-section">
      <div class="section-title">Exponential Rebirth</div>
      <div class="upgrade-grid single">
        <UpgradeCard
          :name="game.exp_upgrades[0].name"
          :level="game.exp_upgrades[0].level"
          :price="format(game.exp_upgrades[0].price)"
          currency="DX"
          :can-afford="game.dx_points.gte(game.exp_upgrades[0].price)"
          :missing="missingDx"
          :effect="`exp_x +${expGainPreview()} 후 Variable/DX 진행 초기화`"
          :show-buy-max="false"
          @buy="buyExpUpgrade(game.exp_upgrades[0])"
        />
      </div>
    </section>

    <section v-else class="panel-section">
      <div class="section-header">
        <div>
          <div class="section-title">Tier 2 Milestones</div>
          <p class="section-subtitle">획득 포인트: {{ tier2MilestoneState.count }}</p>
        </div>
      </div>

      <div class="milestone-list">
        <article v-for="ms in tier2MilestoneTable" :key="ms.id" class="milestone-row" :class="{ unlocked: ms.unlocked }">
          <div>
            <h3>{{ ms.name }}</h3>
            <p>{{ tier2MilestoneEffectText(ms.bonus) }}</p>
          </div>
          <strong>{{ ms.unlocked ? 'Unlocked' : `${ms.remaining} left` }}</strong>
        </article>
      </div>

      <p v-if="tier2MilestoneState.next" class="next-goal">
        다음 목표: {{ tier2MilestoneState.next.name }} ({{ tier2MilestoneState.next.at }} points)
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import Decimal from 'break_eternity.js'
import UpgradeCard from '@/components/UpgradeCard.vue'
import { game, format, buyExpUpgrade, getIntegralBonusValue, getTier2MilestoneState, getTier2MilestoneTable } from '@/game'

const expSubTab = ref('rebirth')
const tier2MilestoneState = computed(() => getTier2MilestoneState())
const tier2MilestoneTable = computed(() => getTier2MilestoneTable())
const totalExponent = computed(() => new Decimal(game.exp_multiplier || 1).plus(getIntegralBonusValue().times(0.1)))
const missingDx = computed(() => format(Decimal.max(0, new Decimal(game.exp_upgrades[0].price).minus(game.dx_points))))

const expGainPreview = () => {
  const base = 0.05
  return (base + (tier2MilestoneState.value.bonuses.extraExpX || 0)).toFixed(2)
}

const tier2MilestoneEffectText = (bonus = {}) => {
  const chunks = []
  if (bonus.extraExpX) chunks.push(`Exp 구매 시 exp_x +${bonus.extraExpX.toFixed(2)}`)
  if (bonus.expPriceMultiplier) chunks.push(`Exp 가격 x${Number(bonus.expPriceMultiplier).toFixed(2)}`)
  if (bonus.apGainMultiplier) chunks.push(`미분 AP 획득 x${Number(bonus.apGainMultiplier).toFixed(2)}`)
  if (bonus.xUpgradePriceMultiplier) chunks.push(`Variable 가격 x${Number(bonus.xUpgradePriceMultiplier).toFixed(2)}`)
  if (bonus.fxUpgradePriceMultiplier) chunks.push(`Utility 가격 x${Number(bonus.fxUpgradePriceMultiplier).toFixed(2)}`)
  if (bonus.startFv) chunks.push(`시작 FV +${format(bonus.startFv)}`)
  if (bonus.startXUpgradeLevels) {
    const levels = Object.keys(bonus.startXUpgradeLevels)
      .map((id) => `x${id} Lv+${bonus.startXUpgradeLevels[id]}`)
      .join(', ')
    if (levels) chunks.push(`시작 레벨 보너스: ${levels}`)
  }
  if (bonus.permanentAutoUnlock) chunks.push('자동화 영구 해금')
  if (bonus.autoUpgradeUsesMaxBuy) chunks.push('자동화가 Buy Max 방식으로 동작')
  return chunks.join(' / ') || '보상 없음'
}
</script>
