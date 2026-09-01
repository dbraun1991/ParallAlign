# ADR-0017: All-view renders real per-canvas thumbnails

- Status: Proposed
- Date: 2026-09-02
- Relates to: [ADR-0001](0001-canvas-architecture-and-central-view.md), [ADR-0002](0002-process-canvas-bpmn-js.md), [ADR-0003](0003-system-integration-and-interaction-canvases-drawio.md), [ADR-0004](0004-object-canvas-mermaid.md), [ADR-0008](0008-issue-shell-view-switcher-and-persistent-backlog-panel.md)

## Context

The "All" view has shown static "not yet implemented" placeholder tiles since the shell skeleton. ADR-0001 named the intended design — "SVG snapshot/thumbnail per canvas, click-through to the matching single-canvas option" — and ADR-0008 explicitly kept that rendering approach when it superseded ADR-0001's layout, but neither ADR ever decided the actual mechanism for getting an SVG out of three very different engines. Direction given: render the real content, with live-updates-from-saves explicitly deferred to a later pass.

Checked each engine's actual export capability before deciding, rather than assuming a uniform approach exists:

- **bpmn-js**: `saveSVG()` exists on `BaseViewer` (confirmed by reading `node_modules/bpmn-js/lib/BaseViewer.js` directly) — available on the lighter, read-only `Viewer` class, not just the `Modeler` already used for editing. It internally calls `contentNode.getBBox()`, which requires the container to actually be laid out by the browser — `display:none` breaks it; the container must be positioned off-screen instead.
- **Mermaid**: `mermaid.render(...)` already returns raw SVG markup directly — the same call `object-canvas.js`'s live preview already makes, no separate export step.
- **draw.io embed**: confirmed via `drawio.com`'s embed-mode FAQ that after sending a `load` action, the editor sends back an **acknowledgement `{event:'load', ...}`** once the diagram has actually finished loading — the real synchronization point before an `export` action is safe to send. `{action:'export', format:'svg'}` then returns `{event:'export', data:'data:image/svg+xml;...'}`, a ready-to-use data URI, distinct in shape from the raw SVG markup the other two engines return.

## Decision

Add a thumbnail-rendering path per engine, orchestrated by a new `src/canvases/thumbnails.js` module rather than growing `shell-state.js` with a fourth rendering concern:

- **Process**: `renderProcessThumbnail(xml)` in `process-canvas.js` — a temporary off-screen (`position:absolute; left:-9999px`, not `display:none`) container + `Viewer` instance, `importXML` + `saveSVG()`, destroyed immediately after.
- **Object**: `renderObjectThumbnail(text, theme)` in `object-canvas.js` — the same `mermaid.render` call the live preview uses.
- **System/Interaction**: `renderDrawioThumbnail(xml, theme)` in `drawio-canvas.js` (shared, same as the live mount) — a temporary hidden iframe driven through the confirmed `init → load → load-ack → export → export-response` sequence, then torn down. No lingering resource, unlike the live `mountDrawioCanvas`.

**Caching, not live updates**: `thumbnails.js` caches each result keyed on `(issueId, view, content-string)` — a repeat visit to All with unchanged content reuses the cached result instead of re-rendering (meaningfully avoids redundant draw.io iframe round-trips, the slowest of the three). This is a performance optimization within this pass, explicitly **not** the deferred live-update feature: it does nothing to reflect an edit happening in another view while All isn't open. Live updates need a reactive invalidation hook fired from each canvas's own `onChange` and are intentionally left for a later ADR/pass.

**Click-through** from a tile to its matching single-canvas view is included — ADR-0001's own stated intent, cheap to add now that tiles show real content, not new scope.

## Consequences

**Positive**

- Fulfills ADR-0001/0008's long-standing stated intent using each engine's own real, documented export capability — not a workaround.
- The content-based cache means the common case (revisiting All without having edited anything) is fast, without needing any of the live-update machinery.
- One new orchestration module keeps the per-engine rendering logic where the rest of each engine's logic already lives, consistent with the existing module boundaries.

**Negative / risks**

- Three different result shapes (raw SVG markup for two engines, a data URI for draw.io) mean the tile markup can't be perfectly uniform — handled explicitly (`x-html` vs. `<img :src>`), not papered over.
- First visit to All for an Issue with unedited System/Interaction content still pays the full draw.io iframe load→export cost twice (once per canvas) — no way around this without live-tracking (deferred) or a non-iframe drawio renderer (not available, per ADR-0003).
- The cache is unbounded (a `Map`, never evicted) — acceptable at this app's current scale (a handful of Issues in a feasibility prototype); worth revisiting if that changes.

## Alternatives considered

- **Render thumbnails live**, reacting immediately to any canvas's `onChange`. Rejected for this pass per explicit direction — a real feature needing a cross-view invalidation hook, deferred rather than half-built now.
- **No caching, always re-render on every All visit.** Rejected: the draw.io round-trip is slow enough (observed during Step 4 testing) that repeated redundant renders would make All feel sluggish for no benefit when nothing changed.
