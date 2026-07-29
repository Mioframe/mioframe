# Material 3 Storybook policy

`docs/testing/storybook.md` defines project-wide Storybook ownership, colocation, proof boundaries, file naming, and verification impact. This document adds only Material-library rules.

## Principle

Storybook is the isolated documentation, browser-fixture, and visual-evidence surface for the Material library. It documents the accepted Mioframe contract; official authority comes from `source-of-truth.md`.

## Story hierarchy

```text
Material 3/Components/<Family>/<Component>/<Story>
Material 3/Patterns/<Pattern>/<Story>
```

Use official Material namespaces only for accepted official components and patterns. Project-specific UI follows the FSD hierarchy defined in `docs/testing/storybook.md`.

## Component story set

A new or migrated public Material component normally exposes only applicable stories:

- `Overview`, `Default`, or another canonical representative story;
- `Variants`, `Configurations`, or `Sizes` when supported axes need explanation;
- `StateMatrix` when multiple distinct component-owned visual routes exist;
- focused browser fixtures when Playwright requires a deterministic initial surface;
- usage, accessibility, token, supported/unsupported, extension, and deviation notes as applicable.

Do not create optional stories mechanically.

## Canonical visual story

Every component with visible output has one stable canonical visual story recorded by the family contract.

Use:

- `StateMatrix` for multiple distinct component-owned visual routes;
- a bounded `Overview`, `Default`, or equivalent story when one representative route is sufficient.

Tag screenshot-ready stories with `visual` and keep accepted titles, export names, and bounded anchors stable. The owning visual spec is colocated with the component according to `docs/testing/storybook.md`.

## `StateMatrix`

Follow `component-testing.md`.

A matrix must:

- show every supported configuration or state that produces distinct component-owned visible output;
- include simultaneous states only when they produce a distinct visible winner or coexistence result;
- omit non-visual states and equivalent cases;
- use the minimum readable rows, columns, and sections rather than a Cartesian product;
- use visible labels and stable representative content;
- use accepted verification-only foundation adapters without changing production API.

When one image would be unreadable, keep one story with labelled bounded sections. Do not create one story or snapshot per cell.

A simple component with one meaningful visual route must not receive a ceremonial matrix.

## Story rules

- Keep stories deterministic and fixture-driven.
- Do not connect product stores, storage, diagnostics, routing lifecycle, account/network state, or app bootstrap effects.
- Do not change public component API for Storybook.
- Do not place business logic in stories.
- Use the same public props, slots, native semantics, and tokens as product code.
- Keep verification-only adapters outside the public component contract.
- Remove obsolete duplicate visual stories after the canonical reference covers their accepted purpose.

## Browser fixtures

Create a fixture only when a focused colocated browser spec needs deterministic initial data or layout for real browser interaction.

The spec acquires focus, hover, press, drag, open, or other behavior through real input. Forced visual state never proves acquisition, cancellation, cleanup, or browser behavior.

## Additional visual stories

Add a visual story only for a distinct supported geometry or context that the canonical story should not multiply, such as:

- supported size or configuration galleries;
- responsive or container contexts;
- typography-specific surfaces;
- target-area or clipping diagnostics;
- a focused previously broken case.

Do not snapshot every story.

## Visual regression

Use bounded screenshots when the canonical visual contract is stable and regression protection is material.

A screenshot baseline detects change; it does not establish official correctness. Initial baselines and intentional visible changes require operator comparison with named official sources.

## Operator handoff

When visual acceptance is required, provide:

- canonical visual story id;
- bounded screenshot and diff;
- official documentation snapshot;
- Design Kit reference when required;
- intended matches, explicit deviations, and unsupported surface;
- confirmation that non-visual agent review passed.

Persist accepted review metadata in the family contract only when the visual contract requires it.

## Documentation notes

Component stories and docs should name applicable:

- official sources and snapshot;
- intended and prohibited usage;
- supported and unsupported surface;
- public API and native semantics;
- foundation dependencies;
- tokens and override points;
- accessibility behavior;
- extensions and deviations;
- canonical visual coverage.

Do not imply official support for project-specific or unsupported behavior.
