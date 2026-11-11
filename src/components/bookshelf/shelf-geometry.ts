export function fitShelfHeight({ width, baseHeight, count, coverRatio, spineRatio, gapRatio, clearance, minScale }: {
  width: number;
  baseHeight: number;
  count: number;
  coverRatio: number;
  spineRatio: number;
  gapRatio: number;
  clearance: number;
  minScale: number;
}): number {
  // The selected album stays centered, including at either end of the row.
  const span = coverRatio + clearance + 2 * Math.max(0, count - 1) * (spineRatio + gapRatio);
  return Math.max(baseHeight * minScale, Math.min(baseHeight, width / span));
}