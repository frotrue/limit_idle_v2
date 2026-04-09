import { reactive } from 'vue';
import Decimal from 'break_eternity.js';

export const SUPERSCRIPT_MAP = {
  0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴',
  5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸' ,9: '⁹',
};

export const format = (num) => {
  const d = new Decimal(num);
  if (d.lt(1000)) return d.toNumber() % 1 === 0 ? d.toNumber() : d.toNumber().toFixed(2);
  return d.toExponential(2).replace(/\+/g, '');
};

export const game = reactive({
  fv: new Decimal(10),
  fx: [new Decimal(1), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)],
  fx_str: "1",
  current_x: new Decimal(0),
  max_x: new Decimal(1),
  x_increase: new Decimal(0.05),
  x_upgrades: {
    0: { id: 0, name: 'Upgrade x⁰', price: new Decimal(10), effect: 0.01, type: 'add', level: 0 },
    1: { id: 1, name: 'Upgrade x¹', price: new Decimal(100), effect: 0.05, type: 'add', level: 0 },
    2: { id: 2, name: 'Upgrade x²', price: new Decimal(1000), effect: 0.05, type: 'add', level: 0 },
    3: { id: 3, name: 'Upgrade x³', price: new Decimal(10000), effect: 0.2, type: 'add', level: 0 },
    4: { id: 4, name: 'Upgrade x⁴', price: new Decimal(100000), effect: 0.2, type: 'add', level: 0 },
    5: { id: 5, name: 'Upgrade x⁵', price: new Decimal(1000000), effect: 0.2, type: 'add', level: 0 },
    6: { id: 6, name: 'Upgrade x⁶', price: new Decimal(100000000), effect: 0.2, type: 'add', level: 0 },
    7: { id: 7, name: 'Upgrade x⁷', price: new Decimal(10000000000), effect: 0.2, type: 'add', level: 0 },
    8: { id: 8, name: 'Upgrade x⁸', price: new Decimal(1000000000000), effect: 0.2, type: 'add', level: 0 },
    9: { id: 9, name: 'Upgrade x⁹', price: new Decimal(100000000000000), effect: 0.2, type: 'add', level: 0 }
  },
  other_upgrades: {
    0: { id: 0, name: 'Upgrade max x', price: new Decimal(1000), type: 'fx', level: 0 },
    1: { id: 1, name: 'Upgrade x increase', price: new Decimal(100), type: 'fx', level: 0 },
    2: { id: 0, name: 'Increase x in f\'(x)', price: new Decimal(10), type:'ddx', level: 0 },
    3: { id: 1, name: 'Decrease Auto Variable Interval', price: new Decimal(50), type:'ddx', level: 0 }
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
    0: { id: 0, name: 'Evolution of e', price: new Decimal("10000"), base_price: new Decimal("10000"), type: 'exp', level: 0 },
    1: { id: 1, name: 'Amplification', price: new Decimal("100000"), base_price: new Decimal("100000"), type: 'exp', level: 0 }
  },
  unlocked_integral: false,
  integral_c: new Decimal(0),
  integral_count: 0,
  integral_upgrades: {
    0: { id: 0, name: 'Higher Dimension (x¹⁰+)', price: new Decimal("10"), base_price: new Decimal("10"), type: 'integral', level: 0 },
    1: { id: 1, name: 'Time Accumulation', price: new Decimal("50"), base_price: new Decimal("50"), type: 'integral', level: 0 }
  },
  stats: {
    total_fv: new Decimal(0),
    total_dx: new Decimal(0),
    play_time: 0,
    session_start: Date.now(),
    fv_per_sec: new Decimal(0)
  },
  is_2x_boost_owned: false,
  lastTick: Date.now()
});

export const makefx = () => {
  let parts = [];
  for (let i = game.fx.length - 1; i >= 0; i--) {
    if (game.fx[i].neq(0)) {
      let valStr = format(game.fx[i]);
      if (i === 0) parts.push(`${valStr}`);
      else if (i === 1) parts.push(`${valStr}x`);
      else parts.push(`${valStr}x${SUPERSCRIPT_MAP[i]}`);
    }
  }
  let base_str = parts.join(" + ") || "0";
  if (game.dx_multiplier.gt(0)) {
    // 1 + dx_multiplier/100 형태의 배율을 시각적으로 f(x)에 곱해줌
    const dx_bonus_percent = game.dx_multiplier.div(100).plus(1);
    game.fx_str = `( ${base_str} ) × ${format(dx_bonus_percent)}`;
  } else {
    game.fx_str = base_str;
  }
};

