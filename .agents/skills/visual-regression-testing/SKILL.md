---
name: visual-regression-testing
description: 'Use for canonical Storybook visual references, bounded screenshots, intentional baseline updates, visual impact metadata, and operator visual handoff. Visual tests prove stable appearance only.'
---

# Visual regression testing

Follow `docs/testing/architecture.md`. Visual regression detects unintended changes in accepted stable appearance. It does not prove component API, browser behavior, accessibility interaction, motion lifecycle, or Material correctness.

## Activation

Use when a stable visible Mioframe contract is created, migrated, or intentionally changed and a bounded deterministic screenshot has material regression value.

Do not create visual coverage solely because a third-party renderer exposes an optional state or CSS variable.

## Canonical references

Use the smallest useful set:

- one bounded overview when representative output is sufficient;
- a state matrix only for materially distinct component-owned visible routes;
- a focused story for a current project extension such as loading when it has distinct stable output.

Do not build Cartesian products, token matrices, or one baseline per renderer capability.

Themes, RTL, optional renderer slots, and token overrides need dedicated baselines only when:

- a current Mioframe scenario depends on them;
- the adapter customizes them;
- migration introduces a meaningful visible regression risk not already covered by another baseline.

## Compatibility coverage

Before replacing a public UI owner, identify current stable visible scenarios that consumers rely on.

For each materially distinct scenario, record:

- the canonical baseline that displays it; or
- why an existing baseline already covers it; or
- why it has no separate stable visual output.

A new baseline does not by itself approve a changed result. Current Mioframe compatibility changes require an explicit decision.

Do not require legacy comparison for newly exposed renderer capability that had no previous Mioframe contract.

## Workflow

1. Name the stable visible invariant.
2. Confirm it belongs to the current Mioframe contract or a deliberate new public capability.
3. Use stable data and a bounded root.
4. Settle animation without claiming to test the transition.
5. Wait for fonts, icons, and fixture readiness.
6. Capture the smallest readable surface.
7. Update source-to-spec metadata when ownership changes.
8. Confirm added, moved, or removed specs and baselines preserve deterministic ownership or use the documented full-lane fallback.
9. Inspect every intentional baseline change.
10. Run focused visual verification and return to the top-level task. This skill does not run a separate final gate.
11. Prepare operator evidence when the first canonical component or meaningful visible change requires review.

## Motion boundary

Screenshots may prove only stable appearance at a captured state.

They do not prove:

- acquisition or release;
- transition timing;
- interruption behavior;
- reduced-motion logic;
- animation quality.

For private renderer-owned motion, use exact installed-version source inspection and operator manual testing according to the owning component workflow. Do not create pressed-state fixtures merely to simulate proof of an inaccessible animation.

## Strict boundary

Visual specs may open a story, prepare deterministic stable appearance, and capture screenshots. They contain no success criteria for click, focus movement, keyboard, pointer, motion lifecycle, persistence, or product flow.

Do not reproduce token tables through large computed-style assertions.

## Impact metadata

- map component, story, theme, font, icon, fixture, and rendering sources to owning specs;
- do not put visual spec paths into source prefixes to group tests;
- a changed spec selects itself;
- a changed baseline follows workspace snapshot conventions;
- unresolved added, modified, removed, or moved baseline changes require the documented full visual fallback;
- shared visual configuration requires broad fallback unless consumers are explicit and validated;
- every visual spec is mapped or has a justified standalone reason.

Until visual-impact migration is implemented, `verify` may run a broader visual lane. Do not claim focused baseline ownership behavior already exists.

## Operator Material review

Automation compares pixels against an accepted baseline. It does not establish Material conformance or animation quality.

Operator review is required for:

- the first canonical visual reference for a migrated Material component;
- intentional visible changes to current Mioframe scenarios;
- renderer-owned motion quality when the component depends on it.

The operator review set should be representative, not exhaustive.

Report:

```text
Canonical visual stories: <story ids>
Current scenarios covered: <summary>
Automated visual baseline: passed | updated and inspected | not applicable (<reason>)
Material/renderer differences requiring review: none | <summary>
Operator visual status: no-reported-defect | defect-reported | not-applicable
```

Operator visual/motion inspection is an external defect-reporting channel, not a positive-acknowledgement gate: absence of a reported defect is not a blocker and requires no confirmation. An automated worker never reports operator visual status as `defect-reported` without an actual reported defect, and never claims automated proof established subjective visual/motion correctness.

## Commands

```bash
pnpm verify --only visual --files <source-story-or-spec-paths...>
```

Intentional baseline update:

```bash
pnpm test:visual:update
pnpm verify --only visual --files <source-story-or-spec-paths...>
```

Preserve applicable `--profile` and `--files` scope when rerunning visual verification. The top-level task later runs one final read-only project verification.

## Forbidden

- behavior assertions in visual specs;
- screenshots broader than the named visible contract;
- uncontrolled product, time, network, storage, or animation state;
- unexplained baseline changes;
- token-table or implementation-detail matrices;
- equivalent combinations that create snapshot bloat;
- forced states presented as motion proof;
- ceremonial matrices for simple components;
- stale or semantically overloaded visual impact mappings;
- exhaustive coverage of unchanged third-party renderer surface.
