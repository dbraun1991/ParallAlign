# ADR-0003: System/Integration and Interaction Canvases — draw.io (diagrams.net)

- Status: Proposed
- Date: 2026-09-01
- Supersedes/relates to: [ADR-0001](0001-canvas-architecture-and-central-view.md)

## Context

Two canvases need general-purpose, free-form diagramming rather than a fixed notation:

- **System/Integration Canvas (S)** — external systems/services and the data/protocols exchanged at each incoming/outgoing interface.
- **Interaction Canvas (I)** — a navigation overview of menu structure and dialog flow, plus rough storyboard-level sketches of screens.

Both are architecture/flowchart-shaped rather than process- or entity-shaped, and both benefit from a large, pre-built shape-library ecosystem — network/architecture icons for S, wireframe/mockup shapes for I — rather than a bespoke notation.

## Decision

Use **draw.io / diagrams.net**, embedded via its documented embed/iframe API, for both the System/Integration Canvas and the Interaction Canvas, persisting content as `.drawio` (mxGraph XML) — one file per canvas instance.

## Details

- **License**: Apache License 2.0 ([jgraph/drawio](https://github.com/jgraph/drawio)) — permissive, no watermark or in-UI attribution requirement.
- **Format**: `.drawio` (mxGraph XML) — widely supported (desktop app, VS Code extension, Confluence/Jira plugins, GitHub/GitLab preview), so exported diagrams stay useful outside Parall-Align.
- **Shape libraries**: draw.io ships with network/AWS/Azure/GCP architecture stencils (useful for S) and wireframe/mockup stencils (useful for I) out of the box — no custom shape authoring needed to start.
- **Realtime collaboration**: not available in the plain self-hosted/embedded app. draw.io only ships realtime collaboration (shared cursors) as part of specific first-party integrations — Confluence Data Center/Cloud, the Nextcloud app — that Parall-Align is not using. Per the maintainers, adding it generically to a self-hosted embed is non-trivial ([jgraph/drawio discussion #3818](https://github.com/jgraph/drawio/discussions/3818)). Treat as a future, custom-built capability if needed.

## Consequences

- **Positive**: one integration (the draw.io embed API) covers two canvases; large built-in stencil libraries fit both S and I needs without custom shape work.
- **Positive**: permissive license, no UI constraints imposed by the tool itself (unlike bpmn-js's watermark, see [ADR-0002](0002-process-canvas-bpmn-js.md)).
- **Negative**: draw.io is a general-purpose diagram editor, not purpose-built for either "integration architecture" or "screen storyboard" — Parall-Align will likely need to curate/restrict the shape palette per canvas to keep each "deliberately incomplete" per the README's intent, rather than exposing draw.io's full generic toolset.
- **Negative**: mxGraph XML is draw.io/diagrams.net-specific, not a cross-tool standard the way BPMN is — portability is to "other draw.io-compatible tools," not a broader ecosystem.
- **Negative**: no realtime path today; adding one later would be harder than for the Object Canvas (see [ADR-0004](0004-object-canvas-mermaid.md)), since mxGraph XML isn't structured for CRDT-style merging the way plain text is.
