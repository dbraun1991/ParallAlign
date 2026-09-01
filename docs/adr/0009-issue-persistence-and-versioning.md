# ADR-0009: Issue persistence format — one JSON document per Issue, git-backed per-view history

- Status: Proposed
- Date: 2026-09-01
- Relates to: [ADR-0002](0002-process-canvas-bpmn-js.md), [ADR-0003](0003-system-integration-and-interaction-canvases-drawio.md), [ADR-0004](0004-object-canvas-mermaid.md), [ADR-0005](0005-backlog-canvas-custom-list.md), [ADR-0008](0008-issue-shell-view-switcher-and-persistent-backlog-panel.md)

## Context

Two new requirements: **every view needs its own history** (browse and revisit past versions of that one canvas, independent of the other views), and there needs to be a **JSON description of an Issue** that makes following changes and revisiting old versions possible at all — i.e. the persisted representation has to be designed with versioning in mind from the start, not bolted on later.

ADR-0002 and ADR-0004 already lean on their formats being plain-text and "diffable in git." That's a hint worth taking literally rather than reinventing a custom version-log format: **git commit history already is a change log with revisit-any-point built in**, and every one of the five canvases' native formats (BPMN XML, mxGraph XML, Mermaid text, and Parall-Align's own backlog fields) is plain text, so git diffs against them meaningfully.

## Decision

Represent each Issue as **one JSON document**, `issues/<issueId>.json`:

```json
{
  "id": "8f14e...-uuid",
  "schemaVersion": 1,
  "title": "Allow partial refunds",
  "theme": "Billing",
  "state": "mapped",
  "notes": "free-text notes area, ADR-0005",
  "createdAt": "2026-08-20T09:00:00Z",
  "updatedAt": "2026-09-01T14:22:00Z",
  "views": {
    "process":     { "id": "3c2a...-uuid", "format": "bpmn-xml",   "content": "<?xml version=\"1.0\"?>..." },
    "system":      { "id": "9b71...-uuid", "format": "drawio-xml", "content": "<mxGraphModel>...</mxGraphModel>" },
    "interaction": { "id": "e04f...-uuid", "format": "drawio-xml", "content": "<mxGraphModel>...</mxGraphModel>" },
    "object":      { "id": "5a6d...-uuid", "format": "mermaid",    "content": "erDiagram\n  CUSTOMER ||--o{ CONTRACT : has" }
  }
}
```

- `id` (top-level) is the Issue's UUID, assigned once at creation and never reused — and doubles as the Backlog entry's own identity, since the Backlog entry *is* this document's top-level fields (title/theme/state/notes), not a separate object. No second ID is needed for it.
- **Every view also carries its own `id` (UUID)**, assigned once when that view is first created and never reused or regenerated, independent of the `views.<name>` key it's currently stored under and independent of any display title. This matters because canvas naming is explicitly **not yet finalized** (`docs/adr/README.md`) — if "Process"/`views.process` is ever renamed as a product decision, every reference that currently exists (copy provenance, ADR-0010; any future history/diff tooling keyed on it) should still resolve correctly, because it points at the view's `id`, not at the string `"process"`. Names — the `views.<name>` key today, or a user-facing title later — can change; the `id` stays clean.
- `views.<name>.content` holds each canvas engine's own native persisted format verbatim (ADR-0002/0003/0004) — the JSON wrapper doesn't reinterpret or restructure it, so an exported `content` string is still a valid standalone `.bpmn`/`.drawio`/Mermaid file on its own.
- The Backlog entry (ADR-0005: title, detail/notes, theme, state) lives as top-level fields on the same document rather than a fifth `views` entry, since it's Parall-Align-native data, not a wrapped external format.

**Versioning**: the `issues/` directory is a git repository; every save is one commit touching one `issues/<issueId>.json` file. Git commit history *is* the version log — no separate custom version-number field or snapshot array inside the JSON itself.

**Git layer, for now: client-side.** ADR-0001 frames the current stage as proving feasibility, not shipping a polished product, and this is still a draft. Given that, use a fully client-side git implementation (e.g. `isomorphic-git` over an in-browser filesystem such as `lightning-fs`/IndexedDB) rather than standing up a server first — it's the cheaper, faster path to a working prototype, keeps the app backend-free like most sibling projects in this workspace, and needs no deployment/hosting decision to start proving the versioning model out. This is a starting point, not a final architecture call: a server-backed git repo (built in Express/Node, ADR-0011) remains the likely path once multi-device access or real-time collaboration (already deferred, ADR-0001) are in scope — client-side git has no story for a second person or device seeing the same Issue.

**Per-view history** (the new requirement) is derived, not stored separately: to show Process view's history, walk `git log` on `issues/<issueId>.json` and, for each commit, diff `views.process.content` against the previous commit — only commits where that specific field actually changed are shown as a "version" of that view. The same walk, filtered on a different field, gives each other view's and the Backlog entry's own independent history from the same underlying commit log. Revisiting an old version means rendering that commit's `views.<name>.content` (or backlog fields) read-only through the same canvas engine used for editing; restoring means writing that old content back as the current value and committing — never rewriting git history, matching the append-only philosophy already used for `docs/adr/`.

## Consequences

**Positive**

- One JSON document is the whole Issue — matches "json-describe the issue" literally, and stays simple to reason about, export, or hand to another tool.
- No custom version-log format to design, implement, or keep consistent — git already solves "list versions," "diff two versions," and "restore an old version."
- Per-view and per-backlog-entry history both fall out of one commit log via field-level diffing, instead of needing five separate history streams to keep synchronized.
- Each `views.<name>.content` string stays a portable, standalone file in its native format — nothing about this ADR compromises the portability ADR-0001/0002/0003/0004 already committed to.

**Negative / risks**

- Client-side git (the current choice, see Decision) means no multi-device or multi-user access to the same Issue data — everything lives in one browser's IndexedDB. Acceptable for a feasibility prototype; revisit before anything beyond single-user, single-device use is expected.
- Field-level diffing to derive per-view history assumes each commit's diff can be attributed cleanly to whichever view was actually edited; a commit that happens to touch more than one view at once (e.g. a bulk import) would show up in more than one view's history, which is probably correct behavior but should be validated once real usage patterns exist.
- A single JSON file per Issue means concurrent edits to *different* views of the same Issue by different people still touch the same file — a merge/conflict story is needed once multi-user editing is in scope (already deferred generally per ADR-0001's realtime-collaboration priority).

## Alternatives considered

- **One file per view** (`process.bpmn`, `system.drawio`, `interaction.drawio`, `object.mmd`, `backlog.json` in a per-issue directory), each with its own independent git history. Rejected as the primary format: cleanly separates concerns and sidesteps the multi-view-in-one-commit ambiguity above, but "json-describe the issue" asked for a single JSON description, and a five-file directory is a weaker match for that — plus it turns every Issue-level operation (list issues, show an issue's metadata) into a multi-file read instead of one. Worth revisiting if per-view git history at the filesystem level turns out to matter more than the single-document convenience.
- **Custom in-JSON version array** (`history: [{version, timestamp, content}, ...]` per view, hand-maintained instead of relying on git). Rejected: duplicates what git already does correctly, and would need its own pruning/storage-growth story that git's own object model already handles.
