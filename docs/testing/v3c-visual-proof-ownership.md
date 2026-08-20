# V3C visual proof ownership cleanup

Status: architecture resolved; V3C-A Lists is architecturally accepted with a bounded legacy exception. Final exact-head verification and PR CI remain required before merge.

`docs/testing/architecture.md` remains the canonical project-wide testing policy. `docs/testing/storybook.md` defines Storybook ownership and placement. `docs/testing/migration-plan.md` records executable migration authorization. This document records the V3C architecture, the V3C-A result, and the exception boundary that applies only to the legacy Lists family.

## Goal

Reduce browser verification cost by correcting proof ownership before optimizing necessary tests or adding execution parallelism.

For a normal durable owner, V3C should:

1. identify observable contracts in legacy visual proof;
2. keep one primary proof owner for each required contract;
3. move reusable real-browser behavior to owner-local Storybook behavior;
4. move Vue/native/ARIA/component contracts to component tests;
5. keep visual regression limited to bounded accepted appearance;
6. remove duplicate and implementation-detail proof;
7. measure wall-clock and aggregate browser execution impact.

The goal is lower total proof cost, not merely moving assertions from the visual lane to another browser lane.

## Non-goals

V3C does not:

- change production behavior or public APIs;
- redesign verifier/resolver architecture;
- add verifier CLI modes, registries, dependency graphs, generic test DSLs, workers, jobs, sharding, retries, sleeps, timeout inflation, or weaker assertions;
- migrate unrelated proof owners in the same batch;
- treat screenshot acceptance as Material conformance proof.

## Normal proof ownership

| Observable contract | Primary proof owner |
| --- | --- |
| Vue props/emits/slots, native owner, attributes, ARIA and deterministic semantic state | colocated component `*.test.ts` |
| Real focus, keyboard, pointer/touch, hit testing, browser layout/overflow and browser-observable state transitions | owner-local `*.browser.spec.ts` |
| Bounded accepted stable appearance | visual proof in the currently authorized location |
| Complete product scenario crossing product/service/navigation/persistence boundaries | application E2E |

Private DOM/classes/custom properties and renderer internals are not independent contracts.

For a durable public CSS token contract, browser proof should set a distinctive non-default value through the public surface and assert the intended rendered effect. Declaration-only, resolved-value-only, or external-default-value checks are not the target architecture.

## V3C-A — legacy Lists

### Scope

V3C-A audited:

- `tests/e2e/visual/shared-ui/md-list.spec.ts`;
- `tests/e2e/visual/shared-ui/md-list-material-contract.ts`;
- active List visual snapshots;
- `src/shared/ui/Lists/*.test.ts`;
- Lists stories/fixtures needed by surviving proof.

The production `src/shared/ui/Lists` implementation is not a V3C change target.

### Resulting proof shape

```text
src/shared/ui/Lists/*.test.ts
  component-owned semantics

src/shared/ui/Lists/MDList.browser.spec.ts
  reusable real-browser and compatibility proof

tests/e2e/visual/shared-ui/md-list.spec.ts
  screenshot assertions only
```

Lists is authorized for owner-local browser proof. Surviving visual proof remains in the current central visual location until the canonical Material List migration changes the owner.

### Implemented result

The implementation achieved the main V3C-A objectives:

- the legacy central visual spec is screenshot-only;
- the broad `md-list-material-contract.ts` helper is removed;
- the former large inline Material literal table was reduced substantially;
- reusable browser proof is owner-local under `src/shared/ui/Lists/MDList.browser.spec.ts`;
- `aria-multiselectable` semantics are component-owned in `MDList.test.ts`;
- narrow MDStateLayer mounting/composition proof is component-owned in `MDListItem.test.ts`;
- three duplicate visual baselines were removed;
- the known focus-indicator intermittent failure was corrected through observable focus/indicator readiness rather than retry or timeout inflation;
- the focused Lists behavior stability diagnostic completed 580/580 executions with no reported flaky result;
- production Lists code, verifier architecture, CI topology, jobs, workers, retries, and Playwright configuration were not changed.

Measured browser proof cost changed from the V3 baseline to the corrected V3C-A result as follows:

| Metric | V3 baseline | Corrected V3C-A |
| --- | ---: | ---: |
| Visual executions | 201 | 87 |
| Storybook behavior executions | 76 | 134 |
| Visual + behavior executions | 277 | 221 |
| Visual local elapsed | about 8m21 verifier baseline | about 3.1m reported locally |
| Storybook behavior local elapsed | about 4m+ baseline | about 3.1m reported locally |

