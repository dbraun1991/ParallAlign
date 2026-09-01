# ADR-0013: Shell UI reactivity — Alpine.js

- Status: Proposed
- Date: 2026-09-01
- Relates to: [ADR-0007](0007-single-canvas-editor-shell.md), [ADR-0008](0008-issue-shell-view-switcher-and-persistent-backlog-panel.md), [ADR-0012](0012-frontend-build-tooling-vite.md)

## Context

ADR-0012 decided the frontend runs on npm + Vite, but never decided what the Issue-shell chrome (sidebar, view switcher, Backlog panel) is actually built *with*. The shell has real reactive state that needs to stay consistent: which Issue is active, which of the five views is showing, and the Backlog panel's minimize/expand flag, which follows a two-rule behavior per ADR-0008 — it persists across view switches within an Issue, but always resets to expanded on Issue activation. Getting that second rule right by hand (tracking exactly which DOM updates follow from which state change) is exactly the kind of bookkeeping a small reactive layer removes.

## Decision

Use **Alpine.js**, installed via npm and imported as an ES module (not a CDN `<script>` tag, consistent with ADR-0012's npm-only approach) for the shell chrome's state and DOM binding.

- `src/main.js` imports Alpine, assigns it to `window.Alpine`, and calls `Alpine.start()`.
- Shell state (active Issue, active view, Backlog-panel expanded flag, and the three state-transition rules from ADR-0008) lives in one Alpine data/store module (`src/shell/shell-state.js`), referenced from `index.html` via `x-data`.
- The four canvas engines (bpmn-js, the draw.io embed, Mermaid, and the custom Backlog list) are unaffected — each manages its own rendering inside a container element Alpine doesn't reach into, the same separation ADR-0001 already established between "the shell" and "the canvases."

## Consequences

**Positive**

- Matches `OrgVisualizr`'s sibling convention in this workspace (Alpine root state + declarative HTML directives) — a familiar pattern to reach for rather than a new one to design.
- Small footprint (~15kb), no build-step requirement of its own — though Vite bundles it via npm import regardless, per ADR-0012.
- Declarative `x-show`/`x-text`/`x-on` bindings make ADR-0008's two-rule Backlog-panel behavior (persist across view switches, reset on activation) straightforward to express directly against state, rather than hand-writing DOM updates at every state-changing call site.

**Negative / risks**

- One more dependency, however small, in a project that otherwise keeps its dependency list to the four canvas-engine libraries plus their own transitive deps.
- Alpine's directive-driven style only governs the shell chrome — anyone touching a canvas module needs to understand that boundary (Alpine markup stops at each canvas's mount point) rather than expecting one consistent reactivity model across the whole app.

## Alternatives considered

- **Plain vanilla JS**, no reactivity library. Rejected: workable, but ADR-0008's Backlog-panel reset-on-activation rule (already flagged in that ADR's own Consequences as "two rules to implement correctly... worth a short comment... so a future edit doesn't collapse it back to one behavior by accident") is exactly the kind of state-consistency bug a small reactive layer prevents by construction rather than by discipline.
- **React (or a similar component framework)**. Rejected for now: a much heavier dependency and mental-model commitment than anything else in this workspace uses, for a shell whose state (a handful of flags) doesn't need component-tree reasoning. Worth reconsidering only if the shell's own interaction complexity grows well past what's currently scoped.
