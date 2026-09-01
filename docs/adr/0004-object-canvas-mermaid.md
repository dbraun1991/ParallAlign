# ADR-0004: Object Canvas — Mermaid

- Status: Proposed
- Date: 2026-09-01
- Supersedes/relates to: [ADR-0001](0001-canvas-architecture-and-central-view.md)

## Context

The Object Canvas (O) shows the business entities involved in a backlog item and the relationships between them, at a business level of abstraction — not schema/implementation detail (README). This maps closely onto Mermaid's entity-relationship (`erDiagram`) or class (`classDiagram`) diagram types, which are plain-text, diffable, and already familiar to many engineers.

## Decision

Use the **Mermaid** renderer to render the Object Canvas from a Mermaid diagram-definition text source (`erDiagram`, or `classDiagram` where relationships need more structure), stored as the canvas's persisted content.

## Details

- **License**: MIT ([mermaid-js/mermaid](https://github.com/mermaid-js/mermaid)) — fully permissive.
- **Format**: Mermaid's own plain-text diagram syntax — not a binary/XML format, so content is human-readable, diffable, and versionable directly in git; broadly supported for read-only rendering elsewhere (GitHub, GitLab, Notion natively render Mermaid blocks).
- **Editing model**: Mermaid itself has no interactive editor — it is a text-to-SVG renderer. The "edit" experience for the Object Canvas is therefore a structured text/form editor with live preview (à la the Mermaid Live Editor), not drag-and-drop direct manipulation like bpmn-js or draw.io. This is a meaningfully different interaction model from the other canvases and should be called out explicitly in design.
- **Realtime collaboration**: not built into mermaid.js — it has no session concept. The hosted Mermaid Chart product offers multiplayer editing as a paid feature, not part of the open-source library. Because the underlying content is plain text, this is the most tractable of the three shape-editing tools to add realtime to later: a standard collaborative-text-editor stack (e.g. CodeMirror + Yjs) editing the Mermaid source, re-rendering through mermaid.js on change, would work without needing Mermaid itself to support collaboration.

## Consequences

- **Positive**: content is plain text — trivially diffable/versionable, and the easiest of the four canvas tools to add realtime editing to later. No license friction.
- **Positive**: MIT license, mature and widely-adopted renderer.
- **Negative**: no native direct-manipulation editing — the Object Canvas will feel different to use than the Process/System/Interaction canvases (text+preview vs. drag-and-drop), which may work against the "parallel view, consistent feel" goal in the README. Worth validating with users early.
- **Negative**: layout is auto-computed by Mermaid's layout engine, not user-positioned — less control over entity placement than a freeform diagram tool would give.
