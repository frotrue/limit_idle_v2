import { game } from '../state.js';
import {
  normalizeAfterPrestigeAdvance,
  snapshotPrestigeCounters
} from '../balance/runDefaults.js';
import {
  performAutoUpgrade as legacyPerformAutoUpgrade,
  autoTick as legacyAutoTick
} from '../../gameLogic.js';

export const performAutoUpgrade = (auto) => {
  const before = snapshotPrestigeCounters(game);
  const changed = legacyPerformAutoUpgrade(auto);
  normalizeAfterPrestigeAdvance(before, game);
  return changed;
};

export const autoTick = (nowMs = Date.now()) => {
  const before = snapshotPrestigeCounters(game);
  const result = legacyAutoTick(nowMs);
  normalizeAfterPrestigeAdvance(before, game);
  return result;
};
