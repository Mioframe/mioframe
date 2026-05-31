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
- For providers and adapters, keep persisted capability ownership, runtime ownership, operation ownership, recovery UI ownership, and retry/navigation ownership separate and explicit.
- Provider-specific failures must be defined and created next to the provider that detects them. Services may supply context or registries, but should not own provider error types.
- UI-facing storage records must be narrow display or selection records. Do not expose provider capabilities, instances, clients, callbacks, or service bags through normal UI lists.
- Any provider or service error crossing a worker/proxy boundary must use the project transfer-safe `DomainError` pattern and safe serializable metadata only.

## Workflow

1. Identify the owner of the persisted behavior: schema/service, entity, feature, widget, or shared helper.
2. Read only the task-relevant files plus direct imports before editing.
3. Reuse existing storage, matching, parsing, filtering, normalization, or CRDT write helpers before creating new ones.
4. Keep writes small and scoped to the owning change callback.
5. Ensure subscriptions and handles recover from legitimate transient states such as missing documents when that is expected behavior.
6. Add cleanup or finalization for resources that can outlive the caller.
7. For lifecycle, integration, or cache state changes, define the applicable state-transition matrix as part of the implementation preflight.
8. For provider access, auth, capability, or recovery changes, complete the provider recovery checklist before production edits.
9. Add or update focused tests for storage semantics, migrations, normalization, CRDT write helpers, or lifecycle behavior when the change affects behavior.
10. Consider the `mutation-testing` skill after focused unit/integration tests pass for high-risk pure data logic.
11. Run the narrowest relevant verification, then follow the final verification rule from `AGENTS.md`.

## Provider recovery checklist

Use this checklist only when a task changes provider access, authentication, capability state, persisted provider configuration, runtime mounts, or retry behavior. Keep answers short in the preflight to avoid wasting limits.

Before production edits, identify:

- source of truth for persisted capability or credentials;
- owner of runtime provider state;
- boundary that detects missing access;
- module where the typed error is defined and created;
- worker/proxy serialization path for that error;
- layer that performs user-action-only recovery steps;
- layer that renders recovery UI;
- layer that retries the original operation or route;
- cleanup and deduplication policy for pending requests;
- focused tests that prove each transition.

Hard rules for provider recovery:

- Do not implement provider recovery directly in `pages`. Pages may compose the screen and handle route navigation after recovery.
- Do not treat access-required as not-found when the provider or persisted capability exists.
- Do not unmount or hide a configured provider only because access is temporarily missing, unless the domain explicitly requires that transition.
- Do not move user-action-only browser prompts or account prompts into background services or workers.
- Do not trigger browser or account prompts on startup, route load, render, or background refresh when the platform requires user activation.
- Do not place capabilities, credentials, clients, callbacks, provider objects, raw external errors, paths, ids, or document names in `DomainError.message`, `DomainError.cause`, serialized payloads, diagnostics, or ordinary UI records.
- Do not duplicate the same provider state read in both page and widget layers. Pick one owner for each read model.

## Testing guidance

Use focused unit or integration tests for:

- CRDT write helpers;
- storage helpers;
- migrations;
- normalization and validation;
- subscription recovery behavior;
- lifecycle cleanup;
- cache invalidation or reuse contracts;
- VFS behavior that can be tested without real browser interaction;
- provider recovery state transitions that do not require the real browser prompt.

Use Playwright/e2e or a browser smoke check only when the behavior requires real browser APIs, file picker behavior, user interaction, or UI integration.

## State-transition matrix

When editing lifecycle, integration, or cache state, cover applicable transitions:

- initial disabled or unavailable state;
- enable after startup;
- disable after enable;
- repeated enable calls;
- enable to disable while setup is pending;
- enable to disable to enable while the first async operation resolves late;
- cleanup when the owning scope stops;
- multiple independent callers using the same target or service.

Cover applicable transitions with focused tests to drive the implementation.

For provider recovery, additionally cover applicable transitions:

- provider is configured but access is missing;
- first operation creates one recoverable request;
- repeated or parallel operations do not leak unbounded pending requests;
- user completes recovery and the original operation can be retried;
- user declines recovery and the provider remains configured if that is the domain rule;
- stale or invalid recovery request id is handled safely;
- provider removal or disconnect cleans up pending recovery state.

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
