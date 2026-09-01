# ADR-0006: No cross-canvas element-link registry — Issue-level grouping is the association

- Status: Proposed
- Date: 2026-09-01
- Relates to: [ADR-0001](0001-canvas-architecture-and-central-view.md), [ADR-0008](0008-issue-shell-view-switcher-and-persistent-backlog-panel.md)

## Context

ADR-0001 named cross-canvas linking as an open risk of the specialized-engine-per-canvas architecture: "BPMN element IDs, mxGraph cell IDs, Mermaid node IDs, and backlog item IDs are four incompatible ID spaces. Parall-Align must design and maintain its own cross-reference layer on top of them." An earlier draft of this ADR proposed solving that directly with a per-tool link-attachment pattern (context-pad action, moddle/cell-attribute storage, overlay badges, a picker modal), plus a central link registry anchored in the Backlog Canvas.

That framing assumed cross-canvas association needs to be resolved *at the element level*, element-by-element. It doesn't: **every Parall-Align Issue already bundles its Process, System/Integration, Object, and Interaction canvases together with its Backlog entry as one unit** (README: an Issue holds all five views). Per [ADR-0008](0008-issue-shell-view-switcher-and-persistent-backlog-panel.md), the Backlog panel is now always visible alongside whichever canvas is open, for every Issue, not just in a separate overview mode. Given that, a reader moving between an Issue's canvases already has the connecting context (the Issue itself, and its always-visible Backlog entry) without needing to jump from one specific diagram element to one specific element on another diagram.

## Decision

Do **not** build a cross-canvas element-link registry, picker UI, or per-tool link-storage/overlay mechanism. The unit of cross-canvas association is the **Issue**, not the element: all five canvases belonging to one Issue are implicitly linked by belonging to that Issue, and that's sufficient for the "same item, different projections" premise in the README.

This removes the need for everything the earlier draft of this ADR proposed: no `moddleExtension`/mxGraph-cell-attribute/node-name-keyed storage per canvas, no shared registry data model, no searchable target picker, no overlay badges, no `hyperlink.follow`-style navigation event.

## Consequences

**Positive**

- Resolves the risk ADR-0001 flagged by removing its premise, not by building against it — no four-way incompatible-ID-space problem to solve at all.
- A meaningful chunk of speculative integration work (four different storage mechanisms, a shared registry, a shared picker) is simply not needed for the feasibility prototype.
- Matches how the product is actually described: an Issue is the thing being understood from five angles, not five independently-linkable diagrams that happen to share a folder.

**Negative / risks**

- No way to point at *one specific element* on another canvas (e.g. "this BPMN task ↔ this Object-canvas entity") — only at the Issue as a whole. If that granularity turns out to matter in practice, it's new scope requiring its own ADR, not something this decision leaves partially built.
- Free-text mentions of another canvas's element (e.g. in a Backlog note or BPMN `<documentation>` field) stay unresolvable/un-navigable — purely descriptive, same as before.

## Alternatives considered

- **Per-tool link-attachment pattern + Backlog-anchored registry** (this ADR's own earlier draft). Rejected: solves a problem — cross-element navigation *within* an Issue — that the Issue-level bundling plus always-visible Backlog panel (ADR-0008) already makes largely unnecessary for the prototype's goals, at a much higher implementation cost (four storage mechanisms, one shared registry and picker UI).
