# Material foundations and styles architecture

Shared Material contracts follow official documentation navigation:

```text
src/shared/ui/material/foundations/<official-foundation-slug>
src/shared/ui/material/styles/<official-style-slug>
```

Do not place every cross-family concern into one generic foundation bucket.

## Evidence boundary

Foundation authoring and review use the current task, current workspace, current successful Material MCP reads, official sources, and local verification.

Source-control history is not contract authority. The current diff may be inspected for scope, unrelated changes, missing cleanup, ownership drift, and regression risk.

A healthy complete MCP read is working current evidence. Capture age alone does not downgrade it; use `source-of-truth.md` for incomplete or conflicting evidence.

## Universal request routing

A named Material request is resolved by official ownership, not by the word `component` in the selected command.

Examples:

- Button → component;
- State layer, ripple, focus indication, interaction states → foundation;
- color, elevation, icons, motion, shape, typography → style.

A valid explicit request for an official foundation or style is sufficient to start implementation. It does not require an active component migration, roadmap priority, multiple current consumers, or an existing canonical directory.

When a request is accidentally sent through `material-component`, route it to `material-foundation` and execute it rather than rejecting it.

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
- use owner-local tests and a bounded testing or Storybook fixture;
- do not invent a fake product consumer;
- do not broaden the work into a universal framework or complete catalog.

Behavior used by one family remains family-local only when it has no official foundation/style owner and no explicit standalone library requirement.

Shared owners must:

- remain free of component-family and product knowledge;
- expose the smallest coherent contract required by the request and affected consumers;
- document source status, supported behavior, known gaps, and affected consumers in README;
- keep implementation, tests, fixtures, and the latest independent AUDIT beside the owner;
- avoid speculative universal frameworks.

## Contract reconstruction

Before production changes, record:

```text
official artifact and boundary
supported, unsupported, and unresolved capability
public/private contract
state, lifecycle, rendering, clipping, and final-owner responsibilities
official token meanings and real runtime dependencies
current owner, canonical owner, consumers, and blast radius
accepted Web adaptation when canonical runtime cannot be consumed literally
current defects and required proof
```

Do not derive the contract from the current legacy implementation alone.

## Problem diagnosis

Every material problem receives one primary classification:

- `canonical-behavior`;
- `implementation-defect`;
- `architecture-defect`;
- `foundation-defect` or `style-defect` within the resolved owner;
- `generic-infrastructure-defect` outside Material ownership;
- `evidence-gap`;
- `product-deviation`.

Diagnosis must identify the actual owner. A symptom visible in one component does not make the component the correct owner.

## Implementation strategy

Choose:

- `repair` when contract and ownership are sound;
- `restructure` when the contract remains valid but routes, lifecycle, rendering, or ownership are wrong;
- `replace` when the implementation is based on a wrong contract or preserves several conflicting models.

If two correction rounds retain the same objective defect, add workarounds, or introduce new ownership ambiguity, stop patching and reconsider the strategy.

## Documentation

Each implemented foundation or style directory contains README with:

- official mapping and source status;
- implementation scope and capability inventory;
- reconstructed contract;
- diagnosis and implementation strategy;
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

An officially invalid route is not missing capability. Optional or non-normative guidance is not automatically required capability.

Independent review may create AUDIT in the same directory. Authoring never edits AUDIT.

## Dependency direction

```text
shared generic infrastructure
  → material/foundations and material/styles
  → material/components
```

Foundations and styles do not import component families. Components consume them through documented cross-family contracts.

Generic DOM, browser, event, geometry, lifecycle, and teleport utilities remain in their generic owner when they contain no Material semantics. Do not create a Material wrapper merely to satisfy folder structure.

Do not leave Material-specific state, token, clipping, motion, focus, or rendering ownership in generic infrastructure merely because the legacy implementation is located there.

Do not patch a foundation defect inside a component to avoid correcting the real shared owner.

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

A generic interaction primitive must not contain family-specific tokens, semantics, or state precedence.

An opacity token declaration alone does not implement State Layer. The route must reach the correct rendered layer with correct bounds, clipping, state winner, and consumer behavior.

Forced states prove stable appearance only. Real input is required to prove acquisition, release, interruption, cancellation, event ownership, and cleanup.

## Change rule

Before changing or creating a foundation/style owner:

1. resolve the explicit request and official owner;
2. reconstruct the current official contract;
3. diagnose each problem and actual owner;
4. select repair, restructure, or replace;
5. name current owner, canonical owner, consumers, and blast radius;
6. distinguish generic infrastructure from Material semantics;
7. define the shortest real route to final output;
8. assess cascade, inheritance, clipping, runtime, accessibility, lifecycle, and visual impact;
9. add proportional proof that actually exercises the route;
10. remove obsolete Material ownership and contradictory documentation;
11. update local documentation with every remaining gap.

Changes to root/system tokens, universal selectors, pseudo-elements, shared formulas, theme roles, shared lifecycle, or public shared APIs require explicit current cross-family impact analysis. A component-specific test alone is insufficient for a global change.

Unchanged tests that never exercise the shared route do not count as representative proof.

## Motion architecture

A shared motion style owns its documented Web runtime contract and proves it deeply once:

- canonical evidence and adaptation;
- source-to-runtime dependency;
- timing/easing or runtime model;
- intermediate composition when endpoints cannot reveal the risk;
- interruption and reduced-motion behavior;
- representative consumers or a style-owned fixture when no consumer exists.

Each component then proves proportional consumption. Do not require frame-by-frame validation per component without a demonstrated transition-composition risk.

A technically honest route does not override an operator-rejected perceived result. The affected family keeps the visual defect open until behavior changes and new evidence is accepted.

## CSS custom-property namespaces

Use only:

- exact official `--md-ref-*`, `--md-sys-*`, and `--md-comp-*` tokens;
- justified semantic `--md-private-<owner>-<role>` routes;
- genuine `--app-*` contracts.

Private names describe semantic roles, not raw CSS mechanisms. Do not create ad-hoc public-looking `--md-<artifact>-*` namespaces or unnecessary aliases for one-use or invariant constants.

Every variable must affect the correct final owner through a real dependency.

## Objective foundation gate

Before reporting implementation finished, establish direct evidence that:

- canonical ownership is unambiguous;
- generic and Material responsibilities are separated correctly;
- every route reaches final output;
- no unnecessary node, wrapper, variable, registry, or compatibility path remains;
- real lifecycle claims use real input;
- affected-consumer blast radius is represented;
- implementation, README, fixtures, tests, exports, and consumers agree;
- obsolete ownership is removed;
- required local verification passes.

Any failed applicable item means the foundation work is partial or blocked, not complete.

## Anti-overengineering

Do not create:

- a universal base component;
- a generic runtime token/state registry;
- a style DSL;
- a shared owner for family-local behavior with no official foundation/style basis and no explicit library request;
- a parallel wrapper around generic infrastructure;
- placeholder directories for every official page;
- fake product consumers;
- frame-level motion infrastructure without a demonstrated lifecycle or composition risk.

The documentation hierarchy is navigation and ownership, not a requirement to pre-create every artifact. Production artifacts are created when explicitly requested or required by real consumers.
