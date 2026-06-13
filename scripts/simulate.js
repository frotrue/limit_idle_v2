#!/usr/bin/env node
import { pathToFileURL } from 'node:url';

const DEFAULT_EVENT_LIMIT = 200;
const MILESTONE_KEYS = new Set([
  'firstDifferentiation',
  'expUnlocked',
  'firstExp',
  'firstResearch',
  'integralUnlocked',
  'firstIntegral'
]);

export const parseBooleanFlag = (value, fallback = true) => {
  if (value === undefined) return fallback;
  if (['0', 'false', 'no', 'off'].includes(String(value).toLowerCase())) return false;
  if (['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase())) return true;
  return fallback;
};

export const parseSimTime = (value) => {
  const input = String(value || '').trim();
  const match = input.match(/^(\d+(?:\.\d+)?)(ms|s|m|h)?$/i);
  if (!match) throw new Error(`Invalid time value: ${value}`);

  const amount = Number(match[1]);
  const unit = (match[2] || 's').toLowerCase();
  if (unit === 'ms') return amount / 1000;
  if (unit === 's') return amount;
  if (unit === 'm') return amount * 60;
  if (unit === 'h') return amount * 3600;
  return amount;
};

const parseExpectation = (raw) => {
  const [key, minRaw, maxRaw] = String(raw || '').split(':');
  if (!MILESTONE_KEYS.has(key)) {
    throw new Error(`Unknown milestone expectation: ${key}`);
  }
  return {
    key,
    minSeconds: parseSimTime(minRaw),
    maxSeconds: parseSimTime(maxRaw)
  };
};

export const parseDuration = (argv) => {
  const options = {
    minutes: 10,
    hours: null,
    seconds: null,
    strategy: 'balanced',
    tickMs: 100,
    purchaseEveryTicks: 10,
    purchaseEveryProvided: false,
    progress: true,
    progressProvided: false,
    progressEveryMs: 250,
    eventLimit: DEFAULT_EVENT_LIMIT,
    maxRealSeconds: 0,
    longRun: false,
    powCache: true,
    powCacheSize: 4096,
    json: false,
    expectations: []
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
    if (key === 'progress') {
      options.progress = parseBooleanFlag(value, true);
      options.progressProvided = true;
    }
    if (key === 'no-progress') {
      options.progress = false;
      options.progressProvided = true;
    }
    if (key === 'progress-every-ms') options.progressEveryMs = Math.max(100, Number(value || options.progressEveryMs));
    if (key === 'event-limit') options.eventLimit = Math.max(0, Number(value || DEFAULT_EVENT_LIMIT));
    if (key === 'max-real-seconds') options.maxRealSeconds = Math.max(0, Number(value || 0));
    if (key === 'long-run') options.longRun = parseBooleanFlag(value, true);
    if (key === 'pow-cache') options.powCache = parseBooleanFlag(value, true);
    if (key === 'no-pow-cache') options.powCache = false;
    if (key === 'pow-cache-size') options.powCacheSize = Math.max(128, Number(value || options.powCacheSize));
    if (key === 'json') {
      options.json = parseBooleanFlag(value, true);
      if (!options.progressProvided) options.progress = false;
    }
    if (key === 'expect') options.expectations.push(parseExpectation(value));
  });

  let totalSeconds = Number(options.minutes || 0) * 60;
  if (options.hours !== null) totalSeconds = Number(options.hours || 0) * 3600;
  if (options.seconds !== null) totalSeconds = Number(options.seconds || 0);

  const totalMs = Math.max(options.tickMs, Math.floor(totalSeconds * 1000));
  const inferredLongRun = options.longRun || totalMs >= 6 * 60 * 60 * 1000;

  if (inferredLongRun && !options.purchaseEveryProvided) {
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

export const evaluateExpectations = (expectations, milestones) => expectations.map((expectation) => {
  const actualSeconds = milestones[expectation.key] ?? null;
  const passed = actualSeconds !== null &&
    actualSeconds >= expectation.minSeconds &&
    actualSeconds <= expectation.maxSeconds;

  return {
    key: expectation.key,
    minSeconds: expectation.minSeconds,
    maxSeconds: expectation.maxSeconds,
    actualSeconds,
    passed
  };
});

export const runSimulation = async (argv = []) => {
  const options = parseDuration(argv);
  const totalTicks = Math.ceil(options.totalMs / options.tickMs);

  let simulatedNow = 0;
  const originalDateNow = Date.now;
  Date.now = () => simulatedNow;

  try {
    globalThis.localStorage = createMemoryStorage();
    globalThis.location = { reload: () => {} };
    globalThis.confirm = () => true;

    const { installDecimalPowCache, getDecimalPowCacheStats } = await import('../src/game/performance/decimalPowCache.js');
    installDecimalPowCache({ enabled: options.powCache, maxEntries: options.powCacheSize });

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
    const milestones = {};
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

    const pushMilestone = (key, title, message) => {
      milestones[key] = simulatedNow / 1000;
      pushEvent({ t: simulatedNow, key, type: 'milestone', title, message });
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
            pushMilestone('firstResearch', 'First AP research', node.name);
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
        pushMilestone('firstDifferentiation', 'First differentiation', `${format(game.dx_points)} DX`);
      }

      if (!seen.expUnlocked && game.unlocked_exp) {
        seen.expUnlocked = true;
        pushMilestone('expUnlocked', 'Exponential unlocked', `FV ${format(game.fv)} / DX ${format(game.dx_points)}`);
      }

      if (!seen.firstExp && Number(game.exp_milestone_points || 0) > 0) {
        seen.firstExp = true;
        pushMilestone('firstExp', 'First exponential rebirth', `Exp points ${game.exp_milestone_points}`);
      }

      if (!seen.integralUnlocked && game.unlocked_integral) {
        seen.integralUnlocked = true;
        pushMilestone('integralUnlocked', 'Integral unlocked', `Exp multiplier ${format(game.exp_multiplier)}`);
      }

      if (!seen.firstIntegral && Number(game.integral_count || 0) > 0) {
        seen.firstIntegral = true;
        pushMilestone('firstIntegral', 'First integration', `C ${format(game.integral_c)}`);
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

    const totalSeconds = options.totalMs / 1000;
    const completedSeconds = simulatedNow / 1000;
    const powCacheStats = getDecimalPowCacheStats();
    const totalPowCalls = (powCacheStats?.hits || 0) + (powCacheStats?.misses || 0);
    const expectationResults = evaluateExpectations(options.expectations, milestones);

    return {
      duration: {
        completedSeconds,
        totalSeconds,
        aborted
      },
      options: {
        strategy: options.strategy,
        tickMs: options.tickMs,
        purchaseEveryTicks: options.purchaseEveryTicks,
        eventLimit: options.eventLimit,
        longRun: options.longRun
      },
      purchaseRuns,
      powCache: powCacheStats?.installed
        ? {
            installed: true,
            hits: powCacheStats.hits,
            misses: powCacheStats.misses,
            hitRate: totalPowCalls > 0 ? powCacheStats.hits / totalPowCalls : 0,
            size: powCacheStats.size,
            maxEntries: powCacheStats.maxEntries
          }
        : { installed: false },
      finalState: {
        fv: format(game.fv),
        fvPerSec: format(game.stats.fv_per_sec),
        dx: format(game.dx_points),
        ap: format(game.ap_points),
        differentiations: format(game.differentiationCount),
        expPoints: game.exp_milestone_points,
        expMultiplier: format(game.exp_multiplier),
        integralCount: game.integral_count,
        integralC: format(game.integral_c),
        apResearchUnlocked: game.ap_research.length,
        achievementsUnlocked: game.achievements.length
      },
      milestones,
      events,
      omittedEvents,
      expectations: expectationResults,
      passed: expectationResults.every((result) => result.passed)
    };
  } finally {
    Date.now = originalDateNow;
  }
};

const printTextReport = (report) => {
  console.log('Limit Idle Simulation Report');
  console.log('============================');
  console.log(`Duration: ${formatDuration(report.duration.completedSeconds)} / ${formatDuration(report.duration.totalSeconds)}${report.duration.aborted ? ' (aborted)' : ''}`);
  console.log(`Strategy: ${report.options.strategy}`);
  console.log(`Tick size: ${report.options.tickMs}ms`);
  console.log(`Purchase interval: every ${report.options.purchaseEveryTicks} ticks (${formatDuration(report.options.purchaseEveryTicks * report.options.tickMs / 1000)})`);
  console.log(`Purchase strategy runs: ${report.purchaseRuns}`);
  console.log(`Event limit: ${report.options.eventLimit}`);
  if (report.powCache.installed) {
    console.log(`Pow cache: ${report.powCache.hits} hits / ${report.powCache.misses} misses (${(report.powCache.hitRate * 100).toFixed(1)}% hit rate, size ${report.powCache.size}/${report.powCache.maxEntries})`);
  } else {
    console.log('Pow cache: disabled');
  }
  console.log('');
  console.log('Final state');
  console.log(`- FV: ${report.finalState.fv}`);
  console.log(`- FV/sec: ${report.finalState.fvPerSec}`);
  console.log(`- DX: ${report.finalState.dx}`);
  console.log(`- AP: ${report.finalState.ap}`);
  console.log(`- Differentiations: ${report.finalState.differentiations}`);
  console.log(`- Exp points: ${report.finalState.expPoints}`);
  console.log(`- Exp multiplier: ${report.finalState.expMultiplier}`);
  console.log(`- Integral count: ${report.finalState.integralCount}`);
  console.log(`- Integral C: ${report.finalState.integralC}`);
  console.log(`- AP research unlocked: ${report.finalState.apResearchUnlocked}`);
  console.log(`- Achievements unlocked: ${report.finalState.achievementsUnlocked}`);
  console.log('');
  console.log('Milestones and alerts');

  if (report.events.length === 0) {
    console.log('- none');
  } else {
    report.events.forEach((event) => {
      console.log(`- [${formatDuration(event.t / 1000)}] ${event.title}: ${event.message}`);
    });
    if (report.omittedEvents > 0) {
      console.log(`- ... ${report.omittedEvents} more events omitted by --event-limit`);
    }
  }

  if (report.expectations.length > 0) {
    console.log('');
    console.log('Expectations');
    report.expectations.forEach((result) => {
      const actual = result.actualSeconds === null ? 'missing' : formatDuration(result.actualSeconds);
      const range = `${formatDuration(result.minSeconds)}..${formatDuration(result.maxSeconds)}`;
      console.log(`- ${result.passed ? 'PASS' : 'FAIL'} ${result.key}: ${actual} in ${range}`);
    });
  }
};

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli) {
  runSimulation(process.argv.slice(2)).then((report) => {
    const options = parseDuration(process.argv.slice(2));
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printTextReport(report);
    }
    if (!report.passed) process.exitCode = 1;
  }).catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
