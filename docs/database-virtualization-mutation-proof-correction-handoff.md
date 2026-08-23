# Database virtualization mutation-proof correction handoff

Status: **implemented; superseded by current review findings**.

This document records the mutation-proof correction contract that was implemented in PR #217. It is no longer the complete remaining-work contract: subsequent semantic review found additional owner-local proof gaps, a feature error-semantics issue, stale performance evidence after later geometry changes, and an E2E budget failure.

Current active review state is authoritative for remaining work:

- `src/entities/databaseData/REVIEW.md`;
- `src/features/databaseInlineValueEdit/REVIEW.md`;
- `src/widgets/DocumentView/Database/REVIEW.md`;
- `tests/e2e/REVIEW.md`.

## Original goal

Close the mutation-verification blocker by strengthening focused tests around the meaningful public behavior of the three touched production owners:

- `src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.ts`;
- `src/widgets/DocumentView/Database/DatabaseToolbar.vue`;
- `src/widgets/DocumentView/Database/EditableInlineValue.vue`.

The correction was intended as proof work while preserving the accepted production architecture.

## Result

The implementation added focused owner-local lifecycle/component coverage and corrected the stale session-ownership comment. The verifier-managed mutation gate subsequently passed with the repository's unchanged 60% breaking threshold.

That successful mutation result does not close the full PR review. Later semantic review established that:

- two feature lifecycle assertions from this contract are still not faithfully proved;
- several component tests exercise weaker/fake paths than the public contract they claim to prove;
- inline persistence failure is still collapsed to a boolean instead of an explicit feature error outcome;
- the final S0/G1 performance revalidation predates the current `DatabaseDataTable` geometry implementation;
- the combined virtualization inline-edit E2E exceeds the normal per-test budget on desktop and Mobile Chrome.

Do not use the earlier `production behavior accepted; no runtime changes` wording from this handoff to block a concrete correctness correction discovered by later review. Repository review findings and current canonical rules take precedence.

## Preserved architecture constraints

The later findings do **not** reopen the accepted virtualization architecture by themselves. Unless new diagnosis proves otherwise, preserve:

- `@tanstack/vue-virtual` as the sole range/measurement/cache engine;
- the existing narrow `useVirtualCollection` API;
- native-table row/property virtualization with explicit physical roots;
- table-owned root-to-surface geometry ownership;
- one feature-owned inline-edit session/draft;
- entity-owned value persistence entry point;
- widget-owned cross-feature resolve-before-view/configuration orchestration;
- dedicated Database virtualization application E2E ownership.

Any further geometry change must be evidence-driven. Any final geometry implementation must receive fresh S0/G1 production revalidation after runtime corrections are complete.

## Forbidden

- weakening mutation thresholds/configuration or excluding touched behavior;
- adding test-only production APIs or exported internals;
- moving persistence back into the widget;
- adding a second edit/session state, manager, provider, or generic interaction abstraction;
- duplicating application E2E scenarios;
- raising test timeouts, relying on retry success, adding sleeps, or using force to hide the current E2E failure;
- treating the historical performance numbers as proof for a later geometry implementation without revalidation.

## Readiness

Mutation threshold: **passed**.

Original mutation-proof correction: **implemented, but its semantic proof is not fully accepted**.

Current PR readiness: **follow the active owner-local `REVIEW.md` findings and the PR description**.
