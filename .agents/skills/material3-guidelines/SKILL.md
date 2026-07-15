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

For public shared `MD*` components, pair it with `shared-ui-implementation` and `docs/material-3/component-architecture.md`.

## Fast path

For copy-only, wiring-only, test-only, or local cleanup that preserves component choice, public API, tokens, anatomy, interaction model, accessibility, and rendered output, record:

```text
Material impact: none; existing Material surface unchanged
```

No Material source lookup is required.

## Public component authoring

For a new or materially changed public `MD*` component, record:

- `standard-authoring` when the agent can derive all decisions from official sources, required scenarios, repository rules, and native semantics;
- `handoff-authoring` when a ready handoff provides the exact contract delta;
- `blocked` when an escalation condition exists.

A normal source-backed component does not require a separate architect handoff. The agent creates or updates the family README blueprint and implements it according to `component-architecture.md`.

Do not introduce a public `MD*` component as incidental support without completing this workflow. When a documented Material component or composition is unavailable, keep the surface project-specific and non-`MD*`, or use `blocked` if the requested behavior is unresolved.

## Source of truth

Use the `material3` MCP server from `Vyachean/m3-docs-mcp` as the primary source.

Lookup order:

1. `material_docs_cache_status`;
2. relevant component overview/specs;
3. relevant accessibility page;
4. guidelines only when they affect supported behavior or composition;
5. exact token pages or graph entries required by the supported surface.

Use `Vyachean/m3-docs-cache` only when MCP is unavailable or incomplete. Check `index.json`, failed pages, suspicious pages, commit, and capture time before relying on it.

Do not use Material Web, direct website fetches, generic web search, screenshots, unrelated libraries, older Material versions, or memory as Material source evidence.

If MCP and fallback cache do not resolve a required decision, use `blocked`. Do not claim alignment from visual similarity.

## Bounded source use

Read only pages needed to resolve:

- the requested scenarios;
- official component choice or composition;
- supported configuration and anatomy;
- states and interaction behavior;
- accessibility and native semantics;
- exact component tokens;
- adaptive or layout behavior relevant to the request;
- required verification.

Stop when these are resolved. Do not read unrelated families to search for generic abstractions. Do not reproduce full documentation in notes or tasks.

## Minimum complete surface

Derive scope using these rules:

1. start from explicit requested scenarios and existing consumers touched by the change;
2. use an official documented component or composition;
3. include one canonical Material default;
4. add variants, sizes, shapes, modes, anatomy options, or behaviors only for named scenarios or current consumers;
5. implement every reachable state, semantic, and accessibility requirement for that supported surface;
6. record other official capabilities as unsupported;
7. add no project extension without an explicit requirement.

Do not implement the full published component family merely because it exists. Completeness means the supported surface is coherent and verified.

## Material-derived API

- Use official component and value vocabulary.
- Keep native HTML behavior explicit rather than hiding it behind Material names.
- Add public props only for supported configuration, semantic state, required native behavior, or explicit extensions.
- Add slots only for supported consumer-provided anatomy.
- Keep Material-owned decoration internal.
- Emit only component-owned state changes or actions.
- Prevent or document invalid combinations according to official guidance.

If official guidance leaves incompatible behaviors unresolved, use `blocked` instead of choosing a local convention.

## Tokens

For every supported part, state, and property:

- use the exact verified `md.comp.*` path when present;
- map it mechanically to `--md-comp-*` without shortening path segments;
- declare canonical tokens independently of active configuration or state;
- resolve component tokens to `--md-sys-*` where appropriate;
- use a family-private route for missing official paths;
- use `--app-*` only for public project-specific extensions;
- record missing paths and deviations in the family README and registry.

A shared Material component is not token-complete when it bypasses available official component tokens with system tokens.

## States and accessibility

- Implement only states reachable through the supported surface.
- Resolve visual properties independently according to the family rendered-property matrix; there is no universal component-wide state precedence.
- Preserve simultaneous outputs such as focus indicator, pressed shape, elevation, and state layer when the source requires them.
- Use existing generic state, ripple, focus, elevation, and motion foundations.
- Use real browser focus and native activation semantics.
- Treat target area, accessible name, role, keyboard behavior, contrast, and disabled behavior as part of the component contract.

## Project composition

`features`, `widgets`, and `pages` compose existing shared Material primitives rather than implementing their own Material-like dialogs, sheets, overlays, scrims, progress surfaces, controls, or component anatomy.

Project-specific surfaces must not use `MD*` naming or claim Material alignment without a documented official mapping.

## Required output

For public component work, keep the source note compact:

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

The detailed accepted contract belongs in the family README blueprint, not in repeated chat output.

## Verification

Use exact proof for the supported surface:

- component contract and accessibility checks;
- token-name and token-route validation;
- browser verification for native behavior, focus, keyboard, pointer, gestures, and actual CSS property owners;
- property-matrix checks for state resolution and simultaneous outputs;
- representative Storybook and visual coverage;
- consumer preservation checks;
- honest component registry and deviation updates.

Do not claim Material alignment from green unit tests or screenshots alone.

## Escalate only when required

Use `blocked` only for the escalation conditions in `component-architecture.md`, including conflicting or missing official guidance, project-specific public extensions, unresolved compatibility, cross-family ownership, new generic infrastructure, or unverifiable required browser behavior.

Component size, number of official tokens, or number of state rows are not reasons to request architecture help.