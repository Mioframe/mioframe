# Material component testing architecture

This document defines the mandatory testing contract for public components in the Mioframe Material library.

It complements `component-architecture.md`: component architecture owns production structure and the complete family blueprint; this document owns test-layer separation, canonical Storybook visual-state coverage, visual regression, and human visual review.

## Applicability

### New component

Create the complete standard test profile.

### First library migration

Create or consolidate the complete standard test profile and canonical `StateMatrix`.

### Later material change to a migrated component

Update every affected contract, browser, visual, pure-behavior, consumer, and review artifact. Do not recreate unaffected coverage.

### Strict local repair to an unmigrated component

The full profile is not required only when `Architecture impact: none` is valid and the existing testing surface is preserved. A public contract, state-model, foundation, or visual-contract change requires migration or an explicit architecture handoff.

## Required test profile

Every new or migrated public Material component records these layers in the canonical family blueprint:

| Layer                   | Required artifact                                 | Purpose                                                                                                            |
| ----------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Architecture validation | enforceable static/structured checks              | Location, dependency direction, profile files, tokens, exports, blueprint sections, and test-artifact consistency. |
| Component contract      | colocated `<Component>.test.ts`                   | Public props, emits, slots, native owner, ARIA, defaults, invalid combinations, and non-browser structural wiring. |
| State matrix            | one Storybook export named `StateMatrix`          | Human-readable reference for every distinct supported component-owned visual route.                                |
| Visual regression       | Playwright screenshot of the state matrix         | Detect unintended rendered changes and provide a stable diff for review.                                           |
| Browser behavior        | focused Storybook Playwright spec when applicable | Real focus, keyboard, pointer, touch, drag, overlay, responsive, and browser-owned behavior.                       |
| Pure behavior           | focused Vitest tests when applicable              | Extracted helpers, composables, transitions, timing, cancellation, and cleanup logic.                              |
| Consumer preservation   | focused checks when consumers changed             | Existing usage, imports, and product-visible behavior remain valid.                                                |

A layer does not replace another:

- screenshots do not prove semantics or interaction behavior;
- Vue component tests do not prove browser layout, focus, pointer, or appearance;
- forced visual states do not prove real acquisition, release, cancellation, or cleanup;
- green automation does not prove that an accepted baseline matches Material.

## Source of test cases

Test cases derive from the accepted family blueprint:

1. supported Material surface;
2. public API and native semantics;
3. anatomy and DOM ownership;
4. semantic and interaction states;
5. state ownership;
6. rendered-property matrix;
7. foundation dependencies;
8. extensions and deviations;
9. affected consumer contracts.

Do not test unsupported optional capabilities. Do not omit a reachable supported contract because it is difficult to automate; place it at the correct proof layer.

## Component contract tests

Use `@vue/test-utils` for the colocated `<Component>.test.ts`.

Cover applicable stable contracts:

- canonical defaults;
- public configuration and semantic-state props;
- native element selection;
- explicit `href`, `type`, `disabled`, `tabindex`, `role`, and `aria-*` ownership;
- slots and fixed anatomy;
- emits and controlled-state behavior;
- invalid combinations and only the normalization accepted by the blueprint;
- component-to-foundation wiring that does not require browser rendering;
- public Mioframe extensions.

Do not assert:

- CSS appearance or computed style;
- layout or geometry;
- focus-visible acquisition;
- pointer/touch behavior;
- ripple or overlay lifecycle;
- browser actionability.

Prefer named contract assertions over complete rendered-tree snapshots.

## Browser behavior tests

Use isolated Storybook stories and Playwright under `tests/e2e/storybook`.

Test only behavior owned or constrained by the component:

- native and custom keyboard activation/navigation;
- focus entry, movement, visibility, and restoration;
- pointer, touch, drag, gesture, capture, cancellation, and cleanup;
- expanded target-area hit testing;
- overlay, teleport, escape/back, outside interaction, and containment;
- responsive or container-dependent component behavior;
- actual property ownership when browser rendering is required;
- motion completion and reduced-motion behavior when contractual.

