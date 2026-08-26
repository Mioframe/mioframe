# Database virtualization relation-selection correction handoff

Status: **ready**.

## Goal

Remove the remaining upward relation-selection mutation callback prop identified by the final PR #217 review while preserving existing relation selection behavior and ownership.

## Confirmed current behavior

- `RelationValueField` owns relation selection mutation through its existing `onSelect(itemId)` behavior.
- `RelationValueField` exposes that operation through the existing `data` scoped-slot payload.
- `DatabasePropertyValueField` consumes that slot and renders `RelationValueFieldData`.
- `RelationValueFieldData` currently accepts `onSelect` as a function prop and calls it from checkbox interaction.
- Current Vue component rules forbid parent-owned mutation callbacks as component props and require typed upward interaction events.

## Non-goals

- no relation persistence, relation-view selection, query, virtualization, or nested scroll-root redesign;
- no change to `RelationValueField` state shape or mutation semantics;
- no new manager, store, provider, callback abstraction, or shared API;
- no rewrite of scoped-slot function payload conventions;
- no work on the separate inline-edit eviction or lockfile findings in this pass.

## Affected scenario

Selecting or deselecting a relation row through the checkbox must update the same relation value as before.

## Ownership

- `features/relationValueEdit`: owns relation-selection interaction and mutation behavior.
- `widgets/DocumentView/Database`: composes the existing feature slot with `RelationValueFieldData`; it must not become the mutation owner.
- entity/shared/service/worker/page: unchanged.

## Source of truth and state

The existing `RelationValueField` relation value/update path remains canonical. No new state is introduced.

## Public component contract

`RelationValueFieldData` must expose a typed upward `select` event carrying exactly one `DatabaseItemId` and must no longer expose an `onSelect` prop.

`DatabasePropertyValueField` binds the emitted `select` event to the existing scoped-slot `onSelect` handler. `RelationValueField` remains unchanged unless a mechanical type/template adjustment is strictly required.

## Minimum sufficient design

1. remove `onSelect` from `RelationValueFieldData` props;
2. add `defineEmits<{ select: [itemId: DatabaseItemId] }>()`;
3. emit `select` from the checkbox interaction handler;
4. replace `:on-select="onSelect"` in `DatabasePropertyValueField` with `@select="onSelect"`;
5. update the focused component contract test to prove the emitted item id.

No additional abstraction is justified. The simpler alternative of retaining the callback prop is rejected because it contradicts the repository's current Vue component communication contract.

## Acceptance

- `RelationValueFieldData` has no parent mutation callback prop;
- one checkbox interaction emits exactly one typed `select` event with the correct item id;
- `DatabasePropertyValueField` forwards that event to the existing feature-owned scoped-slot handler;
- relation selection user behavior is unchanged;
- virtualization geometry and relation scroll-root contracts are untouched.

## Required verification

Use focused unit/component-contract verification, focused E2E selected from the existing source-impact mapping, then the required cumulative `pnpm verify --base origin/develop` branch gate.

## Forbidden

- editing any `REVIEW.md`;
- editing canonical virtualization architecture/results docs or PR metadata;
- changing relation persistence/view/query behavior;
- changing E2E mappings unless the existing mapping is proven incorrect by the code change;
- timeout/retry/sleep/force workarounds;
- unrelated cleanup.

## Implementation readiness

All product behavior, ownership, API, proof ownership, and boundaries are resolved.

Unresolved blockers: none.

Verdict: **ready**.
