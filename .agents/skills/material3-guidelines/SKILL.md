---
name: material3-guidelines
description: 'Use before Material-related UI/UX work. Resolves official sources, component choice and usage, minimum supported surface, library/foundation ownership, accessibility, visual-state coverage, and focused verification.'
paths:
  - 'src/**/*.vue'
  - 'src/shared/ui/**'
  - 'src/shared/lib/md/**'
  - 'docs/material-3/**'
  - 'tests/e2e/visual/**'
  - 'tests/e2e/storybook/**'
---

# Material 3 guidelines

Use for work affecting Material component choice, usage, library structure, foundation contracts, layout, interaction, accessibility, tokens, public UI APIs, Storybook, or visual verification.

Canonical rules live in:

- `docs/material-3/source-of-truth.md`;
- `docs/material-3/library-architecture.md`;
- `docs/material-3/foundation-architecture.md`;
- `docs/material-3/component-architecture.md`;
- `docs/material-3/component-testing.md`.

This skill defines workflow and stop conditions. It does not add fields to the canonical family blueprint.

## No-impact path

For a change preserving component choice, usage, location, public imports, API, foundation dependencies, tokens, anatomy, states, accessibility, testing surface, behavior, and rendered output, record:

```text
Material impact: none
```

A public contract, visual contract, foundation, or state-model change is not `none`.

## Library routing

- New official public `MD*` components go to `src/shared/ui/material/components/<family>`.
- New Material foundation runtime/testing owners go to `material/foundation/<domain>`.
- Reusable official Material compositions go to `material/patterns/<pattern>` only after the pattern gate passes.
- Existing Material locations outside the library are legacy and may receive only strict local repairs until focused migration.
- Generic platform infrastructure and project-specific UI remain outside the Material library.

Do not add new Material ownership to a legacy path.

## Source workflow

1. Use `material3` MCP.
2. Use `Vyachean/m3-docs-cache` only when MCP is unavailable or incomplete.
3. Use the official Material Design Kit only when published docs cannot resolve exact visual geometry, anatomy, or state composition.
4. Record exact pages, snapshot, and Design Kit reference when applicable.
5. Stop when the required surface is resolved.

Do not use Material Web, generic web search, screenshots without official provenance, older Material versions, third-party libraries, or memory as authority.

If required official evidence is missing, narrow unsupported scope or use `blocked`.

## Authoring mode

Record one:

- `standard-authoring`: all decisions derive from required scenarios, official sources, repository rules, accepted contracts, and native semantics;
- `handoff-authoring`: a ready architecture handoff supplies the exact delta;
- `blocked`: a required source, ownership, compatibility, foundation, state, or verification decision remains unresolved.

Normal source-backed component work does not require a separate architecture handoff when the canonical blueprint is ready.

## Minimum complete surface

- Start from required scenarios and affected consumers.
- When no scenario is supplied, implement canonical Material default usage only.
- Add variants, modes, anatomy, and behavior only for named scenarios or current consumers.
- Include every reachable contract and every distinct component-owned visible route of the supported surface.
- Record remaining official capabilities as unsupported.
- Add no Mioframe extension without an explicit requirement and owner.

## Canonical family blueprint

Use the complete schema from `component-architecture.md`. Do not create a parallel checklist or add mandatory fields here.

Before production edits, confirm that the blueprint resolves:

- family and library ownership;
- required scenarios, usage, and supported/unsupported surface;
- official source snapshots and Design Kit evidence when required;
- public API, native semantics, states, and anatomy/DOM owners;
- foundation dependencies and change modes;
- architecture profile, token ownership, and rendered-property matrix;
- production/export/story/test files;
- standard test profile and distinct visual-route coverage;
- migration, consumers, deviations, and human-review status.

`Readiness: ready` is invalid with unresolved or blocked decisions.

## Implementation constraints

- Use official Material vocabulary and native semantics.
- Expose only supported configuration, semantic state, native behavior, consumer anatomy, and explicit extensions.
- Follow official invalid-combination behavior; otherwise use `blocked`.
- Use exact official `md.comp.*` paths; do not invent or shorten tokens.
- Consume accepted foundation owners and keep property-specific state resolution component-owned.
- Product layers own information architecture, component choice, placement, workflow, and adaptive composition.
- Do not add test-only public props, events, classes, or runtime branches.
- Do not create local foundation substitutes, universal bases, runtime registries, generic resolvers, CSS DSLs, or cross-family state machines.

## Verification

Use the standard proof profile from `component-testing.md`:

- static and structured architecture checks;
- colocated component-contract tests;
- canonical `StateMatrix` covering every distinct supported component-owned visual route;
- Playwright visual regression of the matrix;
- real browser behavior tests when applicable;
- pure helper/composable tests when applicable;
- changed-consumer preservation;
- required architecture, Material, and human visual review.

Non-visual states belong in contract or browser tests, not duplicate matrix cells. Forced state proves appearance only.

An automated coding agent must not report human visual review as passed. Green checks or screenshot equality alone do not prove Material alignment.
