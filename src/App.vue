<!--
Limit Idle
reference : gemini 3.0
github : frotrue/limit-idle
using tech : vue.js, break_eternity.js
made by frotrue
-->

<template>
  <div id="app" class="app-wrapper">
    <div class="container">

      <!-- [상단 헤더] 현재 진행도 및 f(x) 수식 표시 -->
      <header class="header-card">
        <div class="label">CURRENT PROGRESS</div>
        <h1 class="resource-display">{{ format(game.fv) }}</h1>
        <div class="income-rate">f(x) = {{ game.fx_str }}</div>

        <div class="progress-section">
          <div class="progress-info">
            <span>X-Axis: {{ format(game.current_x) }} / {{ format(game.max_x) }}</span>
          </div>
        </div>
      </header>

      <!-- [네비게이션] 탭 메뉴 버튼 -->
      <nav class="tab-menu">
        <template v-for="tab in tabs" :key="tab.id">
          <button v-if="tab.id !== 'exp' || game.unlocked_exp"
                  :class="{ active: activeTab === tab.id }"
                  @click="activeTab = tab.id">
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-label">{{ tab.name }}</span>
          </button>
        </template>
      </nav>

      <!-- [메인 콘텐츠 영역] 선택된 탭에 따라 내용 변경 -->
      <main class="main-content">
        
        <!-- 1. Variable 탭 (f(x) 관련 업그레이드) -->
        <div v-if="activeTab === 'fx'" class="tab-pane">
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

        <!-- 2. Derivative 탭 (환생 및 미분 보상) -->
        <div v-if="activeTab === 'fdx'" class="tab-pane">
          <div class="dx-header-card">
            <div class="label">DERIVATIVE POINTS</div>
            <div class="dx-resource-display">{{ format(game.dx_points) }} DX</div>
          </div>

          <div class="section-title">Differentiation</div>
          <div class="upgrade-grid">
            <button class="upg-card-mini full-row prestige-btn" @click="differentiate_bt">
              <div class="upg-name">Differentiate f(x)</div>
              <div class="upg-desc">Reset progress to gain DX points</div>
            </button>
          </div>

          <div class="section-header">
            <div class="section-title">Derivative Upgrades</div>
            <button class="buy-max-btn" @click="buyMaxAllOtherUpgrades('ddx')">BUY MAX</button>
          </div>
          <div class="upgrade-grid">
            <template v-for="upg in game.other_upgrades" :key="upg.id">
              <button v-if="upg.type === 'ddx'"
                      class="upg-card-mini"
                      :class="{
                        'can-buy': game.dx_points.gte(upg.price),
                        'locked': game.dx_points.lt(upg.price)
                      }"
                      @click="buyOtherUpgrade(upg)"
                      @contextmenu.prevent="buyMaxOtherUpgrade(upg)">
                <div class="upg-name">{{ upg.name }}</div>
                <div class="upg-cost">
                  <span class="cost-val">{{ format(upg.price) }}</span>
                  <span class="cost-unit">DX</span>
                </div>
                <div class="upg-level">Lv.{{ upg.level }}</div>
              </button>
            </template>
          </div>
        </div>

        <!-- 3. Automation 탭 -->
        <div v-if="activeTab === 'auto'" class="tab-pane">
          <div class="section-title">Automation</div>
          <div class="dx-header-card" style="margin-bottom: 20px;">
            <div class="label">DIFFERENTIATION COUNT</div>
            <div class="dx-resource-display" style="font-size: 1.5rem;">{{ format(game.differentiationCount) }}</div>
          </div>

          <div class="upgrade-grid">
            <div v-for="auto in game.auto_upgrades" :key="auto.id"
                 class="upg-card-mini"
                 :class="{ 'locked': game.differentiationCount.lt(auto.unlockedAt) }">
              <div class="upg-name">{{ auto.name }}</div>
              
              <template v-if="game.differentiationCount.gte(auto.unlockedAt)">
                <div class="upg-level">Interval: {{ auto.interval / 1000 }}s</div>
                <button class="sub-btn" 
                        :style="{ backgroundColor: auto.active ? '#5e81ac' : '#1a1a1e', width: '100%' }"
                        @click="auto.active = !auto.active">
                  {{ auto.active ? 'ACTIVE' : 'INACTIVE' }}
                </button>
              </template>
              <template v-else>
                <div class="upg-desc" style="font-size: 0.7rem; color: #666;">
                  Unlock at {{ auto.unlockedAt }} Diffs
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- 4. Exponential 탭 (지수 함수 레이어) -->
        <div v-if="activeTab === 'exp'" class="tab-pane">
          <div class="exp-header-card">
            <div class="label">EXPONENTIAL POWER (E)</div>
            <div class="exp-resource-display">^{{ format(game.exp_multiplier) }}</div>
            <div class="exp-desc">생산량 증폭: (f(x) + DX)^{{ format(game.exp_multiplier) }}</div>
            <div class="exp-desc" style="margin-top: 5px; color: #ff79c6;">E = e^{{ format(game.exp_x) }}</div>
          </div>

          <div class="section-header">
            <div class="section-title">Exponential Upgrades</div>
            <button class="buy-max-btn" @click="buyMaxAllExpUpgrades()">BUY MAX</button>
          </div>
          <div class="upgrade-grid">
            <button v-for="upg in game.exp_upgrades"
                    :key="upg.id"
                    class="upg-card-mini"
                    :class="{
                      'can-buy': game.fv.gte(upg.price),
                      'locked': game.fv.lt(upg.price)
                    }"
                    @click="buyExpUpgrade(upg)"
                    @contextmenu.prevent="buyMaxExpUpgrade(upg)">
              <div class="upg-name">{{ upg.name }}</div>
              <div class="upg-desc" v-if="upg.id === 0">Increase exp_x by 0.01</div>
              <div class="upg-desc" v-if="upg.id === 1">Increase exp_x by 0.05</div>
              <div class="upg-cost">
                <span class="cost-val">{{ format(upg.price) }}</span>
                <span class="cost-unit">FV</span>
              </div>
              <div class="upg-level">Lv.{{ upg.level }}</div>
            </button>
          </div>
        </div>

        <!-- 5. Stats 탭 -->
        <div v-if="activeTab === 'stats'" class="tab-pane">
          <div class="section-title">Statistics</div>
          <div class="stats-container">
            <div class="stats-item">
              <span class="stats-label">Total FV Earned:</span>
              <span class="stats-value">{{ format(game.stats.total_fv) }}</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">Current FV/sec:</span>
              <span class="stats-value">{{ format(game.stats.fv_per_sec) }}</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">Differentiation Count:</span>
              <span class="stats-value">{{ format(game.differentiationCount) }}</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">Total Play Time:</span>
              <span class="stats-value">{{ Math.floor(game.stats.play_time / 3600) }}h {{ Math.floor((game.stats.play_time % 3600) / 60) }}m {{ Math.floor(game.stats.play_time % 60) }}s</span>
            </div>
          </div>
        </div>

        <!-- [Settings 탭] -->
        <div v-if="activeTab === 'settings'" class="tab-pane">
          <div class="settings-group">
            <button class="sub-btn" @click="saveGame">SAVE GAME</button>
            <button class="sub-btn danger" @click="resetGame">RESET DATA</button>
          </div>
        </div>

      </main>
    </div>

    <!-- 커스텀 알림 컴포넌트 -->
    <CustomAlert
      :visible="alertState.visible"
      :message="alertState.message"
      :title="alertState.title"
      :is-confirm="alertState.isConfirm"
      @close="alertState.visible = false"
      @confirm="alertState.onConfirm"
      @cancel="alertState.onCancel"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import Decimal from 'break_eternity.js'
