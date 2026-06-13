<template>
  <div class="tab-pane">
    <section class="panel-section">
      <div class="section-title">Settings</div>

      <div class="settings-row">
        <div>
          <strong>Layout</strong>
          <p>데스크톱에서는 반응형 2컬럼 HUD를 사용하거나, 모바일 폭 UI로 고정할 수 있습니다.</p>
        </div>
        <div class="segmented-control" role="group" aria-label="Layout mode">
          <button :class="{ active: game.ui.layoutMode === 'auto' }" @click="setLayoutMode('auto')">Responsive</button>
          <button :class="{ active: game.ui.layoutMode === 'mobile' }" @click="setLayoutMode('mobile')">Mobile UI</button>
        </div>
      </div>

      <div class="settings-actions">
        <button class="sub-btn" @click="saveGame">Save Game</button>
        <button class="sub-btn danger" @click="resetGame">Reset Data</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { game, saveGame, resetGame } from '@/game'

const setLayoutMode = (mode) => {
  game.ui.layoutMode = mode
  saveGame()
}
</script>
