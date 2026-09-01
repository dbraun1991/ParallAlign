# copy

Cross-issue copy mechanics: read a source view or Backlog entry at its current HEAD (never a historical version), overwrite the destination field, commit with a provenance message, and record `copiedFrom: {issueId, viewId, commit, at}` on the copied field. A one-time fork, never a live link. The source/destination picker UI is not designed yet — this module is the copy mechanics only.

ADR-0010.
