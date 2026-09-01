# ADR-0001: Canvas architecture — specialized engine per canvas + read-only Central View

- Status: Proposed
- Date: 2026-09-01
- Layout partially superseded by: [ADR-0008](0008-issue-shell-view-switcher-and-persistent-backlog-panel.md) — the Central View's 2×2+B-column grid and the "navigate from Central View into a single-canvas edit view" model described below are replaced by an issue-scoped shell (sidebar issue browser, All/P/S/O/I view switcher, persistent Backlog panel). The per-canvas engine choices below (bpmn-js/draw.io/Mermaid/custom list) are unaffected.

## Context

Each backlog Issue in Parall-Align holds five views ("canvases"), as described in the README: **Process (P)**, **System/Integration (S)**, **Object (O)**, **Interaction (I)**, and **Backlog (B)**. Naming for these is not yet finalized; this ADR uses the current README naming.

Two entry points are needed into an Issue's canvases:

- **Central View** — shows all canvases of an Issue at once, read-only, scrollable and zoomable. Layout is a 2×2 grid of P/S/O/I with Backlog as a full-height column on the right:

  ```
  +---+---+---+
  | P | S |   |
  +---+---+ B |
  | O | I |   |
  +---+---+---+
  ```

- **Single-canvas edit view** — reached by navigating from the Central View, where one canvas opens full-screen and becomes interactive/editable.

The near-term goal is proving feasibility, not shipping a polished product. Priorities, in order:

1. Compatibility with existing, established open file formats/tools people already use.
2. Real-time multiplayer collaboration — explicitly lower priority, can be added later.

The project is, and will remain, fully open source; there is no constraint against copyleft-licensed dependencies. Per-tool licenses are still recorded in each canvas's ADR for future reference.

## Decision

Build each canvas on a specialized, best-fit open source tool rather than one unified canvas SDK, favoring native support for an existing open file format over a single shared data/interaction model:

| Canvas | Tool | Persisted format | Details |
|---|---|---|---|
| Process (P) | bpmn-js | BPMN 2.0 XML (`.bpmn`) | [ADR-0002](0002-process-canvas-bpmn-js.md) |
| System/Integration (S) | draw.io / diagrams.net (embed) | mxGraph XML (`.drawio`) | [ADR-0003](0003-system-integration-and-interaction-canvases-drawio.md) |
| Object (O) | Mermaid | Mermaid diagram text | [ADR-0004](0004-object-canvas-mermaid.md) |
| Interaction (I) | draw.io / diagrams.net (embed) | mxGraph XML (`.drawio`) | [ADR-0003](0003-system-integration-and-interaction-canvases-drawio.md) |
| Backlog (B) | Custom-built list component | Parall-Align-native | [ADR-0005](0005-backlog-canvas-custom-list.md) |

The **Central View** is a separate, custom-built component: a read-only, pan/zoom overview surface that renders each canvas's current content (e.g. as an SVG snapshot/thumbnail) inside the grid above, with click-through navigation into the corresponding single-canvas editor. It is not itself one of the four editing engines — it only needs to solve layout, rendering, and navigation, not editing.

## Consequences

**Positive**

- Each canvas gets a mature, standards-based editor "for free," instead of Parall-Align reimplementing BPMN/ERD/architecture-diagram editing UX.
- Output stays portable: `.bpmn` and `.drawio` files open in any BPMN/draw.io-compatible tool; Object canvases are plain-text Mermaid, diffable in git.
- Fastest path to a feasibility prototype — three of five canvases are "embed and wire up," not "build from scratch."

**Negative / risks**

- Four distinct integration surfaces (bpmn-js JS API, draw.io embed `postMessage` API, Mermaid text pipeline, custom backlog schema) instead of one — more integration and maintenance surface than a single unified engine.
- Cross-canvas linking (README: "a change or comment on one canvas can point directly at the related element on another") has no shared element-addressing scheme across tools — BPMN element IDs, mxGraph cell IDs, Mermaid node IDs, and backlog item IDs are four incompatible ID spaces. Parall-Align must design and maintain its own cross-reference layer on top of them.
- The Central View must render four different engines' output into one visually consistent overview — fonts, colors, and stroke styles will need explicit alignment/theming work.
- None of the three shape-editing tools (bpmn-js, draw.io, Mermaid) include real-time multiplayer editing out of the box. If/when required, it must be built separately per tool — see the per-canvas ADRs for feasibility notes on each.

## Alternatives considered

- **Single unified canvas SDK** (e.g. tldraw, React Flow) for all five canvases. Rejected for now: standards compatibility (`.bpmn`/`.drawio`/Mermaid interoperability with tools teams already use) was prioritized over interaction consistency, and two canvases (Process, Object) map onto existing, purpose-built open notations that a generic canvas SDK would have to reimplement from scratch.
