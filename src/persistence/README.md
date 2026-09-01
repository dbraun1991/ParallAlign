# persistence

Issue data model (one JSON document per Issue, `issues/<issueId>.json`) and the client-side git layer (`isomorphic-git` over IndexedDB) that makes every save a commit. Per-view/per-Backlog-entry history is derived here by walking commits and diffing one field at a time — not stored separately.

When a server-backed git layer is eventually built (ADR-0011, deferred), this module's git-walking/diffing logic is the reference the server-side implementation should mirror.

ADR-0009.
