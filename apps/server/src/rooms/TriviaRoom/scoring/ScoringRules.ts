/**
 * Pure scoring helpers. Keep logic here side-effect free and unit-testable.
 */
export const computeScore = (params: {
  position: number; // 0-based
  roundStartTime: number;
  roundTimeMs: number;
  nowMs?: number;
}): number => {
  const { position, roundStartTime, roundTimeMs } = params;
  const now = params.nowMs ?? Date.now();

  if (position === 0) return 10;

  const elapsed = now - roundStartTime;
  const timeRemaining = Math.max(0, roundTimeMs - elapsed);
  const timeFraction = roundTimeMs > 0 ? timeRemaining / roundTimeMs : 0;

  const maxPoints = 9;
  const minPoints = 1;
  const bonusPoints = maxPoints - minPoints;

  const score = minPoints + (bonusPoints * Math.sqrt(timeFraction));
  return Math.max(minPoints, Math.round(score));
};


