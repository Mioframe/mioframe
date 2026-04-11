---
scope:
  - src/shared/lib/changeObject
  - src/shared/service/databaseDocument
kind: library-semantics
rule: Use `deepPutJsonObject` only for full-shape replacement semantics; it removes keys missing from the source. Use `deepPatchJsonObject` for partial updates; omitted keys stay, while `undefined` and `DELETE_MARKER` remove keys.
why: Choosing the wrong helper silently deletes or preserves nested state in Automerge-backed documents, filters, and database bodies.
evidence:
  - type: test
    ref: src/shared/lib/changeObject/__tests__/deepPutJsonObject.test.ts:185
    note: Empty source clears the target, showing full replacement semantics.
  - type: test
    ref: src/shared/lib/changeObject/__tests__/deepPatchJsonObject.test.ts:187
    note: Empty patch preserves target keys.
  - type: test
    ref: src/shared/lib/changeObject/__tests__/deepPatchJsonObject.test.ts:285
    note: DELETE_MARKER removes keys during patch semantics.
  - type: code
    ref: src/shared/service/databaseDocument/databaseService.ts:65
    note: Database service exposes separate put and patch entry points around these helpers.
  - type: code
    ref: src/shared/service/databaseDocument/view/databaseViewFilterService.ts:58
    note: Filter editing uses patch for incremental changes and put for full replacements.
status: verified
confidence: high
promotion-target:
  artifact: helper docs or stronger AGENTS note
  ref: src/shared/lib/changeObject/AGENTS.md
  trigger: Promote when another bug or review repeats helper misuse across scopes.
review-trigger:
  - When helper semantics or delete-marker handling changes.
  - When a caller switches between put and patch during a bug fix or review.
last-verified-at: 2026-04-12
---

The important distinction is omission versus deletion, not just “replace” versus “merge”.
