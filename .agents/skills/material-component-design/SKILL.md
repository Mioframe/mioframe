---
name: material-component-design
description: 'Use when given the official name of a component from the Material Design component catalogue. Create one source-backed DESIGN.md from current m3.material.io guidance without inspecting Mioframe implementation or making architecture, code, test, or migration decisions.'
---

# Material component design

Create the normative Material design contract for one official component.

This skill answers only:

> What does the current published Material documentation require this component to be and do?

It does not decide how Mioframe will implement, expose, test, or migrate the component.

## Input

The only required input is the official component name from the Material component catalogue.

Examples:

```text
Buttons
Switch
Navigation drawer
Search
```

Do not ask for a brief, product scenarios, desired variants, current defects, implementation constraints, or project scope.

Resolve harmless case and singular/plural differences only when they identify one current official component unambiguously. If the name is not exact or uniquely resolvable, stop and report the official candidate names. Do not guess from Mioframe code.

## Artifact

After resolving the official target, create or replace exactly one file:

```text
src/shared/ui/material/components/<canonical-material-slug>/DESIGN.md
```

Use the slug from the official component URL.

Do not modify any other file.

The artifact describes the complete current official component surface. It is not a project subset, implementation plan, audit, test plan, or migration record.

## Authority

Use only current published pages on `https://m3.material.io` as normative evidence.

Inspect every applicable official page for the target, including when published:

- overview;
- guidelines;
- specifications;
- accessibility guidance;
- related component guidance;
- linked foundations for color, typography, shape, elevation, motion, interaction states, layout, and adaptation.

Search may be used only to locate official `m3.material.io` pages.

Do not use as authority:

- Mioframe code, tests, stories, screenshots, tokens, or existing documentation;
- historical repository Material documents;
- Material Web or another implementation library;
- Figma or design-kit metadata;
- blogs, articles, search snippets, or community guidance;
- memory or assumed Material conventions.

If official documentation does not define a value or behavior, record the gap. Do not infer it from images or fill it from another source.

## Repository read boundary

Read the root and applicable nested `AGENTS.md` files only to obey repository placement and editing rules.

Do not inspect implementation-adjacent evidence:

- Vue, TypeScript, or CSS source;
- project tokens or foundation code;
- public exports or consumers;
- tests, snapshots, or Storybook;
- component README, audits, or legacy components.

The design contract must be independent of the current implementation.

## Target resolution

1. Resolve the current official component page from the supplied name.
2. Record its official title, category, URL, slug, and directly related components.
3. Preserve the family boundary used by the official documentation.
4. Do not merge separately documented components merely because they may share code.
5. Do not split one documented component into project-specific families.

If the component identity or family boundary cannot be resolved, stop without writing under a guessed path.

## Source evidence

Record the execution date and every inspected official page.

Assign short source IDs, for example:

```text
M3-COMPONENT-OVERVIEW
M3-COMPONENT-GUIDELINES
M3-COMPONENT-SPECS
M3-STATES
M3-MOTION
```

For each source record its real title and URL. Every requirement or table row must reference the supporting source ID. A source list without requirement traceability is insufficient.

## Workflow

### 1. Resolve the official surface

Determine:

- purpose and choice guidance;
- official family members;
- variants;
- configurations;
- sizes and density options;
- related and alternative components.

Include the full official surface. Do not reduce it to current Mioframe needs.

### 2. Resolve anatomy and content

Determine:

- named visual parts;
- required and optional content;
- labels, icons, supporting content, badges, or other official elements;
- localization, wrapping, truncation, and directionality guidance.

Describe design anatomy only. Do not describe DOM, Vue, selectors, wrappers, or files.

### 3. Resolve states and interaction

Determine all applicable:

- base and interaction states;
- selected, checked, expanded, error, dragged, or other semantic states;
- allowed and forbidden state combinations;
- pointer, touch, keyboard, focus, and assistive-technology behavior published by Material;
- disabled, cancellation, and interruption behavior published by Material.

Do not add platform behavior absent from `m3.material.io`; record a source gap instead.

### 4. Resolve visual specification

Capture official tokens or values for every applicable:

- dimensions, target sizes, spacing, and alignment;
- color and typography;
- shape and outline;
- elevation;
- state layers and focus indicators;
- icons;
- motion duration, easing, transition, interruption, and reduced-motion behavior.

Keep Material token names separate from literal measurements. Do not create Mioframe tokens, CSS variables, fallbacks, or mappings.

### 5. Resolve accessibility and adaptation

Capture published Material requirements for:

- semantic meaning and accessible state communication;
- focus visibility and contrast;
- target size;
- text scaling and zoom;
- RTL;
- responsive, adaptive, orientation, and window-size behavior;
- reduced motion.

Record missing guidance instead of importing another authority.

### 6. Build the conformance matrix

Create the minimum set of concrete design cases that covers every documented dimension at least once:

- family member;
- variant;
- size;
- configuration;
- base and interaction state;
- meaningful state combination;
- light and dark scheme when applicable;
- LTR and RTL when applicable;
- documented adaptive condition;
- documented content edge case.

Do not generate a full Cartesian product. Each case must name the requirements it covers.

### 7. Check completeness

Confirm that:

- every applicable official page section was considered;
- variants, configurations, sizes, and states are not conflated;
- every normative statement has source traceability;
- source gaps and conflicts are explicit;
- no project-specific or implementation decision entered the artifact;
- the conformance matrix covers every documented dimension.

## DESIGN.md structure

Use this structure:

```md
---
document: material-component-design
component: <official title>
canonical-slug: <official URL slug>
material-source: m3.material.io
source-snapshot: YYYY-MM-DD
status: review-ready | blocked
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

Omit a subsection only when the artifact explicitly states that it is not applicable according to the inspected sources. Do not silently omit an area because guidance is missing.

## Status and approval

Set:

```yaml
status: review-ready
approval: pending
```

when the source research is complete and internally consistent.

Set:

```yaml
status: blocked
approval: pending
```

when the official target is resolved but a source conflict or gap prevents a coherent contract. Preserve all confirmed evidence and state the exact blocking decision. Do not weaken or invent requirements to reach `review-ready`.

Never set `approval: approved`. Approval is external to this skill.

Neither status authorizes architecture or implementation.

## Requirement rules

- Write design facts and observable behavior, not implementation instructions.
- Distinguish required, optional, conditional, and not specified.
- Preserve official terminology.
- Use exact official token names and values when published.
- Write `Not specified by the inspected Material sources` for missing guidance.
- Do not convert a recommendation into a requirement.
- Do not convert an example into a supported variant.
- Do not infer hidden geometry, color, or timing from screenshots.
- Do not add Mioframe extensions, defaults, exclusions, or future plans.

## Forbidden content

`DESIGN.md` must not contain:

- current Mioframe implementation status;
- a project-specific supported or deferred subset;
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

A completed run changes exactly one file and reports:

```text
MATERIAL DESIGN RESULT
component: <official title>
artifact: src/shared/ui/material/components/<canonical-material-slug>/DESIGN.md
status: review-ready | blocked
approval: pending
sources: <count of inspected m3.material.io pages>
source gaps: none | <count>
source conflicts: none | <count>
```

Do not claim implementation readiness, compliance of existing code, migration readiness, or merge readiness.