import CustomAlert from './components/CustomAlert.vue'

const activeTab = ref('fx')

// 알림 상태 관리
const alertState = reactive({
  visible: false,
  message: '',
  title: '',
  isConfirm: false,
  onConfirm: () => {},
  onCancel: () => {}
})

const showAlert = (message, title = '알림') => {
  alertState.message = message
  alertState.title = title
  alertState.isConfirm = false
  alertState.visible = true
}

const showConfirm = (message, onConfirm, title = '확인') => {
  alertState.message = message
  alertState.title = title
  alertState.isConfirm = true
  alertState.onConfirm = onConfirm
  alertState.onCancel = () => {}
  alertState.visible = true
}

const tabs = [
  { id: 'fx', name: 'Variable', icon: '📊' },
  { id: 'fdx', name: 'Derivative', icon: '📈' },
  { id: 'auto', name: 'Automation', icon: '🤖' },
  { id: 'exp', name: 'Exponential', icon: '🧬' },
  { id: 'stats', name: 'Stats', icon: '📝' },
  { id: 'settings', name: 'Settings', icon: '⚙️' }
]

// 초기 게임 데이터 구조
const game = reactive({
  fv: new Decimal(10),
  fx : [new Decimal(1), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)],
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
    0: { id: 0, name: 'Upgrade max x', price: new Decimal(1000), type: 'fx', level: 0 },
    1: { id: 1, name: 'Upgrade x increase', price: new Decimal(100), type: 'fx', level: 0 },
    2: { id: 0, name: 'Increase x in f\'(x)', price: new Decimal(10), type:'ddx',level: 0 },
    3: { id: 1, name: 'Decrease Auto Variable Interval', price: new Decimal(50), type:'ddx',level: 0 }
  },
  prestige_x: new Decimal(1),
  dx_points: new Decimal(0),
  dx_multiplier: new Decimal(0),
  differentiationCount: new Decimal(0),
  auto_upgrades: [
    { id: 0, name: 'Auto Variable', targetType: 'x_upgrades', interval: 10000, lastTick: 0, unlockedAt: 1, active: false },
    { id: 1, name: 'Auto FV Upgrades', targetType: 'other_upgrades_fx', interval: 2000, lastTick: 0, unlockedAt: 3, active: false },
    { id: 2, name: 'Auto DX Upgrades', targetType: 'other_upgrades_ddx', interval: 5000, lastTick: 0, unlockedAt: 5, active: false },
  ],
  unlocked_exp: false,
  exp_x: new Decimal(0),
  exp_multiplier: new Decimal(1),
  exp_upgrades: {
    0: { id: 0, name: 'Evolution of e', price: new Decimal("1e30"), base_price: new Decimal("1e30"), type: 'exp', level: 0 },
    1: { id: 1, name: 'Amplification', price: new Decimal("1e100"), base_price: new Decimal("1e100"), type: 'exp', level: 0 }
  },
  stats: {
    total_fv: new Decimal(0),
    total_dx: new Decimal(0),
    play_time: 0,
    session_start: Date.now(),
    fv_per_sec: new Decimal(0)
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
    if (game.fx[i].neq(0)) {
      let valStr = format(game.fx[i]);
      if (i === 0) parts.push(`${valStr}`)
      else if (i === 1) parts.push(`${valStr}x`)
      else parts.push(`${valStr}x${SUPERSCRIPT_MAP[i]}`)
    }
  }
  game.fx_str = parts.join(" + ") || "0"
}