export const equation_calc = (equation, x) => {
  let total = new Decimal(0);
  for (let i = 0; i < equation.length; i++) {
    if (equation[i].eq(0)) continue;
    let term = equation[i].times(Decimal.pow(x, i));
    total = total.plus(term);
  }
  return total;
};

export const differentiate = (equation, x) => {
  let temp_arr = [];
  for (let i = 1; i < equation.length; i++) {
    temp_arr[i - 1] = equation[i].times(i);
  }
  while (temp_arr.length < equation.length) {
    temp_arr.push(new Decimal(0));
  }
  if (x !== undefined) return equation_calc(temp_arr, x);
  return temp_arr;
};

export const integrate_calc = (equation, x) => {
  let total = new Decimal(0);
  for (let i = 0; i < equation.length; i++) {
    if (equation[i].eq(0)) continue;
    // $\int c * x^i dx = \frac{c}{i+1} x^{i+1}$
    let term = equation[i].div(i + 1).times(Decimal.pow(x, i + 1));
    total = total.plus(term);
  }
  return total;
};

let showAlertFn = (msg, title) => console.log(title, msg);
let showConfirmFn = (msg, onConfirm, title) => { if(confirm(msg)) onConfirm(); };

export const setAlertCallbacks = (alertCb, confirmCb) => {
  showAlertFn = alertCb;
  showConfirmFn = confirmCb;
};

export const differentiate_bt = () => {
  if (game.fv.gte("1e10")) {
    showConfirmFn("미분 시 현재 모든 함수가 초기화되고 보상을 얻습니다.\n미분 시 f'("+game.prestige_x+") = "+format(differentiate(game.fx,game.prestige_x))+" 만큼의 DX를 얻습니다", () => {
      let gain = differentiate(game.fx, game.prestige_x);
      game.dx_points = game.dx_points.plus(gain);
      game.dx_multiplier = game.dx_multiplier.plus(gain);
      game.differentiationCount = game.differentiationCount.plus(1);

      game.fv = new Decimal(10);
      game.fx = [new Decimal(1), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)];
      game.current_x = new Decimal(0);
      game.max_x = new Decimal(1);
      game.x_increase = new Decimal(0.05);

      Object.values(game.x_upgrades).forEach(upg => {
        upg.level = 0;
        upg.price = Decimal.pow(10, upg.id + 1);
      });
      
      game.other_upgrades[0].level = 0;
      game.other_upgrades[0].price = new Decimal(1000);
      game.other_upgrades[1].level = 0;
      game.other_upgrades[1].price = new Decimal(100);

      makefx();
      showAlertFn(`${format(gain)} DX 포인트를 획득했습니다!`, '알림');
    }, "미분 확인");
  } else {
    showAlertFn("미분하려면 최소 1.00e10 FV가 필요합니다.", '알림');
  }
};

export const buyUpgrade = (upg) => {
  if (game.fv.gte(upg.price)) {
    game.fv = game.fv.minus(upg.price);
    upg.level++;
    if (upg.type === 'add') {
      game.fx[upg.id] = game.fx[upg.id].plus(1);
      
      // 함수 업그레이드 밸런스 패치
      // 초기 진행을 시원하게 하기 위해 초반(100레벨 이하)은 5레벨마다 1.5배, 10레벨마다 2배로 파격적 보너스
      if (upg.level % 10 === 0) {
        game.fx[upg.id] = game.fx[upg.id].times(2).floor();
      } else if (upg.level % 5 === 0) {
        game.fx[upg.id] = game.fx[upg.id].times(1.5).floor();
      }
      
      // 가격 스케일링: 초반에는 덜 오르게, 후반으로 갈수록 1.5배로 수렴되도록
      // 10레벨 이하: 1.1배 / 50레벨 이하: 1.25배 / 그 이후: 1.5배
      let multiplier = 1.5;
      if (upg.level <= 10) {
        multiplier = 1.1;
      } else if (upg.level <= 50) {
        multiplier = 1.25;
      }
      
      upg.price = upg.price.times(multiplier).ceil();
      
      makefx();
    }
  }
};

