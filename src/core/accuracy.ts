import { GameState } from './State';

const MULTIPLIER_STEP_STREAK = 10;
const MULTIPLIER_STEP_AMOUNT = 0.2;
const MAX_ACCURACY_MULTIPLIER = 2.5;
const STAR_POWER_MULTIPLIER = 4;
const STAR_POWER_STREAK_THRESHOLD = 50;
const STAR_POWER_DURATION = 10;

type AccuracyShot = {
  remainingProjectiles: number;
  hit: boolean;
};

let nextShotId = 1;
const activeShots = new Map<number, AccuracyShot>();

export function createAccuracyShot(projectileCount: number): number {
  const shotId = nextShotId++;
  activeShots.set(shotId, {
    remainingProjectiles: projectileCount,
    hit: false
  });
  return shotId;
}

export function recordAccuracyHit(shotId?: number): void {
  if (shotId === undefined) return;

  const shot = activeShots.get(shotId);
  if (shot) {
    shot.hit = true;
  }
}

export function resolveAccuracyProjectile(shotId?: number): boolean {
  if (shotId === undefined) return false;

  const shot = activeShots.get(shotId);
  if (!shot) return false;

  shot.remainingProjectiles -= 1;
  if (shot.remainingProjectiles > 0) {
    return false;
  }

  activeShots.delete(shotId);
  return !shot.hit;
}

export function clearAccuracyShots(): void {
  activeShots.clear();
}

export function applyAccuracyHit(state: GameState): void {
  state.accuracyStreak += 1;

  if (!state.starPowerActive && state.accuracyStreak >= STAR_POWER_STREAK_THRESHOLD) {
    state.starPowerActive = true;
    state.starPowerTimeRemaining = STAR_POWER_DURATION;
    state.starPowerCharge = 1;
    state.scoreMultiplier = STAR_POWER_MULTIPLIER;
    return;
  }

  state.starPowerCharge = state.starPowerActive
    ? Math.max(0, state.starPowerTimeRemaining / STAR_POWER_DURATION)
    : Math.min(1, state.accuracyStreak / STAR_POWER_STREAK_THRESHOLD);
  state.scoreMultiplier = calculateAccuracyMultiplier(state);
}

export function resetAccuracy(state: GameState): void {
  state.accuracyStreak = 0;
  state.scoreMultiplier = 1;
  state.starPowerCharge = 0;
  state.starPowerActive = false;
  state.starPowerTimeRemaining = 0;
}

export function updateStarPower(state: GameState, deltaTime: number): void {
  if (!state.starPowerActive) return;

  state.starPowerTimeRemaining = Math.max(0, state.starPowerTimeRemaining - deltaTime);
  state.starPowerCharge = state.starPowerTimeRemaining / STAR_POWER_DURATION;
  state.scoreMultiplier = STAR_POWER_MULTIPLIER;

  if (state.starPowerTimeRemaining <= 0) {
    resetAccuracy(state);
  }
}

function calculateAccuracyMultiplier(state: GameState): number {
  if (state.starPowerActive) {
    return STAR_POWER_MULTIPLIER;
  }

  const multiplierSteps = Math.floor(state.accuracyStreak / MULTIPLIER_STEP_STREAK);
  return Math.min(
    MAX_ACCURACY_MULTIPLIER,
    1 + multiplierSteps * MULTIPLIER_STEP_AMOUNT
  );
}
