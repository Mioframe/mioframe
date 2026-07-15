---
name: material3-guidelines
description: 'Use before planning, implementing, or reviewing Material-related UI/UX. Provides the bounded official-source workflow and deterministic rules for component choice, usage patterns, foundation dependencies, minimum complete component surfaces, tokens, API, states, accessibility, Storybook, and verification without speculative features.'
paths:
  - 'src/**/*.vue'
  - 'src/shared/ui/**'
  - 'src/shared/lib/md/**'
  - 'docs/material-3/**'
  - 'tests/e2e/visual/**'
---

# Material 3 guidelines

Use this skill for user-visible UI work affecting component choice, Material usage patterns, foundation contracts, layout, interaction, accessibility, visual states, tokens, or public UI APIs.

For public shared `MD*` components, pair it with `shared-ui-implementation`, [Component architecture](../../../docs/material-3/component-architecture.md), and [Foundation architecture](../../../docs/material-3/foundation-architecture.md).

## Fast path

For copy-only, wiring-only, test-only, or local cleanup preserving component choice, usage, public API, foundation dependencies, tokens, anatomy, interaction, accessibility, and rendered output, record:

```text
Material impact: none; existing Material surface and foundation contracts unchanged
```

No Material source lookup is required.

## Public component authoring

For a new or materially changed public `MD*` component, record:

- `standard-authoring` when all decisions derive from official sources, required scenarios, repository rules, accepted foundation contracts, and native semantics;
- `handoff-authoring` when a ready handoff provides the exact delta;
- `blocked` when an escalation condition exists.

A normal source-backed component does not require a separate architect handoff. Create or update the family README blueprint and implement according to the component and foundation architecture documents.

Do not introduce a public `MD*` component as incidental support without completing this workflow. If no documented Material component or composition covers the surface, keep it project-specific and non-`MD*`, or use `blocked` when behavior remains unresolved.

## Source of truth

Use the `material3` MCP server from `Vyachean/m3-docs-mcp` as primary source.

Lookup order:

1. `material_docs_cache_status`;
2. relevant component overview/specs;
3. relevant component accessibility and guidelines pages;
4. relevant foundation pages for the dependencies used by the component;
5. exact token pages or graph entries required by the supported surface.

Use `Vyachean/m3-docs-cache` only when MCP is unavailable or incomplete. Check `index.json`, failed pages, suspicious pages, commit, and capture time.

Do not use Material Web, direct website fetches, generic web search, screenshots, unrelated libraries, older Material versions, or memory as Material evidence.

If MCP and fallback cache do not resolve a required decision, use `blocked`. Do not claim alignment from visual similarity.

External review bot comments are review inputs, not policy. Verify suggestions against repository rules and official Material sources before applying them.

## Project policy routing

Read only policies relevant to the requested surface:

- `component-architecture.md` for authoring mode, profiles, layers, ownership, and escalation;
- `foundation-architecture.md` and `foundation-registry.md` for common contracts, status, gap handling, and change modes;
- `component-tokens.md` and `tokens.md` for token naming and routing;
- `shared-ui-api.md` for public API;
- `interaction-states.md` and `accessibility.md` for states and semantics;
- `layout-adaptive.md`, `density-spacing.md`, `icons.md`, and `overlays.md` when applicable;
- `storybook.md`, `verification.md`, `deviations.md`, registries, and authoring checklist for completion.

Do not load unrelated policy files merely because they exist.

## Bounded source use

Read only pages needed to resolve:

- requested scenarios;
- official component choice, hierarchy, and composition;
- intended and prohibited usage;
- supported configuration and anatomy;
- states and interaction behavior;
- accessibility and native semantics;
- exact component and foundation tokens;
- relevant adaptive or layout behavior;
- required verification.

Stop when resolved. Do not read unrelated families to seek generic abstractions or reproduce full documentation in notes or tasks.

## Minimum complete surface

1. Start from explicit requested scenarios and affected consumers.
2. Use an official documented component or composition.
3. Include one canonical Material default.
4. Add variants, sizes, shapes, modes, anatomy options, or behaviors only for named scenarios or current consumers.
5. Implement every reachable state, semantic, accessibility, usage, and foundation requirement for the supported surface.
6. Record other official capabilities as unsupported.
7. Add no project extension without an explicit requirement.

