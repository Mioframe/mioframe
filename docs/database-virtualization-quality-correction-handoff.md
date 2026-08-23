# Database virtualization quality correction handoff

Status: **ready**.

This is the implementation contract for the remaining full-PR code-health findings in PR #217. It does not reopen the accepted virtualization engine, native-table geometry, relation-root design, performance evidence, service/worker contracts, or canonical Database sources.

## Goal

Close the remaining resolving-interaction, FSD ownership, Vue-template, and application-E2E ownership defects with the minimum complete correction, then return the full PR to semantic review and exact-head CI.

## Current findings

1. `EditableInlineValue` is logically gated while `editSession.resolving`, but its host still owns live Material activation feedback (`cursor: pointer`, state layer, ripple target).
2. The inline-edit session lifecycle is implemented as a widget-local composable even though it owns a complete user-action flow including draft state, cancel, commit, persistence serialization, and recoverable failure.
3. `DatabaseToolbar` uses the newly added controlled `activeConfigurationSurface` through `props.` in the template instead of the component's existing named-ref style.
4. The virtualization product scenarios added by this PR were appended to `databaseViewsAndQueryFlows.spec.ts` and changed that whole historical spec from `desktop` to `both` without the required dedicated full-spec applicability audit.

## Non-goals

- no `useVirtualCollection`, `DatabaseDataTable` geometry, `MDTable`, relation-root, overlay/tooltip, service/worker, filter/sort/view source, or performance redesign;
- no generic disabled/state-layer API;
- no edit manager, provider, registry, global store, or second edit draft;
- no broad `DatabaseViewWidget` decomposition merely to reduce line count;
- no refactor of the pre-existing `RelationValueFieldData.onSelect` callback prop;
- no pre-existing item-remove/read-model cleanup in this PR;
- no rewrite or semantic weakening of accepted virtualization product scenarios.

## Ownership

### Feature: Database inline value edit

Create a dedicated feature owner:

`src/features/databaseInlineValueEdit/`

It owns one active Database inline-edit session and the user-action lifecycle around it:

```text
{ itemId, propertyId, initialValue, draft, resolving }
```

The feature owns:

- request/claim of a cell edit;
- the one canonical draft while the cell may be virtually evicted;
- draft updates;
- cancel;
- serialized resolve/commit;
- persistence through `@entity/databaseValue`;
- recoverable failure that restores the exact draft to an interactive state.

The feature accepts only narrow Database identity inputs required to obtain the entity writer (`path`, `documentId`). It does not accept a service object or a parent-provided persistence callback.

The feature must not know about:

- views or `DatabaseConfigurationSurface`;
- toolbar/sheet state;
- scroll roots or virtualization geometry;
- relation DOM ownership;
- Database screen layout.

### Widget: Database screen composition

`DatabaseViewWidget` remains the composition owner. It consumes the feature session API and owns only screen/cross-feature decisions:

- which explicit view is active;
- which configuration surface is controlled open;
- resolving the active inline edit before a view or source/shape transition;
- composing table, toolbar, dialogs, value rendering, and screen branches;
- owning the top-level physical scroll root.

It must not import `useDatabaseValueWrite` after this correction.

`EditableInlineValue` remains widget-level screen composition because it composes the screen's value rendering/editor surfaces across property types. It receives the narrow session projection and emits user intents; it does not own the lifted session.

### Entity

`@entity/databaseValue` continues to own the narrow value persistence contract. `useDatabaseValueWrite` remains unchanged and is consumed by the new feature.

### Application E2E

`tests/e2e/databaseVirtualizationFlows.spec.ts` owns the virtualization-specific complete product scenarios and is persistently applicable to `both` desktop and Mobile Chrome.

`databaseViewsAndQueryFlows.spec.ts` retains its historical `desktop` applicability.

`scripts/lib/e2eRisk.ts` owns explicit source-to-product-proof selection and must follow the inline-edit composable from its old widget path to the new feature path.

## Minimum sufficient design

### Inline-edit feature move

Move the existing session implementation, preserving its simple model:

- one `shallowRef` active session;
- one in-flight resolution promise;
- no second draft/cache/store;
- equality check before persistence;
- exact draft retained on rejected persistence;
- operations ignored while resolving where currently required.

Public feature API:

```ts
useDatabaseInlineEditSession(path, documentId);
```

returns the existing narrow lifecycle operations:

```text
cancel
commit
getSession
request
resolve
updateDraft
```

The implementation obtains `postValue` internally through `useDatabaseValueWrite(path, documentId)`.

Do not add optional dependency injection, a class, a manager object, or a generic edit-session abstraction solely to preserve the old test shape. Focused tests may mock the entity composable at the feature boundary.

### Resolving interaction surface

Keep `isInteractionEnabled` as the only interaction fact derived from `editSession.resolving`.

When interaction is enabled:

