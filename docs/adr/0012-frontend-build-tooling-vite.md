# ADR-0012: Frontend build tooling — npm + Vite, not CDN script tags

- Status: Proposed
- Date: 2026-09-01
- Relates to: [ADR-0001](0001-canvas-architecture-and-central-view.md), [ADR-0002](0002-process-canvas-bpmn-js.md), [ADR-0003](0003-system-integration-and-interaction-canvases-drawio.md), [ADR-0004](0004-object-canvas-mermaid.md), [ADR-0011](0011-server-backend-express.md)

## Context

ADR-0001 picked bpmn-js, the draw.io embed, and Mermaid as the three tool-backed canvas engines, but never decided *how the frontend obtains them*. This workspace's other sibling projects show one end of that choice already: `OrgVisualizr`/`Climb-Buddy-Belay`/`Metroviz` load everything via plain `<script>` tags from a CDN with no build step at all (ADR-001 in `OrgVisualizr`).

ADR-0011 already put an Express/Node server in Parall-Align's future, and for the same reasons that ADR gave (one runtime, one dependency manager, reuse across client/server tooling) it's worth asking whether the frontend should also go through npm, now that a `package.json` and `node_modules` are going to exist in this repo regardless once that server is built.

The canvas engines themselves are heavier and more actively-versioned than what the CDN-only sibling projects embed: bpmn-js and the draw.io embed both ship non-trivial CSS/asset bundles alongside their JS, `isomorphic-git` (already chosen client-side in ADR-0009) is not a library CDNs package cleanly as a single browser-ready script, and pinning exact versions of four separately-evolving libraries by hand-editing CDN URLs is more failure-prone than a lockfile.

## Decision

Use **npm** as the package manager and **Vite** as the dev server/bundler for the Parall-Align frontend, departing from the CDN/no-build convention used by `OrgVisualizr`, `Climb-Buddy-Belay`, and `Metroviz`.

- All frontend dependencies (bpmn-js, the draw.io embed package, Mermaid, isomorphic-git, and any UI-layer libraries added later) are installed via `npm install` and imported as ES modules, not referenced by CDN URL.
- Vite provides the local dev server (with hot reload) during development and produces a static build output for production, which the Express server (ADR-0011) serves as static files alongside its API routes — the frontend build and the backend stay two concerns in one repo, not two separately deployed services.
- One top-level `package.json` for now (frontend and backend dependencies together) — a single package manifest for the whole repo; split into workspaces later only if the two sides' dependency graphs start actively conflicting.
- Exact dependency versions are pinned via `package-lock.json`, committed to the repo — the lockfile is what removes the CDN approach's "which version is this URL actually serving today" ambiguity.

## Consequences

**Positive**

- One install step (`npm install`) for the whole repo once the Express backend exists, instead of an npm-managed backend next to a CDN-managed frontend with no shared tooling.
- Version pinning and reproducible installs via the lockfile — meaningfully more important here than in the CDN-only siblings, since Parall-Align depends on four separately-versioned, non-trivial libraries rather than one or two small ones.
- `isomorphic-git` (ADR-0009) and the draw.io embed package are more naturally consumed as npm packages than as ad-hoc CDN builds.
- Vite's dev server gives fast local iteration (hot reload) while building each canvas integration, which matters more here than in the simpler sibling apps given four separate library integrations to develop against.

**Negative / risks**

- Breaks the "no build step" simplicity that makes `OrgVisualizr`/`Climb-Buddy-Belay`/`Metroviz` easy to clone and run with zero setup — Parall-Align now needs `npm install` and a build/dev command before anything renders.
- Adds Vite config and a build pipeline as a maintenance surface that the CDN-only siblings simply don't have.
- Until the Express server (ADR-0011) actually exists, there's no backend to serve Vite's production build from — in the interim, `vite preview` or an equivalent static-file command stands in for a real server.

## Alternatives considered

- **CDN script tags, matching `OrgVisualizr`/`Climb-Buddy-Belay`/`Metroviz`.** Rejected: workable for bpmn-js and Mermaid (both do ship CDN-hosted UMD builds), but `isomorphic-git` and the draw.io embed package are a poorer fit for CDN-only consumption, and hand-pinning four libraries' CDN URLs is more error-prone than a lockfile once the app has more than one or two dependencies.
- **No bundler, npm only for dependency resolution, hand-written `<script type="module">` imports from `node_modules`.** Rejected: works in theory in modern browsers, but loses Vite's dev-time hot reload and still needs *some* build step for production (resolving bare module specifiers from `node_modules` isn't native browser behavior), so it captures the downsides of a build step without the DX upside.
