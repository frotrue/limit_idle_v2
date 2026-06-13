<template>
  <div class="tab-pane">
    <section class="panel-section">
      <div class="section-header">
        <div>
          <div class="section-title">Variable Upgrades</div>
          <p class="section-subtitle">f(x) 계수를 직접 키웁니다.</p>
        </div>
        <button class="buy-max-btn" @click="buyMaxVariables">Buy Max</button>
      </div>

      <div class="upgrade-grid">
        <UpgradeCard
          v-for="upg in game.x_upgrades"
          :key="upg.id"
          :name="upg.name"
          :level="upg.level"
          :price="format(upg.price)"
          currency="FV"
          :can-afford="game.fv.gte(upg.price)"
          :missing="missing(game.fv, upg.price)"
          :effect="variableEffect(upg)"
          @buy="buyUpgrade(upg)"
          @buy-max="buyMaxUpgrade(upg)"
        />
      </div>
    </section>

    <section class="panel-section">
      <div class="section-header">
        <div>
          <div class="section-title">Utility Upgrades</div>
          <p class="section-subtitle">x 진행 범위와 이동량을 개선합니다.</p>
        </div>
        <button class="buy-max-btn" @click="buyMaxAllOtherUpgrades('fx')">Buy Max</button>
      </div>

      <div class="upgrade-grid">
        <template v-for="upg in game.other_upgrades" :key="upg.id">
          <UpgradeCard
            v-if="upg.type === 'fx'"
            :name="upg.name"
            :level="upg.level"
            :price="format(upg.price)"
            currency="FV"
            :can-afford="game.fv.gte(upg.price) && upg.level !== 'MAX'"
            :missing="missing(game.fv, upg.price)"
            :effect="utilityEffect(upg)"
            @buy="buyOtherUpgrade(upg)"
            @buy-max="buyMaxOtherUpgrade(upg)"
          />
        </template>
      </div>
    </section>
  </div>
</template>

<script setup>
import Decimal from 'break_eternity.js'
import UpgradeCard from '@/components/UpgradeCard.vue'
import { game, format, buyUpgrade, buyOtherUpgrade, buyMaxUpgrade, buyMaxOtherUpgrade, buyMaxAllOtherUpgrades } from '@/game'

const missing = (wallet, price) => {
  const deficit = Decimal.max(0, new Decimal(price).minus(wallet || 0))
  return format(deficit)
}

const buyMaxVariables = () => {
  Object.values(game.x_upgrades).reverse().forEach((upg) => buyMaxUpgrade(upg))
}

const variableEffect = (upg) => `x^${upg.id} 계수 +1, 5/10레벨마다 보너스`

const utilityEffect = (upg) => {
  if (upg.id === 0) return 'Max x와 x 증가량을 함께 키웁니다.'
  if (upg.id === 1) return '매 tick마다 이동하는 x 증가량을 키웁니다.'
  return 'Variable 진행 보조 업그레이드'
}
</script>
