# shell/view-switcher

Main-area switcher between five states: **All** (read-only pan/zoom 2×2 grid rendering each of the four canvas engines' current content as an SVG snapshot/thumbnail, click-through into the matching single-canvas view) and the four single-canvas editors (Process/System/Object/Interaction, full-screen, native engine per canvas). Backlog is never a switcher target — it's the always-visible panel, not a view (see `shell/backlog-panel`).

ADR-0001 (Central View rendering approach, still applies), ADR-0008 (current shell/switcher shape).
