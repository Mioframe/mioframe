# Mioframe Material migration roadmap

This file is the only owner of current Material milestone status, family-stage status, technical blockers, latest pilot result, and next operator action. Durable workflow rules live in the other canonical documents.

## Current state

Last updated: 2026-08-11

Current milestone: `M2 — Switch stateful pilot correction`

Status: `correction-required`

The m3e-backed Material library architecture is established and already proven by Loading Indicator and Button. Switch has been migrated to the new library boundary and the legacy `src/shared/ui/Switch` owner has been removed, but the current Switch artifact chain is not merge-ready after architecture review against the current `develop` state.

The branch is synchronized with current `develop`, including the completed Storybook S2 owner-local browser migration. The remaining work is Switch-owned correction, not branch synchronization.

Switch is a calibration family. Findings that expose missing durable Material/testing rules are corrected in the canonical docs/skills in this same PR rather than treated only as one-family patches.

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
REVIEW.md          blocked → self/architecture
```

The current runtime direction remains valid: one thin `MDSwitch` Vue adapter over `m3e-switch`, a curated Mioframe API, no renderer leakage, no recreated ripple/state-layer/geometry/motion, and the `presentation` extension for the two confirmed decorative list-item consumers.

Current correction findings:

1. **Controlled-state ownership.** The current wrapper derives `update:selected` from renderer `change`, after `m3e-switch` mutates `checked`. If the consumer rejects the emitted update and leaves `selected` unchanged, renderer state can diverge from the public source of truth. The exact installed `@m3e/web@2.6.3` exposes the correct public seam: bubbling cancelable `beforeinput` is dispatched before the renderer changes `checked`. Architecture must use intent-before-mutation semantics so `selected` remains the only state owner.
2. **Browser-proof ownership.** The Switch branch originally added central `tests/e2e/storybook/md-switch-family.spec.ts` plus a scenario-registry mapping. Current `develop` has completed Storybook S2; ordinary family-owned proof belongs in colocated `src/**/*.browser.spec.ts` and must use filesystem-derived ownership without duplicate central mapping.
3. **Test-environment blast radius.** Switch currently adds an `ElementInternals` compatibility polyfill to shared `src/setupVitest.ts`, changing `HTMLElement.prototype` for every unit test even though the need is renderer/family-specific. The shim must move to the narrowest truthful Switch test owner unless independent consumers justify shared ownership.
4. **Decorative composition proof.** Current browser proof confirms `presentation` prevents the renderer's own toggle, but does not prove the complete handoff: real input on the visible decorative Switch region must reach the enclosing action owner and the resulting owner state must flow back into renderer `checked`.

The earlier M3E-004 accessible-name finding remains valid: native `<label>` association is divergent in the installed renderer, while `aria-label` and `aria-labelledby` are confirmed working and satisfy the selected standalone scenario.

## Calibration rule corrections

The Switch findings exposed four durable workflow gaps. They are corrected in this PR before the family is allowed to return to compliant:

- `docs/component-adapter.md` now requires an explicit controlled renderer transition timeline, rejected-intent proof, no surviving optimistic renderer mutation, narrow test-environment seams, and complete decorative composition handoff proof.
- `material-component-architecture` now requires exact renderer event timing/cancelability and accepted/rejected intent ownership before calling state controlled, and requires proof placement from the current testing migration state rather than historical family examples.
- `component-contract-testing` now requires accepted and rejected controlled-intent proof and forbids one-family global test polyfills.
- `ui-browser-behavior` now reflects completed Storybook S2: ordinary reusable UI uses owner-local `*.browser.spec.ts`; central Storybook specs/registry remain only for truthful cross-owner or infrastructure contracts. It also requires positive composition pass-through proof.
- `material-component-review` now independently rechecks controlled-state rejection, current test placement, test-environment blast radius, composition handoff, and evidence before attributing an external verifier failure to a shared runner/worktree defect.

No new generic adapter framework, workflow database, registry, or orchestration layer was introduced. These are narrow invariants added at the existing owners that failed to catch the calibration defects.

## Verification status

The initial implementation had passing focused format/lint/type/unit/E2E/Storybook build checks and earlier focused browser/visual runs. Those results do not close the current findings because the architecture and proof ownership have changed.

The previously reported Storybook wrong-worktree execution is not accepted as a repository tooling defect without independent evidence from the intended checkout. `scripts/playwrightContainer.mjs` must not be modified as part of the Switch correction merely to accommodate that unverified diagnosis.

Required final sequence after code correction:

1. refresh Switch `ARCHITECTURE.md` with the controlled `beforeinput` intent mapping and current proof ownership;
2. implement the runtime/test corrections and refresh `IMPLEMENTATION.md`;
3. revalidate both consumers and refresh `MIGRATION.md`;
4. run a fresh independent full `material-component-review` using the strengthened rules;
5. run the ordinary final `pnpm verify` from the intended checkout;
6. only then consider PR #186 ready for merge.

## Current blockers

Switch remains blocked on family-owned correction:

- controlled state must prevent renderer drift on rejected intent;
- browser proof must use current owner-local ownership;
- the renderer-specific Vitest shim must be localized;
- decorative composition must prove positive owner-action pass-through and state reflection.

No branch synchronization blocker remains.

## Milestones

| ID  | Milestone                           | Status                | Exit gate                                                                                 |
| --- | ----------------------------------- | --------------------- | ----------------------------------------------------------------------------------------- |
| M0  | workflow architecture and rules     | `complete`            | coherent staged workflow and corrected terminal/verifier ownership                        |
| M1a | Loading Indicator dependency family | `complete`            | current artifacts, compliant review, no unresolved reported defect                        |
| M1  | Button action family                | `complete`            | canonical m3e-backed action component migrated and merged                                 |
| M2  | Switch stateful pilot               | `correction-required` | corrected controlled ownership, current proof ownership, fresh review, final verify pass |
| M3  | sequential component migration      | `planned`             | dependency-first autonomous family migrations                                             |

## Next operator action

Correct Switch from `self/architecture` using the exact installed renderer `beforeinput` contract and the current testing ownership. Then continue the normal durable chain through implementation, migration, fresh independent review, and one final `pnpm verify`.

Do not rerun design unless the correction discovers an actual official Material design-contract defect. Do not reintroduce legacy Switch ownership, raw renderer public surface, a generic adapter framework, central component-owned browser registry metadata, global one-family test polyfills, or an unverified Playwright infrastructure workaround.
