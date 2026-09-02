# agents.md — Parall-Align

## What This Is

Parall-Align is a webapp for remote teams that need business and technical stakeholders to understand the same system the same way. A project holds a small set of shared, deliberately incomplete visual **canvases** — Backlog, Process, Object, System/Integration, Interaction — that give parallel, cross-linked views of the same backlog item. See `README.md` for the full product framing.

**Current status: real persistence + dark-mode canvases + working All view + Backlog editing + New-Issue creation + history/restore.** Product framing (`README.md`) and architecture decisions (`docs/adr/`) are in place; the Vite pipeline (ADR-0012), the Issue-shell (`src/shell/`, ADR-0007/0008/0013), the light/dark toggle (ADR-0014) — including System/Interaction (draw.io) and Object (Mermaid) per ADR-0015, but Process (bpmn-js) deliberately stays light-only per ADR-0016 — real git-backed persistence (`src/persistence/`, ADR-0009 — `isomorphic-git`/`lightning-fs` over IndexedDB, one JSON file per Issue, every save a commit), the All view (`src/canvases/thumbnails.js`, ADR-0017 — real per-engine SVG thumbnails, click-through, content-hash cached, not yet live-updating), Backlog field editing (title/theme/state/notes, ADR-0005), New-Issue creation (the "+ New Issue" button in the sidebar, `src/persistence/issue-store.js`'s `createIssue()`), and per-view history browsing/restore (ADR-0009's other half, `getViewHistory`/`restoreView`, a "History" button on every single-canvas view) are all working end to end: edits survive a page reload, and an old version can be pulled back at any time. Three example Issues still seed automatically on a true first run (`src/persistence/seed-issues.js`), now alongside any Issues created since. Treat every ADR's decision as the plan for what's still unbuilt (cross-issue copy, canvas naming finalization, and the rest of "Features & Future Work" below).

## Development

```
npm install
npm run dev      # starts the Vite dev server, http://localhost:5173/
npm run build    # production build to dist/
npm run preview  # serve that build locally
```

Requires Node.js (any current LTS; installed here via `nvm`). Right now `npm run dev` only shows a placeholder heading — see "Planned Frontend Module Layout" below for what's actually built vs. still scaffold-only.

## Core Idea

Each of the five canvases is built on the best-fit existing open tool for its notation rather than one shared canvas SDK, prioritizing standard-format compatibility and "mature editor for free" over interaction consistency across canvases (ADR-0001). An Issue bundles all five canvases together (README); the shell is issue-scoped, not canvas-scoped (ADR-0008): pick an Issue in the sidebar, then switch between a read-only **All** overview and each canvas's full-screen editor, with the **Backlog** panel staying visible on the right throughout, minimizable but never a separate mode you have to leave the others to see.

## Planned Architecture

```
+-----------+---------------------------------------------+-----------+
| Issue     |  View switcher: [All] [P] [S] [O] [I]        | Backlog   |
| sidebar   |-----------------------------------------------| panel     |
| (search,  |                                                | (always   |
| resizable,|  "All": read-only 2x2 grid of P/S/O/I,         | visible   |
| <details> |    click-through to a single view              | across    |
| collapse  |  single view: that canvas's native editor,     | every     |
| on mobile)|    engine + (Process only) bpmn-io properties  | view,     |
|           |    panel for the selected element               | minimiz-  |
|           |                                                | able)     |
+-----------+---------------------------------------------+-----------+
Activating an Issue always resets view -> All and Backlog -> expanded;
switching views within an already-open Issue leaves both exactly as left.
(ADR-0008, panel mechanics in ADR-0007; supersedes ADR-0001's layout)

Canvas engines
  Process (P)              — bpmn-js, .bpmn XML                 (ADR-0002)
  System/Integration (S)   — draw.io embed, .drawio XML          (ADR-0003)
  Interaction (I)          — draw.io embed, .drawio XML          (ADR-0003)
  Object (O)                — Mermaid, plain-text diagram source  (ADR-0004)
  Backlog (B)                — custom list component, Parall-Align-native (ADR-0005)

No cross-canvas element-link registry (ADR-0006) — an Issue's five canvases
are already bundled together, and Backlog stays visible alongside whichever
one is open, so the Issue itself is the association; no per-element ID
scheme needed.

Persistence — one JSON document per Issue (ADR-0009):
  issues/<issueId>.json = { id, title, theme, state, notes,
    views: { process: {id, format, content}, system: {...}, ... } }
  Issue id doubles as the Backlog entry's id; every view also carries its
  own id, stable across any future rename of the view/canvas naming
  (README/ADR-0001: canvas naming isn't finalized yet) — names can change,
  ids stay clean. Git-backed: every save is a commit; per-view history is
  derived by diffing that one field across consecutive commits, not stored
  separately. For now (feasibility/draft stage), git runs fully client-side
  (e.g. isomorphic-git + IndexedDB) — no backend yet; revisit once
  multi-device/multi-user access is needed.

Cross-issue copy (ADR-0010): copy a view or the Backlog entry from another
  Issue, always reading the source's current HEAD (never a historical
  version), full overwrite at the destination, provenance recorded both in
  the commit message and as a `copiedFrom: {issueId, viewId, commit, at}`
  field — a one-time fork, never a live link (consistent with ADR-0006).
```

