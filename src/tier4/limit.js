import Decimal from 'break_eternity.js';

export const LIMIT_CONSTANTS = [
  {
    id: 'euler_e',
    name: '자연상수 e',
    desc: '지수(Exp) 환생 시의 배율 증가폭의 기본 거듭제곱 수치를 영구적으로 상승시킵니다.',
    effectDesc: (level) => `추가 거듭제곱: +${(level * 0.1).toFixed(1)}`,
    price: (level) => Math.floor(1 + level * 1.5),
    getEffect: (level) => level * 0.1
  },
  {
    id: 'pi',
    name: '원주율 π',
    desc: '최대 x 제한(Max X Hard Cap) 수치를 영구적으로 대폭 확장합니다.',
    effectDesc: (level) => `Max x 상한선 증가: +${level * 20}`,
    price: (level) => Math.floor(1 + level * 2),
    getEffect: (level) => level * 20
  },
  {
    id: 'gamma',
    name: '오일러-마스케로니 γ',
    desc: '미분 시 획득하는 AP와 DX의 획득량을 영구적으로 폭발시킵니다.',
    effectDesc: (level) => `AP/DX 획득 배율: ×${Math.pow(2, level).toLocaleString()}`,
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
  const scaledLp = Math.floor(Math.pow(Math.max(0, baseLp), 0.5));
  return new Decimal(Math.max(1, scaledLp)); // 최소 1 제공
};

export const getLpPassiveBonus = (lp) => {
  if (!lp || lp.lte(0)) return new Decimal(1);
  return Decimal.pow(10, lp);
};

export const canLimit = (integralCount) => {
  return integralCount >= 50;
};
