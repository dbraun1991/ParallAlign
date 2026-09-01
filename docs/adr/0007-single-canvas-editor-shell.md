# ADR-0007: Issue-shell panels — resizable Issue sidebar + Backlog panel, bpmn-js properties panel for Process Canvas

- Status: Proposed
- Date: 2026-09-01
- Relates to: [ADR-0002](0002-process-canvas-bpmn-js.md), [ADR-0003](0003-system-integration-and-interaction-canvases-drawio.md), [ADR-0008](0008-issue-shell-view-switcher-and-persistent-backlog-panel.md)

## Context

[ADR-0008](0008-issue-shell-view-switcher-and-persistent-backlog-panel.md) defines the overall shell: a left Issue sidebar, a main area that switches between "All" (the four-canvas overview) and one of the four single-canvas editors, and a persistent, minimizable Backlog panel on the right. This ADR covers *how* the two chrome panels — Issue sidebar and Backlog panel — are built, plus one Process-Canvas-specific addition.

The Issue sidebar needs two independent pieces of UX: a **resizable panel** (drag handle, `mousedown`/`mousemove` resize, `ew-resize` cursor, min/max width clamped) so it doesn't permanently claim a fixed share of the screen, and a **responsive mobile collapse** so it doesn't just get cramped below a phone-width viewport. For the latter, a sibling project in this workspace already has a proven, dependency-free pattern worth reusing directly:

- **`Climb-Buddy-Belay`** (`index.html`, `AGENTS.md`'s "Responsive sidebar" section): a simple `<aside class="sidebar">` that, below a 768px breakpoint, collapses into a native `<details class="sidebar-collapse" open>`/`<summary>` disclosure — no JS, pure CSS — so the sidebar stays usable on mobile without a bespoke hamburger-menu implementation.

Separately, the bpmn.io ecosystem ships an official **properties panel** — [`@bpmn-io/properties-panel`](https://github.com/bpmn-io/bpmn-js-properties-panel) — for editing a selected BPMN element's own attributes (name, documentation, …). This is unrelated to cross-canvas association (ADR-0006 decided against building that at all) — it's purely about editing the attributes of whatever element is selected within the Process Canvas itself.

## Decision

**Issue sidebar (left)**:

- Resizable via a drag-handle mechanism (`mousedown`/`mousemove` resize, `ew-resize` cursor, min/max width clamped), holding a search field and a list of Issues (title + theme/state, per the Backlog Canvas's data model, ADR-0005) — this is the "used for issues" browser, not a per-canvas file browser.
- Responsive collapse via `Climb-Buddy-Belay`'s `<details>`/`<summary>` pattern below the same mobile breakpoint — no separate mobile nav implementation needed.

**Backlog panel (right)** — same resizable-`<aside>` mechanism, mirrored to the right edge, present in every view (All and each of the four single-canvas editors per ADR-0008) rather than appearing only inside one grid layout. Add a minimize/collapse toggle (distinct from the mobile `<details>` collapse — this one is a deliberate user action available at any viewport width, since ADR-0008 requires the Backlog panel to be dismissible without leaving the current view).

**Process Canvas properties panel** — adopt `@bpmn-io/properties-panel` for editing the selected element's own BPMN attributes, docked between the canvas and the Backlog panel, shown only in the Process single-canvas view (not in "All", not in the other three canvases, which have no equivalent official package — System/Integration and Interaction stay without a dedicated properties panel for now). Constrain which fields/groups it shows to match ADR-0002's "constrained subset/profile of BPMN" intent, rather than exposing its full default vocabulary.

## Consequences

**Positive**

- The mobile-collapse interaction is reused wholesale from a working sibling implementation (`Climb-Buddy-Belay`) instead of designed from scratch, and the resize interaction (drag handle, min/max clamp) is a small, self-contained addition on top of it.
- The Issue sidebar's and Backlog panel's shared resize mechanism means one CSS/JS implementation serves both, despite sitting on opposite edges of the shell.
- `@bpmn-io/properties-panel` gives the Process Canvas a maintained, BPMN-aware element-editing UI "for free," consistent with ADR-0001's general rationale for choosing mature tooling over reimplementation.

**Negative / risks**

- `@bpmn-io/properties-panel` carries the same [bpmn.io License](https://bpmn.io/license/) watermark/attribution constraint as bpmn-js (ADR-0002), now on a second UI surface.
- Three of five main-area states (All, System/Integration, Interaction, Object) have no element-properties panel at all — only Process does — so the shell's right-of-canvas region is asymmetric depending on which view is active; needs a defined empty/absent state rather than reserving dead space.
- The Backlog panel's minimize toggle is **global** state (one flag, not per-view or per-Issue) — see ADR-0008's resolution of this.

## Alternatives considered

- **Modal-based element property editing**, rather than a docked panel. Rejected for Process Canvas: a docked panel keeps attributes visible while browsing the canvas, where a modal would have to be reopened for every element; a modal-based picker is only really justified for something like a cross-file link picker, a use case ADR-0006 has already decided Parall-Align doesn't need.
- **Hand-built properties panel** instead of `@bpmn-io/properties-panel`. Rejected: ADR-0001's stated priority is mature "for free" tooling over reimplementation, and the official panel is a closer fit than reproducing it.
