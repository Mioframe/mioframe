# Material 3 Storybook policy

## Principle

Storybook is the documentation and isolated verification surface for the Material library. It documents the supported Mioframe contract; it is not the source of Material truth.

Official authority comes from the source hierarchy in `source-of-truth.md`.

## Story hierarchy

```text
Material 3/Components/<Family>/<Component>/<Story>
Material 3/Patterns/<Pattern>/<Story>
Project UI/<Component>/<Story>
```

Use `Material 3/Components` only for official Material component families, `Material 3/Patterns` only for accepted reusable Material compositions, and `Project UI` for app-specific surfaces.

## Canonical component story set

A new or migrated public Material component normally exposes:

- `Overview` or `Default`;
- `Variants`, `Configurations`, or `Sizes` only for supported axes needing explanation;
- exactly one canonical `StateMatrix`;
- focused browser-behavior fixtures when tests require them;
- documentation for usage, accessibility, tokens, supported/unsupported surface, extensions, and deviations.

Do not create optional sections mechanically. `StateMatrix` is mandatory for every new or migrated public Material component.

## Canonical `StateMatrix`

Follow `component-testing.md`.

The matrix must:

- show every supported state/configuration that produces a distinct component-owned visible output;
- cover every distinct visible route and simultaneous visual result from the rendered-property matrix;
- omit semantic or interaction states with no distinct visible output;
- use the minimum rows required for different configuration/anatomy routes rather than the full Cartesian product;
- use visible row, column, and section headings;
- use the canonical checkerboard outer backdrop;
- keep representative content stable unless content/anatomy is the tested axis;
- expose `data-testid="visual-<component-kebab>-state-matrix"`;
- use accepted verification-only foundation adapters without changing production API.

When one bounded image would be unreadable, keep one story with labelled bounded sections and screenshot those sections separately. Do not create one story or snapshot per cell.

After migration, remove separate `VisualStates` and `VisualInteractionStates` stories when the canonical matrix represents the visual contract clearly.

## Story rules

- Keep stories deterministic and fixture-driven.
- Do not connect product stores, storage, diagnostics, routing lifecycle, account/network state, or app bootstrap effects.
- Do not change component APIs for Storybook.
- Do not place business logic in stories.
- Use the same public props, slots, native semantics, and tokens as product code.
- Verification-only adapters remain outside the public component contract.
- Tag screenshot-ready stories with `visual`.
- Keep accepted titles, export names, and visual anchors stable.

## Browser-behavior fixtures

Create a fixture only when a focused Playwright test needs a deterministic initial surface for real browser interaction.

The fixture may provide stable data and public initial props. The test must acquire focus, hover, press, drag, open, or other behavior through real browser input. Forced matrix state is never behavior proof.

## Additional visual stories

The matrix is the primary visual regression and manual-review surface.

Additional visual stories are allowed for distinct geometry or contexts the matrix should not multiply, such as:

- size/configuration galleries;
- responsive/container contexts;
- typography-specific surfaces;
- target-area or clipping diagnostics;
- previously broken focused cases.

Do not snapshot every story.

## Human review

Initial matrices and intentional visual baseline changes require human comparison with the official documentation and, when required, the official Material Design Kit references recorded by the family blueprint.

A screenshot baseline is only a regression reference. Storybook cannot decide whether the baseline is materially correct.

Persist accepted review metadata in the family blueprint:

```text
Last accepted visual review: <PR/date>
Source snapshot: <documentation and Design Kit snapshot>
```

## Documentation notes

Component docs should name:

- official documentation pages and snapshot;
- Design Kit evidence when used;
- intended/prohibited usage;
- supported and unsupported surface;
- public API and native semantics;
- foundation dependencies;
- tokens and override points;
- accessibility behavior;
- extensions and deviations;
- canonical distinct visual-route coverage.

Do not imply official support for project-specific or unsupported behavior.
