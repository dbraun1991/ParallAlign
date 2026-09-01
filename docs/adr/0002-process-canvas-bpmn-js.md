# ADR-0002: Process Canvas — bpmn-js

- Status: Proposed
- Date: 2026-09-01
- Supersedes/relates to: [ADR-0001](0001-canvas-architecture-and-central-view.md)

## Context

The Process Canvas (P) shows the sequence of business activities needed to fulfill a backlog item: steps, alternative/concurrent paths, and the conditions that route between them — kept at business-activity level, not implementation/technical sequencing (README).

BPMN 2.0 is the established open standard notation for exactly this kind of diagram, with broad tool support beyond ParallAlign.

## Decision

Use **bpmn-js** (the bpmn.io / Camunda open-source BPMN 2.0 rendering + modeling toolkit) to render and edit the Process Canvas, persisting content as standard BPMN 2.0 XML (`.bpmn`).

## Details

- **License**: [bpmn.io License](https://bpmn.io/license/) — not a standard OSS license like MIT/Apache. Free to use, including commercially, but requires the "powered by bpmn.io" watermark to stay visible and unmodified unless a separate commercial embedding license is purchased. Since ParallAlign is open source with no commercial-product constraint, this is acceptable — but the watermark must be factored into the Process Canvas's UI design (and into Central View thumbnails).
- **Format**: BPMN 2.0 XML (`.bpmn`) — an ISO/OMG standard; files stay openable in Camunda Modeler and other BPMN-compatible tools.
- **Realtime collaboration**: not built in. bpmn-js is a single-editor library; Camunda's collaborative Web Modeler is a separate, non-open-source product. Adding realtime later would mean wrapping bpmn-js's command stack with a CRDT layer (e.g. Yjs) ourselves — done by others in the wild, but not off-the-shelf.

## Consequences

- **Positive**: standards-compliant process diagrams "for free," mature and actively maintained editor.
- **Negative**: the bpmn.io watermark is a permanent, non-removable UI element under the free license.
- **Negative**: BPMN's full vocabulary (events, gateways, lanes, etc.) is broader than "business-activity level." The Process Canvas will need a constrained subset/profile of BPMN — rather than exposing bpmn-js's whole palette — to stay true to the README's "deliberately incomplete" intent.
