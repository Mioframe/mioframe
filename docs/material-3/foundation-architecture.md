# Material foundations and styles architecture

Shared Material contracts follow official documentation navigation:

```text
src/shared/ui/material/foundations/<official-foundation-slug>
src/shared/ui/material/styles/<official-style-slug>
```

Do not place every cross-family concern into one generic foundation bucket.

## Evidence boundary

Foundation authoring and review use current workspace files, official Material sources, and local project verification.

Do not use source-control or remote history as contract evidence.

## Foundations

`foundations` contains cross-component contracts represented under official Material Foundations navigation, such as:

- accessibility;
- adaptive design and layout;
- interaction foundations;
- other official foundation domains required by current components.

## Styles

`styles` contains cross-component visual systems represented under official Material Styles navigation:

- color;
- elevation;
- icons;
- motion;
- shape;
- typography.

Use exact official documentation slugs where practical.

## Ownership rule

A shared owner is justified only when at least one current component requires the contract and the concern is genuinely cross-family.

Shared owners must:

- remain free of component-family and product knowledge;
- expose the smallest contract required by current consumers;
- document source status, supported behavior, known gaps, and affected consumers in README;
- keep implementation, tests, and the latest independent AUDIT beside the owner;
- avoid speculative universal frameworks.

Behavior used by one family remains family-local until official evidence or multiple real consumers prove shared ownership.

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
- implemented contract;
- partial, defective, provisional, or unverified contract;
- actual capability not implemented;
- officially unsupported or invalid routes when applicable;
- known issues and required follow-up;
- affected consumers and blast radius;
- representative verification;
- review status.

An officially invalid route is not a missing capability. Optional or non-normative guidance is not automatically required capability.

Independent review may create AUDIT in the same directory. There is no separate global audit tree.

## Dependency direction

```text
shared generic infrastructure
  → material/foundations and material/styles
  → material/components
```

Foundations and styles do not import component families. Components consume them through documented cross-family contracts.

Generic DOM, browser, event, geometry, lifecycle, and teleport utilities remain in their generic owner. Do not create a Material wrapper merely to satisfy folder structure.

## Change rule

Before changing a shared foundation or style:

1. name the official requirement and source status;
2. name the current owner and current affected consumers;
3. verify that the change is not safely family-local;
4. define the shortest real final route;
5. assess cascade, inheritance, runtime, and visual impact;
6. add proportional representative proof that actually exercises the route;
7. update local documentation with every remaining gap and visual status.

Changes to root/system tokens, universal selectors, pseudo-elements, or shared formulas require explicit current cross-family impact analysis. A component-specific test alone is insufficient for a global change.

Unchanged tests that never exercise the shared route do not count as representative proof.

## Motion architecture

A shared motion foundation owns its documented Web runtime contract and proves it deeply once:

- canonical evidence and adaptation;
- source-to-runtime dependency;
- timing/easing or runtime model;
- interruption and reduced-motion behavior;
- representative consumers.

Each component then proves proportional consumption. Do not require frame-by-frame validation per component.

A technically honest route does not override an operator-rejected perceived result. The affected family keeps the visual defect open until behavior changes and new evidence is accepted.

## Anti-overengineering

Do not create:

- a universal base component;
- a generic runtime token/state registry;
- a style DSL;
- a shared owner before current consumers prove it;
- a parallel wrapper around generic infrastructure;
- placeholder directories for every official page;
- frame-level component motion infrastructure for ordinary CSS transitions.

The structure mirrors documentation for navigation. Production artifacts are created only when required.
