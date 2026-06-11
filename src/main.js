import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { applyPreLoadSavePatches, applyRuntimeStabilityPatches } from './stabilityPatches.js'

applyPreLoadSavePatches()

createApp(App).mount('#app')

applyRuntimeStabilityPatches()
