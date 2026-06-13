<template>
  <div class="tab-pane">
    <section class="resource-card stats-card">
      <div class="label">Statistics</div>
      <div class="resource-card__value">{{ playTimeLabel }}</div>
      <div class="resource-card__sub">총 플레이 타임</div>
    </section>

    <nav class="segmented-tabs">
      <button :class="{ active: statsSubTab === 'overview' }" @click="statsSubTab = 'overview'">Overview</button>
      <button :class="{ active: statsSubTab === 'graph' }" @click="statsSubTab = 'graph'">Graph</button>
      <button :class="{ active: statsSubTab === 'achievements' }" @click="statsSubTab = 'achievements'">Achievements</button>
    </nav>

    <section v-if="statsSubTab === 'overview'" class="panel-section">
      <div class="section-title">Overview</div>
      <div class="stat-grid">
        <div class="stat-tile">
          <span>Total FV Earned</span>
          <strong>{{ format(game.stats.total_fv) }}</strong>
        </div>
        <div class="stat-tile">
          <span>Current FV/sec</span>
          <strong>{{ format(game.stats.fv_per_sec) }}</strong>
        </div>
        <div class="stat-tile">
          <span>Differentiation Count</span>
          <strong>{{ format(game.differentiationCount) }}</strong>
        </div>
        <div class="stat-tile">
          <span>Total DX Earned</span>
          <strong>{{ format(game.stats.total_dx) }}</strong>
        </div>
      </div>
    </section>

    <section v-if="statsSubTab === 'graph'" class="panel-section">
      <div class="section-title">Production History</div>
      <p class="section-subtitle">최근 1분간 FV/sec 변화입니다.</p>
      <LineChart :history="game.history.fv_per_sec" />
    </section>

    <section v-if="statsSubTab === 'achievements'" class="panel-section">
      <div class="section-header">
        <div>
          <div class="section-title">Achievements</div>
          <p class="section-subtitle">{{ game.achievements.length }} / {{ ACHIEVEMENTS.length }} 달성</p>
        </div>
      </div>

      <div class="bonus-strip">
        <span>FV x{{ format(getAchievementFvMultiplier(game.achievements)) }}</span>
        <span>Start FV +{{ format(getAchievementStartFv(game.achievements)) }}</span>
        <span>AP +{{ format(getAchievementExtraAp(game.achievements)) }}</span>
      </div>

      <div class="achievement-grid">
        <article
          v-for="ach in ACHIEVEMENTS"
          :key="ach.id"
          class="achievement-card"
          :class="{ unlocked: game.achievements.includes(ach.id) }"
        >
          <component :is="game.achievements.includes(ach.id) ? Trophy : LockKeyhole" :size="18" />
          <div>
            <h3>{{ ach.name }}</h3>
            <p>{{ ach.desc }}</p>
            <small>보상: {{ ach.reward }}</small>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { LockKeyhole, Trophy } from 'lucide-vue-next'
import { game, format, ACHIEVEMENTS } from '@/game'
import { getAchievementFvMultiplier, getAchievementExtraAp, getAchievementStartFv } from '@/achievements.js'
import LineChart from '@/components/LineChart.vue'

const statsSubTab = ref('overview')
const playTimeLabel = computed(() => {
  const total = Math.floor(game.stats.play_time || 0)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return `${hours}h ${minutes}m ${seconds}s`
})
</script>