Do not implement the full published family merely because it exists. Completeness means the supported surface is coherent and verified.

## Material usage contract

For every new or materially changed public component family, record in the family README blueprint:

- intended scenarios;
- when not to use the component;
- component-choice evidence;
- action/content hierarchy constraints;
- allowed Material compositions;
- placement constraints;
- adaptive behavior and its owner;
- whether product integration is included in the current PR.

A library-only component PR may use canonical Material usage and `Product integration in this PR: none`. Do not invent a product integration to demonstrate the component.

Features, widgets, and pages must verify component choice and composition rather than selecting a Material surface by visual preference.

## Foundation dependencies

For every new, migrated, or materially changed public component family, add the foundation dependency table defined by `foundation-architecture.md`.

Before implementation:

1. check each required domain in `foundation-registry.md`;
2. consume the accepted owner when sufficient;
3. classify any required change as `none`, `additive`, `correction`, or `replacement`;
4. use `blocked` when a required dependency is blocked or ownership/source evidence is unresolved.

A component must not implement a local substitute for a missing theme, motion, state, focus, ripple, icon, overlay, unit, accessibility, density, or adaptive foundation capability.

A small additive foundation delta may remain in the component PR only when it satisfies every same-PR condition in `foundation-architecture.md`. Corrections and replacements normally require a focused foundation PR and consumer-impact review.

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
- resolve component tokens through accepted foundation system roles where appropriate;
- use a documented private/system route when no official path exists;
- use `--app-*` only for public project-specific extensions;
- record missing paths and deviations in the family README and registries.

A component is not token-complete when it bypasses available official component tokens with system tokens. Do not create empty token files.

## States and accessibility

- Implement only states reachable through the supported surface.
- Resolve visual properties independently through the rendered-property matrix; there is no universal component-wide precedence.
- Preserve simultaneous outputs such as focus indicator, pressed shape, elevation, and state layer when required.
- Use accepted generic state, ripple, focus, elevation, and motion foundation contracts.
- Use real browser focus and native activation semantics.
- Treat target area, accessible name, role, keyboard behavior, contrast, and disabled behavior as contract requirements.

## Project composition

`features`, `widgets`, and `pages` compose existing shared Material primitives rather than implementing Material-like dialogs, sheets, overlays, scrims, progress surfaces, controls, or component anatomy locally.

Project-specific surfaces must not use `MD*` naming or claim Material alignment without an official mapping.

Product composition owns information architecture, component choice, placement, and adaptive switching. Foundation and component code must not absorb those product rules.

## Required output

Keep the source note compact:

```text
Material source:
Required scenarios:
Usage/composition:
Supported surface:
Unsupported surface:
Foundation dependencies:
Token source:
Accessibility/native semantics:
Deviation: none | <named deviation>
Authoring mode: standard-authoring | handoff-authoring | blocked
```

The detailed accepted contract belongs in the family README blueprint, not repeated chat output.

## Verification

Use exact proof for the supported surface:

- component-choice and composition evidence for integrated product usage;
- component contract and accessibility checks;
- foundation dependency and registry consistency checks;
- token-name, ownership, and route validation;
- browser verification for native behavior, focus, keyboard, pointer, gestures, overlays, adaptivity, and actual property owners;
- property-matrix checks for state resolution and simultaneous outputs;
- representative Storybook and visual coverage;
- consumer preservation checks;
- honest foundation/component registry and deviation updates.

Do not claim alignment from green unit tests or screenshots alone.

## Escalate only when required

Use `blocked` for escalation conditions in the component or foundation architecture documents, including conflicting or missing official guidance, project-specific public extensions, unresolved compatibility, cross-family ownership, unavailable or blocked foundation capability, new generic infrastructure, or unverifiable required browser behavior.

Component size, official token count, matrix length, or a merely partial foundation domain are not escalation reasons when the exact required capability is already accepted and verified for the supported surface.
