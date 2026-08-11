# Mioframe Material migration roadmap

This file is the only owner of current Material milestone status, family-stage status, technical blockers, latest pilot result, and next operator action. Durable workflow rules live in the other canonical documents.

## Current state

Last updated: 2026-08-11

Current milestone: `M2 — Switch stateful pilot`

Status: `complete`

The m3e-backed Material library architecture is established and already proven by Loading Indicator and Button. Switch is migrated to the canonical Material boundary, legacy `src/shared/ui/Switch` is removed, both product consumers are migrated, the controlled-state calibration correction is implemented, and a fresh independent review found the family fully `compliant`. The ordinary final `pnpm verify` gate passed (11/11 checks) after that compliant review.

The branch is synchronized with current `develop`. No current blocker remains for Switch.

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
IMPLEMENTATION.md  complete
MIGRATION.md       complete
REVIEW.md          compliant
```

Current revisions:

- DESIGN contract: `2026-08-10T19:28:25.068Z`;
- ARCHITECTURE: `2026-08-11T13:30:00.000Z`;
- IMPLEMENTATION: `2026-08-11T13:45:00.000Z`;
- MIGRATION: `2026-08-11T13:47:00.000Z`;
- REVIEW: `2026-08-11T14:15:00.000Z` — `compliant`, route `none/none`.

Final workflow verification: `pnpm verify` passed (11/11 checks: agent-environment, format, oxlint, eslint, type-check, unit-tests, e2e, storybook-behavior, visual, storybook-build, mutation) after this compliant review.

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

None. The prior blockers found during calibration (in order): a forced Playwright `click({ force: true })` in the disabled-pointer browser proof; a stale `IMPLEMENTATION.md`/`docs/m3e-defects.md` citation for `M3E-004`; an invalid `wrapper-correction` Coverage-enum value in `ARCHITECTURE.md`'s renderer-mapping table; and a markdown-formatting-only `oxfmt` failure in `ARCHITECTURE.md`/`docs/m3e-defects.md`. Each was corrected through its exact routed stage, revalidated through the full downstream chain (implementation → migration → independent review), and the family reached a `compliant` review verdict with no remaining findings.

## Verification status

A fresh independent review (revision `2026-08-11T14:15:00.000Z`) found the complete family `compliant`: no blockers, major issues, minor issues, or accepted risks. The ordinary final `pnpm verify` gate (`pnpm verify --base origin/develop --profile local`) was run **after** that compliant review and passed all 11 checks, including e2e, storybook-behavior, visual, storybook-build, and mutation.

## Milestones

| ID  | Milestone                           | Status     | Exit gate                                                        |
| --- | ----------------------------------- | ---------- | ---------------------------------------------------------------- |
| M0  | workflow architecture and rules     | `complete` | coherent staged workflow and corrected calibration invariants    |
| M1a | Loading Indicator dependency family | `complete` | current artifacts and compliant review                           |
| M1  | Button action family                | `complete` | canonical m3e-backed action component migrated and merged        |
| M2  | Switch stateful pilot               | `complete` | faithful disabled pointer proof, compliant review, final verify  |
| M3  | sequential component migration      | `planned`  | begin only after M2 closes without systemic state/ownership gaps |

## Next operator action

M2 is closed without systemic state/ownership gaps. Begin M3: select the next component family for sequential migration via `material-component <name>`.