Drive behavior through public inputs and real browser actions. Do not use forced-state providers, direct Vue mutation, component methods, or synthetic internal events to prove behavior.

A component with no browser-owned behavior may record `not applicable` with an ownership-based reason. Native behavior still receives a focused browser check when the component changes or constrains it.

## Canonical `StateMatrix`

Every new or migrated public Material component has exactly one canonical Storybook export named `StateMatrix`.

Its purpose is:

- manual inspection of the complete supported visual-state surface;
- initial comparison with official Material documentation and, when required, the official Design Kit;
- review of intentional visual changes;
- one deterministic visual-regression entry point.

The story may be inline in `<Component>.stories.ts` or extracted to `<Component>StateMatrixStory.vue` when the fixture would obscure ordinary stories. Extraction is a Storybook fixture decision, not a production abstraction.

### Stable identity

```text
Story export: StateMatrix
Root anchor: data-testid="visual-<component-kebab>-state-matrix"
Outer class: visual-checker-backdrop
```

Keep story id and root anchor stable after acceptance. Rename only with matching visual-spec and snapshot updates.

### Coverage rule

The matrix covers visual contracts, not every state name.

It must include:

1. every supported state that changes component-owned visible output;
2. every distinct visible route from the rendered-property matrix;
3. every disabled/unavailable appearance that differs visually;
4. every simultaneous-state combination with a distinct visible winner or coexistence result;
5. every extension or deviation that changes visible output.

A semantic, interaction, or lifecycle state with no distinct component-owned visible output does not require a matrix cell. Its contract remains covered by component or browser behavior tests.

Do not build the full Cartesian product. Routes may share a cell only when the blueprint confirms identical visible properties, owners, sources, winner/coexistence rules, and foundation bridges.

The family blueprint contains the canonical coverage table:

| Visible route/group | Supported state/configuration | Distinct visible output | Matrix section/row/column |
| ------------------- | ----------------------------- | ----------------------- | ------------------------- |

`Readiness: ready` is invalid when a supported distinct visual route has no matrix location.

### Axes

Columns normally represent visually distinct interaction or terminal appearances:

- resting/default;
- hover;
- focus-visible;
- pressed;
- dragged;
- disabled;
- visually distinct open/loading/active appearances.

Rows normally represent the minimum configurations required to cover different visual routes:

- variants whose state tokens or rendered properties differ;
- semantic configurations such as selected/unselected or error/normal when appearance differs;
- anatomy modes changing state output;
- shape/elevation modes changing state resolution;
- documented extensions with distinct visual contracts.

Sizes, labels, icons, and content lengths receive rows only when they change state routing, state geometry, or a property owner. Ordinary breadth belongs in `Variants`, `Sizes`, or `Configurations` stories.

### Human-readable layout

A reviewer must understand every cell from the screenshot.

Required:

- visible column headings;
- visible row headings;
- visible section headings for multiple bounded sections;
- consistent cell dimensions and alignment;
- fixture-only labels for ambiguous or icon-only cases;
- consistent representative content unless content/anatomy is the tested axis.

Do not rely only on accessible names, tooltips, test ids, CSS classes, source order, or controls.

Fixture labels must not alter the production component layout or obscure focus indicators, state layers, elevation, outlines, or target areas.

### Deterministic visual states

The matrix may use accepted verification-only foundation adapters for generic transient visual facts such as hover, focus-visible, pressed, or dragged.

Rules:

- adapters are not public component props or product APIs;
- adapters belong to the owning foundation testing surface;
- component production code contains no matrix-only branches;
- semantic and disabled appearance uses the public component contract;
- when no accepted adapter can accurately represent the appearance, Playwright reaches the state with real input before capture;
- forced state proves appearance only.

A missing generic verification capability follows the foundation workflow. Do not add a family-local forced-state system.

### Themes and contexts

Use the accepted deterministic default theme.

