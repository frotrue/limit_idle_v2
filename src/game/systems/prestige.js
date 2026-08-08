import Decimal from 'break_eternity.js';
import { game } from '../state.js';
import { format } from '../formatting.js';
import { showGameAlert, showGameConfirm } from '../uiCallbacks.js';
import {
  normalizeAfterPrestigeAdvance,
  normalizeRunStartXIncrease,
  snapshotPrestigeCounters
} from '../balance/runDefaults.js';
import {
  DIFFERENTIATION_FV_REQUIREMENT,
  canDifferentiateNow,
  getDifferentiationPreview,
  differentiate_bt as legacyDifferentiateBt,
  buyExpUpgrade as legacyBuyExpUpgrade,
  performTier2Reset as legacyPerformTier2Reset,
  performTier3Reset as legacyPerformTier3Reset,
  canIntegrate,
  getIntegralBonusValue
} from '../../gameLogic.js';

const INTEGRAL_UNLOCK_EXP_REQ = 1.5;

const getIntegrationGain = () => {
  const logFv = Decimal.max(0, game.fv.log10());
  const gain = logFv.pow(0.7).floor();
  return gain.gte(1) ? gain : new Decimal(1);
};

export const differentiate_bt = (...args) => {
  const before = snapshotPrestigeCounters(game);
  const result = legacyDifferentiateBt(...args);
  normalizeAfterPrestigeAdvance(before, game);
  return result;
};

export const buyExpUpgrade = (...args) => {
  const before = snapshotPrestigeCounters(game);
  const result = legacyBuyExpUpgrade(...args);
  normalizeAfterPrestigeAdvance(before, game);
  return result;
};

export const performTier2Reset = (...args) => {
  const result = legacyPerformTier2Reset(...args);
  normalizeRunStartXIncrease(game);
  return result;
};

export const performTier3Reset = (...args) => {
  const result = legacyPerformTier3Reset(...args);
  normalizeRunStartXIncrease(game);
  return result;
};

export const integrate_bt = () => {
  if (!canIntegrate()) {
    showGameAlert(
      `적분 환생을 하려면 최소 ${INTEGRAL_UNLOCK_EXP_REQ.toFixed(2)} 의 Exp 증폭이 필요합니다.`,
      '알림'
    );
    return false;
  }

  const previewGain = getIntegrationGain();
  showGameConfirm(
    `[경고: 적분 (3차 환생)]\n현재까지의 모든 f(x), 미분(DX), 지수(Exp) 재화를 잃는 대신,\n영구적인 지수 보너스를 제공하는 '적분 상수(C)' ${format(previewGain)} 를 얻습니다.\n(단, 업적, 연구 트리, 모든 마일스톤 보상은 영구적으로 유지됩니다!)\n\n정말 진행하시겠습니까?`,
    () => {
      if (!canIntegrate()) {
        showGameAlert(
          `확인하는 동안 조건이 변경되었습니다. 적분 환생에는 최소 ${INTEGRAL_UNLOCK_EXP_REQ.toFixed(2)} 의 Exp 증폭이 필요합니다.`,
          '알림'
        );
        return;
      }

      const gain = getIntegrationGain();
      game.integral_c = game.integral_c.plus(gain);
      game.integral_count += 1;
      performTier3Reset();
      showGameAlert(
        `적분 환생이 완료되었습니다!\n현재 C: ${format(game.integral_c)}, 적용 보너스: +${format(getIntegralBonusValue().times(0.1))}`,
        '적분 환생'
      );
    },
    '적분 환생 확인'
  );
  return true;
};

export {
  DIFFERENTIATION_FV_REQUIREMENT,
  canDifferentiateNow,
  getDifferentiationPreview,
  canIntegrate
};
