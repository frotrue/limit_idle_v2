<template>
<!-- 6. Stats 탭 -->
          <div class="tab-pane">
            <div class="dx-header-card" style="margin-bottom: 12px; background-color: #3b4252;">
              <div class="label">STATISTICS & ACHIEVEMENTS</div>
              <div class="dx-resource-display" style="font-size: 1.2rem;">총 플레이 타임: {{ Math.floor(game.stats.play_time / 3600) }}h {{ Math.floor((game.stats.play_time % 3600) / 60) }}m {{ Math.floor(game.stats.play_time % 60) }}s</div>
            </div>

            <nav class="tab-menu" style="margin-bottom: 12px;">
              <button :class="{ active: statsSubTab === 'overview' }" @click="statsSubTab = 'overview'">
                <span class="tab-label">Overview</span>
              </button>
              <button :class="{ active: statsSubTab === 'graph' }" @click="statsSubTab = 'graph'">
                <span class="tab-label">Graph</span>
              </button>
              <button :class="{ active: statsSubTab === 'achievements' }" @click="statsSubTab = 'achievements'">
                <span class="tab-label">Achievements</span>
              </button>
            </nav>

            <div v-if="statsSubTab === 'overview'">
              <div class="section-title">Overview</div>
              <div class="stats-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="stats-item" style="flex-direction: column; align-items: flex-start; padding: 15px;">
                  <span class="stats-label" style="font-size: 0.8rem; color: #88c0d0;">Total FV Earned</span>
                  <span class="stats-value" style="font-size: 1.2rem;">{{ format(game.stats.total_fv) }}</span>
                </div>
                <div class="stats-item" style="flex-direction: column; align-items: flex-start; padding: 15px;">
                  <span class="stats-label" style="font-size: 0.8rem; color: #88c0d0;">Current FV/sec</span>
                  <span class="stats-value" style="font-size: 1.2rem;">{{ format(game.stats.fv_per_sec) }}</span>
                </div>
                <div class="stats-item" style="flex-direction: column; align-items: flex-start; padding: 15px;">
                  <span class="stats-label" style="font-size: 0.8rem; color: #88c0d0;">Differentiation Count</span>
                  <span class="stats-value" style="font-size: 1.2rem;">{{ format(game.differentiationCount) }}</span>
                </div>
                <div class="stats-item" style="flex-direction: column; align-items: flex-start; padding: 15px;">
                  <span class="stats-label" style="font-size: 0.8rem; color: #88c0d0;">Total DX Earned</span>
                  <span class="stats-value" style="font-size: 1.2rem;">{{ format(game.stats.total_dx) }}</span>
                </div>
              </div>
            </div>

            <div v-if="statsSubTab === 'graph'">
              <div class="section-title">Production History (FV/sec)</div>
              <div class="exp-desc" style="margin-bottom: 12px;">최근 1분간의 초당 FV 생산량 변화(Log Scale)입니다.</div>
              <LineChart :history="game.history.fv_per_sec" />
            </div>

            <div v-if="statsSubTab === 'achievements'">
              <div class="section-title">Achievements</div>
              <div class="exp-desc" style="margin-bottom: 12px; color: #a3be8c;">
                현재 달성한 업적: {{ game.achievements.length }} / {{ ACHIEVEMENTS.length }}<br>
                적용 중인 추가 배율: ×{{ format(getAchievementFvMultiplier(game.achievements)) }}<br>
                시작 기본 FV 보너스: +{{ format(getAchievementStartFv(game.achievements)) }}<br>
                미분 시 AP 보너스: +{{ format(getAchievementExtraAp(game.achievements)) }}
              </div>
              <div class="upgrade-grid">
                <div v-for="ach in ACHIEVEMENTS" :key="ach.id"
                     class="upg-card-mini"
                     :class="{
                       'research-unlocked': game.achievements.includes(ach.id),
                       'locked': !game.achievements.includes(ach.id)
                     }"
                     style="position: relative; opacity: 1;">
                  <div class="upg-name" :style="{ color: game.achievements.includes(ach.id) ? '#a3be8c' : '#d8dee9' }">
                    {{ game.achievements.includes(ach.id) ? '🏆' : '🔒' }} {{ ach.name }}
                  </div>
                  <div class="upg-desc" style="font-size: 0.75rem; color: #d8dee9; margin: 4px 0;">{{ ach.desc }}</div>
                  <div class="upg-desc" style="font-size: 0.7rem; color: #ebcb8b;">보상: {{ ach.reward }}</div>
                </div>
              </div>
            </div>
          </div>
</template>

<script setup>
import { ref } from 'vue'
import { game, format, ACHIEVEMENTS } from '@/game'
import { getAchievementFvMultiplier, getAchievementExtraAp, getAchievementStartFv } from '@/achievements.js'
import LineChart from '@/components/LineChart.vue'

const statsSubTab = ref('overview')
</script>
