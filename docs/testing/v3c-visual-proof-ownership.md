# V3C visual proof ownership cleanup

Status: architecture resolved; V3C-A Lists implementation is in correction after first architecture review.

`docs/testing/architecture.md` remains the canonical project-wide testing policy. `docs/testing/storybook.md` defines Storybook ownership and placement. `docs/testing/migration-plan.md` records executable migration authorization. This document records the V3C architecture, current review state, and acceptance contract.

## Goal

Reduce visual-lane cost by correcting proof ownership, not by weakening coverage.

For each audited legacy visual spec:

1. identify every observable contract currently asserted;
2. preserve each unique required contract under one primary proof owner;
3. move reusable real-browser behavior to Storybook behavior;
4. move Vue/native/ARIA/component contracts to component tests;
5. keep only bounded accepted appearance in visual regression;
6. remove duplicate or implementation-detail assertions only after their required contract is either preserved elsewhere or shown not to be a public/observable contract;
7. measure wall-clock and aggregate execution impact after cleanup.

## Non-goals

V3C does not:

- change production behavior or public APIs;
- redesign verifier resolver architecture;
- add new verifier CLI modes, registries, generic test DSLs, or dependency graphs;
- change application-E2E project applicability;
- add workers, jobs, sharding, retries, sleeps, timeout inflation, or assertion weakening;
- migrate unrelated visual owners in the same batch;
- treat screenshot baseline acceptance as Material conformance proof.

## Ownership

Proof ownership follows the existing testing architecture:

| Observable contract                                                                                                       | Primary proof owner                                                        |
| ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Vue props/emits/slots, native owner, explicit attributes, ARIA and controlled semantic state                             | colocated component `*.test.ts`                                            |
| Real focus, keyboard, pointer/touch, geometry, overflow, browser layout and browser-observable state transitions          | owner-local Storybook `*.browser.spec.ts`                                  |
| Bounded accepted stable appearance                                                                                        | visual `*.visual.spec.ts` or current authorized central visual location    |
| Complete product scenario crossing product/service/navigation/persistence boundaries                                     | application E2E                                                            |

Private DOM/classes/custom properties and renderer internals are not independent contracts. They may remain in proof only when the repository explicitly owns that public boundary and the assertion is the lowest faithful way to prove it.

Public CSS token proof follows `ui-browser-behavior`: when an active Mioframe public token is part of the accepted contract, set a distinctive non-default value through the public surface and assert its rendered effect. Declaration-only or resolved-value-only token checks are insufficient.

## V3C-A — Lists

### Scope

Audit and decompose:

- `tests/e2e/visual/shared-ui/md-list.spec.ts`;
- `tests/e2e/visual/shared-ui/md-list-material-contract.ts`;
- its active snapshot directory;
- existing `src/shared/ui/Lists/*.test.ts` owners;
- existing Lists stories and story fixtures required by surviving proof.

Production `src/shared/ui/Lists` implementation is not a change target unless the audit exposes an actual production defect. A proof migration must not alter production behavior merely to simplify tests.

### Final proof shape

Use the minimum complete set:

```text
src/shared/ui/Lists/*.test.ts
  Vue/native/ARIA/component contracts

src/shared/ui/Lists/MDList.browser.spec.ts
  surviving Lists-owned real-browser contracts

tests/e2e/visual/shared-ui/md-list.spec.ts
  surviving screenshot assertions only
```

`MDList.browser.spec.ts` is the cohesive Lists module/family browser owner. Do not split one browser spec per Vue file unless a later demonstrated ownership boundary requires it.

Lists is authorized in V3C-A for owner-local browser proof. Do not add a central Storybook behavior mapping for it; filesystem-derived owner-local discovery is the ownership mechanism.

Lists is **not** authorized by V3C-A for owner-local visual colocation. Surviving visual assertions and baselines remain in the current central visual location until a separate visual-migration authorization or canonical Material migration changes that owner.

### Required classification

Move or delete current assertions according to their actual contract:

