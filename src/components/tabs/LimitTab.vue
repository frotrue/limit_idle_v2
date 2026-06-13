<template>
  <div class="tab-pane">
    <section class="resource-card limit-card">
      <div class="label">Limit</div>
      <div class="resource-card__value">{{ format(game.limit.lp) }} LP</div>
      <div class="resource-card__sub">LP passive bonus: FV x{{ format(getLpPassiveBonus(game.limit.lp)) }}</div>
    </section>

    <section class="limit-reset-panel" :class="{ ready: canLimit(game.integral_count, game.fv) }">
      <template v-if="canLimit(game.integral_count, game.fv)">
        <h3>Limit Reset 가능</h3>
        <p>업적, AP 연구, Tier 2/3 마일스톤은 유지하고 나머지 진행을 초기화합니다.</p>
        <strong>예상 LP: +{{ format(getLpGain(game.fv)) }}</strong>
        <button class="limit-reset-btn" @click="performLimitBtn">Limit Reset</button>
      </template>
      <template v-else>
        <h3>Limit 조건 미충족</h3>
        <p>Integral count 50 이상과 충분한 FV가 필요합니다. 현재 {{ game.integral_count }} / 50</p>
      </template>
    </section>

    <section class="panel-section">
      <div class="section-title">Transcendental Constants</div>
      <div class="upgrade-grid">
        <article v-for="constant in LIMIT_CONSTANTS" :key="constant.id" class="limit-upgrade-card">
          <div>
            <h3>{{ constant.name }}</h3>
            <p>{{ constant.desc }}</p>
          </div>
          <div class="limit-upgrade-card__effect">
            Lv.{{ game.limit.constants[constant.id] || 0 }} / {{ constant.effectDesc(game.limit.constants[constant.id] || 0) }}
          </div>
          <button
            class="limit-upgrade-btn"
            :disabled="game.limit.lp.lt(constant.price(game.limit.constants[constant.id] || 0))"
            @click="buyLimitConstant(constant.id)"
          >
            Upgrade ({{ format(constant.price(game.limit.constants[constant.id] || 0)) }} LP)
          </button>
        </article>
      </div>
    </section>

    <section class="panel-section">
      <div class="section-title">L'Hopital's Rule</div>
      <article class="limit-upgrade-card full-row">
        <h3>극한 설계 돌파</h3>
        <p>상수 총합 5레벨 이상부터 미분 횟수와 적분 횟수로 FV 배율을 변환합니다.</p>
        <strong>
          현재 배율: x{{ format(getLpHospitalMultiplier(game.differentiationCount, game.integral_count, totalConstantLevels)) }}
        </strong>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { game, format, LIMIT_CONSTANTS, getLpHospitalMultiplier, getLpGain, getLpPassiveBonus, canLimit, purchaseLimitConstant, performLimitReset } from '@/game'

const emit = defineEmits(['selectTab'])

const totalConstantLevels = computed(() => {
  return (game.limit.constants.euler_e || 0) + (game.limit.constants.pi || 0) + (game.limit.constants.gamma || 0)
})

const performLimitBtn = () => {
  if (confirm('정말 Limit Reset을 진행하시겠습니까? 업적과 AP 연구를 제외한 대부분의 진행이 초기화됩니다.')) {
    performLimitReset()
    emit('selectTab', 'fx')
  }
}

const buyLimitConstant = (id) => purchaseLimitConstant(id)
</script>