## Key Docs

| File | Role |
|------|------|
| `README.md` | Product framing — naming, the five canvases, what each is/isn't for |
| `docs/adr/README.md` | ADR index — numbered, append-only decision log |
| `docs/adr/0001-*.md` | Canvas architecture: specialized engine per canvas + read-only Central View |
| `docs/adr/0002-*.md` | Process Canvas: bpmn-js |
| `docs/adr/0003-*.md` | System/Integration + Interaction Canvases: draw.io |
| `docs/adr/0004-*.md` | Object Canvas: Mermaid |
| `docs/adr/0005-*.md` | Backlog Canvas: custom list component |
| `docs/adr/0006-*.md` | No cross-canvas element-link registry: Issue-level grouping is the association |
| `docs/adr/0007-*.md` | Issue-shell panels: resizable Issue sidebar + Backlog panel, bpmn-js properties panel |
| `docs/adr/0008-*.md` | Issue shell: sidebar Issue browser, All/P/S/O/I view switcher, persistent minimizable Backlog panel |
| `docs/adr/0009-*.md` | Issue persistence: one JSON document per Issue, git-backed per-view history |
| `docs/adr/0010-*.md` | Cross-issue copy: always latest version, overwrite, git-recorded provenance |
| `docs/adr/0011-*.md` | Server-backed persistence: Express (Node), not a second-language backend |
| `docs/adr/0012-*.md` | Frontend build tooling: npm + Vite, not CDN script tags |
| `docs/adr/0013-*.md` | Shell UI reactivity: Alpine.js |
| `docs/adr/0014-*.md` | Theme toggle: light and dark mode |
| `docs/adr/0015-*.md` | Canvas engines follow the shell's theme toggle (Process portion superseded by 0016) |
| `docs/adr/0016-*.md` | Process canvas stays light-themed regardless of shell theme |
| `docs/adr/0017-*.md` | All-view renders real per-canvas thumbnails |

## Architecture Decisions

