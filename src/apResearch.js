import Decimal from 'break_eternity.js';

/**
 * AP 연구 트리 — 영구 업그레이드 시스템
 * AP를 소모하여 해금하면 모든 환생을 거쳐도 영구히 유지됩니다.
 * 
 * 트리 구조:
 * auto_function(10) → auto_fv_utility(30)
 *                   → auto_dx_utility(60) → auto_differentiate(120) → rapid_deriv(250) → auto_exp(800) → auto_integral(2000)
 *                   → enhanced_auto(200) → fv_amp(300)  → dx_accel(500) → convergence(5000)
 *                                        → offline_surge(400)
 */

// 자동 업그레이드 ID와 연구 노드 ID 매핑
export const AUTO_RESEARCH_MAP = {
  0: 'auto_function',
  1: 'auto_fv_utility',
  2: 'auto_dx_utility',
  3: 'auto_differentiate'
};

export const AP_RESEARCH_NODES = [
  // === Tier 0: 루트 — 기본 자동화 해금 ===
  {
    id: 'auto_function',
    name: 'Auto Function',
    desc: '자동 함수 업그레이드 해금',
    cost: 10,
    requires: [],
    icon: '🔧',
    tier: 0,
    category: 'auto'
  },
  // === Tier 1: 자동 유틸리티 & DX 해금 ===
  {
    id: 'auto_fv_utility',
    name: 'Auto FV Utility',
    desc: '자동 FV 유틸리티 업그레이드 해금',
    cost: 30,
    requires: ['auto_function'],
    icon: '📊',
    tier: 1,
    category: 'auto'
  },
  {
    id: 'auto_dx_utility',
    name: 'Auto DX Utility',
    desc: '자동 DX 유틸리티 업그레이드 해금',
    cost: 60,
    requires: ['auto_function'],
    icon: '📐',
    tier: 1,
    category: 'auto'
  },
  // === Tier 2: 자동 미분 & 강화 ===
  {
    id: 'auto_differentiate',
    name: 'Auto Differentiate',
    desc: '자동 미분 해금 (조건부 실행)',
    cost: 120,
    requires: ['auto_dx_utility'],
    icon: '📉',
    tier: 2,
    category: 'auto'
  },
  {
    id: 'enhanced_auto',
    name: 'Enhanced Automation',
    desc: '모든 자동 업그레이드 간격 30% 감소',
    cost: 200,
    requires: ['auto_function'],
    icon: '⚡',
    tier: 2,
    category: 'boost'
  },
  // === Tier 3: 생산 보너스 ===
  {
    id: 'fv_amp',
    name: 'FV Amplifier',
    desc: 'FV 생산량 ×1.5 (영구)',
    cost: 300,
    requires: ['enhanced_auto'],
    icon: '💹',
    tier: 3,
    category: 'boost'
  },
  {
    id: 'offline_surge',
    name: 'Offline Surge',
    desc: '오프라인 보상 ×2',
    cost: 400,
    requires: ['enhanced_auto'],
    icon: '🔋',
    tier: 3,
    category: 'boost'
  },
  {
    id: 'rapid_deriv',
    name: 'Rapid Derivatives',
    desc: '자동 미분 쿨다운 50% 감소',
    cost: 250,
    requires: ['auto_differentiate'],
    icon: '⏩',
    tier: 3,
    category: 'boost'
  },
  // === Tier 4: 고급 자동화 & 생산 ===
  {
    id: 'dx_accel',
    name: 'DX Accelerator',
    desc: 'DX 획득량 ×1.5 (영구)',
    cost: 500,
    requires: ['rapid_deriv', 'fv_amp'],
    icon: '🚀',
    tier: 4,
    category: 'boost'
  },
  {
    id: 'auto_exp',
    name: 'Auto Exponential',
    desc: '자동 Tier 2 환생 (조건 설정 가능)',
    cost: 800,
    requires: ['rapid_deriv'],
    icon: '📈',
    tier: 4,
    category: 'auto'
  },
  // === Tier 5: 최종 ===
  {
    id: 'auto_integral',
    name: 'Auto Integration',
    desc: '자동 Tier 3 환생 (조건 설정 가능)',
    cost: 2000,
    requires: ['auto_exp'],
    icon: '∫',
    tier: 5,
    category: 'auto'
  },
  {
    id: 'convergence',
    name: 'Convergence Engine',
    desc: '모든 FV/DX 생산 ×2 (영구)',
    cost: 5000,
    requires: ['dx_accel'],
    icon: '∞',
    tier: 5,
    category: 'boost'
  }
];

/**
 * 특정 노드를 구매할 수 있는지 확인
 */
export const canPurchaseResearch = (nodeId, unlockedIds, apPoints) => {
  const node = AP_RESEARCH_NODES.find(n => n.id === nodeId);
  if (!node) return false;
  if (unlockedIds.includes(nodeId)) return false;
  if (new Decimal(apPoints).lt(node.cost)) return false;
  return node.requires.every(reqId => unlockedIds.includes(reqId));
};

/**
 * 특정 자동 업그레이드가 연구로 해금되었는지 확인
 */
export const isAutoResearched = (autoId, unlockedIds) => {
  const nodeId = AUTO_RESEARCH_MAP[autoId];
  return nodeId ? unlockedIds.includes(nodeId) : false;
};

/**
 * 연구된 자동 업그레이드가 하나라도 있는지 확인
 */
export const hasAnyAutoResearch = (unlockedIds) => {
  return Object.values(AUTO_RESEARCH_MAP).some(nodeId => unlockedIds.includes(nodeId));
};

/**
 * 해금된 연구 노드들의 보너스를 합산하여 반환
 */
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
