# Database virtualization review correction preflight

Status: **ready**.

Authoring source: `docs/database-virtualization-review-correction-handoff.md`, `docs/database-virtualization.md`, active owner-local `REVIEW.md`, applicable `AGENTS.md`, and testing/diagnostics skills.

## Goal and boundaries

Implement only the active review corrections. Preserve accepted virtualization/root/source architecture. Do not edit architect-owned review/canonical/performance/PR documents.

## Pass order

### Pass 1 — feature error semantics and lifecycle proof

Expected scope:

- `src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.ts`;
- its colocated tests;
- feature-local error code/module only if needed;
- feature barrel only if a new public type must be exported;
- existing snackbar/diagnostics public APIs as dependencies.

Implement the handoff result contract. Preserve existing `DomainError`; wrap only non-`DomainError` failures with one feature-local stable code + safe message + raw cause. Emit one safe snackbar per actual failed persistence operation. Report only unexpected non-`DomainError` failure through the diagnostics wrapper. Keep one session and one in-flight promise.

Add/strengthen tests for:

- exact non-resolving cancel clears with no persistence;
- after one successful changed resolve, a later changed session makes a second distinct write with its own IDs/draft;
- rejected existing `DomainError` is returned unchanged and the exact draft is recoverable;
- rejected raw error is returned as the feature `DomainError` with raw cause;
- concurrent callers share one failed operation/result and do not duplicate persistence/feedback;
- successful retry is independent of the previous failure;
- request/view/configuration gating proceeds only on explicit success.

### Pass 2 — widget component proof fidelity

Expected scope:

- `src/widgets/DocumentView/Database/EditableInlineValue.test.ts`;
- `src/widgets/DocumentView/Database/DatabaseToolbar.test.ts`;
- minimal widget test/mock adaptation required by the new feature result.

Required proof:

- field Enter/Escape through real `keydown` with `KeyboardEvent.key`, not literal custom event names;
- boolean activation writes the exact `toggleBoolean` result;
- stored `true` ARIA case;
- short-string minimum input size plus existing longer-string case;
- toolbar property patch uses exact mounted path/document/property/update values.

Do not change widget runtime behavior for these test gaps unless Pass 1 API adaptation requires the narrow success-result check.

### Pass 3 — application E2E correction and diagnosis

Expected scope:

- `tests/e2e/databaseVirtualizationFlows.spec.ts`;
- `tests/e2e/databasePropertyFlows.spec.ts` and shared E2E helpers only if diagnosis proves a test-owned defect;
- production code only if focused evidence proves the timeout is runtime-owned.

Replace the oversized inline-edit virtualization test with exactly three behavior-focused scenarios from the handoff. Keep one product proof owner and `both` applicability; do not add duplicate routing/configuration matrices.

Separately reproduce/diagnose the historical relation-property timeout. Preserve its user contract. Do not make speculative geometry changes.

### Pass 4 — final performance measurement

Only after Passes 1–3 are stable and after the last runtime/geometry edit, run the existing production S0/G1 measurement protocol with three samples each. Do not create new benchmark infrastructure and do not repeat the full matrix unless S0/G1 shows a scale-dependent problem.

Report the exact final measurement head/state and raw S0/G1 results to the architect; do not edit `docs/database-virtualization-production-results.md`.

## TEST IMPACT

- Contract/scenario: inline persistence failure semantics and lifecycle
  - Primary proof owner: `useDatabaseInlineEditSession.test.ts`
  - Additional proof: existing mutation target
  - New/updated proof: result identity/cause, cancel, second write, retry, shared in-flight failure
  - Risk: persistence/error/concurrency

- Contract/scenario: inline value + toolbar public component behavior
  - Primary proof owner: colocated widget component tests
  - Additional proof: existing mutation target
  - New/updated proof: real key events, exact boolean value, ARIA true, minimum sizing, exact document identity
  - Risk: Vue event fidelity/accessibility/wiring

- Contract/scenario: lifted edit across virtualization and resolve-before-transition
  - Primary proof owner: `tests/e2e/databaseVirtualizationFlows.spec.ts`
  - Additional proof: owner-local feature/widget tests
  - New/updated proof: three focused product scenarios on Chromium and Mobile Chrome
  - Risk: browser/mobile/virtual eviction/configuration

- Contract/scenario: historical relation-property flow
  - Primary proof owner: existing `databasePropertyFlows.spec.ts`
  - New/updated proof: none unless diagnosis identifies a real missing/test-owned contract
  - Risk: current PR runtime regression versus test defect

- Contract/scenario: large Database performance on final geometry
  - Primary proof owner: task-specific S0/G1 production measurement
  - Metric: mounted DOM remains bounded; no 9M materialization; retain established usable/Long Task protocol
  - Risk: main-thread geometry/rendering cost

## Focused verification

Use the smallest useful verifier-managed checks while implementing:

```bash
pnpm verify --only unit-tests --files src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.test.ts src/widgets/DocumentView/Database/EditableInlineValue.test.ts src/widgets/DocumentView/Database/DatabaseToolbar.test.ts
pnpm verify --only mutation --files src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.ts src/widgets/DocumentView/Database/DatabaseToolbar.vue src/widgets/DocumentView/Database/EditableInlineValue.vue
pnpm verify --only e2e --files tests/e2e/databaseVirtualizationFlows.spec.ts tests/e2e/databasePropertyFlows.spec.ts
```

Run focused type-check/lint only as useful for touched code. Do not run repository-wide final verification solely for handoff; exact-head CI is architect-owned.

## Stop conditions

Stop and report instead of broadening scope if:

- correct error handling would require service/entity/shared API redesign;
- E2E diagnosis points to unresolved geometry architecture rather than a local runtime defect;
- S0/G1 shows a material regression needing a new architecture decision;
- passing requires timeout/mutation/config weakening or new generic infrastructure.
