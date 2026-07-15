---
name: material3-guidelines
description: 'Use before Material-related UI/UX work. Verifies official sources, library location, component choice and usage, applicable foundation contracts, minimum supported surface, API, states, accessibility, composition, standard testing, and focused verification.'
paths:
  - 'src/**/*.vue'
  - 'src/shared/ui/**'
  - 'src/shared/lib/md/**'
  - 'docs/material-3/**'
  - 'tests/e2e/visual/**'
  - 'tests/e2e/storybook/**'
---

# Material 3 guidelines

Use for work affecting Material component choice, usage, library structure, foundation contracts, layout, interaction, accessibility, tokens, public UI APIs, Storybook state surfaces, or visual verification.

For public `MD*` components, also use `shared-ui-implementation` and:

- [Library architecture](../../../docs/material-3/library-architecture.md);
- [Component architecture](../../../docs/material-3/component-architecture.md);
- [Component testing architecture](../../../docs/material-3/component-testing.md);
- [Foundation architecture](../../../docs/material-3/foundation-architecture.md).

For a change preserving component choice, usage, location, public imports, API, foundation dependencies, tokens, anatomy, interaction, accessibility, testing surface, and output, record:

```text
Material impact: none; existing Material surface, location, foundation contracts, and verification surface unchanged
```

## Canonical library boundary

`src/shared/ui/material` is the only location for new Material implementation.

- New official public components go to `material/components/<family>`.
- New Material foundation runtime owners go to `material/foundation/<domain>`.
- New reusable official Material compositions go to `material/patterns/<pattern>` only after the pattern gate passes.
- Existing Material code outside the library is legacy and may receive only strict local repairs until focused migration.
- Generic platform infrastructure and project-specific UI remain outside the library.

Do not add a new public `MD*` component, token owner, state/ripple/focus owner, Material icon owner, or Material overlay owner to a legacy path.

## Source workflow

Use `material3` MCP first and `Vyachean/m3-docs-cache` only when MCP is unavailable or incomplete. Record cache health, snapshot, and exact relevant pages.

Read only what resolves:

- component choice, intended/prohibited usage, and composition;
- required configuration, anatomy, states, and accessibility;
- applicable foundation contracts;
- exact component/foundation tokens;
- relevant layout/adaptive behavior;
- the complete supported state surface and verification.

Do not use Material Web, generic web search, screenshots, unrelated libraries, older Material versions, or memory as authority. Stop when the required surface is resolved.

## Component authoring mode

Record one:

- `standard-authoring`: all decisions derive from required scenarios, official sources, repository rules, accepted foundation contracts, library architecture, testing architecture, and native semantics;
- `handoff-authoring`: a ready handoff provides the exact delta;
- `blocked`: component, foundation, library, or testing architecture has an unresolved escalation condition.

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

### Library ownership

- canonical family path under `material/components`;
- current legacy path when migrating;
- migration mode and status;
- public library export;
- consumer import migration scope.

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

### Standard test profile

Record:

- colocated component contract test;
- canonical Storybook `StateMatrix` story and stable root anchor;
- state-matrix coverage map;
- Playwright visual regression path and snapshot sections;
- Storybook browser-behavior spec or `not applicable` with reason;
- pure helper/composable tests or `not applicable`;
- changed-consumer preservation checks;
- human Material visual-review status.

The state matrix covers every supported visual state and every distinct state-rendering route. It does not repeat equivalent sizes, labels, icons, or content combinations.

## API and implementation constraints

- Use official Material vocabulary and native semantics.
- Expose only supported configuration, semantic state, required native behavior, consumer-provided anatomy, and explicit extensions.
- Follow official invalid-combination behavior or use `blocked`.
- Use exact official `md.comp.*` paths when present; do not invent or shorten component tokens.
- Use accepted generic foundation contracts and property-specific state resolution.
- Product layers own information architecture, component choice, placement, and adaptive composition.
- Project-specific shared UI must not be moved under official `material/components` merely because it uses Material primitives.
- Do not add test-only public props, events, classes, or runtime branches.

## Required note

```text
Material source:
Required scenarios:
Usage/composition:
Library owner/current path:
Supported / unsupported surface:
Foundation dependencies:
Token source:
Accessibility/native semantics:
State matrix story and coverage:
Contract/browser/visual verification:
Human Material visual review: required | passed | blocked
Deviation: none | <named deviation>
Authoring mode: standard-authoring | handoff-authoring | blocked
```

An automated coding agent must not report human review as passed. Keep details in repository blueprints, library map, stories, and registries rather than repeating them in task prose.

## Verification

Use the standard component test profile, narrowed only by explicit ownership:

- canonical library location and dependency direction;
- component-choice/composition evidence for product integration;
- colocated contract and accessibility tests;
- foundation dependency and registry consistency;
- token/layer/owner validation;
- public export and no-deep-import validation;
- canonical `StateMatrix` coverage of all distinct supported visual state routes;
- Playwright visual baseline of the matrix or its labelled sections;
- real browser behavior for focus, keyboard, pointer/touch, overlays, adaptivity, and actual CSS owners when applicable;
- pure helper/composable tests when applicable;
- property-state matrix checks;
- changed-consumer import and behavior preservation;
- removal of obsolete legacy paths after migration;
- human review of initial or intentionally changed visual baselines.

Do not claim Material alignment from green unit tests, snapshots, or automated image comparison alone.

Use `blocked` only for unresolved source, usage, library location, ownership, compatibility, foundation, infrastructure, migration, state coverage, or browser-verification decisions. Component size or token count is not an escalation reason.
