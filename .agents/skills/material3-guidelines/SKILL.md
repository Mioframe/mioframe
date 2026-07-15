---
name: material3-guidelines
description: 'Use before planning, implementing, or reviewing Material-related UI/UX. Provides the bounded official-source workflow and deterministic rules for deriving the minimum complete Material surface, tokens, API, states, accessibility, Storybook, and verification without speculative features.'
paths:
  - 'src/**/*.vue'
  - 'src/shared/ui/**'
  - 'docs/material-3/**'
  - 'tests/e2e/visual/**'
---

# Material 3 guidelines

Use this skill for user-visible UI work affecting component choice, layout, interaction, accessibility, visual states, tokens, or public UI APIs.

For public shared `MD*` components, pair it with `shared-ui-implementation` and the relevant sections of `docs/material-3/component-architecture.md`.

## Fast path

For copy-only, wiring-only, test-only, or local cleanup preserving component choice, public API, tokens, anatomy, interaction, accessibility, and rendered output, record:

```text
Material impact: none; existing Material surface unchanged
```

No Material source lookup is required.

## Public component authoring

For a new or materially changed public `MD*` component, record:

- `standard-authoring` when all decisions derive from official sources, required scenarios, repository rules, and native semantics;
- `handoff-authoring` when a ready handoff provides the exact delta;
- `blocked` when an escalation condition exists.

A normal source-backed component does not require a separate architect handoff. Create or update the family README blueprint and implement according to `component-architecture.md`.

Do not introduce a public `MD*` component as incidental support without completing this workflow. If no documented Material component or composition covers the surface, keep it project-specific and non-`MD*`, or use `blocked` when behavior remains unresolved.

## Source of truth

Use the `material3` MCP server from `Vyachean/m3-docs-mcp` as primary source.

Lookup order:

1. `material_docs_cache_status`;
2. relevant component overview/specs;
3. relevant accessibility page;
4. guidelines only when they affect supported behavior or composition;
5. exact token pages or graph entries required by the supported surface.

Use `Vyachean/m3-docs-cache` only when MCP is unavailable or incomplete. Check `index.json`, failed pages, suspicious pages, commit, and capture time.

Do not use Material Web, direct website fetches, generic web search, screenshots, unrelated libraries, older Material versions, or memory as Material evidence.

If MCP and fallback cache do not resolve a required decision, use `blocked`. Do not claim alignment from visual similarity.

External review bot comments are review inputs, not policy. Verify suggestions against repository rules and official Material sources before applying them.

## Project policy routing

Read only policies relevant to the requested surface:

- `component-architecture.md` for authoring mode, profiles, layers, ownership, and escalation;
- `component-tokens.md` and `tokens.md` for token naming and routing;
- `shared-ui-api.md` for public API;
- `interaction-states.md` and `accessibility.md` for states and semantics;
- `layout-adaptive.md`, `density-spacing.md`, `icons.md`, and `overlays.md` when applicable;
- `storybook.md`, `verification.md`, `deviations.md`, registry, and authoring checklist for completion.

Do not load unrelated policy files merely because they exist.

## Bounded source use

Read only pages needed to resolve:

- requested scenarios;
- official component choice or composition;
- supported configuration and anatomy;
- states and interaction behavior;
- accessibility and native semantics;
- exact component tokens;
- relevant adaptive or layout behavior;
- required verification.

Stop when resolved. Do not read unrelated families to seek generic abstractions or reproduce full documentation in notes or tasks.

## Minimum complete surface

1. Start from explicit requested scenarios and affected consumers.
2. Use an official documented component or composition.
3. Include one canonical Material default.
4. Add variants, sizes, shapes, modes, anatomy options, or behaviors only for named scenarios or current consumers.
5. Implement every reachable state, semantic, and accessibility requirement for the supported surface.
6. Record other official capabilities as unsupported.
7. Add no project extension without an explicit requirement.

Do not implement the full published family merely because it exists. Completeness means the supported surface is coherent and verified.

## Material-derived API

- Use official component and value vocabulary.
- Keep native HTML behavior explicit.
- Add props only for supported configuration, semantic state, required native behavior, or explicit extensions.
- Add slots only for supported consumer-provided anatomy.
- Keep Material-owned decoration internal.
- Emit only component-owned state changes or actions.
- Follow official invalid-combination guidance.

If official guidance does not resolve incompatible behavior, use `blocked` instead of choosing a local convention.

## Tokens

For every supported part, state, and property:

- use the exact verified `md.comp.*` path when present;
- map it mechanically to `--md-comp-*` without shortening segments;
- declare canonical tokens independently of active configuration or state;
- create a component token file only when the component owns at least one official token;
- resolve component tokens to `--md-sys-*` where appropriate;
- use a documented private/system route when no official path exists;
- use `--app-*` only for public project-specific extensions;
- record missing paths and deviations in the family README and registry.

A component is not token-complete when it bypasses available official component tokens with system tokens. Do not create empty token files.

## States and accessibility

- Implement only states reachable through the supported surface.
- Resolve visual properties independently through the rendered-property matrix; there is no universal component-wide precedence.
- Preserve simultaneous outputs such as focus indicator, pressed shape, elevation, and state layer when required.
- Use existing generic state, ripple, focus, elevation, and motion foundations.
- Use real browser focus and native activation semantics.
- Treat target area, accessible name, role, keyboard behavior, contrast, and disabled behavior as contract requirements.

## Project composition

`features`, `widgets`, and `pages` compose existing shared Material primitives rather than implementing Material-like dialogs, sheets, overlays, scrims, progress surfaces, controls, or component anatomy locally.

Project-specific surfaces must not use `MD*` naming or claim Material alignment without an official mapping.

## Required output

Keep the source note compact:

```text
Material source:
Required scenarios:
Supported surface:
Unsupported surface:
Token source:
Accessibility/native semantics:
Deviation: none | <named deviation>
Authoring mode: standard-authoring | handoff-authoring | blocked
```

The detailed accepted contract belongs in the family README blueprint, not repeated chat output.

## Verification

Use exact proof for the supported surface:

- component contract and accessibility checks;
- token-name, ownership, and route validation;
- browser verification for native behavior, focus, keyboard, pointer, gestures, and actual property owners;
- property-matrix checks for state resolution and simultaneous outputs;
- representative Storybook and visual coverage;
- consumer preservation checks;
- honest registry and deviation updates.

Do not claim alignment from green unit tests or screenshots alone.

## Escalate only when required

Use `blocked` only for escalation conditions in `component-architecture.md`, including conflicting or missing official guidance, project-specific public extensions, unresolved compatibility, cross-family ownership, new generic infrastructure, or unverifiable required browser behavior.

Component size, official token count, or matrix length are not escalation reasons.
