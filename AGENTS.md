# Instructions for coding agents

Read `docs/MASTER_PROMPT.md`, `docs/DESIGN_SYSTEM.md`, `docs/PRODUCT.md`, and `docs/IMPLEMENTATION.md` before editing.

- This directory is the Trao application. Keep all project code and documentation in this directory; do not edit the anniversary invitation in the parent directory.
- Preserve the bookshelf hero, warm editorial direction, and Vietnamese copy described in MASTER_PROMPT. Do not replace the shelf with flat cards.
- All shared visual values live in `src/styles/theme.css`. Components consume semantic CSS variables. Never scatter hex colors, fonts, radii, shadows, spacing scales, or animation timings across components.
- `docs/DESIGN_SYSTEM.md` defines the current UI color roles: paper cream canvas, forest green content/actions, electric purple highlights and soft glows. Keep eleven shelf topics separate from the five template records.
- Component styles may set local semantic aliases. One-off overrides must be scoped to a named component or explicit data attribute, documented, and must not leak globally. Do not use !important as a theming strategy.
- Use 5 template records, not 6. Preview opens the template's screen-recording video; Visit page opens its independently hosted demo URL. Neither action invents an interactive demo.
- Prices: 97,000 VND and 214,000 VND. Separate first-order campaign: first 5 eligible customers free, later eligible first orders 43,000 VND. Campaign applies to the standard template package; custom upgrades are quoted separately. This scope is a provisional business assumption documented in PRODUCT.md.
- Pricing is a separate `/bang-gia/` page, reachable from navigation. Do not show a price link below the landing shelf.
- No functioning login, editor, uploads, payment, database, or admin in phase 1. Reserve extension boundaries in code and documentation; do not show broken or fake controls.
- Never invent customer reviews, popularity, scarcity, campaign balances, video URLs, contact accounts, delivery deadlines, or hosting guarantees.
- Preserve normal page scrolling. Support touch, keyboard, reduced motion, focus handling, and stable layouts.
- Keep UI copy minimal. Do not add unsolicited helper paragraphs, usage tutorials, explanatory subtitles, or repeated instructions when controls already communicate the action. Add instructional copy only when explicitly requested or essential to prevent a material error; preserve necessary error/empty/unavailable states and accessible labels. Do not replace removed visible guidance with hidden duplicate prose.
- Keep structured business data separate from UI. Business/contact placeholders must produce explicit unavailable states.
- Verify build, types, desktop/mobile layout, drag versus click, dialog focus, missing assets, and direct loading of `/bang-gia/`.
- Report completed work, validation performed, and actual limitations. Do not claim visual checks that were not performed.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
