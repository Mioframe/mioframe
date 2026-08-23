# Database virtualization CI cleanup preflight

Status: **ready**.

Authoring source: `docs/database-virtualization-ci-cleanup-handoff.md`, `docs/database-virtualization.md`, root/applicable `AGENTS.md`, `.agents/skills/shared-ui-implementation/SKILL.md`, `.agents/skills/ui-browser-behavior/SKILL.md`, `.agents/skills/verification/SKILL.md`, and the exact-head CI output for PR #217.

## Goal / non-goals

Fix only the remaining static-gate failures. Do not change runtime code, virtualization architecture, fixtures, browser scenarios, product E2E, performance evidence, public APIs, or test tolerances.

## Confirmed current state

- `eslint.config.mjs` applies `app/vue-ui-imperative-dom-communication` to all `src/shared/ui/**/*.{ts,mts,tsx}` and currently ignores unit/test-utils/stories but not colocated Playwright browser/visual specs.
- `VirtualCollectionCapability.browser.spec.ts` uses one intentional synchronous browser snapshot for correlated deep geometry; five DOM lookups are caught by that production communication rule.
- the same snapshot has three unnecessary optional accesses on its tail item.
- `DatabaseVirtualizationCapability.browser.spec.ts` has one `no-shadow` warning from an evaluate payload named `rowSelector` shadowing the outer selector.

## Minimum implementation

### 1. Lint ownership correction

In the existing `app/vue-ui-imperative-dom-communication` config block only, extend `ignores` with:

```text
**/*.browser.spec.{ts,mts,tsx}
**/*.visual.spec.{ts,mts,tsx}
```

Do not change `vueUiCommunicationFiles`, the restriction itself, its severity/message, Playwright config, or global lint coverage.

### 2. Shared capability proof cleanup

Keep the existing synchronous deep-geometry `page.evaluate` snapshot and all existing returned fields/assertions.

Before accessing the final mounted item, establish an explicit non-empty mounted-item precondition. If no mounted item exists, throw a deterministic proof error.

Then read the tail item's `data-testid`, `data-item-offset`, and `data-item-size` without unnecessary optional chaining.

Do not replace the atomic snapshot with multiple locator reads or change settling logic.

### 3. Database capability warning cleanup

Rename the shadowing selector payload/local name used by the anchor-state `page.evaluate` call (for example `mountedRowSelector`). Keep the selector value, row filtering, anchor choice, epsilon, assertions, and behavior unchanged.

## Expected changed files

- `eslint.config.mjs`
- `src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts`
- `src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts`

No other production/test/documentation files should need code changes.

## Required removal

- the five false-positive production communication lint errors from the shared browser spec;
- the three unnecessary tail-item optional accesses;
- the database capability selector shadow warning.

Do not add local lint suppressions to replace them.

## TEST IMPACT

- Contract/scenario: production Vue imperative-DOM communication guard scope.
  - Primary proof owner: ESLint configuration/static verification.
  - Existing proof: repository ESLint gate.
  - New/updated proof: none; only enforcement scope changes.
  - Risk: accidentally excluding production implementation or all browser specs from unrelated lint rules.
  - Required invariant: only the named production communication rule ignores canonical colocated browser/visual proof suffixes.

- Contract/scenario: shared virtualization deep non-zero-`surfaceOffset` atomic geometry proof.
  - Primary proof owner: `VirtualCollectionCapability.browser.spec.ts`.
  - Existing proof: accepted deterministic capability proof and 300/300 stability evidence.
  - New/updated proof: no scenario/assertion change; keep the same atomic snapshot and assertions.
  - Risk: splitting correlated reads or weakening failure behavior.
  - Required invariant: one synchronous snapshot, explicit mounted-tail precondition, unchanged geometry tolerances/settling criteria.

- Contract/scenario: database above-viewport resize anchor proof.
  - Primary proof owner: `DatabaseVirtualizationCapability.browser.spec.ts`.
  - Existing proof: accepted browser capability proof.
  - New/updated proof: none; identifier-only cleanup.
  - Risk: none beyond accidental behavior edit.

No product E2E, visual baseline, mutation, schema, release, performance, or browser-matrix change is applicable.

## Verification

Use the smallest useful verifier-managed checks:

```text
pnpm verify --only eslint --files eslint.config.mjs src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts
pnpm verify --only oxlint --files src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts
```

Run a focused Storybook browser proof only if the code edit materially changes the snapshot/anchor behavior during implementation; the accepted design does not require such a behavior change.

Do not run a broad local repository gate solely for handoff. Exact-head GitHub CI is architect-owned.

## Stop conditions

Stop and report `blocked` if making the static gate pass would require:

- changing runtime virtualization/fixture behavior;
- weakening/removing the production communication restriction;
- changing browser assertions/tolerances/settling protocol;
- introducing broad lint exceptions;
- changing test applicability or retry policy.

## Forbidden

Global lint weakening; file-local suppression for the five DOM lookup errors; broad warning cleanup; independent async replacement reads; runtime/public API changes; tolerance/timeout/retry changes; performance reruns without new evidence.

Verdict: **ready**.
