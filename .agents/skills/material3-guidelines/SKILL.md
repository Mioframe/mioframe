---
name: material3-guidelines
description: 'Use before Material-related UI/UX work. Verifies official sources, component choice and usage, applicable foundation contracts, minimum supported surface, API, states, accessibility, composition, and focused verification.'
paths:
  - 'src/**/*.vue'
  - 'src/shared/ui/**'
  - 'src/shared/lib/md/**'
  - 'docs/material-3/**'
  - 'tests/e2e/visual/**'
---

# Material 3 guidelines

Use for work affecting Material component choice, usage, foundation contracts, layout, interaction, accessibility, tokens, or public UI APIs.

For public `MD*` components, also use `shared-ui-implementation`, [Component architecture](../../../docs/material-3/component-architecture.md), and [Foundation architecture](../../../docs/material-3/foundation-architecture.md).

For a change preserving component choice, usage, API, foundation dependencies, tokens, anatomy, interaction, accessibility, and output, record:

```text
Material impact: none; existing Material surface and foundation contracts unchanged
```

## Source workflow

Use `material3` MCP first and `Vyachean/m3-docs-cache` only when MCP is unavailable or incomplete. Record cache health, snapshot, and exact relevant pages.

Read only what resolves:

- component choice, intended/prohibited usage, and composition;
- required configuration, anatomy, states, and accessibility;
- applicable foundation contracts;
- exact component/foundation tokens;
- relevant layout/adaptive behavior;
- verification.

Do not use Material Web, generic web search, screenshots, unrelated libraries, older Material versions, or memory as authority. Stop when the required surface is resolved.

## Component authoring mode

Record one:

- `standard-authoring`: all decisions derive from required scenarios, official sources, repository rules, accepted foundation contracts, and native semantics;
- `handoff-authoring`: a ready handoff provides the exact delta;
- `blocked`: component or foundation architecture has an unresolved escalation condition.

Normal source-backed component work does not require a separate architect handoff.

## Minimum complete surface

- Start from required scenarios and affected consumers.
- When no scenario is provided, implement canonical Material default usage only.
- Add variants, modes, anatomy, and behavior only for named scenarios or current consumers.
- Include every reachable state, accessibility requirement, usage constraint, and foundation dependency.
- Record remaining official capabilities as unsupported.
- Add no project extension without an explicit requirement.

## Required family blueprint additions

The family `README.md` must include the component blueprint from `component-architecture.md` plus:

### Material usage contract

- intended scenarios and when not to use the component;
- component-choice evidence;
- action/content hierarchy;
- allowed compositions and placement constraints;
- adaptive behavior and owner;
- product integration in this PR.

### Foundation dependencies

Use the table from `foundation-architecture.md` and current statuses from `foundation-registry.md`.

A component must consume accepted foundation owners. It must not create local substitutes for theme, units, typography, shape, elevation, motion, state/ripple/focus, icons, density, accessibility, overlays, or adaptivity.

Keep an additive foundation delta in a component PR only when every same-PR condition in `foundation-architecture.md` passes. Corrections and replacements normally require focused foundation work.

## API and implementation constraints

- Use official Material vocabulary and native semantics.
- Expose only supported configuration, semantic state, required native behavior, consumer-provided anatomy, and explicit extensions.
- Follow official invalid-combination behavior or use `blocked`.
- Use exact official `md.comp.*` paths when present; do not invent or shorten component tokens.
- Use accepted generic foundation contracts and property-specific state resolution.
- Product layers own information architecture, component choice, placement, and adaptive composition.

## Required note

```text
Material source:
Required scenarios:
Usage/composition:
Supported / unsupported surface:
Foundation dependencies:
Token source:
Accessibility/native semantics:
Deviation: none | <named deviation>
Authoring mode: standard-authoring | handoff-authoring | blocked
```

Keep details in repository blueprints and registries, not repeated task prose.

## Verification

Use only applicable proof:

- component-choice/composition evidence for product integration;
- contract and accessibility tests;
- foundation dependency and registry consistency;
- token/layer/owner validation;
- browser behavior for focus, keyboard, pointer/touch, overlays, adaptivity, and actual CSS owners;
- property-state matrix checks;
- representative Storybook/visual coverage;
- changed-consumer preservation.

Do not claim Material alignment from green unit tests or screenshots alone.

Use `blocked` only for unresolved source, usage, ownership, compatibility, foundation, infrastructure, or browser-verification decisions. Component size or token count is not an escalation reason.
