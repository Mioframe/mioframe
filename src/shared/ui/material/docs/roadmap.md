# Mioframe Material migration roadmap

This file is the only owner of current Material milestone status, family-stage status, technical blockers, latest pilot result, and next operator action. Durable workflow rules live in the other canonical documents.

## Current state

Last updated: 2026-08-11

Current milestone: `M2 — Switch stateful pilot correction`

Status: `correction-required`

The m3e-backed Material library architecture is established and already proven by Loading Indicator and Button. Switch has been migrated to the new library boundary and the legacy `src/shared/ui/Switch` owner has been removed, but the current Switch artifact chain is not merge-ready after architecture review against the latest `develop` state.

The branch must first synchronize with current `develop`; it is currently based before the completed Storybook S2 owner-local browser migration.

## Current family state

### Loading Indicator

```text
DESIGN.md          current
ARCHITECTURE.md    ready
IMPLEMENTATION.md  complete
MIGRATION.md       complete
REVIEW.md          compliant
```

No current blocker.

### Button

Runtime migration to the canonical m3e-backed Material library is complete and merged. Historical artifact-revision cleanup remains separate from the Switch pilot and is not a Switch blocker.

### Switch

```text
DESIGN.md          current
ARCHITECTURE.md    correction required
IMPLEMENTATION.md  stale after architecture correction
MIGRATION.md       stale after implementation correction
REVIEW.md          invalidated; fresh review required
```

The current runtime direction remains valid: one thin `MDSwitch` Vue adapter over `m3e-switch`, a curated Mioframe API, no renderer leakage, no recreated ripple/state-layer/geometry/motion, and the `presentation` extension for the two confirmed decorative list-item consumers.

## Current blockers

### 1. Controlled selection must prevent renderer-owned optimistic state drift

`selected` is the sole source of truth. The current implementation derives `update:selected` from renderer `change`, after `m3e-switch` has already changed its internal `checked` state. If a consumer rejects the emitted update and leaves the `selected` prop unchanged, Vue has no prop change to write back and renderer `checked` can remain divergent from the public prop.

The exact installed `@m3e/web@2.6.3` Switch contract provides the required intent seam: `m3e-switch` dispatches a bubbling, cancelable `beforeinput` before mutating `checked`; only when that event is not cancelled does it flip `checked` and dispatch `input`/`change`.

Architecture correction:

- bind renderer `checked` from public `selected` as before;
- handle renderer `beforeinput` as the user-toggle intent;
- when interactive, call `preventDefault()` so renderer does not mutate its own `checked` value;
- emit `update:selected` with the intended next value `!currentRendererChecked`;
- let the consumer-owned `selected` prop be the only mechanism that updates renderer `checked`;
- do not use `change` as the controlled-state source and do not add wrapper-owned selection state.

Required proof includes the rejected-intent case: when `selected=false`, user activation emits `true`, but if the consumer does not update the prop the rendered switch must remain unchecked.

### 2. Switch browser proof must follow current owner-local Storybook ownership

Current `develop` has completed Storybook S2 migration. Ordinary component/family-owned browser behavior now belongs in colocated `src/**/*.browser.spec.ts` files with filesystem-derived ownership.

Switch-owned browser proof must therefore live at:

```text
src/shared/ui/material/components/switch/MDSwitch.browser.spec.ts
```

Remove the branch-added central `tests/e2e/storybook/md-switch-family.spec.ts` and remove its `switch family behavior` mapping from `scripts/lib/storybookBehaviorRisk.mjs`. Do not add replacement registry metadata for a relation expressed by owner-local placement.

### 3. Do not widen the global Vitest browser-capability surface for one renderer

The current branch adds an `HTMLElement.prototype.attachInternals` polyfill in shared `src/setupVitest.ts`. That changes the capability surface for every Vitest test in the repository.

Unless another current test owner demonstrably requires the same shim, keep the `ElementInternals` test compatibility seam Switch-local (or in an already established narrowly scoped Material test helper). It must not make unrelated tests believe `attachInternals()` exists.

Real form participation and accessibility behavior remain browser-proof responsibilities; the test shim must stay minimal and must not become a fake implementation of those browser contracts.

### 4. Prove the real `presentation` composition action path

The confirmed product scenario is not merely that the decorative renderer fails to toggle itself. A real pointer click on the visible Switch region must still activate the owning `MDListItem` row action, because the row is the interactive `role="switch"` owner.

Add browser or faithful consumer-level proof that a click on the visible `MDSwitch presentation` region reaches the owning row action and that the subsequently updated consumer state is reflected back into the decorative renderer.

## Verification note

The previously reported cross-worktree Playwright mount failure is not currently accepted as a repository blocker. `scripts/playwrightContainer.mjs` intentionally mounts `process.cwd()`; evidence that an agent process had the wrong ambient working directory is insufficient to justify changing shared verification infrastructure in this PR.

After synchronization and the Switch corrections above, rerun the verifier from the correct checkout. If a wrong-worktree mount reproduces independently from the correct repository cwd, investigate it as a separate verification-infrastructure defect with its own reproduction and scope.

## Milestones

| ID  | Milestone                      | Status                | Exit gate                                                                                                                                                                                              |
| --- | ------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M0  | Material workflow architecture | `complete`            | staged family workflow and m3e-backed public boundary established                                                                                                                                      |
| M1a | Loading Indicator              | `complete`            | canonical adapter, migration and compliant review                                                                                                                                                      |
| M1  | Button                         | `complete-runtime`    | m3e-backed Button runtime and consumer migration merged                                                                                                                                                |
| M2  | Switch stateful pilot          | `correction-required` | current `develop` synchronized; controlled intent/state contract corrected; owner-local browser proof; scoped test shim; composition action proof; fresh downstream review; final `pnpm verify` passes |
| M3  | Sequential component migration | `planned`             | migrate one family at a time after M2 closes                                                                                                                                                           |

## Next operator action

1. Synchronize `refactor/material-switch-m3e` with current `develop`.
2. Correct Switch architecture and implementation using cancelable renderer `beforeinput` so `selected` remains the sole source of truth.
3. Align browser proof with completed S2 owner-local placement and remove the obsolete central Switch mapping.
4. Scope the `ElementInternals` test shim to the smallest truthful owner.
5. Add proof for the actual decorative-list-row click path.
6. Re-run implementation, migration and independent review stages against the corrected architecture.
7. Run one final `pnpm verify` from the correct checkout.

Do not change shared Playwright container infrastructure in this PR without a separate, independently reproduced repository-level defect.
