# Instructions for coding agents

Read `docs/MASTER_PROMPT.md`, `docs/DESIGN_SYSTEM.md`, `docs/PRODUCT.md`, and `docs/IMPLEMENTATION.md` before editing.

- This directory is the Gửi Một Chút application. Keep all project code and documentation in this directory; do not edit the anniversary invitation in the parent directory.
- Preserve the bookshelf hero, warm editorial direction, and Vietnamese copy described in MASTER_PROMPT. Do not replace the shelf with flat cards.
- All shared visual values live in `src/styles/theme.css`. Components consume semantic CSS variables. Never scatter hex colors, fonts, radii, shadows, spacing scales, or animation timings across components.
- Component styles may set local semantic aliases. One-off overrides must be scoped to a named component or explicit data attribute, documented, and must not leak globally. Do not use !important as a theming strategy.
- Use 5 template records, not 6. Preview opens the template's screen-recording video; Visit page opens its independently hosted demo URL. Neither action invents an interactive demo.
- Prices: 97,000 VND and 214,000 VND. Separate first-order campaign: first 5 eligible customers free, later eligible first orders 43,000 VND. Campaign applies to the standard template package; custom upgrades are quoted separately. This scope is a provisional business assumption documented in PRODUCT.md.
- Pricing is a separate `/bang-gia/` page. Landing shows a small starting-price reference and a link, not the full price table.
- No functioning login, editor, uploads, payment, database, or admin in phase 1. Reserve extension boundaries in code and documentation; do not show broken or fake controls.
- Never invent customer reviews, popularity, scarcity, campaign balances, video URLs, contact accounts, delivery deadlines, or hosting guarantees.
- Preserve normal page scrolling. Support touch, keyboard, reduced motion, focus handling, and stable layouts.
- Keep structured business data separate from UI. Business/contact placeholders must produce explicit unavailable states.
- Verify build, types, desktop/mobile layout, drag versus click, dialog focus, missing assets, and direct loading of `/bang-gia/`.
- Report completed work, validation performed, and actual limitations. Do not claim visual checks that were not performed.
