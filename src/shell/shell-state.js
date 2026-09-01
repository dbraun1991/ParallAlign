import { mockIssues } from '../persistence/mock-issues.js';

const VIEWS = ['all', 'process', 'system', 'object', 'interaction'];

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
    issues: mockIssues,
    activeIssueId: null,
    activeView: 'all',
    backlogExpanded: true,
    sidebarQuery: '',
    sidebarWidth: 260,
    backlogWidth: 320,

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

    setView(view) {
      if (!VIEWS.includes(view)) return;
      this.activeView = view;
    },

    toggleBacklog() {
      this.backlogExpanded = !this.backlogExpanded;
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
  };
}
