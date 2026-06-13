import Decimal from 'break_eternity.js';

export const LIMIT_CONSTANTS = [
  {
    id: 'euler_e',
    name: 'Euler Constant e',
    desc: 'Exponential Rebirth의 기본 성장값을 영구적으로 높입니다.',
    effectDesc: (level) => `추가 성장값: +${(level * 0.1).toFixed(1)}`,
    price: (level) => Math.floor(1 + level * 1.5),
    getEffect: (level) => level * 0.1
  },
  {
    id: 'pi',
    name: 'Circle Constant pi',
    desc: 'Max x hard cap을 영구적으로 확장합니다.',
    effectDesc: (level) => `Max x 상한 증가: +${level * 20}`,
    price: (level) => Math.floor(1 + level * 2),
    getEffect: (level) => level * 20
  },
  {
    id: 'gamma',
    name: 'Euler-Mascheroni gamma',
    desc: '미분으로 얻는 AP와 DX의 획득량을 영구적으로 개선합니다.',
    effectDesc: (level) => `AP/DX 획득 배율: x${Math.pow(2, level).toLocaleString()}`,
    price: (level) => Math.floor(1 + level * 2.5),
    getEffect: (level) => Decimal.pow(2, level)
  }
];

export const getLpHospitalMultiplier = (diffCount, intCount, totalConstantLevels) => {
  if (totalConstantLevels < 5) return new Decimal(1);
  const dc = Decimal.max(1, diffCount);
  const ic = Decimal.max(1, intCount);
  return Decimal.max(1, dc.times(ic).pow(1.5));
};

export const getLpGain = (fv) => {
  const logVal = fv.gt(0) ? fv.log10().floor() : new Decimal(0);
  const baseLp = logVal.div(50).toNumber();
  if (baseLp < 1) return new Decimal(0);
  const scaledLp = Math.floor(Math.pow(baseLp, 0.5));
  return new Decimal(scaledLp);
};

export const getLpPassiveBonus = (lp) => {
  if (!lp || lp.lte(0)) return new Decimal(1);
  return Decimal.pow(10, lp);
};

export const canLimit = (integralCount, fv) => {
  if (!fv) return integralCount >= 50;
  return integralCount >= 50 && getLpGain(fv).gt(0);
};
