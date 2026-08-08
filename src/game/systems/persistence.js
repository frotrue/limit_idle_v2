import Decimal from 'break_eternity.js';
import { game } from '../state.js';
import { SAVE_KEY, saveSerializedGameState } from '../persistence/saveSerializer.js';
import {
  loadGame as legacyLoadGame,
  resetGame,
  setAlertCallbacks
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

export const saveGame = () => {
  game.save_version = Number(game.save_version || 1);
  game.lastTick = Date.now();
  return saveSerializedGameState(game, globalThis.localStorage, { now: game.lastTick });
};

export const loadGame = () => {
  const serialized = readSerializedSave();
  const loaded = legacyLoadGame();
  if (!loaded) return false;

  restoreSerializedRuntimeState(serialized);
  return true;
};

export {
  resetGame,
  setAlertCallbacks
};
