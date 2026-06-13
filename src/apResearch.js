import Decimal from 'break_eternity.js';

export const AUTO_RESEARCH_MAP = {
  0: 'auto_function',
  1: 'auto_fv_utility',
  2: 'auto_dx_utility',
  3: 'auto_differentiate'
};

export const AP_RESEARCH_NODES = [
  {
    id: 'auto_function',
    name: 'Auto Function',
    desc: 'Variable 업그레이드 자동 구매를 해금합니다.',
    cost: 10,
    requires: [],
    icon: '',
    tier: 0,
    category: 'auto'
  },
  {
    id: 'auto_fv_utility',
    name: 'Auto FV Utility',
    desc: 'FV Utility 업그레이드 자동 구매를 해금합니다.',
    cost: 30,
    requires: ['auto_function'],
    icon: '',
    tier: 1,
    category: 'auto'
  },
  {
    id: 'auto_dx_utility',
    name: 'Auto DX Utility',
    desc: 'DX/AP Utility 업그레이드 자동 구매를 해금합니다.',
    cost: 60,
    requires: ['auto_function'],
    icon: '',
    tier: 1,
    category: 'auto'
  },
  {
    id: 'auto_differentiate',
    name: 'Auto Differentiate',
    desc: '조건 기반 자동 미분을 해금합니다.',
    cost: 120,
    requires: ['auto_dx_utility'],
    icon: '',
    tier: 2,
    category: 'auto'
  },
  {
    id: 'enhanced_auto',
    name: 'Enhanced Automation',
    desc: '모든 자동 업그레이드 간격이 30% 감소합니다.',
    cost: 200,
    requires: ['auto_function'],
    icon: '',
    tier: 2,
    category: 'boost'
  },
  {
    id: 'fv_amp',
    name: 'FV Amplifier',
    desc: 'FV 생산량이 영구적으로 x1.5 증가합니다.',
    cost: 300,
    requires: ['enhanced_auto'],
    icon: '',
    tier: 3,
    category: 'boost'
  },
  {
    id: 'offline_surge',
    name: 'Offline Surge',
    desc: '오프라인 보상이 x2 증가합니다.',
    cost: 400,
    requires: ['enhanced_auto'],
    icon: '',
    tier: 3,
    category: 'boost'
  },
  {
    id: 'rapid_deriv',
    name: 'Rapid Derivatives',
    desc: '자동 미분 쿨다운이 50% 감소합니다.',
    cost: 250,
    requires: ['auto_differentiate'],
    icon: '',
    tier: 3,
    category: 'boost'
  },
  {
    id: 'dx_accel',
    name: 'DX Accelerator',
    desc: 'DX 획득량이 영구적으로 x1.5 증가합니다.',
    cost: 500,
    requires: ['rapid_deriv', 'fv_amp'],
    icon: '',
    tier: 4,
    category: 'boost'
  },
  {
    id: 'auto_exp',
    name: 'Auto Exponential',
    desc: '자동 Tier 2 Rebirth를 해금합니다.',
    cost: 800,
    requires: ['rapid_deriv'],
    icon: '',
    tier: 4,
    category: 'auto'
  },
  {
    id: 'auto_integral',
    name: 'Auto Integration',
    desc: '자동 Tier 3 Integration을 해금합니다.',
    cost: 2000,
    requires: ['auto_exp'],
    icon: '',
    tier: 5,
    category: 'auto'
  },
  {
    id: 'convergence',
    name: 'Convergence Engine',
    desc: 'FV와 DX 생산량이 영구적으로 x2 증가합니다.',
    cost: 5000,
    requires: ['dx_accel'],
    icon: '',
    tier: 5,
    category: 'boost'
  }
];

export const canPurchaseResearch = (nodeId, unlockedIds, apPoints) => {
  const node = AP_RESEARCH_NODES.find(n => n.id === nodeId);
  if (!node) return false;
  if (unlockedIds.includes(nodeId)) return false;
  if (new Decimal(apPoints).lt(node.cost)) return false;
  return node.requires.every(reqId => unlockedIds.includes(reqId));
};

export const isAutoResearched = (autoId, unlockedIds) => {
  const nodeId = AUTO_RESEARCH_MAP[autoId];
  return nodeId ? unlockedIds.includes(nodeId) : false;
};

export const hasAnyAutoResearch = (unlockedIds) => {
  return Object.values(AUTO_RESEARCH_MAP).some(nodeId => unlockedIds.includes(nodeId));
};

export const getResearchBonuses = (unlockedIds) => {
  const bonuses = {
    autoIntervalMultiplier: 1.0,
    autoDiffCooldownMultiplier: 1.0,
    fvProductionMultiplier: new Decimal(1),
    dxGainMultiplier: new Decimal(1),
    offlineMultiplier: new Decimal(1),
    hasAutoExp: false,
    hasAutoIntegral: false
  };

  if (!unlockedIds || unlockedIds.length === 0) return bonuses;

  unlockedIds.forEach(id => {
    switch (id) {
      case 'enhanced_auto':
        bonuses.autoIntervalMultiplier *= 0.7;
        break;
      case 'fv_amp':
        bonuses.fvProductionMultiplier = bonuses.fvProductionMultiplier.times(1.5);
        break;
      case 'offline_surge':
        bonuses.offlineMultiplier = bonuses.offlineMultiplier.times(2);
        break;
      case 'rapid_deriv':
        bonuses.autoDiffCooldownMultiplier *= 0.5;
        break;
      case 'dx_accel':
        bonuses.dxGainMultiplier = bonuses.dxGainMultiplier.times(1.5);
        break;
      case 'auto_exp':
        bonuses.hasAutoExp = true;
        break;
      case 'auto_integral':
        bonuses.hasAutoIntegral = true;
        break;
      case 'convergence':
        bonuses.fvProductionMultiplier = bonuses.fvProductionMultiplier.times(2);
        bonuses.dxGainMultiplier = bonuses.dxGainMultiplier.times(2);
        break;
    }
  });

  return bonuses;
};
