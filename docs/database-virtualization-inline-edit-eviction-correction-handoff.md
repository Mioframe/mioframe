# Database virtualization inline-edit eviction correction handoff

Status: **ready**.

## Goal

Make virtual cell eviction preserve the feature-owned inline-edit draft without implicitly persisting or cancelling it.

## Confirmed current behavior

- `databaseInlineValueEdit` owns one lifted `{ itemId, propertyId, initialValue, draft, resolving }` session that survives virtual remounts.
- `EditableInlineValue` currently emits `commitEdit` from `onBeforeUnmount()` whenever its editor is open and cancellation was not requested.
- Virtual range changes therefore turn ordinary child unmount into persistence.
- The current component test explicitly expects commit-on-unmount.
- The existing virtualization E2E checks draft text after remount but does not distinguish lifted draft survival from an eviction-triggered persisted value.

## Non-goals

- no feature-session API or entity writer redesign;
- no new page/navigation teardown persistence contract;
- no new lifecycle manager, cache, virtualizer hook, observer, or state machine;
- no geometry, range, table, relation, toolbar, or Material changes;
- no timeout/retry/sleep changes;
- no lockfile/dependency work in this pass.

## Affected scenarios

1. An edited cell scrolls out of the vertical virtual range and later remounts: the same editor/draft is still active.
2. An edited property scrolls out of the horizontal virtual range and later remounts: the same editor/draft is still active.
3. Explicit Escape after remount cancels the draft and reveals the original persisted value.
4. Existing explicit outside-click/Enter commit and view/configuration resolution behavior remain unchanged.

## Ownership

- `features/databaseInlineValueEdit`: remains the sole lifted session and persistence-resolution owner.
- `widgets/DocumentView/Database/EditableInlineValue`: owns only the mounted cell interaction surface; generic component teardown is not a commit/cancel intent.
- entity/shared/service/worker/page: unchanged.

## Source of truth and state

The existing feature-owned session remains canonical. No new state is introduced.

`isCancellationRequested` in `EditableInlineValue` exists only to suppress the current unmount auto-commit after explicit cancellation. Once generic unmount no longer commits, that local flag has no remaining requirement and must be removed with the lifecycle hook.

## Public contract

No public component or feature API changes.

Existing explicit events remain:

- `commitEdit` for explicit commit interactions;
- `cancelEdit` for explicit cancellation;
- `requestEdit` / `update:draft` unchanged.

Generic component unmount emits neither commit nor cancel.

## Minimum sufficient design

1. remove `onBeforeUnmount` from `EditableInlineValue` and its Vue import;
2. remove `isCancellationRequested` and its request/cancel assignments as obsolete state;
3. preserve `commitEditor()` for the existing explicit Enter/outside interaction paths;
4. preserve `cancelEditor()` for existing explicit close/Escape paths;
5. replace the unit contract that expects auto-commit-on-unmount with proof that ordinary active-editor unmount emits neither `commitEdit` nor `cancelEdit`;
6. strengthen the existing virtualization E2E so both vertical and horizontal eviction prove the editor is remounted with the exact draft still active, then explicitly Escape and verify the original persisted value is restored.

The simpler alternative of distinguishing virtual unmount from other component unmounts is rejected: there is no confirmed generic-unmount persistence requirement, and the feature already owns the lifted session.

## Acceptance

- virtual/generic child unmount does not emit `commitEdit` or `cancelEdit`;
- no obsolete cancellation bookkeeping remains in the child;
- vertical and horizontal virtual remount restore the active editor with the exact lifted draft;
- Escape after each remount restores the original persisted value, proving eviction did not persist the draft;
- explicit Enter/outside commit and explicit close/Escape cancellation remain unchanged;
- view/configuration resolution remains feature/widget-owned and unchanged;
- no new abstraction or lifecycle protocol appears.

## Required verification

Use focused component-contract verification and focused application E2E for the existing Database virtualization owner, then the cumulative `pnpm verify --base origin/develop` branch gate. Retry-pass/flaky is failure.

## Forbidden

- editing any `REVIEW.md`, this handoff/preflight, canonical virtualization docs, or PR metadata;
- changing `databaseInlineValueEdit` or `databaseValue` unless new repository evidence proves the resolved design impossible;
- adding page-navigation/unmount persistence behavior;
- virtualizer/geometry changes;
- new lifecycle flags, managers, caches, observers, or hooks;
- assertion weakening, timeout inflation, sleeps, force, or retry-as-success;
- unrelated cleanup.

## Implementation readiness

Behavior, ownership, state shape, minimum design, and proof are resolved.

Unresolved blockers: none.

Verdict: **ready**.
