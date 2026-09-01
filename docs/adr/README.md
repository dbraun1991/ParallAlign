# Architecture Decision Records

Numbered, append-only decision log for Parall-Align. Each ADR captures the context, the decision, and its consequences at the time it was made — if a decision changes later, add a new ADR that supersedes it rather than editing the old one.

| # | Title | Status |
|---|---|---|
| [0001](0001-canvas-architecture-and-central-view.md) | Canvas architecture: specialized engines per canvas + read-only Central View | Proposed — layout superseded by 0008 |
| [0002](0002-process-canvas-bpmn-js.md) | Process Canvas: bpmn-js | Proposed |
| [0003](0003-system-integration-and-interaction-canvases-drawio.md) | System/Integration and Interaction Canvases: draw.io | Proposed |
| [0004](0004-object-canvas-mermaid.md) | Object Canvas: Mermaid | Proposed |
| [0005](0005-backlog-canvas-custom-list.md) | Backlog Canvas: custom list component | Proposed |
| [0006](0006-cross-canvas-linking.md) | No cross-canvas element-link registry: Issue-level grouping is the association | Proposed |
| [0007](0007-single-canvas-editor-shell.md) | Issue-shell panels: resizable Issue sidebar + Backlog panel, bpmn-js properties panel | Proposed |
| [0008](0008-issue-shell-view-switcher-and-persistent-backlog-panel.md) | Issue shell: sidebar Issue browser, All/P/S/O/I view switcher, persistent minimizable Backlog panel (minimize state global) | Proposed |
| [0009](0009-issue-persistence-and-versioning.md) | Issue persistence: one JSON document per Issue, git-backed per-view history | Proposed |
| [0010](0010-cross-issue-copy.md) | Cross-issue copy: always latest version, overwrite, git-recorded provenance | Proposed |
| [0011](0011-server-backend-express.md) | Server-backed persistence: Express (Node), not a second-language backend | Proposed |
| [0012](0012-frontend-build-tooling-vite.md) | Frontend build tooling: npm + Vite, not CDN script tags | Proposed |
| [0013](0013-shell-ui-reactivity-alpinejs.md) | Shell UI reactivity: Alpine.js | Proposed |
| [0014](0014-theme-toggle-light-and-dark-mode.md) | Theme toggle: light and dark mode | Proposed |

Naming for the canvases (Process/System/Object/Interaction/Backlog) is not yet finalized as of ADR-0001 — these ADRs use the current README naming and should be updated if it changes.
