<template>
  <div class="tab-pane">
    <section class="resource-card derivative-card">
      <div class="label">Derivative Points</div>
      <div class="resource-card__value">{{ format(game.dx_points) }} DX</div>
      <div class="resource-card__sub">Automation Points: {{ format(game.ap_points) }} AP</div>
    </section>

    <section class="panel-section">
      <div class="section-title">Differentiation</div>
      <div class="differentiation-preview">
        <div>
          <span>Condition</span>
          <strong>FV {{ format(game.fv) }} / {{ format(preview.requirement) }}</strong>
        </div>
        <div>
          <span>Reward Preview</span>
          <strong>{{ format(preview.dxGain) }} DX / {{ format(preview.apGain) }} AP</strong>
        </div>
      </div>
      <button class="prestige-action" @click="differentiate_bt">
        <span>Differentiate f(x)</span>
        <small>미분하면 현재 Variable 진행은 초기화되고 DX/AP는 영구 성장에 쓰입니다.</small>
      </button>
      <p class="section-subtitle">
        {{ preview.canDifferentiate ? '조건을 만족했습니다. 첫 미분으로 다음 성장 속도를 올릴 수 있습니다.' : `미분하려면 ${format(preview.requirement)} FV가 필요합니다.` }}
      </p>
    </section>

    <section class="panel-section">
      <div class="section-header">
        <div>
          <div class="section-title">Derivative Upgrades</div>
          <p class="section-subtitle">DX와 AP로 다음 미분을 빠르게 만듭니다.</p>
        </div>
        <button class="buy-max-btn" @click="buyMaxAllOtherUpgrades('ddx')">Buy Max</button>
      </div>

      <div class="upgrade-grid">
        <template v-for="upg in game.other_upgrades" :key="upg.id">
          <UpgradeCard
            v-if="upg.type === 'ddx'"
            :name="upg.name"
            :level="upg.level"
            :price="format(upg.price)"
            :currency="getUpgradeCurrencyLabel(upg)"
            :can-afford="canAffordUpgrade(upg)"
            :missing="missingFor(upg)"
            :effect="upgradeEffect(upg)"
            @buy="buyOtherUpgrade(upg)"
            @buy-max="buyMaxOtherUpgrade(upg)"
          />
        </template>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Decimal from 'break_eternity.js'
import UpgradeCard from '@/components/UpgradeCard.vue'
import {
  game,
  format,
  getDifferentiationPreview,
  differentiate_bt,
  buyOtherUpgrade,
  buyMaxOtherUpgrade,
  buyMaxAllOtherUpgrades
} from '@/game'

const preview = computed(() => getDifferentiationPreview())

const getUpgradeCurrencyLabel = (upg) => {
  if (upg.currency) return upg.currency
  if (upg.type === 'ddx') return 'DX'
  return 'FV'
}

const getWallet = (currency) => {
  if (currency === 'AP') return game.ap_points
  if (currency === 'DX') return game.dx_points
  return game.fv
}

const canAffordUpgrade = (upg) => {
  if (upg.level === 'MAX') return false
  return getWallet(getUpgradeCurrencyLabel(upg)).gte(upg.price)
}

const missingFor = (upg) => {
  const deficit = Decimal.max(0, new Decimal(upg.price).minus(getWallet(getUpgradeCurrencyLabel(upg))))
  return format(deficit)
}

const upgradeEffect = (upg) => {
  if (upg.id === 2) return "f'(x)의 x 시작값을 높여 DX 획득량을 키웁니다."
  if (upg.id === 3) return '모든 자동화 간격을 줄입니다.'
  return 'Derivative 진행 보조 업그레이드'
}
</script>
