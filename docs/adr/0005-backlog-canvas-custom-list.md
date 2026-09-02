# ADR-0005: Backlog Canvas — custom list component

- Status: Proposed
- Item/state model superseded by: [ADR-0018](0018-issue-and-backlog-entries-data-model.md) — Backlog becomes a list of many `{id, name, description}` entries, no per-entry status; this ADR's "custom-built, no external format" architectural call stands unchanged.
- Date: 2026-09-01
- Supersedes/relates to: [ADR-0001](0001-canvas-architecture-and-central-view.md)

## Context

The Backlog Canvas (B) is the entry point of the project: prioritized requirement "items" as short cards (title on the front, detail on the back), grouped by theme, tracking state (open → mapped → decided) as the interface between analysis and decision-making, plus a linked notes area for context that doesn't belong on any single canvas yet (README).

Unlike the other four canvases, there is no existing open standard or file format for this — it's Parall-Align's own domain model (backlog items, states, notes, cross-links), not a diagram notation.

## Decision

Build the Backlog Canvas as a **custom-built list/board component** native to Parall-Align, rather than adopting an external open source tool.

## Details

- No external file-format dependency — persisted directly in Parall-Align's own data model (item id, title, detail, theme/grouping, state, links to notes and to elements on the other four canvases).
- In the Central View layout, Backlog occupies the full-height right-hand column (see [ADR-0001](0001-canvas-architecture-and-central-view.md)) rather than a grid quadrant, reflecting its role as the always-visible index into the other canvases.
- **Realtime collaboration**: since this is fully custom, if/when needed it can be designed for realtime from the start (e.g. Yjs-backed) rather than retrofitted — unlike the other four canvases, which depend on an external tool's own data model. Not required for the initial feasibility prototype (see [ADR-0001](0001-canvas-architecture-and-central-view.md)).

## Consequences

- **Positive**: full control over the data model, in particular the cross-canvas links that the other four canvases don't share a common ID space for (see [ADR-0001](0001-canvas-architecture-and-central-view.md)) — Backlog is a natural place to anchor that Parall-Align-native link layer.
- **Positive**: unconstrained by any third-party tool's license, watermark, or format quirks.
- **Negative**: no "for free" editor — the full list/card UI (grouping, state transitions, notes linking) must be designed and built from scratch, unlike the other four canvases.
