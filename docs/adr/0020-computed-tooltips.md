# ADR-0020: Tooltips are computed directly from live state, never stored

- Status: Proposed
- Date: 2026-09-02
- Relates to: [ADR-0018](0018-issue-and-backlog-entries-data-model.md)

## Context

Several places in the shell already show short or truncatable text standing in for something longer: the Issue name in the sidebar list (`index.html`'s `.issue-title`, CSS-truncated once names get long), Backlog entry names (`.backlog-entry-name-field`) and their descriptions, the Issue/entry status badges (`.issue-state`, terse single words), and `copiedFrom` provenance lines (currently a fixed sentence — "Copied from another Issue" / "Copied from an earlier version of another Issue" — with no detail on which Issue, when, or from which commit). None of these currently offer a way to see the full value without opening the Issue or entry and reading the underlying field directly.

A tooltip is the obvious fix, but it raises a data question: does the tooltip's text get computed at render/hover time from the same state already driving the visible element, or does it need its own stored field? Given ADR-0018 already narrowed the persisted schema down to exactly the fields the UI needs (no derived/denormalized fields anywhere in `views.*` or `backlogEntries[]`), introducing a separately-stored tooltip string would be new persisted state purely for a hover affordance — a maintenance burden (goes stale independently of the field it describes) with no benefit over computing it live.

## Decision

**Tooltips are computed directly, on demand, from the same in-memory Issue object already bound to the element** — never persisted as their own field, never cached. Concretely, each tooltip is a plain string expression evaluated where the element is rendered (an Alpine `:title` binding is the default mechanism — a native browser tooltip, no new UI component, no JS hover-tracking logic needed), reading straight from `activeIssue`/`issue`/`entry` fields already in scope:

- **Issue name (sidebar list item)** — full `issue.name`, so a CSS-truncated long name is still readable on hover.
- **Backlog entry name and description** — full `entry.name` / `entry.description` text, for the same truncation reason, plus (per the option below) entry metadata folded in rather than a separate tooltip per field.
- **Status badges** (`issue.status`, and any future per-entry status if one is ever added) — the same word already shown, expanded to a short phrase if the single word alone isn't self-explanatory (open/mapped/decided are Issue-level and reasonably self-explanatory already, so this may end up being a no-op for status — implementer's call at build time whether a badge tooltip adds anything beyond what's already visible).
- **`copiedFrom` provenance** — computed from the `copiedFrom` object's own fields (`issueId` resolved to that Issue's current `name` via a lookup in `issues`, plus the stored `at` timestamp formatted the same way History entries already are) rather than the current fixed sentence, so hovering answers "copied from which Issue, when" instead of just "copied from somewhere."

No new persisted fields, no new store functions, no caching layer — `copiedFrom.issueId` → Issue name is a live lookup against the already-loaded `issues` array (same pattern `copySourceOptions`/`copySourceEntries` already use in `shell-state.js`), so a renamed source Issue is reflected immediately rather than showing a stale name frozen at copy time.

Scope is broad by design: any UI text that is truncated, abbreviated, or a fixed placeholder standing in for more specific state gets a computed tooltip, not just the four examples named above — the underlying pattern (bind `:title` to a live expression) is the decision, not an exhaustive element list.

## Consequences

**Positive**

- Zero new persisted state — nothing to keep in sync, nothing that can go stale independently of the field it's describing.
- Native `title` attribute means no new component, no hover-timing/positioning logic, and free accessibility behavior (screen readers already handle `title`).
- `copiedFrom` provenance becomes actually informative (source Issue name + when) instead of a fixed sentence, using data already recorded by ADR-0019's copy operations — no schema change needed to support it.

**Negative / risks**

- Native `title` tooltips are plain-text only and have browser-inconsistent show-delay/styling — acceptable here since the content is supplementary detail, not primary UI, but not a fit if richer (multi-line, styled, or interactive) tooltips are wanted later; that would need a real custom-tooltip component, out of scope for this ADR.
- A live lookup (`copiedFrom.issueId` → Issue name) silently shows nothing useful if the source Issue was deleted after the copy — acceptable since Issues aren't currently deletable at all; revisit if Issue deletion is ever added.

## Alternatives considered

- **Store a denormalized tooltip/label string on write** (e.g. snapshot the source Issue's name into `copiedFrom` at copy time). Rejected: duplicates data that's one lookup away, and goes stale the moment the source Issue is renamed — computing live is strictly more correct at no extra cost.
- **A custom tooltip component** (styled, multi-line, positioned manually). Rejected for now — native `title` covers every case identified above; revisit only if a specific tooltip actually needs formatting `title` can't do.
