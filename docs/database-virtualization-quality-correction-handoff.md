# Database virtualization quality correction handoff

Status: **ready**.

This is the implementation contract for the remaining full-PR code-health findings in PR #217. It does not reopen the accepted virtualization architecture, performance evidence, relation-root design, or edit-session ownership.

## Goal

Close the remaining interaction-surface and application-E2E ownership defects with the smallest local corrections, then return the PR to final semantic review and exact-head CI.

## Current findings

1. `EditableInlineValue` is logically gated while `editSession.resolving`, but its host still owns live Material activation feedback (`cursor: pointer`, state layer, ripple target). The canonical session rejects interaction during that interval, so the surface can still appear actionable.
2. The virtualization product scenarios added by this PR were appended to `databaseViewsAndQueryFlows.spec.ts` and changed that whole historical spec from `desktop` to `both` without the dedicated full-spec applicability audit required by repository rules.

## Non-goals

- no `useVirtualCollection`, `DatabaseDataTable` geometry, `MDTable`, relation-root, overlay/tooltip, service/worker, persistence, filter/sort/view source, or performance redesign;
- no generic disabled/state-layer API;
- no second edit draft, edit manager, configuration manager, or UI registry;
- no audit/refactor of the pre-existing `RelationValueFieldData.onSelect` callback prop;
- no rewrite or semantic weakening of the accepted virtualization product scenarios.

## Ownership

- `src/widgets/DocumentView/Database/EditableInlineValue.vue` owns whether its inline-value host is currently an actionable interaction surface.
- `useDatabaseInlineEditSession` remains the only edit-session/draft/resolution owner and does not need redesign.
- `tests/e2e` owns complete Database virtualization product scenarios and their persistent desktop/mobile applicability metadata.
- `scripts/lib/e2eRisk.ts` owns explicit source-to-product-scenario selection for centralized application E2E.

## Minimum sufficient design

### Resolving interaction surface

Keep the existing `isInteractionEnabled` derivation.

When interaction is enabled:

- the real inline root is the target passed to `useStateLayer` and `useRipple`;
- the Material state layer is rendered;
- the pointer cursor and current semantic action attributes remain unchanged.

When `editSession.resolving` makes interaction disabled:

- the reactive target passed to `useStateLayer` and `useRipple` is `null`;
- `MDStateLayer` is not rendered for that host;
- the clickable cursor is absent;
- the editor, edit request, draft update and cancel paths remain unavailable as already implemented.

A rejected write restores the same session with `resolving: false`; the same normal interaction target/state layer/cursor and exact draft become available again.

Do not change shared State/Ripple APIs. Do not add a second local disabled state; derive everything from the existing session state.

### Application-E2E ownership

Create one dedicated root application spec:

`tests/e2e/databaseVirtualizationFlows.spec.ts`

Move, without changing their product semantics, the virtualization fixture/import helpers added by PR #217 and these seven virtualization scenarios out of `databaseViewsAndQueryFlows.spec.ts`:

- `uses the explicit nested relation overflow root for independent two-axis ranges`;
- `keeps normal and teleported recursive relation tables inside their widget-owned scroll roots`;
- `keeps the production Database table mounted work below its logical row-property cross product`;
- `keeps real preceding Database content connected to the table-owned surface range`;
- `virtualizes the real Database root across deep native-table row and property ranges`;
- `retains dynamic row sizing, sticky native-table surfaces, and measured property width`;
- `preserves a lifted inline draft across virtual eviction and resolves it before view and configuration changes`.

Also move only the imports/helpers used exclusively by those scenarios. Do not duplicate them across both specs.

Persistent applicability:

- `databaseViewsAndQueryFlows.spec.ts` returns to `desktop`;
- `databaseVirtualizationFlows.spec.ts` is `both`.

Update `e2eProjectApplicability.ts` and its deterministic test accordingly.

Update the existing `database virtualized table product behavior` mapping in `e2eRisk.ts` so the virtualization source prefixes select `databaseVirtualizationFlows.spec.ts` instead of `databaseViewsAndQueryFlows.spec.ts`. Preserve the currently required `databaseItemFlows.spec.ts` relation and any independent database persistence relation. Update resolver tests to the new truthful spec boundary.

Do not copy the seven scenarios back into another application spec.

## Proof

### Resolving interaction

Keep the existing deferred-writer session test.

Update the `EditableInlineValue` component contract to prove:

- normal interactive state binds the actual inline root as the state/ripple target and renders the state layer/clickable modifier;
- resolving state changes that reactive target to `null`, removes the state layer/clickable modifier, and still exposes no editor/cancel/draft interaction;
- returning to `resolving: false` restores the same exact draft and normal interaction target.

Because the correction structurally detaches the host from the existing shared state/ripple composables rather than changing their browser lifecycle, no new shared State/Ripple browser contract is required. If implementation leaves a live interaction target/listener and instead relies on pointer timing or CSS-only suppression, add faithful browser proof before handoff.

### E2E ownership

- the moved seven product scenarios remain behaviorally unchanged;
- the dedicated virtualization spec is independently selectable and classified `both`;
- the historical views/query spec is again `desktop`;
- source-impact resolver tests prove virtualization sources select the dedicated product spec.

## Acceptance

- no resolving inline host can present hover/press/ripple/clickable-cursor feedback for an action the session rejects;
- rejected persistence restores the exact draft and normal interaction surface;
- no shared UI API or edit-session state shape changes;
- all seven virtualization product scenarios have one cohesive application-E2E owner;
- Mobile Chrome runs only the dedicated virtualization spec, not all pre-existing views/query scenarios;
- existing virtualization source impact remains fail-closed and deterministic;
- no scenario duplication or weakened assertion/tolerance/timeout/retry is introduced;
- performance evidence remains valid because virtualization/geometry/runtime rendering is unchanged.

## Forbidden

Shared State/Ripple disabled API; `pointer-events` or CSS-only suppression while leaving the live ripple/state target attached; second edit state; generic interaction manager; full historical views/query mobile reclassification without a separate explicit audit; duplicated product scenarios; production test hooks; virtualization/geometry changes; worker/query/storage optimization; sleeps, force, retry-as-success, timeout inflation, or tolerance weakening.

## Readiness

Ownership, final state, minimum design, proof ownership, and E2E applicability are resolved.

Verdict: **ready**.