- screenshots of distinct accepted visual states/compositions -> keep in visual;
- real Enter/Space/Tab behavior -> browser;
- focus acquisition/order/global focus-indicator integration -> browser;
- real pointer hover/press/click and primary/trailing action ownership -> browser;
- browser geometry, hit-target size, overflow and rendered spacing required by a user-visible contract -> browser;
- native tags/roles/ARIA/static DOM semantics that do not require a browser -> existing component tests;
- selection semantic state that does not require real browser input -> component tests;
- private `--md-private-*`, incidental classes, direct `transition-property` assertions, fixture implementation details, and declaration-only token checks -> remove unless a current public contract proves they are necessary;
- Material/public token assertions -> keep only when the token is an active Mioframe public contract, and prove the rendered effect at the lowest faithful owner;
- Storybook consumer reproductions named after Settings, Repository Explorer, EntryAddSheet, or Home -> do not classify as product E2E merely because they resemble product consumers; they remain isolated Lists fixtures unless they actually prove a complete product scenario.

### Screenshot pruning

Do not preserve every current baseline mechanically.

A screenshot survives only when it protects a distinct accepted stable visual contract not already covered by another surviving baseline. Diagnostic wrappers, technical galleries, or consumer-like fixtures do not automatically deserve separate baselines.

Before deleting a baseline:

1. identify the visible invariant it was intended to protect;
2. identify the surviving primary visual owner for that invariant, or establish that no stable public visual contract exists;
3. inspect whether another surviving baseline already covers the same visible state;
4. delete only after equivalent required coverage is confirmed.

Intentional pixel changes are outside V3C-A unless a stale/duplicated baseline is removed. Production appearance is expected to remain unchanged.

### Material contract helper

`md-list-material-contract.ts` belongs to the legacy visual suite only because that suite mixed proof types.

After classification:

- delete it if no surviving owned contract requires literal constants;
- otherwise move/split only the smallest values required by surviving component/browser proof to the truthful Lists test owner;
- do not preserve a broad Material token/value table solely to keep legacy assertions alive.

## First implementation review

The first implementation correctly established the target file ownership shape, but it is **not accepted** yet.

Confirmed good changes:

- the legacy central visual spec is now screenshot-only;
- reusable browser proof is physically owner-local in `src/shared/ui/Lists/MDList.browser.spec.ts`;
- `aria-multiselectable` component semantics moved to `MDList.test.ts`;
- narrow MDStateLayer mounting/composition proof moved to `MDListItem.test.ts`;
- verifier/resolver/CI architecture and production Lists code were not changed;
- the visual full lane reduced from the V3 baseline of 201 executions to 90 executions and passed without pixel changes in the first implementation run.

The following blockers must be corrected together before another architecture review.

### Blocker 1 — known focus-indicator flake

Two real-Tab/focus-indicator browser tests remain intermittently failing. This cannot be classified as an acceptable low-resource sandbox limitation.

Repository testing policy treats any known intermittent failure as failed proof. The correction must either remove a non-required duplicate/flaky assertion after ownership analysis or make the required browser contract deterministic through observable readiness/state. Do not rely on a stronger CI runner, retries, sleeps, timeout inflation, repeated action delivery, or weakened assertions.

### Blocker 2 — legacy Material value table was moved rather than fully classified

The current `MDList.browser.spec.ts` retains a broad inline `MD_LIST_MATERIAL_CONTRACT` and many literal Material geometry/default-token assertions.

This is not the intended V3C result. Reclassify every such assertion independently:

- keep geometry only when it protects a current observable Lists contract that genuinely requires a browser;
- keep a public component-token contract only when `src/shared/ui/Lists/README.md` currently exposes that token to consumers;
- for a public token, prove the public override through a distinctive non-default value and assert the intended rendered effect;
- remove declaration-only/default-value checks, system-token table checks, external-Material literal conformance matrices, and fixture-only assertions that do not protect an independent Mioframe contract;
- do not use the external Material source as a second automated source of truth for literal defaults inside browser tests.

The goal is not to preserve the old assertion count. The goal is the minimum faithful browser proof for current Mioframe contracts.

### Blocker 3 — screenshot pruning was not completed

Keeping all 16 existing PNGs unchanged does not satisfy the pruning acceptance by itself.

Audit each surviving screenshot and record one distinct accepted visible invariant. In particular, explicitly reconsider:

- diagnostic wrapper screenshots;
- technical surface-context galleries;
- consumer reproductions such as Repository Explorer, Settings/Home patterns, and EntryAddSheet rows;
- overlapping technical and Material-reference galleries.

Delete a baseline when its visible invariant is already protected by another surviving baseline or when it is only a diagnostic/fixture artifact rather than a stable visual contract. Keep a consumer-like screenshot only when the isolated Lists composition itself has distinct stable visual regression value; naming a product consumer is not sufficient.