const equation_calc = (equation, x) => {
  let total = new Decimal(0)
  for (let i = 0; i < equation.length; i++) {
    if (equation[i].eq(0)) continue;
    let term = equation[i].times(Decimal.pow(x, i));
    total = total.plus(term);
  }
  return total;
}

const differentiate = (equation, x) => {
    let temp_arr = [];
    for (let i = 1; i < equation.length; i++) {
        temp_arr[i - 1] = equation[i].times(i);
    }
    while (temp_arr.length < equation.length) {
        temp_arr.push(new Decimal(0));
    }
    if (x !== undefined) return equation_calc(temp_arr, x);
    return temp_arr;
}

const differentiate_bt = () => {
  if (game.fv.gte("1e10")) {
    showConfirm("미분 시 현재 모든 함수가 초기화되고 보상을 얻습니다.\n미분 시 f'("+game.prestige_x+") = "+format(differentiate(game.fx,game.prestige_x))+" 만큼의 DX를 얻습니다", () => {
      let gain = differentiate(game.fx, game.prestige_x);
      game.dx_points = game.dx_points.plus(gain);
      game.dx_multiplier = game.dx_multiplier.plus(gain);
      game.differentiationCount = game.differentiationCount.plus(1);

      // 리셋 로직
      game.fv = new Decimal(10);
      game.fx = [new Decimal(1), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)];
      game.current_x = new Decimal(0);
      game.max_x = new Decimal(1);
      game.x_increase = new Decimal(0.05);

      // 함수 업그레이드 리셋 (가격 포함)
      Object.values(game.x_upgrades).forEach(upg => {
        upg.level = 0;
        upg.price = Decimal.pow(10, upg.id + 1);
      });
      
      // FV 기타 업그레이드 리셋
      game.other_upgrades[0].level = 0;
      game.other_upgrades[0].price = new Decimal(1000);
      game.other_upgrades[1].level = 0;
      game.other_upgrades[1].price = new Decimal(100);

      makefx();
      showAlert(`${format(gain)} DX 포인트를 획득했습니다!`);
    }, "미분 확인");
  } else {
    showAlert("미분하려면 최소 1.00e10 FV가 필요합니다.");
  }
}

