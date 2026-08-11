# Mioframe Material migration roadmap

This file is the only owner of current Material milestone status, family-stage status, technical blockers, latest pilot result, and next operator action. Durable workflow rules live in the other canonical documents.

## Current state

Last updated: 2026-08-11

Current milestone: `M2 — Switch stateful pilot final proof correction`

Status: `correction-required`

The m3e-backed Material library architecture is established and already proven by Loading Indicator and Button. Switch is migrated to the canonical Material boundary, legacy `src/shared/ui/Switch` is removed, both product consumers are migrated, and the controlled-state calibration correction is implemented.

The branch is synchronized with current `develop`. The remaining blocker is a Switch-owned browser-proof implementation defect, not architecture, consumer migration, branch synchronization, or shared Playwright infrastructure.

Switch remains the calibration family: durable gaps found during this migration have been corrected in their canonical docs/skills rather than hidden in one-family workarounds.

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

Runtime migration to the canonical m3e-backed Material library is complete and merged. Historical Button artifact cleanup is not a Switch blocker.

### Switch

```text
DESIGN.md          current
ARCHITECTURE.md    ready
IMPLEMENTATION.md  complete, one proof correction required
MIGRATION.md       complete
REVIEW.md          blocked → self/implementation
```

Current revisions:

- DESIGN contract: `2026-08-10T19:28:25.068Z`;
- ARCHITECTURE: `2026-08-11T06:25:34.000Z`;
- IMPLEMENTATION: `2026-08-11T07:30:01.000Z`;
- MIGRATION: `2026-08-11T08:00:00.000Z`;
- REVIEW: `2026-08-11T10:42:00.000Z` — blocked, `self/implementation`.

## Calibration result so far

The earlier systemic findings are corrected:

1. **Controlled-state ownership.** `selected` is the sole source of truth. The adapter intercepts the exact installed renderer's cancelable pre-mutation `beforeinput`, calls `preventDefault()`, emits the requested next `selected`, and never permits a rejected intent to leave renderer `checked` divergent.
2. **Browser-proof ownership.** Switch-owned Storybook behavior is colocated as `src/shared/ui/material/components/switch/MDSwitch.browser.spec.ts`; the obsolete central Switch registry relation is removed.
3. **Test-environment blast radius.** The Switch-only `ElementInternals` shim is local to `MDSwitch.testUtils.ts`, installed only around the owning unit suite and restored afterward. `src/setupVitest.ts` is unchanged by Switch.
4. **Decorative composition ownership.** Browser proof now verifies both that `presentation` is not independently interactive and that real pointer input on its visible region reaches the enclosing action owner, whose state then flows back into renderer `checked`.
5. **Testing workflow rules.** Canonical adapter, architecture, component-contract, browser-behavior, and independent-review rules were strengthened so these stateful-adapter failures cannot be accepted as compliant in later families.
6. **Storybook S2 registry debt.** While exercising fail-closed Storybook impact resolution, stale Button/Dialog registry entries already contradicted by completed S2 ownership were corrected without weakening the resolver.

No generic m3e adapter framework, state manager, workflow database, new registry layer, or compatibility API was introduced.

## Current blocker

Fresh independent review found one remaining proof defect:

`src/shared/ui/material/components/switch/MDSwitch.browser.spec.ts` tests disabled pointer activation with Playwright `click({ force: true })`.

The current `ui-browser-behavior` contract explicitly forbids `force`. A forced click bypasses Playwright actionability and therefore cannot serve as the required faithful disabled pointer proof.

Required correction:

- replace the forced locator click with ordinary real pointer input that does not bypass actionability, such as `page.mouse.click` at the rendered disabled Switch coordinates;
- prove no selection intent/state change occurs;
- refresh `IMPLEMENTATION.md` after the proof change;
- revalidate `MIGRATION.md` if required by the revision chain;
- run a fresh independent review.

No architecture redesign is required.

## Verification status

The implementation correction has strong supporting evidence: focused type-check/lint/format, Switch unit proof, full unit-suite revalidation after shim localization, owner-local Storybook behavior, visual proof, and the agent's full `pnpm verify` all passed.

However, the reported full `pnpm verify` ran **before** the required fresh independent review. The Material state machine already requires current successful reviews before final workflow verification, so that run cannot be reused as the final gate. This is an execution-order mistake, not a missing durable rule.

GitHub Actions `verify` for the implementation head was still running when the latest independent review began. CI success cannot override the browser-proof finding.

Required final sequence:

1. correct the disabled pointer proof in implementation;
2. refresh the implementation revision and downstream migration revision if invalidated;
3. run a fresh independent Material review;
4. only after `REVIEW.md` is compliant, run one ordinary final `pnpm verify`;
5. update PR #186 to ready only when that post-review final gate passes.

## Milestones

| ID  | Milestone                           | Status                | Exit gate                                                        |
| --- | ----------------------------------- | --------------------- | ---------------------------------------------------------------- |
| M0  | workflow architecture and rules     | `complete`            | coherent staged workflow and corrected calibration invariants    |
| M1a | Loading Indicator dependency family | `complete`            | current artifacts and compliant review                           |
| M1  | Button action family                | `complete`            | canonical m3e-backed action component migrated and merged        |
| M2  | Switch stateful pilot               | `correction-required` | faithful disabled pointer proof, compliant review, final verify  |
| M3  | sequential component migration      | `planned`             | begin only after M2 closes without systemic state/ownership gaps |

## Next operator action

Correct only the Switch-owned disabled pointer browser proof under `self/implementation`, then continue the normal revision chain through fresh independent review and post-review final verification.

Do not reopen architecture unless new evidence invalidates the controlled-state decision. Do not rerun design, add speculative Switch surface, create generic adapter infrastructure, reintroduce legacy ownership, or modify shared Playwright container infrastructure for this correction.
