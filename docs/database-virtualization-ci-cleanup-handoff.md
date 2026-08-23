# Database virtualization CI cleanup handoff

Status: **ready**.

This is the implementation contract for the remaining exact-head CI failure in PR #217. Product architecture and semantic review are already accepted; this handoff is static/test-infrastructure cleanup only.

## Goal

Unblock the PR-wide static gate without changing runtime virtualization, product behavior, browser-proof semantics, performance evidence, or public APIs.

## Confirmed current failure

On exact head `9917fda2a25ceb326d42a0dbfc5b5bfd9dc29145`:

- ESLint reports 8 errors in `src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts`:
  - five `no-restricted-syntax` errors for `querySelector` / `querySelectorAll` inside the atomic deep-geometry Playwright snapshot;
  - three `@typescript-eslint/no-unnecessary-condition` errors for optional access on the already-resolved tail item;
- Oxlint reports one `no-shadow` warning in `src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts` for the inner `rowSelector` payload name.

The five restricted-syntax errors are caused by lint scope, not by a Vue production communication defect: the `app/vue-ui-imperative-dom-communication` rule currently covers all `src/shared/ui/**/*.{ts,mts,tsx}` and excludes unit/story files, but not the canonical colocated Playwright `*.browser.spec.ts` / `*.visual.spec.ts` proof files.

## Architecture decision

Keep the production Vue communication rule unchanged and keep browser proof under `ui-browser-behavior` rules.

The minimum complete correction is:

1. In `eslint.config.mjs`, exclude canonical colocated Playwright proof files from the `app/vue-ui-imperative-dom-communication` block only:
   - `**/*.browser.spec.{ts,mts,tsx}`;
   - `**/*.visual.spec.{ts,mts,tsx}`.
2. Do not exclude those files from ESLint generally, Playwright rules, type-aware rules, or other project lint rules.
3. Preserve the existing atomic browser-side deep-geometry snapshot in `VirtualCollectionCapability.browser.spec.ts`; it intentionally reads correlated values synchronously so geometry from different settling moments is not mixed.
4. In that snapshot, make the mounted-tail precondition explicit and remove the three unnecessary optional accesses on the tail item. Missing mounted items must fail the proof explicitly rather than silently produce `NaN`/null geometry.
5. In `DatabaseVirtualizationCapability.browser.spec.ts`, rename the shadowing evaluate payload/local selector name only; do not change anchor-selection behavior.

## Why this is simpler than rewriting the snapshot

Rebuilding the atomic observation through multiple Playwright locator reads would reintroduce the settling race the proof was specifically designed to prevent. Rebuilding the same atomic observation through additional locator/evaluate plumbing adds complexity only to satisfy a production-component lint rule that does not own browser-test DOM observation.

Correcting the lint scope preserves both contracts:

- production Vue code still cannot use imperative DOM lookup to coordinate components;
- browser proof may synchronously observe public rendered DOM when the proof requires one atomic snapshot.

## Ownership

- `eslint.config.mjs`: lint enforcement scope.
- `src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts`: shared virtualization browser proof only.
- `src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts`: native-table capability browser proof only.

No runtime owner changes.

## Acceptance criteria

- the Vue imperative-DOM restriction still applies to production Vue/shared-UI implementation files;
- canonical colocated browser/visual proof files are not subject to that production communication restriction;
- all other ESLint/Playwright/type-aware rules continue to apply to those proof files;
- the shared deep-geometry proof remains one synchronous browser-side snapshot and keeps its current settling/geometry assertions and tolerances;
- absence of a mounted tail item fails explicitly;
- the three unnecessary optional-chain errors are gone;
- the database capability `no-shadow` warning is gone;
- no runtime, fixture, public API, product E2E, performance threshold, browser matrix, timeout, retry, or tolerance changes are introduced.

## Verification

Use focused verifier-managed static checks for the touched files. No new performance run, product E2E, or 300/300 stability rerun is required because the accepted browser behavior and assertions are unchanged.

Exact-head GitHub CI remains the authoritative merge gate.

## Forbidden

- disabling or weakening the production Vue communication rule globally;
- excluding all `src/shared/ui` or all tests from ESLint;
- file-local `eslint-disable` directives for the five DOM lookups as a substitute for correcting the rule scope;
- splitting the atomic geometry snapshot into independent async DOM reads;
- changing geometry assertions, tolerances, retry behavior, timeouts, or test applicability;
- runtime virtualization changes;
- new test-only production APIs;
- broad cleanup of unrelated ESLint/JSDoc warnings.

## Readiness

Implementation decision, scope, ownership, and verification are resolved.

Verdict: **ready**.