const performAutoUpgrade = (auto) => {
  if (auto.targetType === 'x_upgrades') {
    Object.values(game.x_upgrades).reverse().forEach(upg => buyUpgrade(upg));
  } else if (auto.targetType === 'other_upgrades_fx') {
    Object.values(game.other_upgrades).forEach(upg => { if (upg.type === 'fx') buyOtherUpgrade(upg); });
  } else if (auto.targetType === 'other_upgrades_ddx') {
    Object.values(game.other_upgrades).forEach(upg => { if (upg.type === 'ddx') buyOtherUpgrade(upg); });
  }
}

const autoTick = () => {
  const now = Date.now();
  game.auto_upgrades.forEach(auto => {
    if (auto.active && game.differentiationCount.gte(auto.unlockedAt)) {
      if (now - auto.lastTick >= auto.interval) {
        auto.lastTick = now;
        performAutoUpgrade(auto);
      }
    }
  });
}

const buyMaxAllOtherUpgrades = (type) => {
  let attempts = 0;
  while (attempts < 100) {
    let upgrades = Object.values(game.other_upgrades).filter(u => u.type === type && u.level !== "MAX");
    if (upgrades.length === 0) break;
    let cheapest = upgrades.reduce((prev, curr) => new Decimal(curr.price).lt(new Decimal(prev.price)) ? curr : prev);
    let canAfford = type === 'fx' ? game.fv.gte(cheapest.price) : game.dx_points.gte(cheapest.price);
    if (canAfford) buyOtherUpgrade(cheapest);
    else break;
    attempts++;
  }
}

const buyMaxUpgrade = (upg) => {
  while (game.fv.gte(upg.price)) { buyUpgrade(upg); }
}

const buyMaxOtherUpgrade = (upg) => {
  while (true) {
    if (upg.level === "MAX") break;
    let price = new Decimal(upg.price);
    if (upg.type === 'fx' && game.fv.gte(price)) buyOtherUpgrade(upg);
    else if (upg.type === 'ddx' && game.dx_points.gte(price)) buyOtherUpgrade(upg);
    else break;
  }
}

const manualTick = () => {
  // 0. 해금 로직
  if (!game.unlocked_exp && game.fv.gte("1e30")) {
    game.unlocked_exp = true;
    showAlert("지수 함수가 해금되었습니다! Exponential 탭을 확인하세요.");
  }

  // 1. 생산량 계산 ( (f(x) + DX) ^ E )
  let baseGain = equation_calc(game.fx, game.max_x).plus(game.dx_multiplier);
  if (baseGain.lt(1)) baseGain = new Decimal(1); 
  
  const gainPerCycle = baseGain.pow(game.exp_multiplier || 1);
  const cyclesPerTick = game.x_increase.div(game.max_x);
  game.stats.fv_per_sec = gainPerCycle.times(cyclesPerTick).times(10);

  // 2. 실제 자원 획득
  if (game.x_increase.gte(game.max_x)) {
    game.fv = game.fv.plus(gainPerCycle);
    game.stats.total_fv = game.stats.total_fv.plus(gainPerCycle);
    game.current_x = new Decimal(0);
  } else {
    game.current_x = game.current_x.plus(game.x_increase);
    if (game.current_x.gte(game.max_x)) {
      game.fv = game.fv.plus(gainPerCycle);
      game.stats.total_fv = game.stats.total_fv.plus(gainPerCycle);
      game.current_x = new Decimal(0);
    }
  }
  game.stats.play_time += 0.1;
  autoTick();
}

