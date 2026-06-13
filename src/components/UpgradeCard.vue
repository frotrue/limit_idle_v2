<template>
  <article class="upgrade-card" :class="{ 'can-buy': canAfford, locked: !canAfford, 'is-maxed': isMaxed }">
    <div class="upgrade-card__top">
      <div>
        <h3 class="upgrade-card__name">{{ name }}</h3>
        <p v-if="effect" class="upgrade-card__effect">{{ effect }}</p>
      </div>
      <span class="upgrade-card__level">{{ levelLabel }}</span>
    </div>

    <div class="upgrade-card__meta">
      <span class="upgrade-card__cost">{{ price }}</span>
      <span class="upgrade-card__currency">{{ currency }}</span>
    </div>

    <p v-if="!canAfford && !isMaxed" class="upgrade-card__missing">
      부족: {{ missing }} {{ currency }}
    </p>

    <div class="upgrade-card__actions">
      <button class="sub-btn compact" :disabled="!canAfford || isMaxed" @click="$emit('buy')">Buy</button>
      <button
        v-if="showBuyMax"
        class="sub-btn compact secondary"
        :disabled="!canAfford || isMaxed"
        @click="$emit('buy-max')"
      >
        Buy Max
      </button>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  level: { type: [Number, String], default: 0 },
  price: { type: String, required: true },
  currency: { type: String, default: 'FV' },
  canAfford: { type: Boolean, default: false },
  missing: { type: String, default: '0' },
  effect: { type: String, default: '' },
  showBuyMax: { type: Boolean, default: true }
})

defineEmits(['buy', 'buy-max'])

const isMaxed = computed(() => props.level === 'MAX')
const levelLabel = computed(() => isMaxed.value ? 'MAX' : `Lv.${props.level}`)
</script>
