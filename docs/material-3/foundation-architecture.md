# Material foundations and styles architecture

Shared Material contracts follow official documentation navigation:

```text
src/shared/ui/material/foundations/<official-foundation-slug>
src/shared/ui/material/styles/<official-style-slug>
```

Do not place every cross-family concern into one generic foundation bucket.

## Evidence boundary

Foundation authoring and review use the current user task, current workspace files, official Material sources, and local project verification.

Do not use source-control or remote history as contract evidence.

## Universal request routing

A named Material request is resolved by official ownership, not by the word `component` in the selected command.

Examples:

- Button → component;
- State layer, ripple, focus indication, interaction states → foundation;
- color, elevation, icons, motion, shape, typography → style.

A valid explicit request for an official foundation or style is sufficient to start implementation. It does not require an active component migration, roadmap priority, multiple current consumers, or an existing canonical directory.

When a request is accidentally sent through `material-component`, it must be routed to `material-foundation` and executed rather than rejected.

## Foundations

`foundations` contains official cross-component behavior and platform contracts, including:

- accessibility;
- adaptive design and layout;
- interaction foundations;
- state layer, ripple, and focus indication;
- other official foundation domains selected by an explicit library request or required by current components.

## Styles

`styles` contains official cross-component visual systems:

- color;
- elevation;
- icons;
- motion;
- shape;
- typography.

Use exact official documentation slugs where practical.

## Ownership rule

A shared owner is justified when either:

1. the user explicitly requests implementation of that official Material foundation/style artifact; or
2. a real current cross-family requirement needs it.

Existing consumers determine migration and blast-radius work. They are not a prerequisite for an explicit standalone library request.

When no production consumer exists:

- implement the smallest coherent official contract requested;
- use foundation/style-owned tests and a bounded testing or Storybook fixture;
- do not invent a fake product consumer;
- do not broaden the work into a universal framework or complete catalog.

Behavior used by one family remains family-local only when it has no official foundation/style owner and no explicit standalone library requirement.

Shared owners must:

- remain free of component-family and product knowledge;
- expose the smallest coherent contract required by the request and affected consumers;
- document source status, supported behavior, known gaps, and affected consumers in README;
- keep implementation, tests, fixtures, and the latest independent AUDIT beside the owner;
- avoid speculative universal frameworks.

## Canonical source status

Record:

- `current-complete`;
- `snapshot-complete-stale`;
- `partial`;
- `conflicting`;
- `unavailable`.

Do not certify current-complete domain coverage from stale-only, partial, truncated, suspicious, missing, or spot-check-only evidence.

## Documentation

Each implemented foundation or style directory contains README with:

- official mapping and source status;
- implementation scope and capability inventory;
- implemented contract;
- partial, defective, provisional, or unverified contract;
- actual capability not implemented;
- officially unsupported or invalid routes;
- public/private API and CSS namespaces;
- state, lifecycle, clipping, rendering, and final-owner responsibilities;
- known issues and required follow-up;
- affected consumers and blast radius;
- representative verification;
- review status.

An officially invalid route is not a missing capability. Optional or non-normative guidance is not automatically required capability.

Independent review may create AUDIT in the same directory. There is no separate global audit tree. Authoring never edits AUDIT.

## Dependency direction

```text
shared generic infrastructure
  → material/foundations and material/styles
  → material/components
```

Foundations and styles do not import component families. Components consume them through documented cross-family contracts.

Generic DOM, browser, event, geometry, lifecycle, and teleport utilities remain in their generic owner when they contain no Material semantics. Do not create a Material wrapper merely to satisfy folder structure.

Do not leave Material-specific state, token, clipping, motion, focus, or rendering ownership in generic infrastructure merely because the current legacy implementation is located there.

## State layer and interaction ownership

State layer, ripple, and focus indication belong to interaction foundations when they remain generic across components.

Resolve applicable:

- official semantic purpose and state model;
- state-input ownership;
- color and opacity routes;
- layer owner, bounds, shape inheritance, and clipping;
- ripple event host, rendered surface, and clip owner;
- focus-indicator target and bounds;
- disabled and simultaneous-state behavior;
- acquisition, release, cancellation, cleanup, and reduced motion;
- generic consumer bridge;
- testing-only forced-state support.

A generic interaction primitive must not contain Button, Switch, Card, or other family-specific tokens, semantics, or state precedence.

An opacity token declaration alone does not implement State Layer. The route must reach the correct rendered layer with correct bounds, clipping, state winner, and consumer behavior.

## Change rule

Before changing or creating a foundation/style owner:

1. name the explicit request or current cross-family requirement;
2. resolve official requirement and source status;
3. name current owner, canonical owner, and current consumers;
4. distinguish generic infrastructure from Material semantics;
5. define the shortest real final route;
6. assess cascade, inheritance, clipping, runtime, accessibility, and visual impact;
7. add proportional proof that actually exercises the route;
8. migrate legacy Material ownership when applicable;
9. update local documentation with every remaining gap.

Changes to root/system tokens, universal selectors, pseudo-elements, shared formulas, theme roles, or public shared APIs require explicit current cross-family impact analysis. A component-specific test alone is insufficient for a global change.

Unchanged tests that never exercise the shared route do not count as representative proof.

## Motion architecture

A shared motion style owns its documented Web runtime contract and proves it deeply once:

- canonical evidence and adaptation;
- source-to-runtime dependency;
- timing/easing or runtime model;
- interruption and reduced-motion behavior;
- representative consumers or a style-owned fixture when no consumer exists.

Each component then proves proportional consumption. Do not require frame-by-frame validation per component.

A technically honest route does not override an operator-rejected perceived result. The affected family keeps the visual defect open until behavior changes and new evidence is accepted.

## CSS custom-property namespaces

Use only:

- exact official `--md-ref-*`, `--md-sys-*`, and `--md-comp-*` tokens;
- justified semantic `--md-private-<owner>-<role>` routes;
- genuine `--app-*` contracts.

Do not create ad-hoc public-looking `--md-<artifact>-*` namespaces or unnecessary aliases for one-use constants.

Every variable must affect the correct final owner through a real dependency.

## Anti-overengineering

Do not create:

- a universal base component;
- a generic runtime token/state registry;
- a style DSL;
- a shared owner for family-local behavior with no official foundation/style basis and no explicit library request;
- a parallel wrapper around generic infrastructure;
- placeholder directories for every official page;
- fake product consumers;
- frame-level component motion infrastructure for ordinary CSS transitions.

The documentation hierarchy is navigation and ownership, not a requirement to pre-create every artifact. Production artifacts are created when explicitly requested or required by real consumers.