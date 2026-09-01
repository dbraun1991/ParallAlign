# ADR-0014: Theme toggle — light and dark mode

- Status: Proposed
- Date: 2026-09-01
- Relates to: [ADR-0002](0002-process-canvas-bpmn-js.md), [ADR-0003](0003-system-integration-and-interaction-canvases-drawio.md), [ADR-0004](0004-object-canvas-mermaid.md), [ADR-0013](0013-shell-ui-reactivity-alpinejs.md)

## Context

`src/css/theme.css` already defines dark-as-default CSS custom properties on `:root` plus a `:root[data-theme='light']` override block, per the sibling theming convention (`agents.md`), but no toggle exists yet — the note in that file has said "no toggle UI yet" since the shell skeleton was first built. This ADR adds the actual toggle, both modes, for the Issue-shell chrome.

`OrgVisualizr` (this workspace) already has a working light/dark toggle to draw on: a synchronous inline script in `<head>` that reads a `localStorage` key and sets `data-theme` on `<html>` *before* the stylesheet is even parsed for first paint (`index.html` lines 9-20), Alpine state that mirrors that already-applied attribute at init rather than re-reading `localStorage` a second time (`js/app.js` lines 128-129), and a `toggleTheme()` method that flips the attribute and persists the choice, guarded against `localStorage` throwing (`js/app.js` lines 249-254). That project's own git history is also a concrete cautionary example worth citing directly: commit `a848048` ("Fix invisible text/colors in SVG, PNG, and PDF export") — a real instance of the "hardcoded color that only looked fine in one theme" pitfall, not a hypothetical one.

## Decision

Add a light/dark toggle for the Issue-shell chrome (sidebar, view switcher, Backlog panel — not the embedded canvas engines, see Scope below), following `OrgVisualizr`'s pattern with one deliberate improvement:

- **Storage**: `localStorage` key `parall-align_theme`, values `'light'` or `'dark'`.
- **First-visit default** (no stored value yet): unlike `OrgVisualizr`'s unconditional hardcoded `'dark'`, check `prefers-color-scheme` first — `window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'` — falling back to `'dark'` only if `matchMedia` itself is unavailable or throws. `theme.css`'s dark palette on bare `:root` already makes `'dark'` the safe last-resort default.
- **FOUC prevention**: a synchronous inline `<script>` in `index.html`'s `<head>`, before the stylesheet link and before `src/main.js`, applies the resolved theme to `data-theme` on `<html>` immediately — so there's no flash of the wrong theme while Alpine is still loading.
- **Single source of truth**: `shell-state.js`'s Alpine data reads `document.documentElement.getAttribute('data-theme')` at init to set its own `theme` field — it does **not** independently re-derive from `localStorage` or `matchMedia` a second time, so the JS-level state can never disagree with what's already rendered.
- **`toggleTheme()`** (added to `shell-state.js`): flips `this.theme`, sets `data-theme` on `<html>`, and writes to `localStorage` — the write wrapped in `try/catch` (private browsing / storage-disabled environments throw on `setItem`; the theme just won't persist rather than breaking the toggle).
- A toggle control is added to the shell chrome (exact placement is implementation detail, not this ADR's concern) using the same CSS custom properties as everything else — no hardcoded colors on the control itself.

**Scope**: this ADR covers the shell chrome only. The four canvas engines (bpmn-js, the draw.io embed, Mermaid) each have their own separate theming story, or none — ADR-0002/0003/0004 don't commit any of them to following the shell's `data-theme` attribute, and this ADR doesn't change that. A toggle that flips the shell chrome while an embedded canvas engine stays visually stuck in the other mode is a known, accepted rough edge for now (see Pitfalls below) — not solved here.

## Common pitfalls to avoid

1. **Flash of the wrong theme (FOUC)** — applying the theme via a module script that loads after first paint (e.g. inside `src/main.js` or an Alpine `x-init`) causes a visible flip from the default to the real theme on every load. Fix: the synchronous inline `<head>` script above, which must run before the stylesheet is parsed and before `src/main.js` loads.
2. **Two divergent sources of truth** — if Alpine's state independently re-reads `localStorage`/`matchMedia` instead of mirroring the `data-theme` attribute the inline script already resolved, a subtly different default branch between the two code paths can make the JS-level `theme` value disagree with what's actually rendered. Fix: Alpine reads the DOM attribute at init, full stop — never a second independent resolution.
3. **Unguarded `localStorage` calls** — `getItem`/`setItem` can throw (private browsing, storage disabled, quota exceeded). An uncaught throw inside the synchronous `<head>` script would abort all subsequent script execution on the page, including Alpine's own bootstrap. Fix: wrap every call in `try/catch`, exactly as `OrgVisualizr` already does in both its inline script and `toggleTheme()`.
4. **Hardcoded colors that "look fine" in only one theme** — a color written as a literal hex/rgb instead of a `var(--...)` custom property will silently break (invisible text, low contrast) the moment the other theme is selected. This isn't hypothetical: `OrgVisualizr` commit `a848048` is exactly this bug, in SVG/PNG/PDF export. Fix: every new piece of shell UI must use the existing `theme.css` custom properties; audit for stray literal colors specifically when adding the toggle, not just trust that existing CSS already accounted for both themes.
5. **Deliberately un-variabled elements, forgotten** — some elements legitimately need a fixed color regardless of theme (e.g. text drawn directly on a colored status dot/badge, where contrast depends on that dot's own color, not the page theme). `OrgVisualizr` calls these out explicitly in its own `agents.md`. Fix: when one of these shows up in Parall-Align's shell (e.g. the Backlog panel's state-color dots), document it at the CSS rule with a comment explaining why, the same way, rather than leaving a silent exception someone "fixes" into a bug later.
6. **Forgetting the canvas engines don't follow the shell's toggle** — see Scope above. Don't let a future change accidentally imply cross-engine theme sync is solved; it isn't.
7. **Trusting a stored value blindly** — if the accepted values for `parall-align_theme` ever change (e.g. a future `'system'` option), an old stored string could become stale. Validate the read-back value against a known allow-list (`'light' | 'dark'`) rather than assuming it's always one of the current valid values.
8. **The toggle control itself becoming illegible** — a common meta-pitfall: styling the toggle button/icon with a hardcoded color "so it's visible in dark mode" defeats the point once light mode is selected. It must use the same custom properties as everything else.

## Consequences

**Positive**

- Reuses a proven, already-debugged pattern from this workspace instead of re-designing theme persistence from scratch.
- The first-visit `prefers-color-scheme` check is a genuine improvement over `OrgVisualizr`'s hardcoded default, at negligible extra complexity.
- The pitfalls list above is grounded in this workspace's own history (a real bug, a real design choice already made), not generic advice.

**Negative / risks**

- Shell-chrome theming and canvas-engine theming (or lack thereof) can visually diverge — accepted for now, see Scope.
- One more piece of state (`theme`) and one more `localStorage` key to keep consistent as the shell grows.

## Alternatives considered

- **No system-preference check, hardcode `'dark'` as the first-visit default** (matching `OrgVisualizr` exactly). Rejected: `prefers-color-scheme` is a one-line addition that meaningfully improves first-visit UX, and there's no reason not to take it now that a toggle is being built anyway.
- **A three-way `'light' | 'dark' | 'system'` option**, re-resolving against `prefers-color-scheme` live if `'system'` is selected. Rejected for now as unnecessary complexity for a feasibility-stage shell with two options already covering the first-visit case well; worth revisiting if users actually ask for it.
