# Database virtualization quality correction preflight

Status: **ready**.

Implementation input: `docs/database-virtualization-quality-correction-handoff.md`.

## Expected production scope

- `src/widgets/DocumentView/Database/DatabaseViewWidget.vue`
- `src/widgets/DocumentView/Database/DatabaseToolbar.vue`
- `src/widgets/DocumentView/Database/EditableInlineValue.vue`
- `src/widgets/DocumentView/Database/EditableInlineValue.test.ts`
- remove `src/widgets/DocumentView/Database/useDatabaseInlineEditSession.ts`
- remove `src/widgets/DocumentView/Database/useDatabaseInlineEditSession.test.ts`
- new `src/features/databaseInlineValueEdit/index.ts`
- new `src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.ts`
- new `src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.test.ts`

`src/entities/databaseValue/useDatabaseValueWrite.ts` is an existing public entity contract and is not expected to change.

## Expected application-E2E scope

- `tests/e2e/databaseViewsAndQueryFlows.spec.ts`
- new `tests/e2e/databaseVirtualizationFlows.spec.ts`
- `scripts/lib/e2eProjectApplicability.ts`
- `scripts/lib/e2eProjectApplicability.test.ts`
- `scripts/lib/e2eRisk.ts`
- `scripts/lib/e2eRisk.test.ts`

Do not edit architect-owned `REVIEW.md` or virtualization documentation during implementation.

## Pass order

1. Move the inline-edit session lifecycle into `src/features/databaseInlineValueEdit/` and make the feature obtain `useDatabaseValueWrite(path, documentId)` itself.
2. Update `DatabaseViewWidget` to consume the feature API and remove direct value-writer wiring while preserving resolve-before-view/configuration orchestration.
3. Correct the resolving interaction surface locally in `EditableInlineValue` and update its focused component contract.
4. Normalize the newly added `activeConfigurationSurface` template access in `DatabaseToolbar` to a named binding.
5. Move the virtualization-only fixture/helpers and seven product scenarios to the dedicated application spec without semantic changes.
6. Restore `databaseViewsAndQueryFlows.spec.ts` to `desktop`; register `databaseVirtualizationFlows.spec.ts` as `both`.
7. Retarget virtualization source-impact mapping/tests to the dedicated spec and moved feature owner.
8. Run focused verifier-managed checks useful for the changed contracts.

## Feature contract

Create:

```text
src/features/databaseInlineValueEdit/
  index.ts
  useDatabaseInlineEditSession.ts
  useDatabaseInlineEditSession.test.ts
```

Public entry point:

```ts
useDatabaseInlineEditSession(path, documentId);
```

Inputs are the existing narrow reactive directory path and Database document identity used by entity composables.

Inside the feature:

```ts
const { postValue } = useDatabaseValueWrite(path, documentId);
```

Keep the existing session model and lifecycle semantics:

```text
{ itemId, propertyId, initialValue, draft, resolving }
```

Return the same operation surface unless a mechanical rename is needed for FSD/public-export consistency:

```text
cancel
commit
getSession
request
resolve
updateDraft
```

Do not accept `postValue` as a public parameter after the move. Do not add dependency-injection options, a manager class, provider, registry, store, or generic edit-session framework.

### Feature TEST IMPACT

Move the existing focused tests with the implementation.

The tests must still prove:

- exact draft identity while a deferred write is resolving;
- rejected persistence resolves `false`;
- rejected persistence restores the same exact draft with `resolving: false`;
- persistence receives the expected item/property identity and draft through the entity writer.

Mock the entity writer at the feature boundary if needed. Do not add a production dependency-injection hook solely for tests.

## Widget composition contract

`DatabaseViewWidget` must:

- import `useDatabaseInlineEditSession` from the new feature public API;
- call it with `path` and `documentId`;
- remove direct `useDatabaseValueWrite` import/use;
- keep named handlers for request/update/commit/cancel;
- keep `resolveActiveInlineEdit()` before changing explicit view;
- keep `resolveActiveInlineEdit()` before setting `activeConfigurationSurface`;
- keep `activeConfigurationSurface` widget-owned.

Do not move view/configuration coordination into the feature.

Do not refactor the pre-existing item-remove action or duplicate read-model ownership as part of this correction.

## Resolving interaction contract

Use the existing `isInteractionEnabled` fact as the only interaction gate.

Expected wiring:

```ts
const interactionTarget = computed(() => (isInteractionEnabled.value ? inlineEl.value : null));

const { hover, focused, durationPressedState } = useStateLayer(interactionTarget);
useRipple(interactionTarget);
```

Equivalent narrow Vue wiring is acceptable.

The Material state layer and clickable cursor exist only for the interactive state. Prefer one explicit local BEM modifier such as `editable-inline-value_interactive` rather than another state ref.

Do not change shared State/Ripple APIs.

### Component TEST IMPACT

`EditableInlineValue.test.ts` must observe the reactive target passed to mocked `useStateLayer` / `useRipple` rather than only stubbing them away.

Prove:

- interactive -> target resolves to the real root, state layer/clickable modifier present;
- resolving -> target resolves to `null`, state layer/clickable modifier absent, no editor/cancel/draft interaction;
- recovered -> target resolves to the real root and the same draft remains editable.

No new browser proof is required for the approved structural target-detachment design. If a live target remains attached, stop and return to the handoff instead of compensating with CSS or timing logic.

## DatabaseToolbar template contract

Expose `activeConfigurationSurface` as an explicit local binding alongside the existing named prop refs and use it directly in the template:

```vue
v-if="activeConfigurationSurface === 'views'"
```

and equivalent checks for sort/properties/filter.

Do not use `props.activeConfigurationSurface` in the template after the correction. Do not broaden this into cleanup of unrelated historical `props.*` template usage elsewhere.