| ADR | Decision |
|-----|----------|
| [0001](docs/adr/0001-canvas-architecture-and-central-view.md) | Specialized engine per canvas, not one unified SDK (layout portion superseded by 0008) |
| [0002](docs/adr/0002-process-canvas-bpmn-js.md) | Process Canvas: bpmn-js, `.bpmn` XML, bpmn.io License (watermark) |
| [0003](docs/adr/0003-system-integration-and-interaction-canvases-drawio.md) | System/Integration + Interaction Canvases: draw.io embed, `.drawio` XML, Apache-2.0 |
| [0004](docs/adr/0004-object-canvas-mermaid.md) | Object Canvas: Mermaid text source, MIT, text+preview editing model (not drag-and-drop) |
| [0005](docs/adr/0005-backlog-canvas-custom-list.md) | Backlog Canvas: custom list component, Parall-Align-native data model |
| [0006](docs/adr/0006-cross-canvas-linking.md) | No cross-canvas element-link registry — an Issue's bundled canvases + always-visible Backlog panel are association enough |
| [0007](docs/adr/0007-single-canvas-editor-shell.md) | Issue sidebar + Backlog panel share one resizable-panel mechanism + mobile `<details>` collapse (`Climb-Buddy-Belay`); `@bpmn-io/properties-panel` for Process Canvas only |
| [0008](docs/adr/0008-issue-shell-view-switcher-and-persistent-backlog-panel.md) | Issue-scoped shell: sidebar Issue browser, All/P/S/O/I view switcher, Backlog panel always visible and minimizable; activating an Issue always resets to All + expanded Backlog |
| [0009](docs/adr/0009-issue-persistence-and-versioning.md) | One JSON document per Issue; every view + the Backlog entry carries a stable UUID; git commit history is the version log (client-side for now); per-view history derived by field-level diffing |
| [0010](docs/adr/0010-cross-issue-copy.md) | Copy a view/Backlog entry from another Issue: always HEAD, full overwrite, `copiedFrom` provenance (keyed on the source view's UUID) recorded, never a live link |
| [0011](docs/adr/0011-server-backend-express.md) | Server-backed persistence, once built, is Express (Node) — reuses `isomorphic-git`-derived logic, keeps the Yjs/realtime path open for Mermaid, one runtime for a solo build |
| [0012](docs/adr/0012-frontend-build-tooling-vite.md) | Frontend departs from the CDN/no-build sibling convention: npm + Vite, for lockfile-pinned versions across four separately-evolving libraries and a dev server shared with the eventual Express backend |
| [0013](docs/adr/0013-shell-ui-reactivity-alpinejs.md) | Shell chrome (not the canvases) uses Alpine.js for state/DOM binding — matches the `OrgVisualizr` sibling convention, small footprint, fits ADR-0008's Backlog-panel reset-on-activation rule |
| [0014](docs/adr/0014-theme-toggle-light-and-dark-mode.md) | Light/dark toggle for the shell chrome, following `OrgVisualizr`'s FOUC-prevention/single-source-of-truth pattern with a `prefers-color-scheme` first-visit default added; canvas engines' own theming out of scope |
| [0015](docs/adr/0015-canvas-engines-follow-theme-toggle.md) | Un-defers ADR-0014's canvas-theming exclusion for three specific mechanisms: bpmn-js/properties-panel via CSS custom properties (live, Process portion later superseded by 0016), draw.io via its `dark:true` load option, Mermaid via `initialize({theme})` — both mount-time only; shape fill/stroke colors intentionally untouched |
| [0016](docs/adr/0016-process-canvas-stays-light-themed.md) | Process canvas always renders light regardless of shell theme — diagrams should look consistent to every viewer; System/Interaction/Object's dark theming from ADR-0015 is unaffected |
| [0017](docs/adr/0017-all-view-thumbnails.md) | All-view tiles render real SVG thumbnails per engine (bpmn-js `Viewer.saveSVG()`, Mermaid's own render, draw.io's `load`→ack→`export` postMessage sequence via a hidden iframe), content-hash cached; click-through to the matching view; live updates from other views' edits explicitly deferred |

Naming for the canvases (Process/System/Object/Interaction/Backlog) is **not yet finalized** (ADR-0001) — code and docs alike currently use the README naming; check `docs/adr/README.md` before assuming it's settled. This is exactly why views and the Backlog entry carry their own UUIDs (ADR-0009): identity must survive a naming decision that hasn't happened yet.

## Sibling-Project Conventions Used Here

Parall-Align shares this workspace with other solo-built webapps (`Climb-Buddy-Belay`, `Metroviz`, `OrgVisualizr`), each with its own `agents.md`/`AGENTS.md` and `docs/adr(s)/`. Where Parall-Align's own ADRs cite a sibling project's implementation as precedent (ADR-0007 cites `Climb-Buddy-Belay`'s mobile `<details>` collapse), that project's source is the concrete reference to read before implementing the Parall-Align equivalent — don't re-derive the pattern from scratch.

Conventions worth carrying forward once implementation starts, consistent with every sibling project in this workspace:

- **ADRs are append-only** (`docs/adr/README.md`) — a changed decision gets a new ADR that supersedes the old one, never an edit to the old ADR's Decision section. A superseded ADR gets a one-line forward pointer added to its metadata header only (see ADR-0001's "Layout partially superseded by" line) — its own Context/Decision/Consequences stay untouched.
- **One module per concern** in both CSS and JS (see `OrgVisualizr/js/`) rather than monolithic files — expect this to mean, at minimum, separate modules per canvas engine integration plus the Issue sidebar and Backlog panel (ADR-0007/0008).
- **No framework-default confirm/alert** — sibling projects use a promise-based custom dialog module (`OrgVisualizr/js/dialog.js`) instead of native `confirm()`/`alert()`; adopt the same if/when Object/Backlog canvases need confirmation prompts.
- **Theme via CSS custom properties** on `:root`, `data-theme` attribute for light/dark, set before first paint to avoid a flash of the wrong theme (`OrgVisualizr/agents.md`'s "Theming" section) — apply this to the Issue shell chrome (ADR-0007/0008), independent of whatever theming each embedded engine (bpmn-js/draw.io/Mermaid) supports natively.

## Planned Frontend Module Layout

**`src/shell/`, `src/persistence/`, `src/css/`, and all four `src/canvases/*/` have real implementation code; only `src/copy/` is still a directory with just a purpose-note `README.md`.** `src/canvases/interaction/` has no implementation file of its own — it shares `src/canvases/system/drawio-canvas.js` (ADR-0003: one integration, two canvases). Built on npm + Vite (ADR-0012); `server/` for the Express backend (ADR-0011) intentionally not yet created, since that ADR defers the server itself until multi-device/collaboration work starts — scaffolding it now would misrepresent it as active.

| Path | Role | ADR |
|------|------|-----|
| `src/shell/issue-sidebar/` | Left panel: searchable Issue list, resizable + mobile-collapsible | 0007, 0008 |
| `src/shell/view-switcher/` | Main area: All (2×2 read-only overview) + four single-canvas editor views | 0001, 0008 |
| `src/shell/backlog-panel/` | Right panel: current Issue's Backlog Canvas entry, docked, global minimize-with-reset-on-activation | 0005, 0007, 0008 |
| `src/canvases/process/` | Process Canvas: bpmn-js + `@bpmn-io/properties-panel` | 0002, 0007 |
| `src/canvases/system/` | System/Integration Canvas: draw.io embed | 0003 |
| `src/canvases/interaction/` | Interaction Canvas: draw.io embed | 0003 |
| `src/canvases/object/` | Object Canvas: Mermaid text+preview | 0004 |
| `src/persistence/` | Issue JSON model + client-side git (`isomorphic-git`/`lightning-fs`/IndexedDB), debounced autosave-as-commit; per-view history data-layer done, browsing UI not yet built | 0009 |
| `src/copy/` | Cross-issue copy mechanics (HEAD-only, overwrite, `copiedFrom` provenance) | 0010 |
| `src/dialog/` | Promise-based modal system (no native `confirm()`/`alert()`) | sibling convention |
| `src/css/` | One stylesheet per concern, CSS custom properties + `data-theme` | sibling convention |

## Features & Future Work

Working TODO list for whoever (or whichever session) picks this up next. Items with an ADR are designed but not built; items without one still need direction clarified before implementing rather than guessing at exact behavior.

**Concrete next-session TODOs, roughly in the order they were noted:**

- **Settings gear button for overall app settings.** No scope defined yet beyond: a gear icon somewhere in the shell chrome that opens an overlay. What settings live in it is still open. May be worth looking at how `bpmn-process-creator`'s own UI handles an overlay/panel for inspiration on the mechanics (not a decision to cite it as architectural precedent the way ADR-0007 originally did before that got scrubbed — just an implementation reference for "how does an overlay open/close cleanly").
- **File-manager-style Issue sidebar.** The current sidebar is a flat, unfiltered list (`index.html`'s `.issue-list`). `bpmn-process-creator`'s own sidebar — search field, Recent/full-list tabs, a folder tree — was the original inspiration named in ADR-0007's first draft (since generalized away from that specific citation) and is worth revisiting directly for the Issue list once there are enough Issues that a flat list stops scaling.
- **Enrich `src/persistence/seed-issues.js`'s example content.** The three seeded Issues currently carry mostly-empty or single-shape canvas content (a lone start event, one ENTITY table, blank System/Interaction diagrams) — fine for exercising the mechanics, but thin for actually judging look-and-feel now that the All-view thumbnails (ADR-0017) and every editor render real content. Flesh out each seed Issue's `views.*.content` with a properly-sized example diagram per engine (a multi-step BPMN process, a small System/Interaction architecture sketch, a richer ER diagram) so testing and demos show the app at a realistic size, not a toy one.
- **All-view "focus one tile" layout.** Clicking one of the four tiles enlarges it into a big pane while the other three stay visible, shrunk into a stacked small-tile column alongside it — a focus mode within All, not the same thing as fully navigating away to that view's single-canvas editor (ADR-0008), and not the same as today's click-through (ADR-0017, which does navigate away). The core requirement: focusing one view must never hide the other three. Two layout orientations were sketched, not decided between:
  ```
  right-side big:        left-side big:
  s |B                   B|s
  ---B                   B--
  s |B                   B|s
  ---B                   B--
  s |B                   B|s
  ```
  Open questions for whoever picks this up: which orientation (or does the big pane's side follow which tile was clicked?); does the enlarged pane host the real interactive editor (bpmn-js/draw.io/Mermaid, live-editable) or just a bigger static thumbnail; and how this interacts with the view-switcher tabs (All/Process/System/Object/Interaction) already at the top of the shell.

  **Extension, noted later:** the All view should have two modes — **work mode**, where clicking a tile does what it does today (ADR-0017's click-through: navigate straight to that canvas's single-view editor), and **presentation mode**, where clicking a tile instead triggers the focus-tile enlarge behavior described above, without navigating away. Needs a mode toggle somewhere in the All view and a decision on which mode is the default.
- **Live All-view thumbnail updates** (ADR-0017, explicitly deferred there) — thumbnails currently only (re)render when the All view is entered; making them react while another view is being edited elsewhere needs a cross-view invalidation hook that doesn't exist yet.
- **Bundle size.** `npm run build` has warned since Step 4 that the main chunk exceeds 500kB (bpmn-js + draw.io-adjacent + Mermaid all in one bundle) — worth revisiting with per-canvas `import()` code-splitting once it's actually felt, not purely on principle.
- **Server-backed git layer** (ADR-0009/0011) — client-side git (`isomorphic-git`/IndexedDB) was the deliberate starting point; a real Express/Node server is the expected next step once multi-device access or real-time collaboration are actually needed.
- **Canvas naming finalization.** README/ADR-0001 flag Process/System/Object/Interaction/Backlog naming as provisional. ADR-0009's per-view UUIDs mean this can be resolved later without a data migration — but the rename itself (UI copy, `views.<name>` key vs. `id`, any docs referencing the current names) is still unbuilt work when it happens.
- **User-facing view/Issue titles distinct from the fixed type-key.** ADR-0009 gives every view its own `id` independent of the `views.<name>` slot it lives in — that decouples identity from naming but doesn't itself add a UI for renaming/relabeling a view or an Issue; whether that's wanted at all is still open.
- **Cross-issue picker/search UI for copy** (ADR-0010) — the copy mechanics (read HEAD, overwrite, record provenance) are decided; choosing *which* Issue and view to copy from needs its own picker UI, not designed yet.
- **Concurrent-edit / merge story** for one Issue's single JSON document (ADR-0009's noted risk) — relevant once more than one person can edit the same Issue; out of scope while client-side/single-user.
- **Cross-canvas element-level linking**, reconsidered. ADR-0006 explicitly decided against building this now, on the grounds that Issue-level bundling plus the always-visible Backlog panel cover the need. If element-to-element navigation (e.g. one BPMN task ↔ one Object-canvas entity) turns out to matter in practice, it's new scope requiring its own ADR — not a partially-built feature waiting to be finished.
- **Real-time multiplayer editing** across all four tool-backed canvases (ADR-0001/0002/0003/0004) — explicitly lower priority than format compatibility for the initial feasibility prototype; per-canvas feasibility notes already live in ADR-0002/0003/0004.

## What It Does NOT Do (yet)

- No real-time multiplayer editing in any of the four tool-backed canvases out of the box (ADR-0001/0002/0003/0004) — explicitly lower priority than format compatibility for the initial feasibility prototype.
- No cross-canvas element-level linking (ADR-0006, decided against) — association only happens at the Issue level; you can't point from one specific BPMN task to one specific Object-canvas entity.
- No live cross-issue references (ADR-0010) — copy is a one-time overwrite snapshot, never a link that stays in sync with its source; the copy feature itself isn't built yet either.
- No multi-device or multi-user access to the same Issue (ADR-0009) — the git layer is client-side only, for now.
