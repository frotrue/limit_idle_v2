<template>
  <div id="app" class="app-wrapper">
    <div class="container">

      <header class="header-card">
        <div class="label">CURRENT PROGRESS</div>
        <h1 class="resource-display">{{ format(game.fv) }}</h1>
        <div class="income-rate">f(x) = {{ game.fx_str }}</div>

        <div class="progress-section">
          <div class="progress-info">
            <span>X-Axis: {{ format(game.current_x) }} / {{ format(game.max_x) }}</span>
          </div>
<!--          <div class="progress-container">-->
<!--            <div class="progress-bar" :style="{ width: (game.current_x.div(game.max_x).toNumber() * 100) + '%' }"></div>-->
<!--            <div class="progress-glow" :style="{ width: (game.current_x.div(game.max_x).toNumber() * 100) + '%' }"></div>-->
<!--          </div>-->
        </div>
      </header>

      <nav class="tab-menu">
        <button v-for="tab in tabs" :key="tab.id"
                :class="{ active: activeTab === tab.id }"
                @click="activeTab = tab.id">
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.name }}</span>
        </button>
      </nav>

      <main class="main-content">
        <div v-if="activeTab === 'fx'" class="tab-pane">
          <div class="section-title">Variable Upgrades</div>

          <div class="upgrade-grid">
            <button v-for="upg in game.x_upgrades"
                    :key="upg.id"
                    class="upg-card-mini"
                    :class="{
                      'can-buy': game.fv.gte(upg.price),
                      'locked': game.fv.lt(upg.price)
                    }"
                    @click="buyUpgrade(upg)">
              <div class="upg-name">{{ upg.name }}</div>
              <div class="upg-cost">
                <span class="cost-val">{{ format(upg.price) }}</span>
                <span class="cost-unit">FV</span>
              </div>
              <div class="upg-level">Lv.{{ upg.level }}</div>
            </button>
          </div>
          <br>
          <div class="section-title">other Upgrades</div>
          <div class="upgrade-grid">
            <button v-for="upg in game.other_upgrades"
                    :key="upg.id"
                    class="upg-card-mini"
                    :class="{
                      'can-buy': game.fv.gte(upg.price),
                      'locked': game.fv.lt(upg.price)
                    }"
                    @click="buyOtherUpgrade(upg)">
              <div class="upg-name">{{ upg.name }}</div>
              <div class="upg-cost">
                <span class="cost-val">{{ format(upg.price) }}</span>
                <span class="cost-unit">FV</span>
              </div>
              <div class="upg-level">Lv.{{ upg.level }}</div>
            </button>
          </div>
        </div>
        <div v-if="activeTab === 'fdx'" class="tab-pane">
          <div class="dx-header-card">
            <div class="label">DERIVATIVE POINTS</div>
            <div class="dx-resource-display">{{ format(game.dx_points) }} DX</div>
          </div>

          <div class="section-title">Differentiation</div>
          <div class="upgrade-grid">
            <button class="upg-card-mini full-row prestige-btn" @click="console.log('Differentiate clicked')">
              <div class="upg-name">Differentiate f(x)</div>
              <div class="upg-desc">Reset progress to gain DX points</div>
            </button>
          </div>

          <div class="section-title">Derivative Upgrades</div>
          <div class="upgrade-grid">
            <button v-for="upg in game.dx_upgrades"
                    :key="upg.id"
                    class="upg-card-mini"
                    :class="{
                      'can-buy': game.dx_points.gte(upg.price),
                      'locked': game.dx_points.lt(upg.price)
                    }"
                    @click="console.log('DX Upgrade clicked', upg.id)">
              <div class="upg-name">{{ upg.name }}</div>
              <div class="upg-cost">
                <span class="cost-val">{{ format(upg.price) }}</span>
                <span class="cost-unit">DX</span>
              </div>
              <div class="upg-level">Lv.{{ upg.level }}</div>
            </button>
          </div>
        </div>

        <div v-if="activeTab === 'settings'" class="tab-pane">
          <div class="settings-group">
            <button class="sub-btn" @click="saveGame">SAVE GAME</button>
            <button class="sub-btn danger" @click="resetGame">RESET DATA</button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import Decimal from 'break_infinity.js'

const activeTab = ref('fx')
const isTapping = ref(false)

const tabs = [
  { id: 'fx', name: 'Variable', icon: '📊' },
  { id: 'fdx', name: 'Derivative', icon: '📈' },
  { id: 'auto', name: 'Automation', icon: '🤖' },
  { id: 'settings', name: 'Settings', icon: '⚙️' }
]

