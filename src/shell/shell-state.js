import { loadAllIssues, scheduleSave, createIssue, restoreView } from '../persistence/issue-store.js';
import { getViewHistory } from '../persistence/git-store.js';
import { mountProcessCanvas } from '../canvases/process/process-canvas.js';
import { mountDrawioCanvas } from '../canvases/system/drawio-canvas.js';
import { mountObjectCanvas } from '../canvases/object/object-canvas.js';
import { renderAllThumbnails as renderThumbnails } from '../canvases/thumbnails.js';

// Process needs two child containers (canvas + properties panel); the
// other engines mount straight into the single wrapper element. Adapting
// here keeps _syncCanvas's mountFn contract uniform: (wrapperEl, viewObj,
// onChange) => { destroy() }.
function mountProcessCanvasAdapter(wrapperEl, viewObj, onChange) {
  const canvasEl = wrapperEl.querySelector('.process-canvas-container');
  const propertiesEl = wrapperEl.querySelector('.process-properties-panel');
  return mountProcessCanvas(canvasEl, propertiesEl, viewObj, onChange);
}

const VIEWS = ['all', 'process', 'system', 'object', 'interaction'];

const VIEW_INSTANCE_KEYS = {
  process: '_processInstance',
  system: '_systemInstance',
  interaction: '_interactionInstance',
  object: '_objectInstance',
};

