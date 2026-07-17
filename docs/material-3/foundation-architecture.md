# Material foundations and styles architecture

Shared Material contracts follow the official documentation navigation:

```text
src/shared/ui/material/foundations/<official-foundation-slug>
src/shared/ui/material/styles/<official-style-slug>
```

Do not place every cross-family concern into one generic `foundation` bucket.

## Foundations

`foundations` contains cross-component contracts represented under the official Material Foundations navigation, such as:

- accessibility;
- adaptive design and layout;
- interaction foundations;
- other official foundation domains required by current components.

## Styles

`styles` contains cross-component visual systems represented under the official Material Styles navigation:

- color;
- elevation;
- icons;
- motion;
- shape;
- typography.

Use the exact official documentation slug where practical.

## Ownership rule

A shared owner is justified only when at least one current component requires the contract and the concern is genuinely cross-family.

Shared owners must:

- remain free of component-family and product knowledge;
- expose the smallest contract required by current consumers;
- document supported behavior, known gaps, and affected consumers in a local `README.md`;
- keep implementation, tests, and any latest `AUDIT.md` beside the owner;
- avoid speculative universal frameworks.

A behavior used by one family remains family-local until a second real consumer or official shared contract proves otherwise.

## Documentation

Each implemented foundation or style directory contains a `README.md` with:

- official documentation mapping;
- implemented contract;
- not implemented or unsupported capability;
- known issues and required follow-up;
- consumers;
- verification;
- review status.

An independent review may create `AUDIT.md` in the same directory. There is no separate global audit tree.

## Dependency direction

```text
shared generic infrastructure
  → material/foundations and material/styles
  → material/components
```

Foundations and styles must not import component families. Components consume them through documented public or private cross-family contracts.

Generic DOM, browser, event, geometry, lifecycle, and teleport utilities remain in their generic owner. Do not create a Material wrapper merely to satisfy folder structure.

## Change rule

Before changing a shared foundation or style:

1. name the official requirement;
2. name the existing owner and affected consumers;
3. verify that the change is not safely family-local;
4. define the shortest final route;
5. assess broad cascade or runtime impact;
6. add proportional proof across representative consumers;
7. update the local documentation with every remaining gap.

Changes to root/system tokens, universal selectors, pseudo-elements, or shared formulas require explicit cross-family impact analysis. A component-specific test alone is not sufficient evidence for a global change.

## Anti-overengineering

Do not create:

- a universal base component;
- a generic runtime token/state registry;
- a style DSL;
- a shared owner before current consumers prove it;
- a parallel wrapper around generic infrastructure;
- placeholder directories for every official documentation page.

The structure mirrors the documentation for navigation. Production artifacts are still created only when required.