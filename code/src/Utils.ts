/**
 * Generates nice tick positions for a scale.
 * 
 * @param min       - The minimum value of the scale range
 * @param max       - The maximum value of the scale range
 * @param maxTicks  - Maximum number of tick marks to generate
 * @returns         - Array of "nice" tick positions
 */
export function computeTickPositions(min: number, max: number, maxTicks: number): number[] {
  const range = max - min;
  if (range === 0 || maxTicks < 2) return [min];

  // Compute the raw step size, then round it up to 1, 2, or 5 × 10^n
  const rawStep = range / (maxTicks - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;  // in range [1, 10)

  // Snap to the nearest nice multiplier: 1, 2, or 5
  const niceMultiplier = normalized <= 1 ? 1
                       : normalized <= 2 ? 2
                       : normalized <= 5 ? 5
                       : 10;

  const step = niceMultiplier * magnitude;

  // Align start to a clean multiple of step
  const start = Math.ceil(min / step) * step;

  const ticks: number[] = [];
  // Use rounding to avoid floating-point drift
  for (let tick = start; tick <= max + step * 1e-10; tick += step) {
    ticks.push(parseFloat(tick.toFixed(10)));
    // Safety cap: never exceed maxTicks
    if (ticks.length >= maxTicks) break;
  }

  return ticks;
}