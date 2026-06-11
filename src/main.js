import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { installDecimalPowCache } from './game/performance/decimalPowCache.js'
import { applyPreLoadSavePatches, applyRuntimeStabilityPatches } from './game/persistence/stabilityPatches.js'

installDecimalPowCache()
applyPreLoadSavePatches()

createApp(App).mount('#app')

applyRuntimeStabilityPatches()