This is a material reduction in both the previously dominant visual lane and aggregate browser executions.

## V3C-A legacy exception

Lists is expected to be replaced by the canonical Material family implemented through the repository Material workflow and the private `@m3e/web` renderer boundary. The canonical family will own its own API, token and behavior contracts and must add proof from those contracts rather than preserve the internal proof structure of the legacy implementation.

Because of that replacement path, V3C-A does **not** require another deep cleanup round solely to perfect the old Lists proof architecture.

The current accepted legacy exceptions are:

- `MDList.browser.spec.ts` may temporarily retain some legacy fixture/default-geometry/system-token checks that would not be accepted as the preferred proof shape for a new durable canonical family;
- those checks must not be expanded, generalized, or used as precedent for later V3C owners;
- V3C-A does not require converting legacy spacing/default-value checks into a new exhaustive public-token override suite before the canonical List migration;
- V3C-A does not require further baseline pruning merely to prove that every remaining technical/Material-reference image is globally minimal before the family is replaced;
- surviving Material-reference screenshots are temporary accepted-appearance/migration comparison evidence only and do not prove Material conformance;
- remaining legacy-only proof may be deleted or replaced as part of the canonical List migration when the new family contracts identify the compatibility scenarios that actually survive.

This exception is justified only because the implementation owner itself is planned for replacement. It does not weaken `docs/testing/architecture.md`, `.agents/skills/ui-browser-behavior/SKILL.md`, or `.agents/skills/visual-regression-testing/SKILL.md` for durable owners.

## Compatibility proof worth carrying into the canonical List migration

The future List migration should re-evaluate current proof from user-observable scenarios, with particular attention to:

- native keyboard activation;
- real focus order;
- global focus-indicator integration;
- primary versus trailing action ownership and hit testing;
- selection through real pointer input;
- disabled interaction behavior;
- browser overflow/containment regressions that correspond to real reusable List behavior;
- a small representative set of current accepted visual appearances.

Legacy implementation details such as the current StateLayer wiring, exact internal token indirection, and old literal Material default matrices are not compatibility requirements by themselves.

## V3C-A completion boundary

No further MDList test-architecture redesign is required for V3C-A.

V3C-A is accepted when all of the following remain true on the final branch head:

- the visual spec stays screenshot-only;
- the broad legacy Material helper/table does not return;
- the known focus-indicator flake remains resolved;
- no retries, sleeps, force-based interaction, timeout inflation, repeated action delivery, or weakened flaky acceptance are introduced;
- production Lists behavior/API remains unchanged;
- aggregate browser execution remains materially below the V3 baseline;
- final automatic `pnpm verify` passes;
- GitHub exact-head CI passes before merge.

Do not add more legacy proof merely to satisfy the normal ideal ownership model. If a concrete current product defect is discovered, fix and prove that defect; otherwise defer List-family proof redesign to the canonical Material migration.

## Follow-up V3C owners

Later V3C owners should be audited independently. Existing candidates include:

- `tests/e2e/visual/shared-ui/md-icon-button.spec.ts`;
- `tests/e2e/visual/shared-ui.spec.ts` for MDCard/StateLayer;
- `tests/e2e/visual/shared-ui/md-menu.spec.ts`;
- `tests/e2e/visual/fab-container.spec.ts`.

The Lists legacy exception must not be copied to a durable owner merely to avoid cleanup. For each next owner, first check whether that implementation is itself scheduled for near-term canonical Material replacement. If it is, prefer the same bounded strategy: remove expensive/misowned proof that has immediate value, preserve compatibility scenarios needed by migration, and avoid polishing implementation-specific tests that the replacement will delete.

## After V3C

- V3D: optimize expensive necessary tests after misowned/duplicated proof is removed.
- V3E: consider more workers/jobs/sharding only for irreducible work and only when measurement justifies added compute and complexity.
- V4A: automatic release-impact planning.
- V4B: durable unit-test impact.
- V4C: persistent mutation targets.

## Current readiness

- architecture decisions resolved: yes;
- V3C-A ownership correction materially achieved: yes;
- known V3C-A flake resolved: yes, based on the reported 580/580 bounded stability run;
- additional legacy Lists proof redesign required: no;
- production/API changes required: no;
- verifier architecture changes required: no;
- final automatic verification required on the latest branch head: yes;
- exact-head GitHub CI required: yes;
- architecture verdict: accepted with bounded legacy exception; proceed to final verification and PR gate.
