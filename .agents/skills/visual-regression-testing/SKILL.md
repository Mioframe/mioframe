---
name: visual-regression-testing
description: 'Use for canonical Storybook visual references, bounded screenshots, intentional baseline updates, visual ownership, and operator visual handoff. Visual tests prove stable appearance only.'
---

# Visual regression testing

Follow `docs/testing/architecture.md`. For Storybook ownership, story authoring, and target placement also follow `docs/testing/storybook.md` and the current executable state in `docs/testing/migration-plan.md`.

Visual regression detects unintended changes in accepted stable appearance. It does not prove component API, browser interaction, accessibility behavior, motion lifecycle, or Material correctness.

## Activation

Use when a stable visible Mioframe contract is created, migrated, or intentionally changed and a bounded deterministic screenshot has material regression value.

Do not create visual coverage solely because a third-party renderer exposes an optional state or CSS variable.

## Ownership and placement

The truthful UI owner owns visual proof:

- Material: the Material family selected by family architecture;
- other UI: the current FSD component or cohesive local UI module.

The durable target is an explicit owner-local `*.visual.spec.ts` with deterministic owner-local snapshots. Physical placement must follow `docs/testing/migration-plan.md`.

Owners explicitly authorized/migrated by `docs/testing/migration-plan.md` (currently Loading Indicator, Stage S3) use owner-local `*.visual.spec.ts` and colocated snapshots. Every other visual owner remains in the current central visual location with the current resolver relation until its own migration stage authorizes it. Do not create a colocated visual spec for an owner the migration plan has not authorized, and do not migrate another owner opportunistically.

## Canonical references

Use the smallest useful set:

- one bounded overview when representative output is sufficient;
- a state matrix only for materially distinct owner-visible routes;
- a focused story for a current project extension such as loading when it has distinct stable output.

Do not build Cartesian products, token matrices, or one baseline per renderer capability.

Themes, RTL, optional renderer slots, and token overrides need dedicated baselines only when a current Mioframe scenario depends on them, the adapter customizes them, or migration creates a meaningful visible risk not already covered.

## Compatibility coverage

Before replacing a public UI owner, identify current stable visible scenarios that consumers rely on.

For each materially distinct scenario, record the canonical baseline that displays it, why an existing baseline already covers it, or why no separate stable visual output exists.

A new baseline does not approve a changed result by itself. Current Mioframe compatibility changes require an explicit decision.

## Workflow

1. Name the stable visible invariant and truthful owner.
2. Confirm it belongs to the current Mioframe contract or a deliberate new public capability.
3. Use a deterministic canonical Storybook story and bounded root.
4. Settle animation without claiming to test transition behavior.
5. Wait for fonts, icons, and fixture readiness.
6. Capture the smallest readable surface.
7. Maintain current ownership metadata: local convention when implemented, otherwise the smallest truthful explicit/transitional relation.
8. Confirm add/move/remove/rename of specs/baselines preserves deterministic ownership or full visual fallback.
9. Inspect every intentional baseline change.
10. Run focused verifier-managed visual proof and return to the top-level task.
11. Prepare operator evidence only when the owning Material workflow requires it for a concrete visual/motion concern.

## Strict boundary

Visual specs may open a story, prepare deterministic stable appearance, and capture screenshots.

They contain no success criteria for:

- click or navigation;
- focus movement or keyboard operation;
- pointer/touch behavior;
- motion lifecycle;
- persistence/product flow;
- semantic/ARIA behavior;
- computed token tables;
- geometry matrices used as behavioral assertions.

Route those contracts to component, browser, or product proof according to `docs/testing/architecture.md`.

## Motion boundary

Screenshots may prove only stable appearance at a captured state. They do not prove acquisition/release, transition timing, interruption, reduced-motion logic, or animation quality.

Do not create forced visual states and present them as proof of inaccessible private renderer motion.

## Impact ownership

For `visual`:

- a changed visual spec selects itself;
- use deterministic owner-local relation when the current resolver supports it (currently implemented for Loading Indicator, Stage S3);
- use explicit mapping only for truthful non-local family/module/cross-cutting visible impact;
- for unmigrated owners, changes remain in the legacy central location and select the full visual lane rather than a false local relation;
- do not put visual spec paths into source prefixes merely to group tests;
- theme, fonts, icons, Storybook renderer/config, and broad shared visual helpers default to full visual unless all consumers are explicit, small, stable, and validated;
- unresolved added/modified/removed/moved baseline ownership selects full visual rather than silently skipping.

The colocated snapshot convention is documented in `docs/testing/storybook.md`. Use it for owners `docs/testing/migration-plan.md` has already authorized/migrated; preserve the current central executable convention for every other owner.

## Operator Material review

Automation compares pixels against an accepted baseline. It does not establish Material conformance or subjective motion quality.

Operator visual/motion inspection is an external defect-reporting channel, not a positive-acknowledgement gate. Absence of a reported defect is not a blocker. A concrete reported defect routes to the owning Material stage.

Never claim that an unchanged screenshot proves compliance with official Material sources.

## Commands

Focused accepted proof:

```bash
pnpm verify --only visual --files <readable-source-story-or-spec-paths...>
```

Intentional baseline update remains an explicit write operation through the repository visual update command and must be followed by verifier-managed visual proof.

Preserve applicable `--profile` and `--files` scope when rerunning visual verification. The top-level task later runs one final read-only project verification.

## Forbidden

- behavior assertions in visual specs;
- a colocated visual spec for an owner `docs/testing/migration-plan.md` has not authorized/migrated;
- screenshots broader than the named visible contract;
- uncontrolled product, time, network, storage, or animation state;
- unexplained baseline changes;
- token-table or implementation-detail matrices;
- equivalent combinations that create snapshot bloat;
- forced states presented as motion proof;
- ceremonial matrices for simple components;
- duplicate registry metadata for a relation already expressed by supported local ownership;
- stale or semantically overloaded impact mappings;
- exhaustive coverage of unchanged third-party renderer surface.
