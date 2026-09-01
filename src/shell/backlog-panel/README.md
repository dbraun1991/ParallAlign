# shell/backlog-panel

Right panel: the current Issue's own Backlog Canvas entry (title/detail, theme, state, notes — ADR-0005), docked and visible across every view-switcher state, collapsible via a manual toggle (distinct from the sidebar's mobile collapse). Minimize/expand is a single global flag that persists across view switches within an Issue but resets to expanded on every Issue activation.

ADR-0005 (data model), ADR-0007 (panel mechanics), ADR-0008 (global-flag-with-reset behavior).
