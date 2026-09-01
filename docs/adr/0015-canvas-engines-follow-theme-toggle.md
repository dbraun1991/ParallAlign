# ADR-0015: Canvas engines follow the shell's theme toggle

- Status: Proposed
- Date: 2026-09-01
- Process portion superseded by: [ADR-0016](0016-process-canvas-stays-light-themed.md) — Process now stays light-themed regardless of shell theme; System/Interaction/Object's decisions below are unaffected.
- Relates to: [ADR-0002](0002-process-canvas-bpmn-js.md), [ADR-0003](0003-system-integration-and-interaction-canvases-drawio.md), [ADR-0004](0004-object-canvas-mermaid.md), [ADR-0014](0014-theme-toggle-light-and-dark-mode.md)

## Context

ADR-0014 scoped the light/dark toggle to the shell chrome only, explicitly noting the four canvas engines "each have their own separate theming story, or none" and leaving that unsolved. In practice this meant Process (bpmn-js) rendered its own light-themed white canvas regardless of the shell's theme — a stark, jarring white box once the rest of the UI went dark. Reversing a stated ADR scope is itself a decision worth its own entry (this repo's ADRs are append-only), not a silent patch.

Checked each engine's actual theming support before designing anything, rather than assuming:

- **bpmn-js + `@bpmn-io/properties-panel`**: both already-imported stylesheets (`diagram-js.css`, `properties-panel.css`) are built entirely on CSS custom properties, scoped to the `.djs-parent` and `.bio-properties-panel` classes respectively (confirmed by reading the installed files directly) — `--canvas-fill-color`, `--palette-background-color`, `--context-pad-entry-background-color`, `--header-background-color`, `--group-background-color`, and others. This is bpmn-js's own documented customization mechanism (its official `theming` example states plainly: "Of course you can override any of these styles").
- **draw.io embed**: the `load` postMessage action we already send on `init` accepts a `"dark": true` field directly (confirmed via drawio.com's embed-mode FAQ) — no URL parameter, no protocol change.
- **Mermaid**: `mermaid.initialize({ theme: 'dark' })` is a standard, documented option.

## Decision

Un-defer canvas theming, but only for these three specific, already-verified mechanisms — not a general commitment to full dark-mode parity everywhere:

1. **Process**: pure CSS. `[data-theme='dark'] .djs-parent { ... }` and `[data-theme='dark'] .bio-properties-panel { ... }` override the semantic custom properties both stylesheets already expose, tuned to match the shell's existing dark palette (`theme.css`'s `--surface`/`--border`/`--text`). No JS change. Because it's pure CSS reacting to the `data-theme` attribute, it updates **live** — toggling the theme while Process is already open re-themes it immediately, unlike the two below.
2. **System/Interaction (draw.io)**: `mountDrawioCanvas` gains a `theme` parameter; the existing `load` action payload gets one more field, `dark: theme === 'dark'`.
3. **Object (Mermaid)**: `mountObjectCanvas` gains a `theme` parameter; calls `mermaid.initialize({ ..., theme: theme === 'dark' ? 'dark' : 'default' })` at the top of mount.

**Scope deliberately excludes recoloring individual shape fill/stroke** (Process) or draw.io's own shape styling — only the canvas background and surrounding chrome (palette, context pad, properties panel, draw.io's UI, Mermaid's own diagram styling) follow the toggle. Existing/loaded shapes keep their authored colors (white fill, black stroke by default) and read fine as light cards on a dark canvas — the same pattern most diagram/whiteboard tools already use (Figma, Miro, draw.io itself), and it avoids the added complexity of re-deriving `bpmnRenderer.defaultFillColor` for already-loaded content.

**Known, accepted limitation**: draw.io and Mermaid's dark option is resolved once, at mount time — there is no "reconfigure a live instance" path in the current mount contract for either engine (matches how their content-loading already works). Toggling the shell's theme while System/Interaction/Object is already open does not visually update it until the view is switched away and back. Process is the exception, being pure CSS.

## Consequences

**Positive**

- Fixes the actual complaint (a stark white canvas in an otherwise dark shell) using each engine's own documented, supported customization mechanism — not fragile selector-guessing or forking a stylesheet.
- Process's fix costs zero JS and updates live, the strongest outcome of the three.
- The `theme` parameter threading (`_syncCanvas` → `mountFn`) is a one-line, uniform change applying identically to all four mount functions, consistent with the existing shared-helper design (Step 4).

**Negative / risks**

- Three different theming granularities across three mechanisms (CSS custom properties, a postMessage field, a JS init option) — no single unified "theme" abstraction across engines, because none exists to unify against; ADR-0001 already accepted this kind of per-engine divergence as the cost of "best-fit tool per canvas."
- The mount-time-only limitation for draw.io/Mermaid is a real, visible inconsistency (Process updates live, the others don't) until a future pass adds a reconfigure path for those two, if ever needed.
- Hand-tuned dark color values for bpmn-js/properties-panel's custom properties are a new small surface to keep in sync with `theme.css`'s own palette if that palette changes later.

## Alternatives considered

- **Recolor shape fill/stroke too** (via `bpmnRenderer.defaultFillColor`/`defaultStrokeColor`, or equivalent draw.io/Mermaid options). Rejected for this pass: adds real complexity (remount timing for already-loaded content, consistency questions for shapes with explicitly-set colors) for a cosmetic improvement beyond what was actually reported — light shapes on a dark canvas already reads fine.
- **A live "reconfigure" message/call for draw.io and Mermaid** so mid-view theme toggling updates immediately, matching Process. Rejected for now: no existing hook for this in either engine's mount contract, and the mount-time-only behavior is a minor, honestly-documented rough edge, not a functional bug.
