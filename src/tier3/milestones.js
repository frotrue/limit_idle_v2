import Decimal from 'break_eternity.js';

export const TIER3_MILESTONES = [
  { id: 'm1', at: 1, name: 'Warm Start', bonus: { startFv: '5e3', startXIncrease: '0.03' } },
  { id: 'm2', at: 2, name: 'Faster Variable', bonus: { startFv: '2e4', startXIncrease: '0.05' } },
  { id: 'm3', at: 4, name: 'Wider Domain', bonus: { startMaxX: 2 } },
  { id: 'm4', at: 6, name: 'Flow Boost', bonus: { startFv: '1e5', startXIncrease: '0.08' } },
  { id: 'm5', at: 8, name: 'Domain II', bonus: { startMaxX: 3 } },
  { id: 'm6', at: 10, name: 'Integral Momentum', bonus: { fvProductionMultiplier: '1.25' } },
  { id: 'm7', at: 12, name: 'Hyper Start', bonus: { startFv: '1e6', startXIncrease: '0.12' } },
  { id: 'm8', at: 14, name: 'Flux Acceleration', bonus: { fvProductionMultiplier: '1.35' } },
  { id: 'm9', at: 16, name: 'Domain III', bonus: { startMaxX: 5 } }
];

const freshTier3Bonus = () => ({
  startFv: new Decimal(0),
  startXIncrease: new Decimal(0),
  startMaxX: new Decimal(0),
  fvProductionMultiplier: new Decimal(1)
});

export const getUnlockedTier3Milestones = (integralCount) => {
  const count = Math.max(0, Number(integralCount || 0));
  return TIER3_MILESTONES.filter((m) => count >= m.at);
};

export const getTier3MilestoneBonuses = (integralCount) => {
  const unlocked = getUnlockedTier3Milestones(integralCount);

  return unlocked.reduce((acc, milestone) => {
    const b = milestone.bonus || {};
    if (b.startFv) acc.startFv = acc.startFv.plus(new Decimal(b.startFv));
    if (b.startXIncrease) acc.startXIncrease = acc.startXIncrease.plus(new Decimal(b.startXIncrease));
    if (b.startMaxX) acc.startMaxX = acc.startMaxX.plus(new Decimal(b.startMaxX));
    if (b.fvProductionMultiplier) acc.fvProductionMultiplier = acc.fvProductionMultiplier.times(new Decimal(b.fvProductionMultiplier));
    return acc;
  }, freshTier3Bonus());
};

export const getTier3MilestoneProgress = (integralCount) => {
  const count = Math.max(0, Number(integralCount || 0));
  const next = TIER3_MILESTONES.find((m) => count < m.at) || null;
  return {
    unlocked: getUnlockedTier3Milestones(count),
    next,
    count
  };
};