export const buyOtherUpgrade = (upg) => {
  let price = new Decimal(upg.price);
  if (upg.type ==='fx' && game.fv.gte(price)){
    game.fv = game.fv.minus(price);
    upg.level++;
    if (upg.id === 0) {
      game.max_x = game.max_x.plus(1);
      game.x_increase = game.x_increase.times(1.1);
      upg.price = price.times(1.6).floor();
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
      game.prestige_x = game.prestige_x.plus(2);
      upg.price = price.times(1.5).floor();
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
};

export const buyExpUpgrade = (upg) => {
  if (game.dx_points.gte(upg.price)) {
    showConfirmFn(`[경고: 초월 진화]\n강력한 지수 효과를 얻는 대신, 미분 재화(DX)를 포함한 게임의 모든 진행도가 초기화됩니다.\n\n정말 진행하시겠습니까?`, () => {
      upg.level++;
      // 지수함수 밸런스 패치: 2차 환생(초월)이므로 효과를 다시 강화 (0.02, 0.05 배율)
      if (upg.id === 0) game.exp_x = game.exp_x.plus(0.02);
      else if (upg.id === 1) game.exp_x = game.exp_x.plus(0.05);
      
      upg.price = upg.base_price.times(Decimal.pow(10, upg.level)).floor();
      game.exp_multiplier = Decimal.exp(game.exp_x);

      performTier2Reset();
      showAlertFn(`초월 진화가 완료되었습니다!\n이제 f(x)가 ${format(game.exp_multiplier)} 승수만큼 증폭됩니다.`, '초월 진화');
    }, "초월 진화 확인");
  }
};

export const performTier2Reset = () => {
  game.fv = new Decimal(10);
  game.fx = [new Decimal(1), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)];
  game.current_x = new Decimal(0);
  game.max_x = new Decimal(1);
  game.x_increase = new Decimal(0.05);

  Object.values(game.x_upgrades).forEach(upg => {
    upg.level = 0;
    upg.price = Decimal.pow(10, upg.id + 1);
  });
  
  game.other_upgrades[0].level = 0;
  game.other_upgrades[0].price = new Decimal(1000);
  game.other_upgrades[1].level = 0;
  game.other_upgrades[1].price = new Decimal(100);
  game.other_upgrades[2].level = 0;
  game.other_upgrades[2].price = new Decimal(10);
  game.other_upgrades[3].level = 0;
  game.other_upgrades[3].price = new Decimal(50);

  game.dx_points = new Decimal(0);
  game.dx_multiplier = new Decimal(0);
  game.differentiationCount = new Decimal(0);
  game.prestige_x = new Decimal(1);

  game.auto_upgrades[0].interval = 10000;
  game.auto_upgrades[1].interval = 2000;
  game.auto_upgrades[2].interval = 5000;

  makefx();
  saveGame()
};

export const performTier3Reset = () => {
  performTier2Reset(); // 1, 2차 초기화 내용 포함
  
  // 지수(Exp) 관련 추가 초기화
  game.exp_x = new Decimal(0);
  game.exp_multiplier = new Decimal(1);
  
  Object.values(game.exp_upgrades).forEach(upg => {
    upg.level = 0;
    upg.price = new Decimal(upg.base_price);
  });
  
  saveGame();
};

export const integrate_bt = () => {
  // 해금 조건: 지수 배율이 일정 수준 이상 도달했을 때 (밸런스 조절: 1e5 -> 2)
  if (game.exp_multiplier.gte(2)) {
    let raw_integral = integrate_calc(game.fx, game.max_x);
    // 밸런스를 위해 로그값을 취하거나 일정 비율로 C (IX) 획득
    let gain = raw_integral.pow(0.1).floor(); 
    if (gain.lt(1)) gain = new Decimal(1);

    showConfirmFn(`[경고: 적분 (3차 환생)]\n현재까지의 모든 f(x), 미분(DX), 지수(Exp)를 잃는 대신,\n정적분 영역에 비례한 영구 '적분 상수(C)' ${format(gain)} 를 얻습니다.\n\n정말 진행하시겠습니까?`, () => {
      game.integral_c = game.integral_c.plus(gain);
      game.integral_count += 1;
      
      performTier3Reset();
      showAlertFn(`적분 환생이 완료되었습니다!\n이제 최종 생산량에 × ${format(getIntegralMultiplier())} 적분 배율이 적용됩니다.`, '적분 환생');
    }, "적분 환생 확인");
  } else {
    showAlertFn("적분 환생을 하려면 최소 2.00 의 Exp 증폭이 필요합니다.", '알림');
  }
};

// DX는 기본 생산량을 보정하고, 적분은 최종 생산량을 증폭해 역할을 분리한다.
export const getIntegralDivisor = () => Math.max(1, 10 - game.integral_count);
const getIntegralMultiplier = () => game.integral_c.div(getIntegralDivisor()).plus(1);

export const buyMaxUpgrade = (upg) => {
  while (game.fv.gte(upg.price)) { buyUpgrade(upg); }
};

export const buyMaxOtherUpgrade = (upg) => {
  while (true) {
    if (upg.level === "MAX") break;
    let price = new Decimal(upg.price);
    if (upg.type === 'fx' && game.fv.gte(price)) buyOtherUpgrade(upg);
    else if (upg.type === 'ddx' && game.dx_points.gte(price)) buyOtherUpgrade(upg);
    else break;
  }
};

export const buyMaxAllOtherUpgrades = (type) => {
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
};

export const performAutoUpgrade = (auto) => {
  if (auto.targetType === 'x_upgrades') {
    Object.values(game.x_upgrades).reverse().forEach(upg => buyUpgrade(upg));
  } else if (auto.targetType === 'other_upgrades_fx') {
    Object.values(game.other_upgrades).forEach(upg => { if (upg.type === 'fx') buyOtherUpgrade(upg); });
  } else if (auto.targetType === 'other_upgrades_ddx') {
    Object.values(game.other_upgrades).forEach(upg => { if (upg.type === 'ddx') buyOtherUpgrade(upg); });
  }
};

export const autoTick = () => {
  const now = Date.now();
  game.auto_upgrades.forEach(auto => {
    if (auto.active && game.differentiationCount.gte(auto.unlockedAt)) {
      if (now - auto.lastTick >= auto.interval) {
        auto.lastTick = now;
        performAutoUpgrade(auto);
      }
    }
  });
};

export const manualTick = () => {
  if (!game.unlocked_exp && (game.dx_points.gte(10000) || game.fv.gte("1e24"))) {
    game.unlocked_exp = true;
    showAlertFn("지수 함수가 해금되었습니다! Exponential 탭을 확인하세요.", '알림');
  }
  
  // 밸런스 조절: 1e5 -> 2
  if (!game.unlocked_integral && game.exp_multiplier.gte(2)) {
    game.unlocked_integral = true;
    showAlertFn("적분 함수가 해금되었습니다! Integral 탭을 확인하세요.", '알림');
  }

  // 기본 생산량은 f(x) 계산값만 사용
  let baseGain = equation_calc(game.fx, game.max_x);
  if (baseGain.lt(1)) baseGain = new Decimal(1); 
  
  if (game.dx_multiplier.gt(0)) {
    const dx_bonus = game.dx_multiplier.div(100).plus(1);
    baseGain = baseGain.times(dx_bonus);
  }
  
  if (game.is_2x_boost_owned) baseGain = baseGain.times(2);
  
  // 지수 효과 적용 (승수)
  let gainPerCycle = baseGain.pow(game.exp_multiplier || 1);
  gainPerCycle = gainPerCycle.times(getIntegralMultiplier());
  const cyclesPerTick = game.x_increase.div(game.max_x);
  game.stats.fv_per_sec = gainPerCycle.times(cyclesPerTick).times(10);

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
};

export const saveGame = () => {
  game.lastTick = Date.now();
  localStorage.setItem('math_idle_save', JSON.stringify(game));
};

export const loadGame = () => {
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
  
  game.unlocked_integral = data.unlocked_integral || false;
  game.integral_c = new Decimal(data.integral_c || 0);
  game.integral_count = Math.max(0, Number(data.integral_count || 0));

  game.is_2x_boost_owned = data.is_2x_boost_owned || false;
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
      if (data.exp_upgrades[key] && game.exp_upgrades[key]) {
        game.exp_upgrades[key].level = data.exp_upgrades[key].level || 0;
        // 기존 FV(1e24) 세이브와 호환이 안되므로, DX 기반의 기본 가격(base_price)에 맞춰 가격을 강제 재설정
        game.exp_upgrades[key].price = game.exp_upgrades[key].base_price.times(Decimal.pow(10, game.exp_upgrades[key].level)).floor();
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

  // 오프라인 보상(Offline Progress) 계산 로직
  if (data.lastTick) {
    const now = Date.now();
    const offlineMs = now - data.lastTick;
    
    // 1분(60초) 이상 오프라인 시 보상 지급
    if (offlineMs > 30000) {
      let baseGain = equation_calc(game.fx, game.max_x);
      if (baseGain.lt(1)) baseGain = new Decimal(1); 
      
      if (game.dx_multiplier.gt(0)) {
        const dx_bonus = game.dx_multiplier.div(100).plus(1);
        baseGain = baseGain.times(dx_bonus);
      }
      
      if (game.is_2x_boost_owned) baseGain = baseGain.times(2);
      
      let gainPerCycle = baseGain.pow(game.exp_multiplier || 1);
      gainPerCycle = gainPerCycle.times(getIntegralMultiplier());
      const cyclesPerTick = game.x_increase.div(game.max_x);
      const fv_per_sec = gainPerCycle.times(cyclesPerTick).times(10); // 초당 10틱
      
      const offlineSecs = offlineMs / 1000;
      const totalOfflineGain = fv_per_sec.times(offlineSecs);
      
      game.fv = game.fv.plus(totalOfflineGain);
      game.stats.total_fv = game.stats.total_fv.plus(totalOfflineGain);
      
      // UI 준비 완료 후 띄우기 위해 1초(1000ms) 뒤 Custom Alert 표시
      setTimeout(() => {
        showAlertFn(`방치 환영합니다!\n${offlineSecs.toFixed(0)}초 동안 오프라인 생산으로\n${format(totalOfflineGain)} FV를 획득했습니다.`, '오프라인 보상');
      }, 1000);
    }
  }
  game.lastTick = Date.now();
};

export const resetGame = () => {
  showConfirmFn("모든 데이터를 초기화하시겠습니까?", () => {
    localStorage.removeItem('math_idle_save');
    location.reload();
  }, "초기화 확인");
};

// 디버깅 및 테스트용 콘솔 명령어
if (typeof window !== 'undefined') {
  window.debug = {
    addFV: (amount = "1e10") => {
      game.fv = game.fv.plus(amount);
      console.log(`${amount} FV가 추가되었습니다.`);
    },
    addDX: (amount = "1e10") => {
      game.dx_points = game.dx_points.plus(amount);
      game.unlocked_exp = true; // DX를 추가하면 Exp 탭도 같이 확인하기 편하도록 해금
      console.log(`${amount} DX가 추가되었습니다.`);
    },
    forceTier2: (expAmount = "0.7") => {
      // 즉시 2차 환생(지수) 효과 부여 및 해금
      game.unlocked_exp = true;
      game.exp_x = game.exp_x.plus(expAmount);
      game.exp_multiplier = Decimal.exp(game.exp_x);
      performTier2Reset();
      console.log(`2차 환생(초월)이 강제로 실행되었습니다! 현재 exp_multiplier: ${format(game.exp_multiplier)}`);
    },
    forceTier3: (cAmount = "100") => {
      // 즉시 3차 환생(적분) 효과 부여 및 해금
      game.unlocked_exp = true;
      game.unlocked_integral = true;
      game.integral_c = game.integral_c.plus(cAmount);
      game.integral_count += 1;
      performTier3Reset();
      console.log(`3차 환생(적분)이 강제로 실행되었습니다! 현재 적분 상수 C: ${format(game.integral_c)}, 현재 분모: ${getIntegralDivisor()}`);
    },
    unlockAll: () => {
      game.unlocked_exp = true;
      game.unlocked_integral = true;
      console.log("모든 탭(Exp, Integral)이 해금되었습니다.");
    },
    help: () => {
      console.log(`
[디버그 명령어 목록]
debug.addFV("1e10")     - FV 재화 추가 (기본값 1e10)
debug.addDX("1e10")     - DX 재화 추가 (기본값 1e10)
debug.forceTier2("0.7") - 즉시 2차 환생 트리거 & Exp 배율 획득
debug.forceTier3("100") - 즉시 3차 환생 트리거 & 적분 상수(C) 획득
debug.unlockAll()       - 모든 탭 해금
      `);
    }
  };
  console.log("🛠️ 테스트용 디버그 명령어가 로드되었습니다. 콘솔에 debug.help() 를 입력해보세요.");
}
