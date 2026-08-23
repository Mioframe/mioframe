# Database virtualization quality correction preflight

Status: **ready**.

Implementation input: `docs/database-virtualization-quality-correction-handoff.md`.

## Expected production scope

- `src/widgets/DocumentView/Database/EditableInlineValue.vue`
- `src/widgets/DocumentView/Database/EditableInlineValue.test.ts`

`useDatabaseInlineEditSession.ts` and its state shape are not expected to change.

## Expected application-E2E scope

- `tests/e2e/databaseViewsAndQueryFlows.spec.ts`
- new `tests/e2e/databaseVirtualizationFlows.spec.ts`
- `scripts/lib/e2eProjectApplicability.ts`
- `scripts/lib/e2eProjectApplicability.test.ts`
- `scripts/lib/e2eRisk.ts`
- `scripts/lib/e2eRisk.test.ts`

Do not edit architect-owned review or virtualization documentation during implementation.

## Pass order

1. Correct the resolving interaction surface locally in `EditableInlineValue`.
2. Update its focused component contract.
3. Move the virtualization-only fixture/helpers and seven product scenarios to the dedicated application spec without semantic changes.
4. Restore `databaseViewsAndQueryFlows.spec.ts` to its pre-virtualization `desktop` applicability.
5. Register the new virtualization spec as `both` and update deterministic applicability tests.
6. Retarget the existing virtualization E2E-risk mapping/tests to the new spec boundary.
7. Run only focused verifier-managed checks useful for the changed contracts.

## Component contract

Use the existing `isInteractionEnabled` fact as the only interaction gate.

Expected wiring:

```ts
const interactionTarget = computed(() => (isInteractionEnabled.value ? inlineEl.value : null));

const { hover, focused, durationPressedState } = useStateLayer(interactionTarget);
useRipple(interactionTarget);
```

Equivalent narrow Vue wiring is acceptable if it preserves the same ownership and has no second state.

The rendered Material state layer and clickable cursor must exist only for the interactive state. Prefer one explicit local BEM modifier such as `editable-inline-value_interactive` rather than a second behavior flag.

Do not add `disabled`/`enabled` support to shared State/Ripple for this one consumer.

### Component TEST IMPACT

Changed contract: resolving state is not merely non-editable; its host is not an active Material action target.

Primary proof: `EditableInlineValue.test.ts` component contract.

The focused test must observe the reactive target passed to the mocked state/ripple composables, not only stub away those composables. Prove:

- interactive session -> target resolves to the real root, state layer/clickable modifier present;
- resolving session -> target resolves to `null`, state layer/clickable modifier absent, no editor/cancel/draft interaction;
- recovered session -> target resolves back to the root and exact draft remains editable.

Keep the existing deterministic deferred-writer test as the session failure owner.

No new browser proof is required for the approved target-detachment design because the shared state/ripple behavior is unchanged and the component contract proves whether that existing capability receives a target. If the implementation leaves a live target attached while resolving, this preflight is invalid: stop and return to the handoff rather than compensating with CSS/timing logic.

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

Move the `DatabaseVirtualizationFixture` type and the fixture/import helpers introduced for those tests to the new spec. Keep generic existing helpers in `tests/e2e/helpers.ts`; do not create another shared test helper module unless both specs genuinely need the same new helper after the move.

After extraction, `databaseViewsAndQueryFlows.spec.ts` should contain its original views/query scenarios and only imports they use.

### E2E TEST IMPACT

Persistent applicability:

```text
tests/e2e/databaseViewsAndQueryFlows.spec.ts -> desktop
tests/e2e/databaseVirtualizationFlows.spec.ts -> both
```

`e2eProjectApplicability.test.ts` must prove every root spec remains classified exactly once.

In `E2E_SCENARIO_SCOPES`, preserve the existing virtualization source prefixes. Replace the virtualization scope's `databaseViewsAndQueryFlows.spec.ts` target with `databaseVirtualizationFlows.spec.ts`; preserve `databaseItemFlows.spec.ts` where it is already part of that scope. Independent `database persistence` mapping remains unchanged.

Update `e2eRisk.test.ts` expected focused plans accordingly. Do not make the new spec a source prefix and do not add duplicate registry metadata for the same relation.

## Required removal

- no unconditional `useStateLayer(inlineEl)` / `useRipple(inlineEl)` interaction target while resolving;
- no unconditional pointer cursor for `EditableInlineValue`;
- no virtualization-only fixture/helpers or seven virtualization tests left in `databaseViewsAndQueryFlows.spec.ts`;
- no `both` classification for `databaseViewsAndQueryFlows.spec.ts`;
- no virtualization source mapping to that historical spec once the dedicated owner exists.

## Verification

Use focused verifier-managed checks. Expected useful checks:

```text
pnpm verify --only unit-tests --files src/widgets/DocumentView/Database/EditableInlineValue.test.ts src/widgets/DocumentView/Database/useDatabaseInlineEditSession.test.ts scripts/lib/e2eProjectApplicability.test.ts scripts/lib/e2eRisk.test.ts
pnpm verify --only type-check
pnpm verify --only eslint --files src/widgets/DocumentView/Database/EditableInlineValue.vue src/widgets/DocumentView/Database/EditableInlineValue.test.ts tests/e2e/databaseViewsAndQueryFlows.spec.ts tests/e2e/databaseVirtualizationFlows.spec.ts scripts/lib/e2eProjectApplicability.ts scripts/lib/e2eProjectApplicability.test.ts scripts/lib/e2eRisk.ts scripts/lib/e2eRisk.test.ts
pnpm verify --only oxlint --files src/widgets/DocumentView/Database/EditableInlineValue.vue src/widgets/DocumentView/Database/EditableInlineValue.test.ts tests/e2e/databaseViewsAndQueryFlows.spec.ts tests/e2e/databaseVirtualizationFlows.spec.ts scripts/lib/e2eProjectApplicability.ts scripts/lib/e2eProjectApplicability.test.ts scripts/lib/e2eRisk.ts scripts/lib/e2eRisk.test.ts
pnpm verify --only e2e --files tests/e2e/databaseVirtualizationFlows.spec.ts
```

Use the smallest subset materially useful during implementation. Do not run a repository-wide final local gate solely for handoff; exact-head GitHub CI is architect-owned.

No performance rerun is required unless production virtualization/geometry or the measured rendering algorithm is changed, which is outside this correction scope.

## Forbidden

- changes to `useVirtualCollection`, `DatabaseDataTable`, relation roots, `MDTable`, shared State/Ripple public API, service/worker or persistence;
- second edit/draft/interaction state;
- generic disabled/interactivity abstraction;
- CSS-only suppression with live state/ripple target still attached;
- semantic edits to the seven moved product scenarios except imports/owner-local helper references required by the move;
- reclassifying the historical views/query spec to `both` without a separate complete audit;
- duplicated E2E scenarios or duplicated impact metadata;
- sleeps, force, retries-as-success, timeout inflation, weakened tolerances or private virtualizer assertions.

## Readiness

Expected files, pass order, component/E2E contracts, TEST IMPACT, required removal, verification, and forbidden scope are resolved.

Verdict: **ready**.
