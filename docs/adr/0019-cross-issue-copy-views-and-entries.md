# ADR-0019: Cross-issue copy narrows to views and Backlog entries — never a whole Issue

- Status: Proposed
- Date: 2026-09-02
- Supersedes: [ADR-0010](0010-cross-issue-copy.md)
- Relates to: [ADR-0018](0018-issue-and-backlog-entries-data-model.md), [ADR-0006](0006-cross-canvas-linking.md)

## Context

ADR-0018 turns the Backlog from one scalar field-set per Issue into a list of entries. ADR-0010's "copy the Backlog entry `{title, detail, theme}`, overwriting the destination's own" no longer makes sense — there's no longer a singleton Backlog field to overwrite. Direction confirmed: individual canvases stay copyable exactly as ADR-0010 designed; Backlog entries become copyable too, but as **list append**, not overwrite; and a whole **Issue is explicitly never copyable** as one unit — creating a new Issue and then pulling in pieces (entries, canvases) from older ones is how starting-point reuse works instead of duplicating an Issue wholesale.

## Decision

Two copy operations, both still: source is always read at HEAD (ADR-0010's "always newest version" reasoning is unchanged — a copy is a snapshot, not a link, per ADR-0006), destination is always the currently-active Issue (unchanged simplification from ADR-0010's implementation), provenance recorded as structured JSON, never re-resolved after the copy.

**View copy — unchanged from ADR-0010.** Pick a source Issue; the chosen view's (`process`/`system`/`object`/`interaction`) current content overwrites the destination's corresponding view, keeping the destination's own view `id`. `copiedFrom: {issueId, viewId, commit, at}` recorded on the copied view, exactly as ADR-0010 specified.

**Backlog-entry copy — new, append-not-overwrite.** Pick a source Issue and one of its entries; a **new** entry is appended to the destination's `backlogEntries` (new `id` — it's now a genuinely separate entry living in a different Issue's list, not the same identity in two places), with `name`/`description` cloned from the source and `copiedFrom: {issueId, entryId, commit, at}` recorded on the new entry (anchored on the source entry's own `id`, same reasoning as view copy — names can change, `id` stays clean).

**Whole-Issue copy: explicitly not supported.** There is no "duplicate this Issue" action. Starting a new Issue from older ones' material means: create a new (empty) Issue (unchanged instant-create flow), then use view-copy and entry-copy, individually, as many times as wanted, to pull in whichever specific canvases and backlog entries are actually relevant — not a bulk clone of everything an old Issue happened to contain.

**Destructive-overwrite reassurance carries over unchanged from ADR-0010** for view copy (the destination view's pre-copy content survives in its own History, ADR-0009/Step 3b). Entry copy isn't destructive at all in the same sense — it only appends, never overwrites an existing entry — so no equivalent warning is needed there; deleting an entry (a separate, ADR-0018 action) is the only destructive entry operation, and undoing that relies on the same git-history safety net as everything else.

## Consequences

**Positive**

- View-copy mechanics needed zero redesign — ADR-0010 already got that part right, this ADR only touches what changed (Backlog's shape) plus states the whole-Issue non-goal explicitly rather than leaving it implicit.
- Append-not-overwrite for entries is a better match for "pull in a few relevant lines from an old Issue" than a destructive overwrite ever would have been for a list.
- Explicitly ruling out whole-Issue copy keeps the feature set narrow and matches the stated actual want (selective reuse, not duplication).

**Negative / risks**

- Two different copy semantics (overwrite for views, append for entries) in one feature — a source of potential UI confusion if not made clear which is which; worth the copy picker UI explicitly saying "overwrite" vs. "add" per target type when it's built.
- No bulk "import everything relevant from Issue X" shortcut — pulling in several entries and canvases from the same source Issue means repeating the copy action per item. Acceptable for now; revisit only if that repetition turns out to matter in practice.

## Alternatives considered

- **Allow whole-Issue duplication** as a separate, simpler shortcut alongside per-piece copy. Rejected per explicit direction ("An issue can not be copied") — selective reuse via individual view/entry copies is the only supported path.
- **Overwrite semantics for entry copy too** (replace one specific destination entry with the source's). Rejected: entries are a list, not a singleton slot — there's no natural "which existing entry does this replace" target the way a view copy has one obvious destination field.
