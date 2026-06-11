import { game } from '../state.js';
import { saveSerializedGameState } from '../persistence/saveSerializer.js';
import {
  loadGame,
  resetGame,
  setAlertCallbacks
} from '../../gameLogic.js';

export const saveGame = () => {
  game.save_version = Number(game.save_version || 1);
  game.lastTick = Date.now();
  return saveSerializedGameState(game, globalThis.localStorage, { now: game.lastTick });
};

export {
  loadGame,
  resetGame,
  setAlertCallbacks
};
