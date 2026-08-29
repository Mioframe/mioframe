---
name: visual-regression-testing
description: 'Use for canonical Storybook visual references, bounded screenshots, intentional baseline updates, visual ownership, and operator visual handoff. Visual tests prove stable appearance only.'
---

# Visual regression testing

Follow `docs/testing/architecture.md`. For Storybook ownership, story authoring, and current placement also follow `docs/testing/storybook.md` and the executable state in `docs/testing/migration-plan.md`.

Visual regression detects unintended changes in accepted stable appearance. It does not prove component API, browser interaction, accessibility behavior, motion lifecycle, or Material correctness.

## Activation

Use when a stable visible Mioframe contract is created, migrated, or intentionally changed and a bounded deterministic screenshot has material regression value.

Do not create visual coverage solely because a third-party renderer exposes an optional state or CSS variable.

## Ownership and placement

The truthful UI owner owns visual proof:

- Material: the Material family selected by family architecture;
- other UI: the current FSD component or cohesive local UI module.

Current visual proof is explicit owner-local `*.visual.spec.ts` with deterministic colocated snapshots. Central `tests/e2e/visual/**` discovery has no remaining consumer and must not be restored.

Test authorship does not change this ownership. When an intentional baseline change is part of production work, the separate `test-authoring` context owns independent baseline acceptance while the same truthful UI owner continues to own the visual spec and snapshot.

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

## Intentional baseline changes

An intentional baseline change must be derived from an independently accepted visible contract, not from whatever pixels the changed implementation happens to produce.

When the target pixels cannot exist before production implementation:

1. before implementation, `TEST IMPACT` and the test-author context establish the visible contract, truthful owner, bounded visual-spec intent, and why the current baseline is expected to change;
2. production implementation may change rendering but must not create, regenerate, or approve the expected baseline;
3. after the new rendering exists, a fresh test-author context follows this skill to create/update the baseline, inspect it against the accepted visible contract, and run focused `visual` verification;
4. only that independently inspected baseline becomes accepted proof.

When an existing accepted baseline is supposed to remain unchanged, it stays read-only and may provide ordinary failing/green regression proof through the implementation cycle.

## Workflow

1. Name the stable visible invariant and truthful owner.
2. Confirm it belongs to the current Mioframe contract or a deliberate new public capability.
3. For an intentional changed result, confirm the visible oracle was established independently from the production rendering; do not infer the target appearance from generated pixels.
4. Use a deterministic canonical Storybook story and bounded root.
5. Settle animation without claiming to test transition behavior.
6. Wait for fonts, icons, and fixture readiness.
7. Capture the smallest readable surface.
8. Keep spec and snapshot ownership colocated with the truthful UI owner.
9. Confirm add/move/remove/rename of specs/baselines preserves deterministic ownership or safe full-visual fallback.
10. Inspect every intentional baseline change in the independent test-author context when the baseline changes with production implementation.
11. Run focused verifier-managed visual proof and return to the top-level task.
12. Prepare operator evidence only when the owning Material workflow requires it for a concrete visual/motion concern.

## Strict boundary

Visual specs may open a story, prepare deterministic stable appearance, and capture screenshots.

They contain no success criteria for click/navigation, focus/keyboard operation, pointer/touch behavior, motion lifecycle, persistence/product flow, semantic/ARIA behavior, computed token tables, or geometry matrices used as behavioral assertions.

Route those contracts to component, browser, or product proof according to `docs/testing/architecture.md`.

## Motion boundary

Screenshots may prove only stable appearance at a captured state. They do not prove acquisition/release, transition timing, interruption, reduced-motion logic, or animation quality.

Do not create forced visual states and present them as proof of inaccessible private renderer motion.

## Impact ownership

For `visual`:

- a changed visual spec selects itself;
- ordinary local source/story/spec/baseline relations derive from current owner-local placement;
- theme, fonts, icons, Storybook renderer/config, shared Playwright/Vite execution inputs, and broad shared visual helpers widen to full visual unless all consumers are explicit, small, stable, and validated;
- unresolved added/modified/removed/moved ownership widens safely or fails structural validation rather than silently skipping;
- do not add explicit mapping metadata for an ordinary relation already expressed by colocation.

The colocated snapshot convention is documented in `docs/testing/storybook.md`.

## Operator Material review

Automation compares pixels against an accepted baseline. It does not establish Material conformance or subjective motion quality.

Operator visual/motion inspection is an external defect-reporting channel, not a positive-acknowledgement gate. Absence of a reported defect is not a blocker. A concrete reported defect routes to the owning Material stage.

Never claim that an unchanged screenshot proves compliance with official Material sources.

## Commands

Focused accepted proof:

```bash
pnpm verify --only visual --files <readable-source-story-or-spec-paths...>
```

Intentional baseline update remains an explicit write operation through the repository visual update command and must be performed/accepted by the applicable test-author visual pass when it accompanies production rendering changes. It must be followed by verifier-managed visual proof.

Preserve applicable `--profile` and `--files` scope when rerunning visual verification. For PR work, required GitHub CI on the exact published head owns the broad repository gate; this skill adds no separate broad local completion run.

## Forbidden

- behavior assertions in visual specs;
- central visual ownership or restored `tests/e2e/visual/**` discovery;
- screenshots broader than the named visible contract;
- unexplained baseline changes;
- production implementation context creating, regenerating, or approving an intentional changed baseline it is expected to satisfy;
- target appearance inferred solely from changed implementation output;
- token-table or implementation-detail matrices;
- equivalent combinations that create snapshot bloat;
- forced states presented as motion proof;
- ceremonial matrices for simple components;
- duplicate registry metadata for a relation already expressed by current local ownership;
- stale or semantically overloaded impact mappings;
- exhaustive coverage of unchanged third-party renderer surface.
