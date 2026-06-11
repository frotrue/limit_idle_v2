#!/usr/bin/env node

const parseDuration = (argv) => {
  const options = {
    minutes: 10,
    hours: null,
    seconds: null,
    strategy: 'balanced',
    tickMs: 100,
    purchaseEveryTicks: 10
  };

  argv.forEach((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    if (key === 'minutes') options.minutes = Number(value);
    if (key === 'hours') options.hours = Number(value);
    if (key === 'seconds') options.seconds = Number(value);
    if (key === 'strategy') options.strategy = value || options.strategy;
    if (key === 'tick-ms') options.tickMs = Math.max(50, Number(value || options.tickMs));
    if (key === 'purchase-every') options.purchaseEveryTicks = Math.max(1, Number(value || options.purchaseEveryTicks));
  });

  let totalSeconds = Number(options.minutes || 0) * 60;
  if (options.hours !== null) totalSeconds = Number(options.hours || 0) * 3600;
  if (options.seconds !== null) totalSeconds = Number(options.seconds || 0);

  return {
    ...options,
    totalMs: Math.max(options.tickMs, Math.floor(totalSeconds * 1000))
  };
};

const createMemoryStorage = () => {
  const data = new Map();
  return {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear()
  };
};

const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const main = async () => {
  const options = parseDuration(process.argv.slice(2));
  const totalTicks = Math.ceil(options.totalMs / options.tickMs);

  let simulatedNow = 0;
  const originalDateNow = Date.now;
  Date.now = () => simulatedNow;

  globalThis.localStorage = createMemoryStorage();
  globalThis.location = { reload: () => {} };
  globalThis.confirm = () => true;

  const {
    game,
    manualTick,
    buyMaxUpgrade,
    buyMaxAllOtherUpgrades,
    differentiate_bt,
    buyExpUpgrade,
    integrate_bt,
    canIntegrate,
    purchaseResearch,
    AP_RESEARCH_NODES,
    format,
    setAlertCallbacks
  } = await import('../src/game/index.js');

  const events = [];
  const seen = {
    firstDifferentiation: false,
    expUnlocked: false,
    firstExp: false,
    integralUnlocked: false,
    firstIntegral: false,
    firstResearch: false
  };

  setAlertCallbacks(
    (message, title = 'Alert') => {
      events.push({ t: simulatedNow, type: 'alert', title, message: String(message).split('\n')[0] });
    },
    (_message, onConfirm) => {
      if (typeof onConfirm === 'function') onConfirm();
    }
  );

  const tryBuyResearch = () => {
    let changed = false;
    for (const node of AP_RESEARCH_NODES) {
      if (purchaseResearch(node.id)) {
        changed = true;
        if (!seen.firstResearch) {
          seen.firstResearch = true;
          events.push({ t: simulatedNow, type: 'milestone', title: 'First AP research', message: node.name });
        }
      }
    }
    return changed;
  };

  const runPurchaseStrategy = () => {
    Object.values(game.x_upgrades).reverse().forEach((upg) => buyMaxUpgrade(upg));
    buyMaxAllOtherUpgrades('fx');

    if (options.strategy === 'passive') return;

    buyMaxAllOtherUpgrades('ddx');
    tryBuyResearch();

    if (options.strategy === 'active' && game.fv.gte('1e10')) {
      differentiate_bt();
    } else if (game.fv.gte('1e12')) {
      differentiate_bt();
    }

    const expUpgrade = game.exp_upgrades?.[0];
    if (expUpgrade && game.unlocked_exp && game.dx_points.gte(expUpgrade.price)) {
      buyExpUpgrade(expUpgrade);
    }

    if (canIntegrate()) {
      integrate_bt();
    }
  };

  const captureMilestones = () => {
    if (!seen.firstDifferentiation && game.differentiationCount.gt(0)) {
      seen.firstDifferentiation = true;
      events.push({ t: simulatedNow, type: 'milestone', title: 'First differentiation', message: `${format(game.dx_points)} DX` });
    }

    if (!seen.expUnlocked && game.unlocked_exp) {
      seen.expUnlocked = true;
      events.push({ t: simulatedNow, type: 'milestone', title: 'Exponential unlocked', message: `FV ${format(game.fv)} / DX ${format(game.dx_points)}` });
    }

    if (!seen.firstExp && Number(game.exp_milestone_points || 0) > 0) {
      seen.firstExp = true;
      events.push({ t: simulatedNow, type: 'milestone', title: 'First exponential rebirth', message: `Exp points ${game.exp_milestone_points}` });
    }

    if (!seen.integralUnlocked && game.unlocked_integral) {
      seen.integralUnlocked = true;
      events.push({ t: simulatedNow, type: 'milestone', title: 'Integral unlocked', message: `Exp multiplier ${format(game.exp_multiplier)}` });
    }

    if (!seen.firstIntegral && Number(game.integral_count || 0) > 0) {
      seen.firstIntegral = true;
      events.push({ t: simulatedNow, type: 'milestone', title: 'First integration', message: `C ${format(game.integral_c)}` });
    }
  };

  for (let tick = 0; tick < totalTicks; tick += 1) {
    simulatedNow += options.tickMs;

    if (tick % options.purchaseEveryTicks === 0) {
      runPurchaseStrategy();
    }

    manualTick();
    captureMilestones();
  }

  Date.now = originalDateNow;

  const totalSeconds = options.totalMs / 1000;
  console.log('Limit Idle Simulation Report');
  console.log('============================');
  console.log(`Duration: ${formatDuration(totalSeconds)}`);
  console.log(`Strategy: ${options.strategy}`);
  console.log(`Tick size: ${options.tickMs}ms`);
  console.log('');
  console.log('Final state');
  console.log(`- FV: ${format(game.fv)}`);
  console.log(`- FV/sec: ${format(game.stats.fv_per_sec)}`);
  console.log(`- DX: ${format(game.dx_points)}`);
  console.log(`- AP: ${format(game.ap_points)}`);
  console.log(`- Differentiations: ${format(game.differentiationCount)}`);
  console.log(`- Exp points: ${game.exp_milestone_points}`);
  console.log(`- Exp multiplier: ${format(game.exp_multiplier)}`);
  console.log(`- Integral count: ${game.integral_count}`);
  console.log(`- Integral C: ${format(game.integral_c)}`);
  console.log(`- AP research unlocked: ${game.ap_research.length}`);
  console.log(`- Achievements unlocked: ${game.achievements.length}`);
  console.log('');
  console.log('Milestones and alerts');

  if (events.length === 0) {
    console.log('- none');
  } else {
    events.slice(0, 30).forEach((event) => {
      console.log(`- [${formatDuration(event.t / 1000)}] ${event.title}: ${event.message}`);
    });
    if (events.length > 30) {
      console.log(`- ... ${events.length - 30} more events omitted`);
    }
  }
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
