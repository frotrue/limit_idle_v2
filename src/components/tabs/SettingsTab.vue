<template>
<!-- [Settings 탭] -->
          <div class="tab-pane">
            <div class="settings-group">
              <button class="sub-btn" @click="saveGame">SAVE GAME</button>
              <button class="sub-btn danger" @click="resetGame">RESET DATA</button>
            </div>
          </div>
</template>

<script setup>
import { saveGame, resetGame } from '@/game'
</script>
