---
name: material-component-implementation
description: 'Internal Material workflow stage for implementing and proving one resolved component family, including representative consumer validation.'
paths:
  - 'src/shared/ui/material/components/**'
---

# Material component implementation

This is an internal stage skill. Use it only after `material-component-contract` has produced a ready family contract and any required foundation prerequisite is complete.

It owns the canonical family implementation from one primary vertical slice through the complete supported surface. It may integrate one representative consumer named by the contract. It does not migrate all remaining consumers, remove the legacy owner, update the roadmap, or start another stage.

## Required sources

Read:

- root and applicable nested `AGENTS.md` files;
- `src/shared/ui/material/docs/architecture.md`;
- `src/shared/ui/material/docs/component-development.md`;
- the ready family README;
- required foundation contracts;
- current production owner, representative consumer, public exports, stories, tests, and relevant verification mappings.

Use Vue and testing skills only for the exact implementation or proof layer currently needed.

## Checkpoint A — Primary vertical slice

Implement one representative configuration end to end:

- canonical production component and public entry point;
- native semantic and accessible owner;
- required anatomy without unnecessary DOM nodes;
- exact token-to-rendered-property route;
- required state and interaction path;
- one stable bounded canonical Storybook story;
- focused proof at the lowest faithful layer.

Do not expand the family until this slice is coherent in code and actual Storybook rendering.

## Checkpoint B — Representative consumer

Integrate the slice into the representative consumer recorded in the contract and verify:

- public API usability in real composition;
- parent-owned placement and layout;
- props, attributes, slots, events, and state wiring;
- focus, keyboard, pointer, touch, disabled, loading, cancellation, and cleanup behavior when applicable;
- token inheritance and theme context;
- preservation of the required product scenario.

If integration exposes a wrong API, ownership, DOM, state, token, or foundation decision, return a contract blocker to `material-component`. Do not add a consumer workaround.

## Checkpoint C — Complete supported family

Expand only the supported surface recorded in the family contract:

- required components, variants, sizes, configurations, and states;
- invalid-combination handling;
- complete public props, emits, slots, attributes, and events;
- required interaction, ripple, focus, motion, interruption, disabled, failure, and cleanup behavior;
- materially distinct Storybook examples and behavior fixtures;
- proportional component, browser, pure, and visual proof.

Keep one declaration owner for every canonical token and one final owner for every rendered property. Consumer-controlled semantic state must not gain a hidden internal copy.

## Exit gate

Pass only when:

- the primary slice is coherent;
- the representative consumer works without library-contract workarounds;
- every supported route is implemented and proved;
- unsupported routes remain absent;
- no required foundation gap remains.

## Result

```text
MATERIAL STAGE RESULT

Family:
Stage: implementation
Status: complete | blocked
Exit gate: passed | failed
Evidence:
Changed ownership:
Representative consumer result:
Supported family result:
Blocker: none | <exact blocker>
```

## Forbidden

- changing the family contract silently;
- migrating all remaining consumers;
- removing the complete legacy owner before adoption owns that migration;
- roadmap updates;
- speculative variants, abstractions, managers, registries, validators, aliases, or extension points;
- unnecessary DOM nodes;
- generic test DSLs or tests for framework behavior the project does not own;
- starting another stage or family.