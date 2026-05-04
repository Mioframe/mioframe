---
name: crdt-storage
description: 'Use this skill for Automerge/CRDT changes, repo or document handle lifecycle, storage helpers, VFS behavior, subscriptions, listeners, workers, timers, caches, file handles, or blob URLs. Keep writes inside owning change callbacks and lifecycle-manage resources.'
---

# CRDT and storage workflow

Use this skill for changes that affect Automerge documents, repo/document handles, storage helpers, VFS behavior, or lifecycle-managed resources.

## Activation check

Use this workflow when the task touches any of these areas:

- Automerge or CRDT-backed state;
- repo, document handles, subscriptions, or observable query flows;
- storage helpers, VFS, file handles, blob URLs, or cache behavior;
- background services or proxy clients that read/write persisted state;
- migrations, normalization, or data repair for persisted documents;
- workers, listeners, timers, or other resources that need cleanup.

## Core invariants

- Mutate live nested CRDT objects only inside the owning change callback.
- Never assign a live document object back into the same document.
- Prefer shared write helpers such as `put`, `patch`, `deepPutJsonObject`, and `deepPatchJsonObject` when they match the write shape.
- Do not bypass entity or service APIs with direct storage access or ad hoc document mutation.
- Treat subscriptions, listeners, workers, timers, caches, file handles, and blob URLs as lifecycle-managed resources.

## Workflow

1. Identify the owner of the persisted behavior: schema/service, entity, feature, widget, or shared helper.
2. Read only the task-relevant files plus direct imports before editing.
3. Reuse existing storage, matching, parsing, filtering, normalization, or CRDT write helpers before creating new ones.
4. Keep writes small and scoped to the owning change callback.
5. Ensure subscriptions and handles recover from legitimate transient states such as missing documents when that is expected behavior.
6. Add cleanup or finalization for resources that can outlive the caller.
7. Add or update focused tests for storage semantics, migrations, normalization, CRDT write helpers, or lifecycle behavior when the change affects behavior.
8. Consider the `mutation-testing` skill after focused unit/integration tests pass for high-risk pure data logic.
9. Run the narrowest relevant verification, then follow the final verification rule from `AGENTS.md`.

## Testing guidance

Use focused unit or integration tests for:

- CRDT write helpers;
- storage helpers;
- migrations;
- normalization and validation;
- subscription recovery behavior;
- lifecycle cleanup;
- cache invalidation or reuse contracts;
- VFS behavior that can be tested without real browser interaction.

Use Playwright/e2e or a browser smoke check only when the behavior requires real browser APIs, file picker behavior, user interaction, or UI integration.

## Cache and lifecycle checks

When adding or changing caches:

- define the cache key explicitly;
- define invalidation, cleanup, or finalization behavior;
- avoid unbounded retention;
- ensure stale negative lookups do not hide newly created files or documents;
- document or test recovery when underlying documents appear after an initial miss.

When adding or changing subscriptions:

- preserve expected error-as-state behavior when the subscription is meant to recover;
- do not convert recoverable states into terminal stream failures;
- clean up listeners and handles when subscribers are gone;
- avoid duplicate subscriptions that do the same work for the same key.

## Limits

- Do not introduce direct background service imports into UI-facing layers.
- Do not spread storage write semantics across widgets or pages.
- Do not add local type assertions to force record iteration typing when typed collection helpers exist.
- Do not change production semantics only to satisfy a weak test or mutation score.
