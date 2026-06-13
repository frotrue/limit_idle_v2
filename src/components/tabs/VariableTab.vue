<template>
<!-- 1. Variable 탭 (f(x) 관련 업그레이드) -->
        <div class="tab-pane">
          <div class="section-header">
            <div class="section-title">Variable Upgrades</div>
            <button class="buy-max-btn" @click="Object.values(game.x_upgrades).reverse().forEach(u => buyMaxUpgrade(u))">BUY MAX</button>
          </div>
          <div class="upgrade-grid">
            <button v-for="upg in game.x_upgrades"
                    :key="upg.id"
                    class="upg-card-mini"
                    :class="{
                      'can-buy': game.fv.gte(upg.price),
                      'locked': game.fv.lt(upg.price)
                    }"
                    @click="buyUpgrade(upg)"
                    @contextmenu.prevent="buyMaxUpgrade(upg)">
              <div class="upg-name">{{ upg.name }}</div>
              <div class="upg-cost">
                <span class="cost-val">{{ format(upg.price) }}</span>
                <span class="cost-unit">FV</span>
              </div>
              <div class="upg-level">Lv.{{ upg.level }}</div>
            </button>
          </div>

          <br>
          
          <div class="section-header">
            <div class="section-title">Other Upgrades</div>
            <button class="buy-max-btn" @click="buyMaxAllOtherUpgrades('fx')">BUY MAX</button>
          </div>
          <div class="upgrade-grid">
            <template v-for="upg in game.other_upgrades" :key="upg.id">
              <button v-if="upg.type === 'fx'"
                      class="upg-card-mini"
                      :class="{
                        'can-buy': game.fv.gte(upg.price),
                        'locked': game.fv.lt(upg.price)
                      }"
                      @click="buyOtherUpgrade(upg)"
                      @contextmenu.prevent="buyMaxOtherUpgrade(upg)">
                <div class="upg-name">{{ upg.name }}</div>
                <div class="upg-cost">
                  <span class="cost-val">{{ format(upg.price) }}</span>
                  <span class="cost-unit">FV</span>
                </div>
                <div class="upg-level">Lv.{{ upg.level }}</div>
              </button>
            </template>
          </div>
        </div>
</template>

<script setup>
import { game, format, buyUpgrade, buyOtherUpgrade, buyMaxUpgrade, buyMaxOtherUpgrade, buyMaxAllOtherUpgrades } from '@/game'
</script>
