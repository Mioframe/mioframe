---
name: material-component-design
description: 'Use when given the official name of a component from the Material Design component catalogue. Research the current published m3.material.io component contract and create exactly one source-backed DESIGN.md without inspecting Mioframe implementation or making architecture, code, test, or migration decisions.'
---

# Material component design

Create the normative Material design document for one official component.

This skill answers only:

> What does the current published Material Design documentation require this component to be and do?

It does not decide how Mioframe will implement, expose, test, or migrate the component.

## Required input

The only required input is the official component name as published in the Material Design component catalogue.

Examples:

```text
Buttons
Switch
Navigation drawer
Search
```

Do not ask for a brief, product scenarios, supported variants, current defects, implementation constraints, or desired project scope.

Resolve harmless case and singular/plural differences only when they identify one current official component unambiguously. Do not use fuzzy matching to choose between multiple official components.

If the name is not an exact or uniquely resolvable current Material component, stop and report the official candidate names. Do not invent a component, combine families, inspect Mioframe code to infer intent, or create an artifact under a guessed owner.

## Required artifact

Create or replace exactly one file:

```text
src/shared/ui/material/components/<canonical-material-slug>/DESIGN.md
```

Use the canonical slug from the resolved official `m3.material.io` component URL.

The artifact is the complete official design contract for that component, not a plan, audit, implementation report, or description of the current repository.

Do not modify any other file.

## Authority

Use only current published pages on `https://m3.material.io` as normative evidence.

Inspect all applicable official pages for the resolved component, including when available:

- overview;
- guidelines;
- specifications;
- accessibility guidance;
- related component guidance;
- linked Material foundations for color, typography, shape, elevation, motion, interaction states, layout, and adaptation.

Do not use as authority:

- Mioframe code, tests, stories, screenshots, tokens, or existing documentation;
- deleted or historical repository Material documents;
- Material Web or another implementation library;
- Figma files or design-kit metadata;
- blogs, articles, search snippets, examples from other products, or community guidance;
- memory or assumed Material conventions.

Search may be used only to locate the official `m3.material.io` pages. Every normative statement in the artifact must be supported by an inspected official page.

When the official documentation does not define a value or behavior, record the gap. Do not complete it from another source and do not infer it from an image.

## Repository boundary

Before writing, read the root and applicable nested `AGENTS.md` files only to obey repository placement and editing rules.

Do not inspect the existing component implementation or any implementation-adjacent evidence, including:

- Vue or TypeScript source;
- CSS, project tokens, or foundation code;
- public exports;
- consumers;
- tests, snapshots, or Storybook stories;
- existing component README or audit files;
- legacy components.

The design contract must remain independent of the current implementation.

## Target resolution

1. Resolve the exact current official component page from the supplied name.
2. Record the official component title, category, URL slug, and directly related official components.
3. Preserve the family boundary used by the official documentation.
4. Do not merge separately documented Material components merely because their implementation may share code.
5. Do not split one officially documented component into project-specific subfamilies.

If current official pages conflict about the component identity or family boundary, stop and report the conflict. Do not create `DESIGN.md` until the target is deterministic.

## Source snapshot

Record the execution date and every inspected official page.

Assign short stable source IDs inside the document, for example:

```text
M3-COMPONENT-OVERVIEW
M3-COMPONENT-GUIDELINES
M3-COMPONENT-SPECS
M3-STATES
M3-MOTION
```

Use the real page title and URL for each source. Do not cite a page that was not inspected.

Every table row or requirement group must reference its supporting source ID. A general source list without requirement traceability is insufficient.

## Research procedure

Perform these passes in order.

### 1. Resolve identity and official surface

Determine:

- canonical title and slug;
- Material category;
- purpose;
- when to use and when not to use;
- official family members;
- variants;
- configurations;
- sizes and density options;
- related and alternative components.

Include the complete current official surface. Do not reduce it to what Mioframe currently uses.

### 2. Resolve anatomy and content

Determine:

- named visual parts;
- required and optional content;
- labels, icons, supporting content, badges, or other official elements;
- content guidance;
- localization, wrapping, truncation, and directionality rules when documented.

Describe design anatomy only. Do not describe DOM nodes, Vue components, wrappers, selectors, or file structure.

### 3. Resolve states and interaction

Determine all applicable:

- base states;
- interaction states;
- selected, checked, expanded, error, dragged, or other semantic states;
- allowed state combinations;
- mutually exclusive states;
- pointer, touch, keyboard, focus, and assistive-technology behavior documented by Material;
- disabled, cancellation, interruption, and recovery behavior documented by Material.