const buyUpgrade = (upg) => {
  if (game.fv.gte(upg.price)) {
    game.fv = game.fv.minus(upg.price)
    upg.level++
    if (upg.type === 'add') {
      game.fx[upg.id] = game.fx[upg.id].plus(1)
      if(upg.level % 10 === 0) {
        game.fx[upg.id] = game.fx[upg.id].times(1.5).floor()
        upg.price = upg.price.times(10).floor()
      }
      makefx()
    }
  }
}

const buyOtherUpgrade = (upg) => {
  let price = new Decimal(upg.price);
  if (upg.type ==='fx' && game.fv.gte(price)){
    game.fv = game.fv.minus(price);
    upg.level++;
    if (upg.id === 0) {
      game.max_x = game.max_x.plus(1);
      game.x_increase = game.x_increase.times(1.1);
      upg.price = price.times(1.5).floor();
    } else if (upg.id === 1) {
      game.x_increase = game.x_increase.plus(0.01);
      upg.price = price.times(1.6).floor();
      if (upg.level >= 100) {
        game.x_increase = game.max_x;
        upg.level = "MAX";
        upg.price = new Decimal("1e9999");
      }
    }
  } else if (upg.type ==='ddx' && game.dx_points.gte(price)) {
    game.dx_points = game.dx_points.minus(price);
    upg.level++;
    if (upg.id === 0) {
      game.prestige_x = game.prestige_x.plus(1);
      upg.price = price.times(2).floor();
    } else if (upg.id === 1) {
      if (game.auto_upgrades[0].interval > 100) {
        game.auto_upgrades[0].interval *= 0.8;
        upg.price = price.times(2).floor();
      } else {
        upg.level = "MAX";
        upg.price = new Decimal("1e9999");
      }
    }
  }
}

const buyExpUpgrade = (upg) => {
  if (game.fv.gte(upg.price)) {
    game.fv = game.fv.minus(upg.price);
    upg.level++;
    if (upg.id === 0) game.exp_x = game.exp_x.plus(0.01);
    else if (upg.id === 1) game.exp_x = game.exp_x.plus(0.05);
    upg.price = upg.base_price.times(Decimal.pow(10, upg.level)).floor();
    game.exp_multiplier = Decimal.exp(game.exp_x);
  }
}

const buyMaxExpUpgrade = (upg) => {
  while (game.fv.gte(upg.price)) { buyExpUpgrade(upg); }
}

const buyMaxAllExpUpgrades = () => {
  Object.values(game.exp_upgrades).forEach(u => buyMaxExpUpgrade(u));
}

const saveGame = () => {
  localStorage.setItem('math_idle_save', JSON.stringify(game));
}

