# ADR-0016: Process canvas stays light-themed regardless of shell theme

- Status: Proposed
- Date: 2026-09-01
- Supersedes (Process portion only): [ADR-0015](0015-canvas-engines-follow-theme-toggle.md)
- Relates to: [ADR-0002](0002-process-canvas-bpmn-js.md), [ADR-0014](0014-theme-toggle-light-and-dark-mode.md)

## Context

ADR-0015 dark-themed the Process canvas's chrome (palette, context pad, canvas background, properties panel) via CSS custom-property overrides on bpmn-js/`@bpmn-io/properties-panel`'s own stylesheets, live-reacting to the shell's `data-theme` attribute. Direction since: Process editing should render with the same light theme in the canvas regardless of the shell's own theme — narrowing ADR-0015 for this one engine specifically. System/Interaction (draw.io) and Object (Mermaid) are unaffected by this ADR; their dark-mode behavior from ADR-0015 stands.

## Decision

Remove the `[data-theme='dark'] .djs-parent` / `[data-theme='dark'] .bio-properties-panel` overrides (`src/css/canvas-theme.css`, no longer needed once Process has nothing left to theme). Process's canvas/palette/context-pad/properties-panel revert to bpmn-js's own default light appearance unconditionally — the same visual result as before ADR-0015, now a deliberate choice rather than an unaddressed gap.

## Consequences

**Positive**

- Matches the direction given: the Process diagram itself always looks the same regardless of which shell theme the viewer happens to have selected — arguably desirable for a diagram surface people export/share, where theme-dependent rendering could be confusing or inconsistent across viewers.
- Removes the one piece of ADR-0015 that was hand-tuned, unofficial color guessing (approximating a dark palette against bpmn-js's own semantic custom properties) — the highest-maintenance-risk part of that ADR — while keeping the two mechanisms that used the engines' own first-class, documented options (draw.io's `dark` load field, Mermaid's `theme` init option).

**Negative / risks**

- Reintroduces the original complaint's visual seam: a light Process canvas inside an otherwise dark shell. Accepted as the explicit tradeoff of this decision, not an oversight.
- Widens the Process/System-Interaction-Object inconsistency in the other direction — now Process is the one engine that *doesn't* follow the toggle, where before it was the only one that did live.

## Alternatives considered

- **Keep ADR-0015's Process theming as-is.** Rejected per explicit direction.
- **Make it a user-facing per-canvas toggle** (follow shell theme vs. always light), rather than a fixed decision. Rejected as unnecessary complexity for a feasibility-stage app with a single, clear preference stated — revisit only if this turns out to matter to more than one person.
