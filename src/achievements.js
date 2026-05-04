import Decimal from 'break_eternity.js';

export const ACHIEVEMENTS = [
  {
    id: 'start_1k',
    name: '시작이 반이다',
    desc: '총 FV 획득량 1,000 도달',
    reward: '시작 기본 FV +100',
    bonuses: { startFv: new Decimal(100) },
    check: (game) => game.stats.total_fv.gte(1000)
  },
  {
    id: 'diff_first',
    name: '미적분의 기초',
    desc: '첫 번째 미분 수행',
    reward: '미분 시 추가 AP +1',
    bonuses: { extraAp: new Decimal(1) },
    check: (game) => game.differentiationCount.gte(1)
  },
  {
    id: 'accel_50',
    name: '가속도',
    desc: 'X 증가량 업그레이드 Lv.50 달성',
    reward: '시작 기본 FV +1,000',
    bonuses: { startFv: new Decimal(1000) },
    check: (game) => game.other_upgrades[1].level >= 50 || game.other_upgrades[1].level === 'MAX'
  },
  {
    id: 'dx_million',
    name: '미분 마스터',
    desc: '보유 DX 1.00e6 도달',
    reward: '미분 시 추가 AP +2',
    bonuses: { extraAp: new Decimal(2) },
    check: (game) => game.dx_points.gte("1e6")
  },
  {
    id: 'diff_10',
    name: '반복 학습',
    desc: '미분 10회 수행',
    reward: '기본 FV 생산량 +5%',
    bonuses: { fvMultiplier: 1.05 },
    check: (game) => game.differentiationCount.gte(10)
  },
  {
    id: 'fv_1e10',
    name: '기하급수적 성장',
    desc: '총 FV 획득량 1.00e10 도달',
    reward: '기본 FV 생산량 +5%',
    bonuses: { fvMultiplier: 1.05 },
    check: (game) => game.stats.total_fv.gte("1e10")
  },
  {
    id: 'exp_first',
    name: '지수 폭발',
    desc: '첫 번째 지수(Tier 2) 환생 수행',
    reward: '기본 FV 생산량 +10%',
    bonuses: { fvMultiplier: 1.10 },
    check: (game) => game.exp_milestone_points >= 1
  },
  {
    id: 'exp_5',
    name: '초월 진화',
    desc: '지수 환생 5회 수행',
    reward: '시작 기본 FV +100,000',
    bonuses: { startFv: new Decimal(100000) },
    check: (game) => game.exp_milestone_points >= 5
  },
  {
    id: 'integral_first',
    name: '적분의 경지',
    desc: '첫 번째 적분(Tier 3) 환생 수행',
    reward: '기본 FV 생산량 +15%',
    bonuses: { fvMultiplier: 1.15 },
    check: (game) => game.integral_count >= 1
  },
  {
    id: 'play_1h',
    name: '인내의 결실',
    desc: '총 플레이 타임 1시간 돌파',
    reward: '기본 FV 생산량 +5%',
    bonuses: { fvMultiplier: 1.05 },
    check: (game) => game.stats.play_time >= 3600
  },
  {
    id: 'mathematician',
    name: '수학자',
    desc: 'Max x 업그레이드 Lv.20 달성',
    reward: '시작 기본 FV +5,000',
    bonuses: { startFv: new Decimal(5000) },
    check: (game) => game.other_upgrades[0].level >= 20 || game.other_upgrades[0].level === 'MAX'
  },
  {
    id: 'ap_automation',
    name: '완전 자동화 시대',
    desc: '자동화 연구(AP) 4개 이상 해금',
    reward: '미분 시 추가 AP +3',
    bonuses: { extraAp: new Decimal(3) },
    check: (game) => game.ap_research.length >= 4
  }
];

export const getAchievementFvMultiplier = (unlockedIds) => {
  let bonus = new Decimal(1);
  if (!unlockedIds || unlockedIds.length === 0) return bonus;

  ACHIEVEMENTS.forEach(ach => {
    if (unlockedIds.includes(ach.id) && ach.bonuses.fvMultiplier) {
      bonus = bonus.times(ach.bonuses.fvMultiplier);
    }
  });

  return bonus;
};

export const getAchievementExtraAp = (unlockedIds) => {
  let bonus = new Decimal(0);
  if (!unlockedIds || unlockedIds.length === 0) return bonus;

  ACHIEVEMENTS.forEach(ach => {
    if (unlockedIds.includes(ach.id) && ach.bonuses.extraAp) {
      bonus = bonus.plus(ach.bonuses.extraAp);
    }
  });

  return bonus;
};

export const getAchievementStartFv = (unlockedIds) => {
  let bonus = new Decimal(0);
  if (!unlockedIds || unlockedIds.length === 0) return bonus;

  ACHIEVEMENTS.forEach(ach => {
    if (unlockedIds.includes(ach.id) && ach.bonuses.startFv) {
      bonus = bonus.plus(ach.bonuses.startFv);
    }
  });

  return bonus;
};
