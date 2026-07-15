# Material 3 Storybook policy

## Principle

Storybook is the project documentation and isolated verification surface for the Material library. For Material components used by the app, Storybook should read like the corresponding official Material documentation adapted to the supported Mioframe contract.

Storybook is not the source of truth for Material. It documents how the project implements official guidance checked through MCP or `m3-docs-cache`.

## Story hierarchy

Use a hierarchy that separates official Material-aligned components from project-specific UI:

```text
Material 3/Components/<Family>/<Component>/<Story>
Material 3/Patterns/<Pattern>/<Story>
Project UI/<Component>/<Story>
```

Use `Material 3/Components` only for components that intentionally implement an official Material component family. Use `Material 3/Patterns` only for accepted reusable Material compositions. Use `Project UI` for app-specific surfaces.

## Canonical component story set

A new or migrated public Material component should normally expose:

- `Overview` or `Default`;
- `Variants`, `Configurations`, or `Sizes` only for supported axes that need explanation;
- exactly one canonical `StateMatrix`;
- focused browser-behavior fixtures when tests require them;
- documentation for usage, accessibility, tokens, supported/unsupported surface, extensions, and deviations.

Do not create sections mechanically when the supported surface does not need them. `StateMatrix` is the exception: it is mandatory for every new or migrated public Material component.

## State matrix

The canonical `StateMatrix` story follows [Component testing architecture](./component-testing.md).

It must:

- show every supported semantic, interaction, disabled, and other visually distinct component state;
- cover every distinct state-rendering route and simultaneous-state result from the rendered-property matrix;
- use the minimum rows required to cover distinct configuration/anatomy routes rather than the full Cartesian product;
- use visible row and column headings so a human can identify every case without source code;
- use the canonical checkerboard outer backdrop;
- keep representative content stable across cells unless content/anatomy is the tested axis;
- expose the stable root anchor `data-testid="visual-<component-kebab>-state-matrix"`;
- use accepted verification-only foundation adapters for deterministic transient states without adding test-only production APIs.

When one bounded image would be unreadable, keep one `StateMatrix` story with visibly labelled sections and screenshot those sections separately. Do not create one story or snapshot per cell.

New or migrated components should not retain separate `VisualStates` and `VisualInteractionStates` stories when the canonical matrix can represent both clearly. Legacy stories remain valid until family migration.

## Story rules

- Keep stories deterministic and fixture-driven.
- Do not connect product stores, storage flows, diagnostics, routing lifecycle, Google Drive integration, live network calls, or app bootstrap side effects.
- Do not change public component APIs only to satisfy Storybook.
- Do not put business logic in stories.
- Use the same public props, slots, native semantics, and tokens that product code uses.
- Verification-only state adapters remain outside the public component contract.
- Tag screenshot-ready stories with `visual`.
- Keep story titles, export names, and visual anchors stable after acceptance.

## Browser behavior fixtures

A behavior fixture exists only when a focused Playwright test needs a deterministic initial surface for real browser interaction.

The fixture may supply data and initial public props, but the test must acquire focus, hover, pressed, drag, open, or other behavior through real browser input. Do not use the state-matrix forced-state mechanism as behavior proof.

## Visual documentation

The state matrix is the primary visual regression and manual-review surface for a component.

Additional visual stories are allowed only for materially different geometry or contexts that the matrix should not multiply, such as:

- size/configuration galleries;
- responsive/container contexts;
- typography-specific surfaces;
- target-area or clipping diagnostics;
- previously broken focused cases.

Do not add visual snapshots for every story. Keep screenshots bounded and understandable.

## Human review

Initial state matrices and intentional matrix baseline changes require human comparison with the official Material sources named by the family blueprint.

A screenshot baseline is only a regression reference. Storybook must make the complete supported visual state surface inspectable; it cannot automatically decide whether that surface is correct.

## Documentation notes

Each Material component's Storybook docs should name:

- checked official Material pages and snapshot;
- intended and prohibited usage;
- supported and unsupported surface;
- public API and native semantics;
- foundation dependencies;
- tokens and supported override points;
- accessibility behavior;
- extensions and deviations;
- canonical state-matrix coverage.

Do not imply official Material support for project-specific or unsupported behavior.
