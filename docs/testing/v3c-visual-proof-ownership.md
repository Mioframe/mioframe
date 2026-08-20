# V3C visual proof ownership cleanup

Status: architecture ready; V3C-A Lists is the first authorized implementation batch.

`docs/testing/architecture.md` remains the canonical project-wide testing policy. `docs/testing/storybook.md` defines Storybook ownership and placement. `docs/testing/migration-plan.md` records executable migration authorization. This document records the V3C architecture and acceptance contract.

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

| Observable contract | Primary proof owner |
| --- | --- |
| Vue props/emits/slots, native owner, explicit attributes, ARIA and controlled semantic state | colocated component `*.test.ts` |
| Real focus, keyboard, pointer/touch, geometry, overflow, browser layout and browser-observable state transitions | owner-local Storybook `*.browser.spec.ts` |
| Bounded accepted stable appearance | visual `*.visual.spec.ts` or current authorized central visual location |
| Complete product scenario crossing product/service/navigation/persistence boundaries | application E2E |

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

`md-list-material-contract.ts` currently belongs to the legacy visual suite only because the suite mixes proof types.

After classification:

- delete it if no surviving owned contract requires literal constants;
- otherwise move/split only the smallest values required by surviving component/browser proof to the truthful Lists test owner;
- do not preserve a broad Material token/value table solely to keep legacy assertions alive.

## Acceptance

V3C-A is complete only when:

- `md-list.spec.ts` contains screenshot preparation/assertions only and no behavioral success criteria, DOM/ARIA contract assertions, token/computed-style matrices, or geometry matrices;
- every unique required Lists contract removed from visual has a correct primary owner or is explicitly shown to be implementation detail/duplicate/non-contract proof;
- reusable Lists browser behavior is owner-local under `src/shared/ui/Lists/MDList.browser.spec.ts` with no duplicate central mapping;
- component-level semantics are covered by existing colocated Lists tests without duplicating the same contract in browser proof;
- surviving visual baselines are a minimal set of distinct accepted appearances;
- production behavior, story addresses, and unrelated owners remain unchanged;
- no retries, sleeps, force-based interaction, timeout inflation, or weakened assertions are introduced;
- focused proof passes for every changed owner and final `pnpm verify` passes before coding-agent handoff;
- GitHub exact-head CI remains the architect-owned merge gate.

## Performance evidence

Use final CI run #3881 from PR #212 as the repository baseline for the full lanes:

- visual: 201 Playwright executions, about 7.1 minutes Playwright / 8m21 verifier;
- Storybook behavior: 76 tests, about 4+ minutes;
- application E2E: 65 executions, about 6.3 minutes Playwright / 7m15 verifier.

For V3C-A record before/after at minimum:

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
- test ownership resolved: yes;
- production/API changes required: no;
- verifier architecture changes required: no;
- unresolved blockers: none;
- verdict: ready.