Do not add platform behavior that is absent from `m3.material.io`. Record it as a source gap instead.

### 4. Resolve visual specification

Capture the official values or named tokens for every applicable:

- dimensions and target sizes;
- spacing and alignment;
- color roles;
- typography roles;
- shapes;
- outlines;
- elevation;
- state layers;
- focus indicators;
- icons;
- motion durations, easing, transitions, interruption, and reduced-motion behavior.

Keep official Material token names separate from literal measurements. Do not create Mioframe token names, CSS custom properties, fallbacks, mappings, or implementation routes.

### 5. Resolve accessibility and adaptation

Capture only published Material requirements for:

- semantic meaning;
- accessible naming and state communication;
- focus visibility;
- contrast;
- target size;
- text scaling and zoom;
- RTL;
- responsive or adaptive behavior;
- orientation and window-size behavior;
- reduced motion.

Record missing guidance explicitly rather than importing requirements from another authority.

### 6. Build the conformance matrix

Create the minimum set of concrete design cases needed to cover every officially documented dimension at least once:

- family member;
- variant;
- size;
- configuration;
- base state;
- interaction state;
- meaningful state combination;
- light and dark color schemes when applicable;
- LTR and RTL when applicable;
- documented adaptive conditions;
- documented content edge cases.

Do not generate the full Cartesian product. Each case must state which official requirements it covers.

### 7. Check completeness

Before writing `review-ready`, confirm that:

- every official page section was considered;
- variants, configurations, sizes, and states are not conflated;
- every normative statement has source traceability;
- source gaps and source conflicts are visible;
- no repository-specific scope or implementation decision entered the document;
- the conformance matrix covers every documented dimension.

## DESIGN.md contract

Use this structure.

```md
---
document: material-component-design
component: <official title>
canonical-slug: <official URL slug>
material-source: m3.material.io
source-snapshot: YYYY-MM-DD
status: review-ready
approval: pending
---

# <Official component title>

## Sources
## Component identity
## Purpose and choice guidance
## Official family and related components
## Variants
## Configurations
## Sizes and density
## Anatomy
## Content guidance
## State model
## Interaction behavior
## Visual specification
### Dimensions and layout
### Color
### Typography
### Shape and outline
### Elevation
### State layers and focus
### Icons
## Material token inventory
## Motion
## Accessibility
## Directionality and adaptation
## Canonical conformance matrix
## Source conflicts
## Source gaps
## Design acceptance criteria
```

Omit a subsection only when the document explicitly states that it is not applicable according to the inspected official sources. Do not silently omit an area because the source is incomplete.

## Metadata rules

The skill may set only:

```yaml
status: review-ready
approval: pending
```

It must never set `approval: approved`.

`review-ready` means only that the official-source research is complete and the artifact is ready for independent design review. It does not authorize architecture or implementation.

If an unresolved official-source conflict makes the contract internally contradictory, do not publish a misleading `review-ready` artifact. Stop and report the exact conflict and affected sections.

## Requirement writing rules

- Write requirements as design facts and observable behavior, not implementation instructions.
- Distinguish required, optional, conditional, and not specified.
- Preserve official terminology.
- Use exact official token names and values when published.
- State `Not specified by the inspected Material sources` when a required field has no official value.
- Do not convert a recommendation into a requirement.
- Do not convert an example into a supported variant.
- Do not infer hidden geometry, timing, or color from screenshots.
- Do not add Mioframe extensions, product defaults, or future plans.

## Forbidden content

`DESIGN.md` must not contain:

- current Mioframe implementation status;
- product-specific supported or deferred subsets;
- Vue props, emits, slots, composables, or directives;
- TypeScript types;
- DOM structure or event-handler design;
- CSS selectors or Mioframe variables;
- ownership or dependency decisions;
- foundation APIs;
- implementation file paths other than the artifact path;
- test types, test files, Storybook plans, or verification commands;
- migration consumers or legacy-removal plans;
- estimates, implementation phases, branches, commits, or PR instructions.

These belong to later workflow stages.

## Completion result

A successful run produces exactly one changed file and reports:

```text
MATERIAL DESIGN RESULT
component: <official title>
artifact: src/shared/ui/material/components/<canonical-material-slug>/DESIGN.md
status: review-ready
approval: pending
sources: <count of inspected m3.material.io pages>
source gaps: none | <count>
source conflicts: none | <count>
```

Do not claim implementation readiness, compliance of existing code, migration readiness, or merge readiness.