// Alpine data factory for the Issue-shell (ADR-0007/0008). Implements the
// three state-transition rules from ADR-0008's Decision section exactly:
//   - selectIssue: always resets view -> 'all' and expands the Backlog panel,
//     regardless of what was left over from a previously active Issue.
//   - setView: changes only the active view; the Backlog panel's expanded
//     flag is untouched, so it doesn't flicker when switching canvases.
//   - toggleBacklog: flips the expanded flag; persists across further
//     setView calls until the next selectIssue call resets it again.
export function shellState() {
  return {
    issues: [],
    loading: true,
    activeIssueId: null,
    activeView: 'all',
    backlogExpanded: true,
    sidebarQuery: '',
    sidebarWidth: 260,
    backlogWidth: 320,
    _processInstance: null,
    _systemInstance: null,
    _interactionInstance: null,
    _objectInstance: null,
    thumbnails: { process: null, system: null, interaction: null, object: null },
    historyOpen: false,
    historyEntries: [],
    // Mirrors the data-theme attribute the inline head script already set
    // (ADR-0014) — never re-derived independently, so this can't disagree
    // with what's actually rendered.
    theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark',

    // Alpine's special lifecycle method — called automatically once this
    // component initializes. Issue loading is async (real git/IndexedDB
    // access, ADR-0009), so `issues` can't be populated synchronously the
    // way the mock array was.
    async init() {
      this.issues = await loadAllIssues();
      this.loading = false;
    },

    get activeIssue() {
      return this.issues.find((issue) => issue.id === this.activeIssueId) ?? null;
    },

    get filteredIssues() {
      const query = this.sidebarQuery.trim().toLowerCase();
      if (!query) return this.issues;
      return this.issues.filter((issue) => issue.title.toLowerCase().includes(query));
    },

    selectIssue(id) {
      this.activeIssueId = id;
      this.activeView = 'all';
      this.backlogExpanded = true;
    },

    async createNewIssue() {
      const issue = await createIssue();
      this.issues.push(issue);
      this.selectIssue(issue.id);
    },

    setView(view) {
      if (!VIEWS.includes(view)) return;
      this.activeView = view;
    },

    toggleBacklog() {
      this.backlogExpanded = !this.backlogExpanded;
    },

    // Bound to every Backlog field's @input/@change (index.html). activeIssue
    // is a live reference into the reactive `issues` array, so x-model has
    // already mutated it in place by the time this runs — same pattern the
    // canvas onChange handlers use for views[view].content.
    saveActiveIssue() {
      if (!this.activeIssue) return;
      scheduleSave(this.activeIssue);
    },

    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', this.theme);
      try {
        localStorage.setItem('parall-align_theme', this.theme);
      } catch (e) {
        // private browsing / storage disabled — theme just won't persist
      }
    },

    // Drag-handle resize (ADR-0007): 'sidebar' grows to the right,
    // 'backlog' grows to the left, both clamped to [MIN_PANEL_WIDTH,
    // MAX_PANEL_WIDTH].
    startResize(panel, event) {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = panel === 'sidebar' ? this.sidebarWidth : this.backlogWidth;
      const MIN_PANEL_WIDTH = 200;
      const MAX_PANEL_WIDTH = 480;

      const onMove = (moveEvent) => {
        const delta = panel === 'sidebar' ? moveEvent.clientX - startX : startX - moveEvent.clientX;
        const next = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, startWidth + delta));
        if (panel === 'sidebar') this.sidebarWidth = next;
        else this.backlogWidth = next;
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },

    // Bound via x-effect on each single-canvas view's container, re-evaluated
    // on every activeView/activeIssueId change. No-ops unless the desired
    // mounted issue actually changed for THIS view, so repeated
    // re-evaluations (Alpine re-runs x-effect on any reactive read inside
    // it) don't remount, and switching directly between two views that
    // share an engine module (System <-> Interaction) can't let one
    // instance's mount clobber the other's — each tracks its own handle,
    // not module-level state.
    _syncCanvas(view, wrapperEl, mountFn, instanceKey) {
      const shouldMount = this.activeView === view && this.activeIssue;
      const key = shouldMount ? this.activeIssue.id : null;
      const mountedKey = this[instanceKey] ? this[instanceKey].issueId : null;
      if (key === mountedKey) return;

      if (this[instanceKey]) {
        this[instanceKey].destroy();
        this[instanceKey] = null;
      }
      if (shouldMount) {
        const handle = mountFn(
          wrapperEl,
          this.activeIssue.views[view],
          (content) => {
            this.activeIssue.views[view].content = content;
            scheduleSave(this.activeIssue);
          },
          this.theme
        );
        this[instanceKey] = { issueId: key, destroy: handle.destroy };
      }
    },

    syncProcessCanvas(el) {
      this._syncCanvas('process', el, mountProcessCanvasAdapter, '_processInstance');
    },

    syncSystemCanvas(el) {
      this._syncCanvas('system', el, mountDrawioCanvas, '_systemInstance');
    },

    syncInteractionCanvas(el) {
      this._syncCanvas('interaction', el, mountDrawioCanvas, '_interactionInstance');
    },

    syncObjectCanvas(el) {
      this._syncCanvas('object', el, mountObjectCanvas, '_objectInstance');
    },

    // Bound via x-effect on the All view's wrapping element (ADR-0017).
    // Reruns whenever activeIssueId changes while activeView === 'all' —
    // no destroy/handle needed here, unlike the four single-canvas syncs
    // above, since rendering a thumbnail is a one-shot async call, not a
    // persistent mounted instance. thumbnails.js's own content-hash cache
    // handles avoiding redundant re-renders.
    async renderAllThumbnails() {
      if (!this.activeIssue) return;
      const issue = this.activeIssue;
      this.thumbnails = { process: null, system: null, interaction: null, object: null };
      this.thumbnails = await renderThumbnails(issue, this.theme);
    },

    // ADR-0009's history-browsing half (3b). Only meaningful for a single-
    // canvas view, not All — index.html hides the History button there.
    async toggleHistory() {
      this.historyOpen = !this.historyOpen;
      if (this.historyOpen && this.activeIssue) {
        this.historyEntries = await getViewHistory(this.activeIssue.id, this.activeView);
      }
    },

    async restoreHistoryEntry(oid) {
      if (!this.activeIssue) return;
      await restoreView(this.activeIssue, this.activeView, oid);

      // _syncCanvas only remounts on activeIssueId change, never on content
      // changing while already mounted — nudge it by clearing the tracked
      // instance. That field is itself a reactive property _syncCanvas
      // reads, so clearing it triggers the bound x-effect to remount fresh
      // with the just-restored content.
      const instanceKey = VIEW_INSTANCE_KEYS[this.activeView];
      if (instanceKey && this[instanceKey]) {
        this[instanceKey].destroy();
        this[instanceKey] = null;
      }

      this.historyOpen = false;
    },
  };
}
