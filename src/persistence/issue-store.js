import {
  initRepo,
  listIssueFiles,
  readIssueFile,
  writeIssueFile,
  commitIssue,
  readIssueAtCommit,
} from './git-store.js';
import { seedIssues } from './seed-issues.js';

const SAVE_DEBOUNCE_MS = 1500;
const saveTimers = new Map(); // issueId -> setTimeout handle

export async function loadAllIssues() {
  await initRepo();

  let files = await listIssueFiles();
  if (files.length === 0) {
    // True first run — seed the example issues so the app isn't a dead end
    // (there's still no "create issue" UI).
    for (const issue of seedIssues) {
      const filename = `${issue.id}.json`;
      await writeIssueFile(filename, issue);
      await commitIssue(filename, `seed: ${issue.title}`);
    }
    files = await listIssueFiles();
  }

  return Promise.all(files.map((filename) => readIssueFile(filename)));
}

export async function createIssue() {
  const now = new Date().toISOString();
  const issue = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    title: 'Untitled Issue',
    theme: '',
    state: 'open',
    notes: '',
    createdAt: now,
    updatedAt: now,
    views: {
      process: { id: crypto.randomUUID(), format: 'bpmn-xml', content: '' },
      system: { id: crypto.randomUUID(), format: 'drawio-xml', content: '' },
      interaction: { id: crypto.randomUUID(), format: 'drawio-xml', content: '' },
      object: { id: crypto.randomUUID(), format: 'mermaid', content: '' },
    },
  };

  const filename = `${issue.id}.json`;
  await writeIssueFile(filename, issue);
  await commitIssue(filename, `create: ${issue.title}`);

  return issue;
}

// Immediate commit, not debounced — restoring is a discrete, deliberate
// action like createIssue(), not rapid-fire typing.
export async function restoreView(issue, view, oid) {
  const issueAtCommit = await readIssueAtCommit(issue.id, oid);
  issue.views[view].content = issueAtCommit.views[view]?.content ?? '';
  issue.updatedAt = new Date().toISOString();

  const filename = `${issue.id}.json`;
  await writeIssueFile(filename, issue);
  await commitIssue(filename, `restore: ${view} to an earlier version`);
}

export function scheduleSave(issue) {
  const existingTimer = saveTimers.get(issue.id);
  if (existingTimer) clearTimeout(existingTimer);

  const timer = setTimeout(async () => {
    saveTimers.delete(issue.id);
    issue.updatedAt = new Date().toISOString();
    const filename = `${issue.id}.json`;
    try {
      await writeIssueFile(filename, issue);
      await commitIssue(filename, `update: ${issue.title}`);
    } catch (error) {
      console.error('Failed to save issue', issue.id, error);
    }
  }, SAVE_DEBOUNCE_MS);

  saveTimers.set(issue.id, timer);
}
