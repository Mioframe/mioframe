---
name: visual-regression-testing
description: 'Use for canonical Storybook visual references, bounded screenshots, Material state matrices, intentional baseline updates, visual impact metadata, and operator visual handoff. Visual tests prove appearance only.'
---

# Visual regression testing

Follow `docs/testing/architecture.md`. Visual regression detects unintended changes in accepted rendered appearance. It does not prove component API, browser behavior, product flow, accessibility interaction, or Material correctness.

For public Material components, also follow `docs/material-3/component-testing.md`.

## Activation

Use when a stable visible contract is created or intentionally changed and a bounded deterministic screenshot provides material regression value.

Use isolated Storybook stories with deterministic data, rendering-only dependencies, no product side effects, and a stable bounded root.

## Canonical visual reference

Use one canonical reference per visible component or surface:

- `StateMatrix` only when multiple distinct component-owned visual routes exist;
- bounded `Overview`, `Default`, or equivalent when one representative route is sufficient.

A matrix represents distinct visible contracts, not every state name. Do not build Cartesian products or one snapshot per cell. Keep labels readable and accepted story ids stable.

Use `.visual-checker-backdrop` only when transparency, shape, elevation, or state-layer output needs a neutral contrast surface.

## Workflow

1. Name the visible invariant and canonical story/root.
2. Use stable data and viewport.
3. Settle animation without changing accepted final output.
4. Wait for fonts, icons, rendering, and fixture setup.
5. Capture the smallest readable bounded surface.
6. Update the owning visual source-to-spec mapping when the stable impact relation changes.
7. Confirm added, moved, renamed, or removed specs and baselines preserve deterministic ownership or use the documented full-lane fallback.
8. Inspect every intentional baseline diff.
9. Run focused visual verification and final verification.
10. Prepare operator Material evidence when applicable.

## Transient appearance

Use the real public contract for semantic and disabled states. An accepted foundation testing adapter may prepare generic transient appearance outside public product API.

Forced state proves appearance only. It does not prove acquisition, release, transition, cancellation, cleanup, actionability, or focus movement.

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

Automation compares against the prior accepted baseline; it does not prove correspondence with canonical Material.

Operator comparison is required for a first accepted canonical Material reference and intentional changes to visible tokens, state routing, shape, color, elevation, typography, icon geometry, focus/ripple appearance, motion appearance, layout, or rendered foundation output.

Report:

```text
Canonical visual story: <story id>
Visual coverage: complete | incomplete (<gap>)
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
- unexplained baseline changes;
- token-table or implementation-detail computed-style matrices;
- equivalent combinations that create snapshot bloat;
- forced states presented as behavior proof;
- ceremonial matrices for simple components;
- stale or semantically overloaded visual impact mappings.