const loadGame = () => {
  const saved = localStorage.getItem('math_idle_save');
  if (!saved) return;
  const data = JSON.parse(saved);
  game.fv = new Decimal(data.fv || 10);
  game.current_x = new Decimal(data.current_x || 0);
  game.max_x = new Decimal(data.max_x || 1);
  game.x_increase = new Decimal(data.x_increase || 0.05);
  game.prestige_x = new Decimal(data.prestige_x || 1);
  game.dx_points = new Decimal(data.dx_points || 0);
  game.dx_multiplier = new Decimal(data.dx_multiplier || 0);
  game.differentiationCount = new Decimal(data.differentiationCount || 0);
  game.unlocked_exp = data.unlocked_exp || false;
  game.exp_x = new Decimal(data.exp_x || 0);
  game.exp_multiplier = new Decimal(data.exp_multiplier || 1);
  if (data.fx) game.fx = data.fx.map(val => new Decimal(val));
  if (data.x_upgrades) {
    for (let key in game.x_upgrades) {
      if (data.x_upgrades[key]) {
        game.x_upgrades[key].level = data.x_upgrades[key].level;
        game.x_upgrades[key].price = new Decimal(data.x_upgrades[key].price);
      }
    }
  }
  if (data.other_upgrades) {
    for (let key in game.other_upgrades) {
      if (data.other_upgrades[key]) {
        game.other_upgrades[key].level = data.other_upgrades[key].level;
        game.other_upgrades[key].price = new Decimal(data.other_upgrades[key].price);
      }
    }
  }
  if (data.exp_upgrades) {
    for (let key in game.exp_upgrades) {
      if (data.exp_upgrades[key]) {
        game.exp_upgrades[key].level = data.exp_upgrades[key].level;
        game.exp_upgrades[key].price = new Decimal(data.exp_upgrades[key].price);
      }
    }
  }
  if (data.auto_upgrades) {
    data.auto_upgrades.forEach((savedAuto, index) => {
      if (game.auto_upgrades[index]) {
        game.auto_upgrades[index].active = savedAuto.active;
        game.auto_upgrades[index].lastTick = savedAuto.lastTick || 0;
      }
    });
  }
  makefx();
}

const resetGame = () => {
  showConfirm("모든 데이터를 초기화하시겠습니까?", () => {
    localStorage.removeItem('math_idle_save');
    location.reload();
  }, "초기화 확인");
}

onMounted(() => {
  loadGame();
  makefx();
  setInterval(manualTick, 100);
  setInterval(saveGame, 30000);
})
</script>

<style scoped>
@import url('https://webfontworld.github.io/gmarket/GmarketSans.css');
/* 전역 스크롤 방지 및 높이 고정 (Capacitor 대응) */
:deep(html), :deep(body) {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  position: fixed;
  width: 100%;
}

#app, .app-wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background-color: #050505;
  /* 화면 전체 고정 */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.container {
  width: 100%;
  max-width: 450px;
  background-color: #0f0f11;
  display: flex;
  flex-direction: column;
  /* 시스템 바 가려짐 방지: 최소 상단 44px, 하단 34px 여백 강제 확보 */
  padding-top: max(44px, env(safe-area-inset-top, 44px));
  padding-bottom: max(34px, env(safe-area-inset-bottom, 34px));
  padding-left: 16px;
  padding-right: 16px;
  gap: 20px;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
@media (min-width: 451px) { .container { border-left: 1px solid #2a2a2e; border-right: 1px solid #2a2a2e; } }
.header-card { background: linear-gradient(145deg, #1a1a1e, #141417); padding: 24px; border-radius: 20px; border: 1px solid #2a2a2e; text-align: center; }
.resource-display { font-size: 2.8rem; color: #fff; margin: 10px 0; }
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
.settings-group { display: flex; flex-direction: column; gap: 10px; }
.sub-btn { padding: 15px; border-radius: 10px; border: 1px solid #333; background: #1a1a1e; color: white; cursor: pointer; font-family: inherit; }
.sub-btn.danger { border-color: #bf616a; color: #bf616a; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.buy-max-btn { background: #2e3440; border: 1px solid #4c566a; color: #eceff4; padding: 4px 12px; border-radius: 8px; font-size: 0.7rem; cursor: pointer; }
.stats-container { background: #16161a; border: 1px solid #2a2a2e; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 15px; }
.stats-item { display: flex; justify-content: space-between; border-bottom: 1px solid #2a2a2e; padding-bottom: 8px; }
.stats-value { color: #fff; font-weight: bold; }
.exp-header-card { background: linear-gradient(145deg, #2e1a1e, #1a0f11); padding: 24px; border-radius: 20px; border: 1px solid #4e2a2e; text-align: center; margin-bottom: 20px; }
.exp-resource-display { font-size: 2.2rem; color: #ff79c6; margin: 10px 0; font-weight: bold; text-shadow: 0 0 10px rgba(255, 121, 198, 0.3); }
.exp-desc { font-size: 0.8rem; color: #a89984; }
.full-row { grid-column: 1 / -1; }
</style>