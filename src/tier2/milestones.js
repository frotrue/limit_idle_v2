import Decimal from 'break_eternity.js';

export const TIER2_MILESTONES = [
  { id: 'e1', at: 1, name: 'Spark of Growth', bonus: { extraExpX: 0.01, startFv: '1e3' } },
  { id: 'e2', at: 3, name: 'Efficient Evolution', bonus: { startFv: '1e4' } },
  { id: 'e3', at: 6, name: 'Derivative Resonance', bonus: { apGainMultiplier: 1.25, startXUpgradeLevels: { 0: 3, 1: 3 } } },
  { id: 'e4', at: 10, name: 'Exponential Instinct', bonus: { extraExpX: 0.02, startXUpgradeLevels: { 0: 2, 1: 2 }, permanentAutoUnlock: true } },
  { id: 'e5', at: 15, name: 'Deep Evolution', bonus: { apGainMultiplier: 1.5, startXUpgradeLevels: { 2: 2 }, autoUpgradeUsesMaxBuy: true } }
];

const freshTier2Bonus = () => ({
  extraExpX: 0,
  apGainMultiplier: 1,
  startFv: new Decimal(0),
  startXUpgradeLevels: {},
  permanentAutoUnlock: false,
  autoUpgradeUsesMaxBuy: false
});

export const getUnlockedTier2Milestones = (points) => {
  const count = Math.max(0, Number(points || 0));
  return TIER2_MILESTONES.filter((m) => count >= m.at);
};

export const getTier2MilestoneBonuses = (points) => {
  const unlocked = getUnlockedTier2Milestones(points);
  return unlocked.reduce((acc, milestone) => {
    const b = milestone.bonus || {};
    if (b.extraExpX) acc.extraExpX += b.extraExpX;
    if (b.apGainMultiplier) acc.apGainMultiplier *= b.apGainMultiplier;
    if (b.startFv) acc.startFv = acc.startFv.plus(new Decimal(b.startFv));
    if (b.startXUpgradeLevels) {
      Object.keys(b.startXUpgradeLevels).forEach((id) => {
        const n = Number(b.startXUpgradeLevels[id] || 0);
        acc.startXUpgradeLevels[id] = (acc.startXUpgradeLevels[id] || 0) + n;
      });
    }
    if (b.permanentAutoUnlock) acc.permanentAutoUnlock = true;
    if (b.autoUpgradeUsesMaxBuy) acc.autoUpgradeUsesMaxBuy = true;
    return acc;
  }, freshTier2Bonus());
};

export const getTier2MilestoneProgress = (points) => {
  const count = Math.max(0, Number(points || 0));
  const next = TIER2_MILESTONES.find((m) => count < m.at) || null;
  return {
    count,
    next,
    unlocked: getUnlockedTier2Milestones(count)
  };
};

