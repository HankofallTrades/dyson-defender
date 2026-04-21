const BASE_UPGRADE_COSTS: Record<string, number> = {
  'ship-damage': 500,
  'ship-fire-rate': 500,
  'ship-hull': 500,
  'dyson-shield': 500,
  'dyson-regen': 500,
  'secondary-praetorian-laser': 500
};

const FIXED_COST_UPGRADES = new Set(['secondary-praetorian-laser']);

export function getUpgradeCost(upgradeId: string, level: number = 0): number {
  const baseCost = BASE_UPGRADE_COSTS[upgradeId];
  if (!baseCost) {
    return Number.POSITIVE_INFINITY;
  }

  if (FIXED_COST_UPGRADES.has(upgradeId)) {
    return baseCost;
  }

  return baseCost * (level + 1);
}
