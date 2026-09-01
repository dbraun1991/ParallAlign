# ADR-0011: Server-backed persistence — Express (Node), not a second-language backend

- Status: Proposed
- Date: 2026-09-01
- Relates to: [ADR-0001](0001-canvas-architecture-and-central-view.md), [ADR-0002](0002-process-canvas-bpmn-js.md), [ADR-0003](0003-system-integration-and-interaction-canvases-drawio.md), [ADR-0004](0004-object-canvas-mermaid.md), [ADR-0009](0009-issue-persistence-and-versioning.md)

## Context

ADR-0009 chose client-side git (`isomorphic-git`/IndexedDB) as a deliberate starting point, not a final architecture, and named a server-backed git repo as the likely next step "once multi-device access or real-time collaboration are in scope." This ADR settles what that server is *built in*, ahead of actually needing it, so the choice doesn't get made implicitly by whatever's convenient later.

A Python backend was considered first, on the general instinct that a backend serving JS-heavy canvas engines (bpmn-js, draw.io, Mermaid) might want a different-language server behind it. Checking that instinct against ADR-0002/0003/0004: all three canvas engines are pure client-side JS libraries — they render and edit entirely in the browser, with "Node" only involved as package/build tooling (npm) to pull them in, not as a runtime dependency. None of the three canvas engines creates any backend requirement, in Python or otherwise. The only thing that actually needs a server at all is ADR-0009's persistence layer, once client-side git stops being sufficient.

Separately, Mermaid's plain-text source format (already noted in ADR-0004/0009 as diffable) makes it the one canvas where real-time collaborative editing is comparatively cheap — a CRDT/OT sync on a text field, unlike synchronizing concurrent drag-and-drop edits on the draw.io or bpmn-js canvases. The server, when it exists, has a simple shape either way: Express plus filesystem storage, containerized via Docker — a well-understood, minimal-setup pattern for a small Node service.

## Decision

When a server-backed persistence layer is actually built (per ADR-0009's deferred trigger), it is **Express (Node.js)**, not Python or any other language, for three reasons specific to this project rather than a general "stay consistent" preference:

1. **Git library continuity.** ADR-0009 already committed to `isomorphic-git` client-side. A Node server can reuse the same library (or `simple-git`) and the same per-view field-diffing logic already written for the client, instead of re-deriving equivalent git-walking/diffing logic in a second language (e.g. GitPython).
2. **Realtime path stays open cheaply.** If/when Mermaid-source real-time collaboration (noted above) is pursued, Yjs — the most mature CRDT text-sync library — is JS-native (`y-websocket` server). An Express backend can add this directly; a Python backend would mean running a second Node process for realtime anyway, defeating the point of picking Python.
3. **One runtime for a solo build.** Express plus filesystem storage plus Docker is a small, well-understood scaffolding shape requiring little design work to stand up on its own. A second language means a second runtime, a second dependency manager, and a second deploy target to maintain for no capability ParallAlign actually needs — nothing in the current feature set (ADR-0001 through ADR-0010) calls for anything Python-specific (no data science, ML, or existing Python service to integrate with).

Scope of the Express server, once built: owns the server-side git repository under `issues/` (ADR-0009) and exposes it over HTTP to the frontend — replacing the client's direct `isomorphic-git`/IndexedDB access, not running alongside it. Concurrent-edit/merge handling and real-time collaboration remain separately deferred (ADR-0009's noted risk, ADR-0001's realtime priority) — this ADR only fixes the language/framework, not the timing or the collaboration model.

## Consequences

**Positive**

- No second language/runtime to install, deploy, or reason about — one Node-based stack end-to-end for both frontend and backend, consistent with how the other sibling projects in this workspace each stick to a single language throughout.
- Git-handling logic can plausibly be shared or at least mirrored 1:1 between the client's temporary `isomorphic-git` usage (ADR-0009) and the eventual server, instead of maintaining two independent implementations of "diff this field across commits."
- Leaves the Yjs/realtime door open for Mermaid without committing to build it now — the framework choice doesn't foreclose that path later.
- Express plus filesystem storage plus Docker is small enough that little design work is needed to stand up the server itself when the time comes.

**Negative / risks**

- Ties the eventual server to the Node ecosystem's tradeoffs (e.g. its concurrency model for filesystem/git operations) — acceptable here since none of the four canvas engines or the persistence model (ADR-0009) call for anything Node handles poorly.
- This ADR fixes *language*, not *when* the server gets built or *how* concurrent multi-user edits to one Issue's JSON document are resolved — both remain open per ADR-0009's own noted risk; a follow-up ADR is still needed once that work actually starts.

## Alternatives considered

- **Python backend** (e.g. FastAPI/Flask + GitPython). Rejected: no Python-specific capability is needed anywhere in the current scope (ADR-0001–0010); it would require re-implementing git-diffing logic already designed for `isomorphic-git` on the client, and would need a separate Node process anyway if Yjs-based realtime is ever added for the Mermaid canvas — net addition of a second runtime for no corresponding benefit.
- **No server, keep client-side git indefinitely.** Not rejected outright — this remains correct until multi-device/multi-user access is actually needed (ADR-0009). This ADR only pre-decides the language for when that trigger is hit, so the choice isn't made implicitly later.
