# ADR-0008: Issue shell — sidebar Issue browser, All/P/S/O/I view switcher, persistent minimizable Backlog panel

- Status: Proposed
- Date: 2026-09-01
- Supersedes (layout only): [ADR-0001](0001-canvas-architecture-and-central-view.md)
- Relates to: [ADR-0006](0006-cross-canvas-linking.md), [ADR-0007](0007-single-canvas-editor-shell.md)

## Context

ADR-0001 defined two entry points: a read-only **Central View** (a 2×2 grid of Process/System/Object/Interaction with Backlog as a full-height column to its right) and, reached by navigating from it, a **single-canvas edit view** where one canvas opens full-screen.

That model treated Backlog as one region of a specific overview screen — visible in the Central View grid, but not carried into the single-canvas edit view. In practice, every Parall-Align Issue wraps its four canvases *and* its Backlog entry together as one unit (README) — Backlog is not just one grid cell among four others, it's the always-relevant index into the rest, per its own role described in ADR-0005 ("the single interface between people doing the analysis and people making the call"). Confining it to one screen undersells that role.

## Decision

Restructure the shell around three regions, all present at once:

1. **Issue sidebar (left)** — lists Issues; selecting (activating) one loads its five canvases into the rest of the shell. Built per [ADR-0007](0007-single-canvas-editor-shell.md).
2. **Main area (center)** — once an Issue is selected, a **view switcher** offers five options: **All**, **Process**, **System/Integration**, **Object**, **Interaction**.
   - **All** renders what ADR-0001 called the Central View: a read-only, pan/zoom 2×2 grid of the four canvas engines' current content — but *without* Backlog as a grid column, since Backlog is no longer scoped to this one mode (see below). ADR-0001's rendering approach for this (SVG snapshot/thumbnail per canvas, click-through to the matching single-canvas option) still applies.
   - Each of the other four options opens that one canvas full-screen in its native editor engine (bpmn-js / draw.io / Mermaid per ADR-0002/0003/0004) — this replaces ADR-0001's separate "single-canvas edit view reached by navigating from Central View" with a direct switcher, one level flatter.
   - **Activating an Issue always lands on All.** Selecting an Issue from the sidebar — whether for the first time or returning to an Issue already visited this session — always sets the view switcher to **All**, regardless of which single-canvas view was open the last time that Issue was active. View selection is not remembered per-Issue; it resets on every activation, giving every Issue the same, predictable entry point: the overview first, drill into a single canvas deliberately.
3. **Backlog panel (right)** — the current Issue's Backlog entry, visible regardless of which of the five view-switcher options is active. Collapsible/minimized via a toggle (ADR-0007), never fully removed from the shell while an Issue is open. The minimized/expanded state is a **single global flag** for *switching views within an already-open Issue* — moving between "All"/P/S/O/I never changes whether the panel is open or minimized, only the explicit toggle does, avoiding flicker. **Activating an Issue is the one exception**: it always sets that global flag to expanded, alongside resetting the view switcher to All — so every Issue is entered with full context (overview + expanded Backlog) regardless of whatever minimized/expanded state was left over from browsing a previous Issue. After that reset, the flag behaves normally again: minimizing it while looking at this Issue's Process view keeps it minimized when switching to this Issue's Object view, until the next Issue activation (or manual toggle) changes it again.

## Consequences

**Positive**

- Matches the product's actual mental model directly: an Issue is a bundle of five views, not four-views-plus-a-separate-overview-tool.
- Backlog's "always-visible index" role (ADR-0005) is now literally true in every view, not just a dedicated overview screen — closer to the README's "single interface between analysis and decision" framing.
- One level of navigation removed: switching canvases is a direct switcher action, not "return to Central View, then click into a different canvas."
- Makes [ADR-0006](0006-cross-canvas-linking.md)'s cross-canvas-linking mechanism unnecessary — Backlog, and thus the Issue's context, is already on-screen alongside any canvas being viewed.
- Every Issue has the same, predictable entry point — All view, Backlog expanded — regardless of what state a previous session or a different Issue was left in, so switching between Issues never carries confusing leftover UI state with it.

**Negative / risks**

- The "All" overview loses Backlog as a visible grid member (it's now beside the grid, not part of it) — needs a UI check that this still reads as one coherent Issue overview rather than two disconnected regions.
- Backlog's minimize/expand state is global *within* an Issue session, but reset to expanded on every Issue activation (see Decision) — so it's not purely global in the strictest sense, it's "global, with one deliberate reset trigger." That's two rules to implement correctly (persist across view switches, reset on Issue activation) rather than one; worth a short comment at the implementation site so a future edit doesn't collapse it back to one behavior by accident.
- The Issue sidebar is now permanent chrome (not just a Central-View-specific control), so its own collapse/resize behavior (ADR-0007) has to coexist with three simultaneously-visible panels (Issue sidebar, main area, Backlog panel) on narrower viewports — more layout-budget pressure than the original two-entry-point model had.

## Alternatives considered

- **Keep Backlog Central-View-only, as ADR-0001 originally specified.** Rejected per direction: Backlog needs to stay visible while working in any single canvas, not just in the overview.
- **Backlog as a modal/overlay toggled on demand in single-canvas views**, rather than a persistent docked panel. Rejected: "always visible... can be minimized" calls for a docked, collapsible panel — present by default, dismissible, not something that has to be reopened as a modal each time.
