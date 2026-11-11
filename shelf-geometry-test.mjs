import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fitShelfHeight } from './src/components/bookshelf/shelf-geometry.ts';

const theme = await readFile(new URL('./src/styles/theme.css', import.meta.url), 'utf8');
const token = name => Number(theme.match(new RegExp(`${name}:\\s*([\\d.]+)`))[1]);
const geometry = {
  coverRatio: token('--book-cover-ratio'), spineRatio: token('--book-spine-ratio'),
  gapRatio: token('--book-gap-ratio'), clearance: token('--shelf-fit-clearance'),
  minScale: token('--shelf-min-scale'),
};
for (const width of [360, 390, 768, 1366, 1440, 1920]) {
  const baseHeight = width < 768 ? 300 : 460;
  let previous = baseHeight;
  for (const count of [0, 1, 2, 5, 10, 12, 20, 50, 100]) {
    const height = fitShelfHeight({ ...geometry, width, baseHeight, count });
    assert(Number.isFinite(height));
    assert(height <= previous && height <= baseHeight);
    assert(height >= baseHeight * geometry.minScale);
    const span = geometry.coverRatio + geometry.clearance + 2 * Math.max(0, count - 1) * (geometry.spineRatio + geometry.gapRatio);
    assert(height * span <= width + .001 || height === baseHeight * geometry.minScale);
    previous = height;
  }
  console.log(`PASS ${width}px: counts 0–100 fit monotonically with bounded readable height`);
}
assert(geometry.spineRatio < .1 && geometry.gapRatio > .04);
console.log('PASS slim spine and increased spacing tokens');