## E2E extraction contract

`databaseVirtualizationFlows.spec.ts` owns exactly the virtualization-specific product proof added by PR #217.

Move these seven tests unchanged apart from imports/local helper placement:

1. `uses the explicit nested relation overflow root for independent two-axis ranges`
2. `keeps normal and teleported recursive relation tables inside their widget-owned scroll roots`
3. `keeps the production Database table mounted work below its logical row-property cross product`
4. `keeps real preceding Database content connected to the table-owned surface range`
5. `virtualizes the real Database root across deep native-table row and property ranges`
6. `retains dynamic row sizing, sticky native-table surfaces, and measured property width`
7. `preserves a lifted inline draft across virtual eviction and resolves it before view and configuration changes`

Move the `DatabaseVirtualizationFixture` type and fixture/import helpers introduced for those tests to the new spec. Keep generic existing helpers in `tests/e2e/helpers.ts`; do not create another shared helper module without a genuine multi-owner need.

After extraction, `databaseViewsAndQueryFlows.spec.ts` contains its historical views/query scenarios and only imports they use.

### E2E TEST IMPACT

Persistent applicability:

```text
tests/e2e/databaseViewsAndQueryFlows.spec.ts -> desktop
tests/e2e/databaseVirtualizationFlows.spec.ts -> both
```

`e2eProjectApplicability.test.ts` must prove every root spec remains classified exactly once.

In `E2E_SCENARIO_SCOPES` for `database virtualized table product behavior`:

- preserve existing production source coverage;
- replace `tests/e2e/databaseViewsAndQueryFlows.spec.ts` with `tests/e2e/databaseVirtualizationFlows.spec.ts`;
- preserve `tests/e2e/databaseItemFlows.spec.ts` where already required;
- replace the old source entry `src/widgets/DocumentView/Database/useDatabaseInlineEditSession.ts` with the new feature owner, preferably the narrow prefix `src/features/databaseInlineValueEdit/`;
- leave independent database persistence mapping unchanged.

Update `e2eRisk.test.ts` focused-plan expectations accordingly.

## Required removal

- no widget-local `useDatabaseInlineEditSession.ts` or its test;
- no direct `useDatabaseValueWrite` wiring in `DatabaseViewWidget`;
- no unconditional `useStateLayer(inlineEl)` / `useRipple(inlineEl)` target while resolving;
- no unconditional clickable cursor while resolving;
- no `props.activeConfigurationSurface` template access in `DatabaseToolbar`;
- no virtualization-only fixture/helpers or seven virtualization tests left in `databaseViewsAndQueryFlows.spec.ts`;
- no `both` classification for the historical views/query spec;
- no virtualization source mapping to that historical spec or old widget-local session path.

## Verification

Use focused verifier-managed checks. Expected useful commands:

```text
pnpm verify --only unit-tests --files src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.test.ts src/widgets/DocumentView/Database/EditableInlineValue.test.ts scripts/lib/e2eProjectApplicability.test.ts scripts/lib/e2eRisk.test.ts
pnpm verify --only type-check
pnpm verify --only eslint --files src/features/databaseInlineValueEdit/index.ts src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.ts src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.test.ts src/widgets/DocumentView/Database/DatabaseViewWidget.vue src/widgets/DocumentView/Database/DatabaseToolbar.vue src/widgets/DocumentView/Database/EditableInlineValue.vue src/widgets/DocumentView/Database/EditableInlineValue.test.ts tests/e2e/databaseViewsAndQueryFlows.spec.ts tests/e2e/databaseVirtualizationFlows.spec.ts scripts/lib/e2eProjectApplicability.ts scripts/lib/e2eProjectApplicability.test.ts scripts/lib/e2eRisk.ts scripts/lib/e2eRisk.test.ts
pnpm verify --only oxlint --files src/features/databaseInlineValueEdit/index.ts src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.ts src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.test.ts src/widgets/DocumentView/Database/DatabaseViewWidget.vue src/widgets/DocumentView/Database/DatabaseToolbar.vue src/widgets/DocumentView/Database/EditableInlineValue.vue src/widgets/DocumentView/Database/EditableInlineValue.test.ts tests/e2e/databaseViewsAndQueryFlows.spec.ts tests/e2e/databaseVirtualizationFlows.spec.ts scripts/lib/e2eProjectApplicability.ts scripts/lib/e2eProjectApplicability.test.ts scripts/lib/e2eRisk.ts scripts/lib/e2eRisk.test.ts
pnpm verify --only e2e --files tests/e2e/databaseVirtualizationFlows.spec.ts
```

Use the smallest subset materially useful during implementation. Do not run a repository-wide final local gate solely for handoff; exact-head GitHub CI is architect-owned.

No performance rerun is required unless production virtualization/geometry or the measured rendering algorithm changes, which is outside this correction scope.

## Forbidden

- changes to `useVirtualCollection`, `DatabaseDataTable`, relation roots, `MDTable`, shared State/Ripple public API, service/worker, or entity value-write API;
- feature knowledge of view/configuration state or scroll roots;
- second edit/draft/interaction state;
- generic edit/interaction/configuration abstraction;
- public persistence callback injection into the new feature;
- CSS-only suppression with a live state/ripple target;
- semantic edits to the seven moved product scenarios beyond imports/owner-local helper references;
- broad historical views/query mobile reclassification;
- broad pre-existing Database widget cleanup;
- duplicated E2E scenarios or impact metadata;
- sleeps, force, retries-as-success, timeout inflation, weakened tolerances, or private virtualizer assertions.

## Readiness

Expected files, ownership, pass order, contracts, TEST IMPACT, required removal, verification, and forbidden scope are resolved.

Verdict: **ready**.
