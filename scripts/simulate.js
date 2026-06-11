#!/usr/bin/env node

const DEFAULT_EVENT_LIMIT = 200;

const parseBooleanFlag = (value, fallback = true) => {
  if (value === undefined) return fallback;
  if (['0', 'false', 'no', 'off'].includes(String(value).toLowerCase())) return false;
  if (['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase())) return true;
  return fallback;
};

const parseDuration = (argv) => {
  const options = {
    minutes: 10,
    hours: null,
    seconds: null,
    strategy: 'balanced',
    tickMs: 100,
    purchaseEveryTicks: 10,
    purchaseEveryProvided: false,
    progress: true,
    progressEveryMs: 250,
    eventLimit: DEFAULT_EVENT_LIMIT,
    maxRealSeconds: 0,
    longRun: false
  };

  argv.forEach((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    if (key === 'minutes') options.minutes = Number(value);
    if (key === 'hours') options.hours = Number(value);
    if (key === 'seconds') options.seconds = Number(value);
    if (key === 'strategy') options.strategy = value || options.strategy;
    if (key === 'tick-ms') options.tickMs = Math.max(50, Number(value || options.tickMs));
    if (key === 'purchase-every') {
      options.purchaseEveryTicks = Math.max(1, Number(value || options.purchaseEveryTicks));
      options.purchaseEveryProvided = true;
    }
    if (key === 'progress') options.progress = parseBooleanFlag(value, true);
    if (key === 'no-progress') options.progress = false;
    if (key === 'progress-every-ms') options.progressEveryMs = Math.max(100, Number(value || options.progressEveryMs));
    if (key === 'event-limit') options.eventLimit = Math.max(0, Number(value || DEFAULT_EVENT_LIMIT));
    if (key === 'max-real-seconds') options.maxRealSeconds = Math.max(0, Number(value || 0));
    if (key === 'long-run') options.longRun = parseBooleanFlag(value, true);
  });

  let totalSeconds = Number(options.minutes || 0) * 60;
  if (options.hours !== null) totalSeconds = Number(options.hours || 0) * 3600;
  if (options.seconds !== null) totalSeconds = Number(options.seconds || 0);

  const totalMs = Math.max(options.tickMs, Math.floor(totalSeconds * 1000));
  const inferredLongRun = options.longRun || totalMs >= 6 * 60 * 60 * 1000;

  if (inferredLongRun && !options.purchaseEveryProvided) {
    // Long simulations do not need frame-perfect active play. Buying every simulated minute
    // keeps the signal useful while avoiding tens of thousands of expensive buy-max calls.
    options.purchaseEveryTicks = Math.max(options.purchaseEveryTicks, Math.ceil(60_000 / options.tickMs));
  }

  return {
    ...options,
    longRun: inferredLongRun,
    totalMs
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

const formatRealDuration = (ms) => {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const createProgressRenderer = (options, totalTicks, getSummary) => {
  const canRewriteLine = options.progress && process.stderr.isTTY;
  let lastRenderAt = 0;
  let lastPercentLogged = -1;
  const startedAt = performance.now();

  const makeLine = (tick) => {
    const done = Math.min(1, tick / totalTicks);
    const percent = done * 100;
    const elapsedMs = performance.now() - startedAt;
    const etaMs = done > 0 ? elapsedMs * (1 - done) / done : 0;
    const width = 24;
    const filled = Math.round(width * done);
    const bar = `${'#'.repeat(filled)}${'-'.repeat(width - filled)}`;
    const summary = getSummary();

    return `[${bar}] ${percent.toFixed(1).padStart(5)}% | sim ${formatDuration(summary.simSeconds)} / ${formatDuration(options.totalMs / 1000)} | real ${formatRealDuration(elapsedMs)} | ETA ${formatRealDuration(etaMs)} | FV ${summary.fv} | DX ${summary.dx} | Exp ${summary.expPoints} | Int ${summary.integrals}`;
  };

  const render = (tick, force = false) => {
    if (!options.progress) return;

    const now = performance.now();
    if (!force && now - lastRenderAt < options.progressEveryMs) return;
    lastRenderAt = now;

    if (canRewriteLine) {
      const columns = process.stderr.columns || 120;
      const line = makeLine(tick);
      process.stderr.write(`\r${line.slice(0, Math.max(20, columns - 1)).padEnd(Math.max(20, columns - 1), ' ')}`);
      return;
    }

    const percentStep = Math.floor((tick / totalTicks) * 10);
    if (force || percentStep > lastPercentLogged) {
      lastPercentLogged = percentStep;
      console.error(makeLine(tick));
    }
  };

  const done = () => {
    if (canRewriteLine) process.stderr.write('\n');
  };

  return { render, done, startedAt };
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
  let omittedEvents = 0;
  let purchaseRuns = 0;
  let aborted = false;
  const seen = {
    firstDifferentiation: false,
    expUnlocked: false,
    firstExp: false,
    integralUnlocked: false,
    firstIntegral: false,
    firstResearch: false
  };

  const pushEvent = (event) => {
    if (events.length < options.eventLimit) {
      events.push(event);
    } else {
      omittedEvents += 1;
    }
  };

  setAlertCallbacks(
    (message, title = 'Alert') => {
      pushEvent({ t: simulatedNow, type: 'alert', title, message: String(message).split('\n')[0] });
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
          pushEvent({ t: simulatedNow, type: 'milestone', title: 'First AP research', message: node.name });
        }
      }
    }
    return changed;
  };

  const runPurchaseStrategy = () => {
    purchaseRuns += 1;
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
      pushEvent({ t: simulatedNow, type: 'milestone', title: 'First differentiation', message: `${format(game.dx_points)} DX` });
    }

    if (!seen.expUnlocked && game.unlocked_exp) {
      seen.expUnlocked = true;
      pushEvent({ t: simulatedNow, type: 'milestone', title: 'Exponential unlocked', message: `FV ${format(game.fv)} / DX ${format(game.dx_points)}` });
    }

    if (!seen.firstExp && Number(game.exp_milestone_points || 0) > 0) {
      seen.firstExp = true;
      pushEvent({ t: simulatedNow, type: 'milestone', title: 'First exponential rebirth', message: `Exp points ${game.exp_milestone_points}` });
    }

    if (!seen.integralUnlocked && game.unlocked_integral) {
      seen.integralUnlocked = true;
      pushEvent({ t: simulatedNow, type: 'milestone', title: 'Integral unlocked', message: `Exp multiplier ${format(game.exp_multiplier)}` });
    }

    if (!seen.firstIntegral && Number(game.integral_count || 0) > 0) {
      seen.firstIntegral = true;
      pushEvent({ t: simulatedNow, type: 'milestone', title: 'First integration', message: `C ${format(game.integral_c)}` });
    }
  };

  const progress = createProgressRenderer(options, totalTicks, () => ({
    simSeconds: simulatedNow / 1000,
    fv: format(game.fv),
    dx: format(game.dx_points),
    expPoints: game.exp_milestone_points,
    integrals: game.integral_count
  }));

  progress.render(0, true);

  for (let tick = 0; tick < totalTicks; tick += 1) {
    simulatedNow += options.tickMs;

    if (tick % options.purchaseEveryTicks === 0) {
      runPurchaseStrategy();
    }

    manualTick();
    captureMilestones();

    progress.render(tick + 1);

    if (options.maxRealSeconds > 0) {
      const elapsedSeconds = (performance.now() - progress.startedAt) / 1000;
      if (elapsedSeconds >= options.maxRealSeconds) {
        aborted = true;
        pushEvent({
          t: simulatedNow,
          type: 'abort',
          title: 'Simulation stopped by max-real-seconds',
          message: `${options.maxRealSeconds}s real-time limit reached`
        });
        break;
      }
    }
  }

  progress.render(Math.min(totalTicks, Math.ceil(simulatedNow / options.tickMs)), true);
  progress.done();

  Date.now = originalDateNow;

  const totalSeconds = options.totalMs / 1000;
  const completedSeconds = simulatedNow / 1000;
  console.log('Limit Idle Simulation Report');
  console.log('============================');
  console.log(`Duration: ${formatDuration(completedSeconds)} / ${formatDuration(totalSeconds)}${aborted ? ' (aborted)' : ''}`);
  console.log(`Strategy: ${options.strategy}`);
  console.log(`Tick size: ${options.tickMs}ms`);
  console.log(`Purchase interval: every ${options.purchaseEveryTicks} ticks (${formatDuration(options.purchaseEveryTicks * options.tickMs / 1000)})`);
  console.log(`Purchase strategy runs: ${purchaseRuns}`);
  console.log(`Event limit: ${options.eventLimit}`);
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
    events.forEach((event) => {
      console.log(`- [${formatDuration(event.t / 1000)}] ${event.title}: ${event.message}`);
    });
    if (omittedEvents > 0) {
      console.log(`- ... ${omittedEvents} more events omitted by --event-limit`);
    }
  }
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