### Blocker 4 — final verification and performance evidence

The first implementation did not produce a green final automatic `pnpm verify` because:

- Storybook behavior still had known intermittent failures;
- formatter failures existed in architecture docs prepared before the coding session.

The correction round may apply **mechanical formatter-only changes** to the V3C documentation already changed on this branch when required by `pnpm verify`. It must not redesign or rewrite the architecture documents.

After correction, record comparable full-lane measurements for visual and Storybook behavior and report aggregate browser execution/compute impact. A visual-lane improvement is not sufficient if unnecessary proof was merely moved to Storybook behavior.

## Acceptance

V3C-A is complete only when:

- `md-list.spec.ts` contains screenshot preparation/assertions only and no behavioral success criteria, DOM/ARIA contract assertions, token/computed-style matrices, or geometry matrices;
- every unique required Lists contract removed from visual has a correct primary owner or is explicitly shown to be implementation detail/duplicate/non-contract proof;
- reusable Lists browser behavior is owner-local under `src/shared/ui/Lists/MDList.browser.spec.ts` with no duplicate central mapping;
- component-level semantics are covered by existing colocated Lists tests without duplicating the same contract in browser proof;
- broad external-Material/default-token conformance tables are not retained as Storybook behavior proof;
- any surviving public token browser proof uses the public override surface and an observable rendered effect;
- surviving visual baselines are a minimal set of distinct accepted appearances with an explicit invariant for each retained baseline;
- production behavior, story addresses, and unrelated owners remain unchanged;
- no known intermittent browser failure remains;
- no retries, sleeps, force-based interaction, timeout inflation, repeated action delivery, or weakened assertions are introduced;
- focused proof passes for every changed owner and final `pnpm verify` passes before coding-agent handoff;
- before/after visual and Storybook behavior counts/timings plus aggregate browser execution impact are recorded;
- GitHub exact-head CI remains the architect-owned merge gate.

## Performance evidence

Use final CI run #3881 from PR #212 as the repository baseline for the full lanes:

- visual: 201 Playwright executions, about 7.1 minutes Playwright / 8m21 verifier;
- Storybook behavior: 76 tests, about 4+ minutes;
- application E2E: 65 executions, about 6.3 minutes Playwright / 7m15 verifier.

First implementation evidence:

- visual: 90/90 passed, about 3m07 locally;
- Storybook behavior: 141/144 passed in the reported full-lane run; two Lists focus-indicator tests remained intermittently failing;
- first implementation therefore has no accepted final Storybook behavior timing/performance result.

For the correction record after the suite is stable:

- visual test/execution count;
- visual Playwright elapsed time;
- visual verifier elapsed time;
- Storybook behavior test/execution count and elapsed time;
- aggregate browser executions and approximate aggregate browser compute.

Success is not defined as moving the same unnecessary assertions from visual to behavior. Aggregate proof must become simpler or cheaper while preserving required contracts. A behavior-lane increase is acceptable only for faithful browser contracts that were previously misowned in visual.

## Follow-up batches

After V3C-A, audit the next owners independently. Confirmed candidates include:

- `tests/e2e/visual/shared-ui/md-icon-button.spec.ts` — screenshots mixed with geometry/token/computed-style proof;
- `tests/e2e/visual/shared-ui.spec.ts` — MDCard/StateLayer screenshots mixed with component/browser behavior;
- `tests/e2e/visual/shared-ui/md-menu.spec.ts` — browser behavior with no screenshot regression ownership;
- `tests/e2e/visual/fab-container.spec.ts` — browser geometry/anchoring behavior with no screenshot regression ownership.

Do not combine these owners into V3C-A.

## After V3C

- V3D: remeasure and optimize expensive **necessary** tests only after misowned/duplicated proof is removed.
- V3E: consider more workers/jobs/sharding only for irreducible work and only when measured wall-clock benefit justifies aggregate compute and complexity.
- V4A: automatic release-impact planning.
- V4B: durable unit-test impact.
- V4C: persistent mutation targets.

## Implementation readiness

- architecture decisions resolved: yes;
- owner and source of truth resolved: yes;
- test ownership rules resolved: yes;
- production/API changes required: no;
- verifier architecture changes required: no;
- correction blockers resolved: no;
- current implementation accepted: no;
- verdict: ready for correction, not ready for merge.
