# Trao performance checkpoint ? 2026-11-11

Status: PARTIAL IMPLEMENTATION; NOT ACCEPTED against the complete performance budget.

## Scope and commits
Production source changes are limited to src/styles/theme.css, src/components/bookshelf/bookshelf.css and src/components/bookshelf/Bookshelf.tsx. AlbumDialog source was inspected but not modified. No dependencies or package/config changes.

- 3ed6cb2: separate all eleven pale spine palettes, preserve cover/poster palettes, strengthen left edge and add spine glint/contact/soft shadows.
- 8ae3b27: rest/suspend shared rAF, cached rect with resize/scroll updates, batched live CSS token reads, lazy dialogs, loop copies 55 -> 33, skip hidden cuboid writes, automatic lite plus query overrides, specificity fix for reduced motion.
- e489709: localize tilt writes, avoid unchanged style writes; scoped removal of literal header blur in lite.
- 7f092e4: ignore pointer tracking/hover wakes in lite/coarse pointer modes.

## Measurements
Production static export, local Chrome 157 headless, 390x844, scale 1. Single local samples, not statistical medians or physical low-end Android validation.

CDP network: 150ms latency, 1.6 MiB/s divided by 8 download, 750 KiB/s divided by 8 upload. This is an explicit approximate Slow-4G profile, not a claim that all Chrome presets match exactly. CPU 4x/6x. Motion scenario: programmatic next-button selection every ~300ms for ~3 seconds; rAF callback throughput is NOT compositor/display FPS, and is NOT a drag/wheel benchmark. Long-task window also includes 1.3s settling afterward.

| Scenario | LCP ms (CDP) | CLS (CDP) | Motion callback/s | Motion tasks >50ms | Max task ms |
|---|---:|---:|---:|---:|---:|
| Baseline full 4x |1276|.03855|13.30|16|239|
| Baseline full 6x |1432|.03855|6.26|24|326|
| Scoped full 4x |1088|.03855|49.78|7|89|
| Scoped full 6x |1272|.03855|31.65|11|122|
| Scoped lite 4x |1196|.03853|50.47|9|73|
| Scoped lite 6x |1460|.03853|24.90|12|142|

Initial fetched JS gzip: baseline 148608 bytes; scoped build 148410 bytes (sum of gzip sizes of fetched script resources, not actual server compression). This was measured before the final pointer guard-only commit; that commit was built/types/regression tested but not rebenchmarked. Baseline had no lite mode.

Lighthouse mobile simulated CPU 4x/Slow-4G settings (rttMs 150, throughputKbps 1638.4):

| Sample | LCP ms | CLS | TBT ms |
|---|---:|---:|---:|
| Baseline |1354|.03721|130.5|
| Delivery full, sequential run |1204|.00268|308|
| Delivery lite, sequential run |1211|.03475|1037.7|

TBT FAILS and regressed in these samples. Earlier full/lite samples varied significantly (219/148ms); do not cherry-pick them or claim target success. Concurrent-browser-test Lighthouse runs named scoped-lighthouse-* are contaminated and excluded from acceptance. INP is NOT measured: script .click() does not create representative trusted Event Timing interactions. No field INP claim.

Trace files: motion-trace-before.json and motion-trace-scoped.json. Eight selections at CPU 4x; UpdateLayoutTree totals 1634.6ms / 1611.1ms. Not a significant demonstrated trace improvement. CDP LayerTree only reported 4 layers in this headless setup: insufficient to claim a real Layers-tab/compositor audit.

## Visual evidence
original-{1440,1024,390}.png: original pre-palette baseline.
baseline-full-{width}.png: post-palette full reference used for optimization comparisons.
delivery-full-{width}.png and delivery-lite-{width}.png: final source screenshots, with -motion variants.

