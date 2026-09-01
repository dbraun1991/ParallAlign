// Temporary stand-in for the real Issue data source. Matches ADR-0009's JSON
// shape exactly so it can be swapped for the real isomorphic-git-backed
// persistence layer (Step 3 of the implementation roadmap) without the shell
// having to change how it reads issue data.

export const mockIssues = [
  {
    id: 'issue-1',
    schemaVersion: 1,
    title: 'Allow partial refunds',
    theme: 'Billing',
    state: 'mapped',
    notes: 'Customer support asked for this after three escalations last month.',
    createdAt: '2026-08-20T09:00:00Z',
    updatedAt: '2026-09-01T14:22:00Z',
    views: {
      process: { id: 'view-1-process', format: 'bpmn-xml', content: '' },
      system: { id: 'view-1-system', format: 'drawio-xml', content: '' },
      interaction: { id: 'view-1-interaction', format: 'drawio-xml', content: '' },
      object: { id: 'view-1-object', format: 'mermaid', content: '' },
    },
  },
  {
    id: 'issue-2',
    schemaVersion: 1,
    title: 'Single sign-on for enterprise tenants',
    theme: 'Auth',
    state: 'open',
    notes: '',
    createdAt: '2026-08-25T11:30:00Z',
    updatedAt: '2026-08-25T11:30:00Z',
    views: {
      process: { id: 'view-2-process', format: 'bpmn-xml', content: '' },
      system: { id: 'view-2-system', format: 'drawio-xml', content: '' },
      interaction: { id: 'view-2-interaction', format: 'drawio-xml', content: '' },
      object: { id: 'view-2-object', format: 'mermaid', content: '' },
    },
  },
  {
    id: 'issue-3',
    schemaVersion: 1,
    title: 'Export invoice history as CSV',
    theme: 'Billing',
    state: 'decided',
    notes: 'Decided to ship as a background job, not a synchronous download.',
    createdAt: '2026-07-15T08:00:00Z',
    updatedAt: '2026-08-30T16:45:00Z',
    views: {
      process: { id: 'view-3-process', format: 'bpmn-xml', content: '' },
      system: { id: 'view-3-system', format: 'drawio-xml', content: '' },
      interaction: { id: 'view-3-interaction', format: 'drawio-xml', content: '' },
      object: { id: 'view-3-object', format: 'mermaid', content: '' },
    },
  },
];
