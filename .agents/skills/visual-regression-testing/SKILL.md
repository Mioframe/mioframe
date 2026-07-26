---
name: visual-regression-testing
description: 'Use for canonical Storybook visual references, bounded screenshots, Material state matrices, intentional baseline updates, visual impact metadata, and operator visual handoff. Visual tests prove appearance only.'
---

# Visual regression testing

Follow `docs/testing/architecture.md`. Visual regression detects unintended changes in accepted rendered appearance. It does not prove component API, browser behavior, product flow, accessibility interaction, or Material correctness.

## Activation

Use when a stable visible contract is created, migrated, or intentionally changed and a bounded deterministic screenshot provides material regression value.

Use isolated Storybook stories with deterministic data, rendering-only dependencies, no product side effects, and a stable bounded root.

## Canonical visual reference

Use one canonical reference per materially distinct visible component surface:

- `StateMatrix` only when multiple distinct component-owned visual routes exist;
- bounded `Overview`, `Default`, or equivalent when one representative route is sufficient;
- a focused story for a project extension, theme, direction, or state when its output is visually distinct and not visible in the canonical matrix.

A matrix represents distinct visible contracts, not every state name. Do not build Cartesian products or one snapshot per cell. Keep labels readable and accepted story ids stable.

Use `.visual-checker-backdrop` only when transparency, shape, elevation, or state-layer output needs a neutral contrast surface.

## Compatibility coverage

Before replacing a shared or public UI owner, inventory every accepted stable visible scenario from the family contract or current implementation.

For each scenario, record one of:

- exact canonical story and screenshot that displays it;
- another baseline that visibly and unambiguously covers it;
- a specific evidence-based reason it has no distinct stable visual output.

Include project extensions such as loading, themes, RTL content order, disabled/selected combinations, and custom token effects when they materially change visible output.

A refreshed baseline proves only that the repository now expects the new pixels. It does not prove that a difference from the previous implementation was intended. Any observable compatibility change requires an explicit accepted decision before updating the baseline.

Operator review is `incomplete` while any scenario named as visually preserved lacks visible evidence or a justified no-delta decision.

## Workflow

1. Name the visible invariant and canonical story/root.
2. Link it to the exact required scenario or styling contract.
3. Compare the intended new output with the accepted previous output and official Material evidence where applicable.
4. Use stable data and viewport.
5. Settle animation without changing accepted final output.
6. Wait for fonts, icons, rendering, and fixture setup.
7. Capture the smallest readable bounded surface.
8. Update the owning visual source-to-spec mapping when the stable impact relation changes.
9. Confirm added, moved, renamed, or removed specs and baselines preserve deterministic ownership or use the documented full-lane fallback.
10. Inspect every intentional baseline diff and classify it as preserved output, accepted change, or defect.
11. Run focused visual verification and final verification.
12. Prepare operator Material evidence when applicable.

## Transient appearance

Use the real public contract for semantic and disabled states. An accepted foundation testing adapter may prepare generic transient appearance outside public product API.

Forced state proves appearance only. It does not prove acquisition, release, transition, cancellation, cleanup, actionability, or focus movement.

When renderer-owned motion cannot be inspected through a public host style, a deterministic pressed or settled visual fixture may prove appearance, while a separate browser test proves real acquisition and release. Neither proof may claim ownership of the other contract.

## Strict boundary

Visual specs may open a story, prepare deterministic appearance, and capture screenshots. They contain no success criteria for click, focus, keyboard, pointer, drag, scrolling, overlays, motion lifecycle, persistence, or product flow.

Do not reproduce token tables through large computed-style assertion matrices. A small non-visual routing assertion belongs to the relevant component contract or browser proof.

## Impact metadata

- map visible component, foundation, story, theme, font, icon, fixture, and rendering sources to owning visual specs;
- do not put visual spec paths into source prefixes to group tests;
- a changed visual spec selects itself;
- a changed baseline resolves through the repository snapshot convention;
- an unresolved added, modified, deleted, or renamed baseline requires full visual fallback;
- global visual/Storybook configuration and common rendering helpers require full visual fallback unless all consumers are explicit and validated;
- every visual spec is mapped or has a justified standalone reason.

Until the visual resolver migration is implemented, current `verify` may still run a broader visual lane. Do not claim focused baseline ownership behavior already exists.

## Operator Material review

Automation compares against the prior accepted baseline; it does not prove correspondence with canonical Material or preservation of the replaced component.

Operator comparison is required for a first accepted canonical Material reference and intentional changes to visible tokens, state routing, shape, color, elevation, typography, icon geometry, focus/ripple appearance, motion appearance, loading presentation, layout, theme output, directionality, or rendered foundation output.

Report:

```text
Canonical visual stories: <story ids>
Covered scenarios: <exact scenarios>
Visual coverage: complete | incomplete (<exact gaps>)
Compatibility differences: none | accepted (<decision>) | blocked (<defect>)
Automated visual baseline: passed | updated and inspected | not applicable (<reason>)
Official visual sources: <named evidence>
Operator visual acceptance: required | accepted | rejected | blocked (<reason>)
```

An automated agent never reports operator acceptance as `accepted`.

## Commands

```bash
pnpm verify --only visual --files <source-story-or-spec-paths...>
```

Intentional baseline update:

```bash
pnpm test:visual:update
pnpm verify --only visual --files <source-story-or-spec-paths...>
```

## Forbidden

- behavior assertions in visual specs;
- screenshots broader than the named visible contract;
- uncontrolled product, time, network, storage, loading, or animation state;
- unexplained or unapproved baseline changes;
- token-table or implementation-detail computed-style matrices;
- equivalent combinations that create snapshot bloat;
- forced states presented as behavior proof;
- ceremonial matrices for simple components;
- stale or semantically overloaded visual impact mappings;
- declaring complete visual coverage while a named stable visible scenario is absent.