Delivery static pixel diff versus post-palette reference is in delivery-pixel-diff.json. Earlier scoped diffs: 1440 max 1/255; 390 max 2/255; 1024 MAE .02486/255, 1028 pixels exceed 8/255, max 41/255 near a spine. Full static images were visually reviewed: no obvious depth/shadow loss. 1024 is NOT pixel-identical. Motion screenshots are wall-clock samples at ~100ms, not deterministic equal-animation-progress frames; no valid motion pixel-equivalence claim. No baseline drag/wheel screenshots were captured.

Lite preserves original perspective, left yaw, cuboid faces, edge lighting, ground shadow and elevated/tilted center cover. Header is solid cream in lite, texture disabled, shadows simplified, pointer tilt disabled. This is an intentional separate mode, not a full equivalence claim.

## Validation performed
- Production build, TypeScript, git diff --check pass.
- shelf-geometry-test.mjs passes counts 0?100 at 360/390/768/1366/1440/1920.
- regression.mjs passes query overrides, mocked low hardware detection, perspective/stage preserve-3d, stable-loop rest, album colors, focus/Escape/scroll restoration, lite reduced-motion override and direct pricing route.
- album-pointer-lazy-test.mjs (copy of existing pointer test with state polling instead of fixed 60ms assumption) passes physical CDP mouse/touch, drag suppression, keyboard after drag and arrows at 1366/390. Sequential runs pass. Tests run in parallel with Lighthouse on the same browser were invalid; rerun sequentially.
- Existing shelf-pose-browser-test.mjs fails its legacy exactly-one-shadow assertion because requested spine shadows intentionally add shadow-bearing faces. Not edited or silently marked passed; remaining original pose assertions were not all completed.
- Mocked auto hardware condition tested; all hardware/network branches and low-FPS fallback not independently exercised.
- Tab-hidden/offscreen pause implemented; not independently measured in this checkpoint.

## Bundle inspection
Used installed Next/Turbopack experimental-analyze --output and export --route /; NOT @next/bundle-analyzer (not installed, config/package files outside approved edit scope). bundle-graph.jsonl records this snapshot. Top client module contributions (uncompressed analyzer parts; not necessarily all initially executed modern-browser JS):
1. react-dom-client.production.js 203369 bytes.
2. polyfill-nomodule.js 112594 bytes.
3. react-server-dom-turbopack-client.browser.production.js 24066 bytes.
4. segment-cache/cache.js 20261 bytes.
5. segment-cache/scheduler.js 14022 bytes.

## Unfinished / decisions required
- Budget not achieved: full 60fps not established, lite 6x <30 callback/s, motion long tasks persist, Lighthouse TBT regresses.
- Existing mask-image remains on .bookshelf; separate static edge overlays NOT implemented. Existing overflow:hidden remains on face elements; no new clipping/flattening added, but user prohibition not fully resolved. Needs deterministic visual comparison before replacement.
- DOM copies reduced/reused and offscreen hidden, not full visible-window DOM virtualization. Hidden offscreen accessible originals may need explicit navigation/accessibility review.
- Full texture remains original gradient; no tiled texture conversion. Gradient color-mix values not precomputed. No contain:paint, new opacity/filter/mask on 3D parents, or will-change added.
- Wheel remains non-passive because it calls preventDefault and intercepts vertical wheel input in the existing implementation. Decide whether to preserve that behavior or use horizontal-only passive handling with normal vertical page scrolling.
- AlbumDialog still uses clip-path and animated SVG circle radii/filter reveal. Replacing with transform/opacity is a design/behavior decision; not silently changed.
- Font/logo next/font migration requires global.css/layout/BrandWordmark and font asset scope. Existing typography is Hina Mincho, not the older documentation's Lora/Be Vietnam default. Exact logo-outline SVG and license/provenance need approval; do not approximate logo with a different font.
- next/image migration and below-fold Server Component/content-visibility changes not done. Topics currently have null image assets. Static export needs a deliberate image loader/pre-generation decision.
- Add @next/bundle-analyzer requires permission to extend config/package scope or accept the native Turbopack analyzer already generated.
- Artifacts and temporary Chrome profile are local/untracked. No browser profile or test output added to production source commits.