Add another theme, surface, density, contrast, or container section only when:

- that context belongs to the current supported contract; and
- it changes component-owned visible output or a required foundation route.

Do not multiply matrices by hypothetical contexts. Foundation corrections use representative consumers.

## Visual regression

Every canonical `StateMatrix` has a Playwright visual test.

Preferred location for new and migrated families:

```text
tests/e2e/visual/material/<family>.spec.ts
```

The visual test:

1. opens the canonical story;
2. waits for fonts, icons, asynchronous rendering, and deterministic state setup;
3. screenshots the bounded matrix root or visibly labelled bounded sections;
4. uses stable Linux/Chromium baselines;
5. names snapshots by component and section;
6. contains no business or behavior assertions.

Prefer one complete bounded screenshot. Split into labelled sections only when the complete image would be unreadable. Do not create one snapshot per cell.

A screenshot baseline is a regression reference, not proof of Material correctness.

## Human visual review

Human comparison with named official sources is required when a PR:

- creates a component;
- creates the first complete matrix during migration;
- changes tokens, visible state routing, shape, color, elevation, typography, icon geometry, focus indicator, state layer, ripple, motion, or layout;
- intentionally updates a matrix baseline;
- changes an applicable foundation contract with rendered impact.

The PR reports:

```text
State matrix story: <story id>
State coverage: complete | incomplete (<gap>)
Automated visual baseline: passed | updated and inspected | not applicable (<reason>)
Human Material visual review: required | passed | blocked (<reason>)
```

An automated coding agent must never report human review as passed.

After acceptance, the family blueprint persists:

```text
Last accepted visual review: <PR/date>
Source snapshot: <documentation and Design Kit snapshot>
```

A relocation-only change with an unchanged accepted matrix and no screenshot diff does not require a new visual comparison.

## Storybook organization

A component story set normally contains:

- `Overview` or `Default`;
- `Variants`, `Configurations`, or `Sizes` only for supported axes;
- `StateMatrix`;
- focused browser-behavior fixtures;
- docs for usage, accessibility, tokens, unsupported surface, extensions, and deviations.

Do not retain separate `VisualStates` and `VisualInteractionStates` stories after migration when one labelled matrix can represent the visual contract clearly.

## Reuse and anti-overengineering

Reuse existing Storybook-only layout styles.

Do not create:

- a production `MDStateMatrix`;
- a runtime state registry;
- a generic component-test DSL;
- public test-only props, events, classes, or branches;
- one family-specific forced-state provider.

A shared Storybook fixture component or typed case helper may be introduced only after at least two migrated families demonstrate the same concrete need and the helper reduces total complexity without hiding rendered cases.

## Validation ownership

### Static/structured automation

Automation may verify:

- required test artifacts exist;
- exactly one `StateMatrix` export exists;
- stable root anchor and checkerboard class exist;
- visual spec opens the canonical story;
- snapshot organization is bounded rather than one-per-cell;
- coverage-table sections and visible labels are present structurally;
- behavior specs do not use forced-state providers;
- no test-only production API or family-local forced-state owner exists;
- risk registration and migration paths are consistent.

### Review blocking

Human/architect review confirms:

- the coverage table includes all distinct visible routes;
- grouped routes are truly visually equivalent;
- cells are readable and correctly labelled;
- official visual sources are sufficient;
- the baseline matches Material or an accepted deviation;
- test ownership is proportionate and does not duplicate framework/browser behavior.

Automation must not infer these semantic or visual conclusions from free-form Markdown or screenshots alone.

## Completion

Component verification is complete only when:

- the applicable test profile is recorded and implemented;
- contract tests cover the accepted public contract;
- browser tests cover real component-owned browser behavior;
- the matrix covers every distinct supported visual route;
- visual regression passes;
- required human visual review is passed or remains an explicit merge blocker;
- tests do not duplicate framework, browser, foundation, or product ownership;
- blueprint, stories, specs, snapshots, risk registration, consumers, and production code agree.