- the real inline root is the target passed to `useStateLayer` and `useRipple`;
- `MDStateLayer` is rendered;
- the clickable cursor and existing semantic action attributes remain.

When resolving:

- the reactive state/ripple target is `null`;
- `MDStateLayer` is not rendered;
- the clickable cursor is absent;
- editor/request/draft/cancel interaction remains unavailable.

A rejected write restores the same draft and the normal interaction target/state/cursor.

Do not change shared State/Ripple APIs.

### Controlled configuration template

`DatabaseToolbar` already uses named refs for its props. Add `activeConfigurationSurface` to that explicit local contract and use it directly in the template. Do not introduce template-level `props.activeConfigurationSurface` or a broad props cleanup.

### Application-E2E ownership

Create:

`tests/e2e/databaseVirtualizationFlows.spec.ts`

Move, without semantic changes, the virtualization fixture/import helpers added by PR #217 and exactly these seven scenarios out of `databaseViewsAndQueryFlows.spec.ts`:

- `uses the explicit nested relation overflow root for independent two-axis ranges`;
- `keeps normal and teleported recursive relation tables inside their widget-owned scroll roots`;
- `keeps the production Database table mounted work below its logical row-property cross product`;
- `keeps real preceding Database content connected to the table-owned surface range`;
- `virtualizes the real Database root across deep native-table row and property ranges`;
- `retains dynamic row sizing, sticky native-table surfaces, and measured property width`;
- `preserves a lifted inline draft across virtual eviction and resolves it before view and configuration changes`.

Move only imports/helpers exclusive to those scenarios. Do not duplicate them.

Persistent applicability:

```text
tests/e2e/databaseViewsAndQueryFlows.spec.ts -> desktop
tests/e2e/databaseVirtualizationFlows.spec.ts -> both
```

In the existing `database virtualized table product behavior` risk scope:

- preserve the existing production source coverage;
- replace `databaseViewsAndQueryFlows.spec.ts` with `databaseVirtualizationFlows.spec.ts`;
- preserve the existing `databaseItemFlows.spec.ts` relation;
- replace the old widget-local `useDatabaseInlineEditSession.ts` source entry with the new feature path;
- leave independent database-persistence mapping unchanged.

## Proof

### Feature lifecycle

Move the focused session tests with the implementation. Preserve deterministic proof that:

- the exact draft remains visible while a deferred write resolves;
- rejected persistence returns `false` and restores that exact draft with `resolving: false`;
- persistence is addressed by logical item/property identity through the entity writer.

### Resolving interaction

Update the `EditableInlineValue` component contract to prove:

- interactive state binds the actual inline root as state/ripple target and renders the state layer/clickable modifier;
- resolving changes that target to `null`, removes the state layer/clickable modifier, and exposes no editor/cancel/draft interaction;
- recovery restores the same draft and interaction surface.

No new browser proof is required for the approved structural target-detachment design. If implementation keeps a live state/ripple target and relies on CSS/event timing, the implementation is outside this contract.

### E2E ownership

- seven product scenarios remain behaviorally unchanged and exist exactly once;
- dedicated virtualization spec is independently selectable and classified `both`;
- historical views/query spec is `desktop`;
- source-impact tests select the new spec for virtualization and the new feature path for inline-edit changes.

## Acceptance

- inline-edit lifecycle is feature-owned and widget persistence wiring is removed;
- `DatabaseViewWidget` still resolves edits before view/configuration transitions;
- no feature knowledge of views/configuration/layout/virtualization is introduced;
- no resolving host presents hover/press/ripple/clickable-cursor feedback;
- rejected persistence restores the exact draft and normal interaction surface;
- shared State/Ripple and entity value-write APIs remain unchanged;
- `DatabaseToolbar` uses a named `activeConfigurationSurface` binding in its template;
- all seven virtualization product scenarios have one dedicated E2E owner;
- Mobile Chrome executes that dedicated spec, not the complete historical views/query spec;
- source-impact mapping remains deterministic and follows moved ownership;
- no scenario/assertion/tolerance/timeout/retry is weakened;
- performance evidence remains valid because virtualization/geometry/runtime rendering is unchanged.

## Forbidden

- shared State/Ripple disabled API;
- CSS-only or `pointer-events` suppression with a live ripple/state target;
- second edit state/draft/cache;
- generic edit/interaction/configuration manager;
- parent-provided persistence callback for the new feature;
- feature knowledge of view/configuration state or scroll roots;
- broad `DatabaseViewWidget` refactor unrelated to these findings;
- full historical views/query mobile reclassification;
- duplicated E2E scenarios or impact metadata;
- production test hooks;
- virtualization/geometry changes;
- worker/query/storage optimization;
- sleeps, force, retries-as-success, timeout inflation, or tolerance weakening.

## Readiness

Ownership, final state, minimum design, proof ownership, and E2E applicability are resolved.

Verdict: **ready**.
