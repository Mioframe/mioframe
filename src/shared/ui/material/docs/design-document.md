# Material component design document

## Purpose

Every official Material component family under `src/shared/ui/material/components/<family>` owns:

```text
DESIGN.md
```

`DESIGN.md` is the complete normalized repository snapshot of the official Material 3 Expressive component documentation.

It answers only:

```text
What does official Material define for this component?
```

It does not answer:

```text
What does Mioframe implement now?
How does m3e render it?
Which current consumers need it?
How is it implemented, migrated, tested, or reviewed?
```

Those decisions belong to later stage artifacts and runtime owners.

## Authority and lifecycle

Official Material documentation is the authority. `DESIGN.md` is the complete local, source-backed snapshot used by later architecture and implementation stages.

The document records:

- exact official routes and source titles;
- source snapshot date;
- cache/source revision used for extraction;
- whether every required official page was available;
- source conflicts, unresolved values, or extraction gaps.

A family design document has one status:

- `current` — every required official source is represented completely;
- `stale` — official sources changed after the recorded snapshot;
- `blocked` — a required source is unavailable, contradictory, or incompletely extracted.

A missing, stale, or blocked `DESIGN.md` blocks architecture, implementation, migration, review, and complete status.

## Required source set

Inspect every official page applicable to the component, including at minimum:

- overview;
- specifications;
- guidelines;
- accessibility;
- complete component-token tables;
- related-component references;
- official expressive-update notes;
- official platform or adaptive guidance when present.

When the official component documentation delegates behavior to another official foundation or component page, include that source and the delegated facts required to understand the complete component contract.

Do not silently omit a source because Mioframe does not currently use the corresponding capability.

## Completeness contract

`DESIGN.md` describes the complete official component model, not the current Mioframe subset.

It must include every applicable official fact in a structured, non-duplicative form:

1. **Identity and purpose**
   - official component name;
   - role and intended use;
   - distinction from adjacent or alternative components;
   - expressive-update changes and differences from earlier Material versions.

2. **Anatomy and content**
   - required and optional parts;
   - content roles;
   - label, icon, supporting-content, and ordering rules;
   - allowed and disallowed combinations.

3. **Variants and configurations**
   - every official variant;
   - every color/configuration option;
   - every size;
   - every shape;
   - default values;
   - selection/toggle modes;
   - all official configuration combinations and constraints.

4. **Geometry and layout**
   - heights, widths, padding, spacing, icon sizes, target sizes, outlines, shapes, and other exact measurements;
   - layout behavior and alignment;
   - density or adaptive behavior;
   - standalone and composed geometry where official documentation distinguishes them.

5. **States and behavior**
   - enabled, disabled, hovered, focused, pressed, dragged, selected, unselected, loading, error, or other documented states;
   - state precedence and valid combinations when documented;
   - activation, selection, dismissal, progress, navigation, or other component behavior;
   - transition, motion, shape morphing, elevation, state-layer, and restoration behavior.

6. **Usage guidance**
   - when to use and when not to use;
   - placement and hierarchy guidance;
   - content-writing guidance;
   - do/don't rules;
   - related-component selection guidance.

7. **Accessibility**
   - semantic role and native behavior;
   - accessible name and state requirements;
   - keyboard and pointer interaction;
   - focus behavior;
   - minimum target and contrast requirements;
   - screen-reader or platform-specific guidance.

8. **Complete official token catalogue**
   - every token path published for the component, including all variants, sizes, states, parts, selected/unselected modes, disabled values, motion, shape, elevation, typography, spacing, and contrast variants;
   - exact official token path;
   - official token display name;
   - system/reference aliases;
   - documented light, dark, high-contrast, or other values;
   - unresolved or omitted official values preserved explicitly rather than guessed.

9. **Source conflicts and unknowns**
   - disagreements between official pages;
   - unresolved token values;
   - missing official guidance;
   - deprecated or superseded guidance;
   - no Mioframe or renderer decision in this section.

10. **Related official contracts**
    - required official dependencies;
    - related foundations;
    - alternative components;
    - links to their own design documents when those families exist in the repository.

## Full does not mean verbatim

The document must preserve the complete official contract without copying whole official pages as prose.

Use:

- structured paraphrase for guidance and behavior;
- exact names for variants, states, parts, token paths, measurements, and values;
- tables for complete enumerations;
- source references for every section.

Do not replace complete coverage with a short summary, a selected-surface matrix, or links to external pages.

## Separation from later stage artifacts

| Artifact            | Question answered                                         | Scope                                |
| ------------------- | --------------------------------------------------------- | ------------------------------------ |
| `DESIGN.md`         | What does official Material define?                       | complete official component contract |
| `ARCHITECTURE.md`   | What must Mioframe implement now and how?                 | demand-scoped Material–Vue–m3e plan  |
| `IMPLEMENTATION.md` | Was the accepted component architecture implemented?      | component code/proof handoff         |
| `MIGRATION.md`      | Were consumers migrated and legacy ownership removed?     | application adoption                 |
| `REVIEW.md`         | Does the complete result satisfy all contracts and gates? | independent review                   |
| `README.md`         | Where are the family artifacts and runtime entry points?  | short index only                     |

`ARCHITECTURE.md` must reference exact `DESIGN.md` sections for every selected, deferred, conflicting, or restrictive decision.

`DESIGN.md` must not contain:

- current Mioframe demand;
- `implement-now` or `defer` decisions;
- Vue props, emits, slots, or exports;
- m3e properties, events, types, tags, or CSS variables;
- renderer defects or workarounds;
- code paths, test files, migration status, PR history, or verification results.

## Update rule

Regenerate or update `DESIGN.md` when:

- official source content changed;
- the source cache revision changed materially;
- a previously unavailable official page became available;
- review found an omitted official capability, token, state, measurement, or guidance rule.

Implementation, migration, and review changes alone do not modify `DESIGN.md`.

## Completion gate

A design document is complete only when:

- all applicable official source pages are listed and represented;
- the complete component surface is described regardless of current demand;
- every official component token is included or explicitly recorded as unavailable;
- exact measurements, defaults, states, and accessibility rules are preserved;
- no m3e, Mioframe architecture, implementation, migration, demand, or proof decision is mixed into the artifact;
- source conflicts and extraction gaps are explicit;
- status is `current`.

The design skill stops after this artifact. Architecture begins only in a later invocation.
