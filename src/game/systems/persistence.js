import Decimal from 'break_eternity.js';
import { game } from '../state.js';
import { format } from '../formatting.js';
import {
  ensureCanonicalRunStartXIncrease,
  normalizeAfterPrestigeAdvance,
  snapshotPrestigeCounters
} from '../balance/runDefaults.js';
import { setGameUiCallbacks, showGameAlert } from '../uiCallbacks.js';
import { SAVE_KEY, saveSerializedGameState } from '../persistence/saveSerializer.js';
import { simulateOfflineProgress } from './offlineProgress.js';
import {
  loadGame as legacyLoadGame,
  resetGame,
  setAlertCallbacks as legacySetAlertCallbacks
} from '../../gameLogic.js';

const readSerializedSave = (storage = globalThis.localStorage) => {
  if (!storage) return null;
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (_err) {
    return null;
  }
};

const restoreSerializedRuntimeState = (data) => {
  if (!data || typeof data !== 'object') return;

  if (data.stats?.fv_per_sec !== undefined) {
    game.stats.fv_per_sec = new Decimal(data.stats.fv_per_sec || 0);
  }

  if (Array.isArray(data.auto_upgrades)) {
    data.auto_upgrades.forEach((savedAuto, index) => {
      const auto = game.auto_upgrades[index];
      if (!auto || !savedAuto) return;
      auto.idleUntil = Math.max(0, Number(savedAuto.idleUntil || 0));
      auto.idleStreak = Math.max(0, Number(savedAuto.idleStreak || 0));
    });
  }
};

const repairStaleRunStartBaseline = () => {
  const xIncreaseUtility = game.other_upgrades?.[1];
  if (!xIncreaseUtility || Number(xIncreaseUtility.level || 0) !== 0) return false;
  return ensureCanonicalRunStartXIncrease(game);
};

const prepareLegacyLoad = (storage, serialized, now) => {
  if (!storage || !serialized?.lastTick) return null;
  const startMs = Number(serialized.lastTick || 0);
  if (!Number.isFinite(startMs) || now - startMs <= 5000) return null;

  storage.setItem(SAVE_KEY, JSON.stringify({ ...serialized, lastTick: now }));
  return { startMs };
};

const notifyOfflineProgress = (result) => {
  if (!result || result.offlineMs <= 5000) return;
  const offlineSecs = result.offlineMs / 1000;
  const notify = () => showGameAlert(
    `방치 환영합니다!\n${offlineSecs.toFixed(0)}초 동안 ${result.steps.toLocaleString()}단계로 오프라인 진행을 계산했습니다.\n총 약 ${format(result.totalProduced)} FV 생산 (자동 기능 반영됨)`,
    '오프라인 보상'
  );

  if (typeof setTimeout === 'function') setTimeout(notify, 1000);
  else notify();
};

export const saveGame = () => {
  game.save_version = Number(game.save_version || 1);
  game.lastTick = Date.now();
  return saveSerializedGameState(game, globalThis.localStorage, { now: game.lastTick });
};

export const loadGame = () => {
  const storage = globalThis.localStorage;
  const serialized = readSerializedSave(storage);
  const now = Date.now();
  const offline = prepareLegacyLoad(storage, serialized, now);
  const loaded = legacyLoadGame();
  if (!loaded) return false;

  restoreSerializedRuntimeState(serialized);
  repairStaleRunStartBaseline();

  if (offline) {
    const result = simulateOfflineProgress({
      startMs: offline.startMs,
      endMs: now,
      maxSteps: 5000,
      minStepMs: 100
    });
    game.lastTick = now;
    saveSerializedGameState(game, storage, { now });
    notifyOfflineProgress(result);
  }

  return true;
};

export const setAlertCallbacks = (alertCb, confirmCb) => {
  setGameUiCallbacks(alertCb, confirmCb);

  const wrappedConfirm = typeof confirmCb === 'function'
    ? (message, onConfirm, title) => confirmCb(message, () => {
        const before = snapshotPrestigeCounters(game);
        try {
          onConfirm();
        } finally {
          normalizeAfterPrestigeAdvance(before, game);
        }
      }, title)
    : confirmCb;

  legacySetAlertCallbacks(alertCb, wrappedConfirm);
};

export {
  resetGame
};