// 초기 게임 데이터 구조
const game = reactive({
  fv: new Decimal(10),
  fx : [1,0,0,0,0,0,0,0,0,0],
  fx_str: "1",
  current_x: new Decimal(0),
  max_x: new Decimal(1),
  x_increase: new Decimal(0.05),
  x_upgrades : {
    0: { id: 0, name: 'Upgrade x⁰', price: new Decimal(10), effect: 0.01, type: 'add', level: 0 },
    1: { id: 1, name: 'Upgrade x¹', price: new Decimal(100), effect: 0.05, type: 'add', level: 0 },
    2: { id: 2, name: 'Upgrade x²', price: new Decimal(1000), effect: 0.05, type: 'add', level: 0 },
    3: { id: 3, name: 'Upgrade x³', price: new Decimal(10000), effect: 0.2, type: 'add', level: 0 },
    4: { id: 4, name: 'Upgrade x⁴', price: new Decimal(100000), effect: 0.2, type: 'add', level: 0 },
    5: { id: 5, name: 'Upgrade x⁵', price: new Decimal(1000000), effect: 0.2, type: 'add', level: 0 },
    6: { id: 6, name: 'Upgrade x⁶', price: new Decimal(10000000), effect: 0.2, type: 'add', level: 0 },
    7: { id: 7, name: 'Upgrade x⁷', price: new Decimal(100000000), effect: 0.2, type: 'add', level: 0 },
    8: { id: 8, name: 'Upgrade x⁸', price: new Decimal(1000000000), effect: 0.2, type: 'add', level: 0 },
    9: { id: 9, name: 'Upgrade x⁹', price: new Decimal(10000000000), effect: 0.2, type: 'add', level: 0 }
  },
  other_upgrades : {
    0: { id: 0, name: 'Upgrade max x', price: new Decimal(1000), type: 'add', level: 0 },
    1: { id: 1, name: 'Upgrade x increase', price: new Decimal(100), type: 'add', level: 0 },
    // 2: { id: 2, name: 'Upgrade x²', price: new Decimal(1000), effect: 0.05, type: 'add', level: 0 },
    // 3: { id: 3, name: 'Upgrade x³', price: new Decimal(1000), effect: 0.2, type: 'add', level: 0 },
    // 4: { id: 4, name: 'Upgrade x⁴', price: new Decimal(10000), effect: 0.2, type: 'add', level: 0 },
    // 5: { id: 5, name: 'Upgrade x⁵', price: new Decimal(100000), effect: 0.2, type: 'add', level: 0 },
    // 6: { id: 6, name: 'Upgrade x⁶', price: new Decimal(1000000), effect: 0.2, type: 'add', level: 0 },
    // 7: { id: 7, name: 'Upgrade x⁷', price: new Decimal(10000000), effect: 0.2, type: 'add', level: 0 },
    // 8: { id: 8, name: 'Upgrade x⁸', price: new Decimal(100000000), effect: 0.2, type: 'add', level: 0 },
    // 9: { id: 9, name: 'Upgrade x⁹', price: new Decimal(1000000000), effect: 0.2, type: 'add', level: 0 }
  },
  prestige_x: new Decimal(1), // 미분 시 대입할 x값
  dx_points: new Decimal(0),  // 미분 재화
  dx_multiplier: new Decimal(1), // 미분 보너스 배수
  dx_upgrades: {
    0: { id: 0, name: 'Increase x in f\'(x)', price: new Decimal(10), level: 0 },
    1: { id: 1, name: 'Double DX Gain', price: new Decimal(50), level: 0 }
  }
})

const SUPERSCRIPT_MAP = {
  0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴',
  5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹',
};

const format = (num) => {
  const d = new Decimal(num)
  if (d.lt(1000)) return d.toNumber() % 1 === 0 ? d.toNumber() : d.toNumber().toFixed(2);
  return d.toExponential(2).replace(/\+/g, '');
}

const makefx = () => {
  let parts = []
  for (let i = game.fx.length - 1; i >= 0; i--) {
    if (game.fx[i] !== 0) {
      if (i === 0) parts.push(`${game.fx[i]}`)
      else if (i === 1) parts.push(`${game.fx[i]}x`)
      else parts.push(`${game.fx[i]}x${SUPERSCRIPT_MAP[i]}`)
    }
  }
  game.fx_str = parts.join(" + ") || "0"
}

const equation_calc = (equation, x) => {
  let total = new Decimal(0)
  for (let i = 0; i < equation.length; i++) {
    if (equation[i] === 0) continue;
    let term = new Decimal(equation[i]).times(Decimal.pow(x, i));
    total = total.plus(term);
  }
  return total;
}

const differentiate = (equation, x) => {
    let temp_arr = [];
    for (let i = 1; i < equation.length; i++) {
        temp_arr[i - 1] = equation[i]*i;
    }
    while (temp_arr.length < equation.length) {
        temp_arr.push(new Decimal(0));
    }

    if (x !== undefined) {
        return equation_calc(temp_arr, x);
    }
    return temp_arr;
}

const manualTick = () => {
  game.current_x = game.current_x.plus(game.x_increase)
  if (game.current_x.gte(game.max_x)) {
    game.current_x = new Decimal(0)
    game.fv = game.fv.plus(equation_calc(game.fx, game.max_x))
  }
}

