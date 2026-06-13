<template>
<!-- 2. Derivative 탭 (환생 및 미분 보상) -->
        <div class="tab-pane">
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
</template>

<script setup>
import { game, format, differentiate_bt, buyOtherUpgrade, buyMaxOtherUpgrade, buyMaxAllOtherUpgrades } from '@/game'

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
</script>
