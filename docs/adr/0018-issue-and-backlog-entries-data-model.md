# ADR-0018: Issue simplified to name+status; Backlog becomes a list of ephemeral entries

- Status: Proposed
- Date: 2026-09-02
- Supersedes: [ADR-0005](0005-backlog-canvas-custom-list.md)'s item/state model; the Issue-schema portion of [ADR-0009](0009-issue-persistence-and-versioning.md)
- Relates to: [ADR-0008](0008-issue-shell-view-switcher-and-persistent-backlog-panel.md), [ADR-0010](0010-cross-issue-copy.md) (see [ADR-0019](0019-cross-issue-copy-views-and-entries.md), which supersedes it)

## Context

Direction change from the original model: an Issue was `{title, theme, state, notes}` plus four canvases, with "the Backlog entry" being those same four scalar fields — a 1:1 relationship between an Issue and its one Backlog card. In practice, an Issue's backlog is better modeled as **many** small entries (what needs to change to get from the current system to the pursued one), not one text blob. Reworked:

- **Issue**: just `id`, `name`, `status`, plus the four canvases. `theme` and `notes` are dropped entirely at the Issue level — theme-like grouping and free-text detail move down to individual Backlog entries instead.
- **Backlog entries**: a list, each with a hidden `id` (UUID), a visible `name`, a visible `description`, and `createdAt`/`updatedAt` — no `status` field. An entry's only two states are "exists" (still a needed change) or "deleted" (resolved or dropped) — no in-between, no follow-up tracking. Presence in the list *is* the status; git history (ADR-0009) already records what once existed and got removed, so nothing is lost by not tracking a status explicitly.
- `status` (`open`/`mapped`/`decided`, ADR-0009's existing three-value enum, kept as-is here — nothing in the new direction calls for changing the values, only where the field lives conceptually) now unambiguously describes the **Issue** as a whole, not "the current backlog item's analysis progress" the way the old 1:1 model implied.

## Decision

**Issue schema** (`issues/<id>.json`, `schemaVersion: 2`):

```json
{
  "id": "8f14e...-uuid",
  "schemaVersion": 2,
  "name": "Improve checkout flow",
  "status": "open",
  "createdAt": "2026-09-02T09:00:00Z",
  "updatedAt": "2026-09-02T09:00:00Z",
  "views": {
    "process":     { "id": "...-uuid", "format": "bpmn-xml",   "content": "..." },
    "system":      { "id": "...-uuid", "format": "drawio-xml", "content": "..." },
    "interaction": { "id": "...-uuid", "format": "drawio-xml", "content": "..." },
    "object":      { "id": "...-uuid", "format": "mermaid",    "content": "..." }
  },
  "backlogEntries": [
    {
      "id": "...-uuid",
      "name": "Add partial-refund support to the billing API",
      "description": "Free text — as long as needed.",
      "createdAt": "2026-09-02T09:05:00Z",
      "updatedAt": "2026-09-02T09:05:00Z"
    }
  ]
}
```

`views` and its per-view UUID/history-diffing model (ADR-0009) are entirely unaffected — this ADR only changes the Issue's own scalar fields and adds `backlogEntries`.

**UI placement**: the Issue's `name`/`status` — now genuinely minimal — move out of the Backlog panel and into the view-switcher tab bar (`.view-tabs`, next to All/Process/System/Object/Interaction) as a small editable name field + status dropdown, always visible regardless of which view is active or whether the Backlog panel is collapsed. The Backlog panel becomes exclusively the entries list: add/rename/describe/delete, no Issue-level fields left in it at all.

**Migration**: this is a breaking schema change (`schemaVersion` bumped `1` → `2`) with no migration path written — existing locally-persisted Issues (this workspace's own `seed-issues.js` and anything created/edited so far this session) are old-shape and incompatible. `seed-issues.js` needs rewriting to the new shape, and local IndexedDB state from before this ADR will need clearing (`indexedDB.deleteDatabase('parall-align')`, already used once this session for a similar reason) rather than being migrated in place — acceptable for a feasibility prototype with no real users yet, not something to build a migration path for.

## Consequences

**Positive**

- Matches the actual described need directly: a backlog is a list of discrete needed changes, not one text field.
- Simplifying the Issue to `name`+`status` makes the tab-bar placement natural — there's little enough there that it doesn't need a dedicated panel.
- No entry-level status removes an entire state machine (and the "what does 'mapped' mean for a single backlog line item" ambiguity the old 1:1 model had) in favor of "it's here or it's deleted," which is both simpler to build and matches how the entries are actually described being used.

**Negative / risks**

- Breaking change, no migration — accepted for now (see above), but means this ADR's own example data (this session's seed/test Issues) is stale the moment this lands.
- Backlog entries losing `state` also means ADR-0010's original "Backlog-entry copy excludes `state`" carve-out becomes moot for entries (there's no `state` on an entry to exclude) — see ADR-0019 for the full revised copy story.

## Alternatives considered

- **Keep `theme` on the Issue** for grouping/filtering Issues themselves, only move `notes` down to entries. Considered, not chosen — the direction given was explicit that the Issue is just name+status; theme-like grouping, if wanted later, is easy to reintroduce as its own ADR once there's a concrete need (e.g. filtering the Issue sidebar), rather than kept now on a guess.
- **Give entries a lightweight status anyway** (e.g. a boolean "done" instead of deleting). Rejected per explicit direction — "no follow up" was stated plainly, and deletion-as-resolution is simpler and already has a safety net (git history).
