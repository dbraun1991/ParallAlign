# ADR-0010: Cross-issue copy — always latest version, overwrite, git-recorded provenance

- Status: Proposed
- Date: 2026-09-01
- Relates to: [ADR-0006](0006-cross-canvas-linking.md), [ADR-0009](0009-issue-persistence-and-versioning.md)

## Context

Two related requirements: copying a **view** (Process/System/Object/Interaction) or the **Backlog entry** (title/detail/theme, not state — see below) from one Issue into another, as an explicit copy-and-overwrite action; and that a copy always pulls the **newest version** of the source, never an older version picked from its history (ADR-0009).

ADR-0006 already decided against any live cross-canvas or cross-issue link — this is a one-time, one-directional copy, not a reference that stays in sync. That decision is what makes "always newest version" the only sensible rule here: a copy is a snapshot taken now, not a pointer that could later be re-resolved against a different point in the source's history.

## Decision

A copy action has a source (`sourceIssueId`, one of `process`/`system`/`object`/`interaction`/`backlog`) and a destination (an existing Issue, or one being created as part of the copy). It:

1. Reads the source's current value at HEAD — `views.<name>.content` for a view, or `{title, detail, theme}` for a Backlog entry (`state` is excluded: it reflects the destination Issue's own analysis progress, not something a copy should reset) — from `issues/<sourceIssueId>.json` (ADR-0009). Never a historical commit picked from that view's history browser — the history UI (ADR-0009) is for revisiting/restoring *within* one Issue's own timeline, not for selecting what a cross-issue copy pulls.
2. Writes that value into the destination's corresponding field, replacing whatever was there — a full overwrite, not a merge.
3. Commits the destination with a provenance-carrying message (e.g. `copy(process): from <sourceIssueId>@<sourceCommitHash>`), and additionally stores the same provenance as structured JSON on the copied field itself:

```json
"process": {
  "id": "3c2a...-uuid",
  "format": "bpmn-xml",
  "content": "...",
  "copiedFrom": { "issueId": "<sourceIssueId>", "viewId": "<sourceViewId>", "commit": "<sourceCommitHash>", "at": "2026-09-01T15:00:00Z" }
}
```

`copiedFrom` is a factual record of where this content originated, not a live reference — it is never re-read or re-resolved after the copy, and a subsequent manual edit to the field does not clear it (the provenance of the content's *origin* stays true even after it's been edited further, the same way a git blame line survives later edits to other lines).

The destination view keeps its own `id` (ADR-0009) — copying content into it never reassigns that identity, only `copiedFrom` records where the content came from. `copiedFrom.viewId` records the *source's* view `id`, not just its `sourceIssueId` + name-key: per ADR-0009, the `views.<name>` key (`process`/`system`/`object`/`interaction`) isn't guaranteed stable if canvas naming changes later, so provenance is anchored on the source view's UUID, with the name-key recorded alongside only as a human-readable label at copy time. A Backlog-entry copy needs no `viewId` — the source Issue's own `id` fully identifies it, since a Backlog entry is exactly one per Issue (ADR-0008).

## Consequences

**Positive**

- "Always newest version" removes an entire axis of complexity (picking a source version) that would otherwise have to be exposed in the copy UI.
- Provenance as structured JSON, not just a commit message, means "where did this come from" can be shown/queried in the UI directly (e.g. a small "copied from X" badge on a view) without parsing git log messages.
- Consistent with ADR-0006: copy is explicitly a one-time fork, never a link — there's nothing to keep in sync, nothing to break if the source Issue is later changed or deleted.

**Negative / risks**

- Overwrite is destructive to the destination's prior content by design — the destination's *own* history (ADR-0009) still has the pre-copy value as the previous commit, so nothing is unrecoverably lost, but the UI must make that recoverability clear rather than let a copy feel like silent data loss.
- `copiedFrom` pointing at a `sourceIssueId` that later gets deleted becomes a dangling reference — acceptable (it's a historical fact, not a dependency), but the UI should degrade gracefully (e.g. "copied from a deleted issue") rather than error.
- No cross-issue picker/search UI is designed here — only the copy mechanics. A source-issue-and-view picker is implied but left to implementation.

## Alternatives considered

- **Let the user pick a specific historical version of the source to copy from**, not just HEAD. Rejected per explicit direction ("always only pulls the newest version") — also avoids conflating this feature's scope with ADR-0009's per-view history browser.
- **Live reference instead of a copy** (destination stores a pointer to the source, re-resolved on read). Rejected: directly contradicts ADR-0006's decision against cross-issue/cross-canvas linking, and reintroduces the "four/five incompatible reference targets" problem ADR-0006 specifically avoided by not building.