const buyUpgrade = (upg) => {
  if (game.fv.gte(upg.price)) {
    game.fv = game.fv.minus(upg.price)
    upg.level++

    if (upg.type === 'add') {
      game.fx[upg.id] += 1
      if( upg.level %10 === 0){
        game.fx[upg.id] *= 1.5
        game.fx[upg.id] = Math.floor(game.fx[upg.id])
        upg.price = upg.price.times(10).floor()
      }
      makefx()
    } else if (upg.type === 'mul_max') {
      game.max_x = game.max_x.times(upg.effect)
    }
  }
}
const buyOtherUpgrade = (upg) => {
  let price = new Decimal(upg.price);
  if (game.fv.gte(upg.price)) {
    game.fv = game.fv.minus(upg.price)
    upg.level++

    if (upg.id === 0) {
      game.max_x = game.max_x.plus(1)
      game.x_increase = game.x_increase.times(1.03)
      upg.price = price.times(1.5).floor()
      if( upg.level %10 === 0){
        game.max_x = game.max_x.times(1.3)
      }
    } else if (upg.id === 1) {
      game.x_increase = game.x_increase.plus(0.05)
      upg.price = price.times(1.8).floor()
      if( upg.level %10 === 0){
        game.x_increase = game.x_increase.times(1.3)
      }
    }
  }
  console.log(game.x_increase)
}

const saveGame = () => {
  localStorage.setItem('math_idle_save', JSON.stringify(game));
  console.log("Game Saved");
}

const loadGame = () => {
  const saved = localStorage.getItem('math_idle_save');
  if (!saved) return;

  const data = JSON.parse(saved);

  Object.assign(game, data);

  game.fv = new Decimal(data.fv);
  game.current_x = new Decimal(data.current_x);
  game.max_x = new Decimal(data.max_x);
  game.x_increase = new Decimal(data.x_increase);

  for (let key in game.x_upgrades) {
    game.x_upgrades[key].price = new Decimal(data.x_upgrades[key].price);
  }

  makefx();
}

const resetGame = () => {
  if (confirm("Reset all data?")) {
    localStorage.removeItem('math_idle_save');
    location.reload();
  }
}

onMounted(() => {
  loadGame();
  makefx();
  setInterval(manualTick, 100);
  setInterval(saveGame, 30000); // 30초 자동 저장
})
</script>

<style scoped>
/* 기존 스타일 코드 유지 */
@import url('https://webfontworld.github.io/gmarket/GmarketSans.css');

#app, .app-wrapper {
  /* 화면 전체를 채우되 내부 요소를 중앙으로 보냄 */
  display: flex;
  justify-content: center;
  align-items: flex-start; /* 혹은 center (취향 차이) */
  background-color: #050505;
  min-height: 100vh;
  width: 100vw; /* 뷰포트 전체 너비 */
  margin: 0;
  padding: 0;
  overflow-x: hidden; /* 가로 스크롤 절대 방지 */
}

.container {
  /* 실제 게임 화면이 들어가는 곳 */
  width: 100%;
  max-width: 450px; /* 창이 커져도 이 이상 안 넓어짐 */
  background-color: #0f0f11;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 20px;
  min-height: 100vh;
  box-sizing: border-box; /* 패딩이 너비에 포함되도록 함 */
  border-left: 1px solid #2a2a2e; /* PC에서 구분선 역할을 위해 추가 (선택) */
  border-right: 1px solid #2a2a2e;
}
.header-card {
  background: linear-gradient(145deg, #1a1a1e, #141417); padding: 24px; border-radius: 20px; border: 1px solid #2a2a2e; text-align: center;
}
.resource-display { font-size: 2.8rem; color: #fff; margin: 10px 0; }
.progress-container { height: 10px; background: #000; border-radius: 5px; position: relative; overflow: hidden; }
.progress-bar { height: 100%; background: #5e81ac; transition: width 0.1s linear; }
.tab-menu { display: flex; background: #1a1a1e; padding: 8px; border-radius: 15px; gap: 5px; }
.tab-menu button { flex: 1; border: none; background: transparent; padding: 10px 0; border-radius: 10px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.tab-menu button.active { background: #2a2a2e; }
.tab-label { font-size: 0.65rem; color: #888; }
.upgrade-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.upg-card-mini { background: #16161a; border: 1px solid #2a2a2e; border-radius: 12px; padding: 15px; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: 0.2s; font-family: inherit; }
.upg-card-mini.can-buy:hover { border-color: #5e81ac; transform: translateY(-3px); background: #1c1c22; }
.upg-card-mini.locked { opacity: 0.4; cursor: not-allowed; filter: grayscale(1); }
.upg-name { color: #fff; font-size: 0.9rem; font-weight: bold; }
.cost-val { color: #ebcb8b; font-weight: bold; font-size: 0.95rem; }
.cost-unit { color: #666; font-size: 0.7rem; margin-left: 2px; }
.upg-level { font-size: 0.7rem; color: #5e81ac; }
.main-tap-btn { width: 100%; padding: 18px; border-radius: 15px; border: none; background: #5e81ac; color: white; font-family: inherit; cursor: pointer; margin-bottom: 10px; }
.main-tap-btn.tapping { transform: scale(0.95); }
.settings-group { display: flex; flex-direction: column; gap: 10px; }
.sub-btn { padding: 15px; border-radius: 10px; border: 1px solid #333; background: #1a1a1e; color: white; cursor: pointer; font-family: inherit; }
.sub-btn.danger { border-color: #bf616a; color: #bf616a; }
</style>