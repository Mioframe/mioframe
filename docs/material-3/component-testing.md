# Material component testing architecture

This document defines the mandatory testing contract for new, migrated, and materially changed public components in the Mioframe Material library.

The goal is consistent proof across component families without duplicating browser, Vue, or foundation internals. Every component follows the same test layers, while each layer covers only behavior owned by that component.

## Required test profile

Every new or migrated public Material component records this profile in its family README:

| Layer                   | Required artifact                                 | Purpose                                                                                                                                |
| ----------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture validation | verify-managed static checks                      | Location, dependency direction, profile, tokens, layers, state-matrix coverage, and registry consistency.                              |
| Component contract      | colocated `<Component>.test.ts`                   | Public props, emits, slots, native owner, ARIA, defaults, invalid combinations, and structural wiring that does not require a browser. |
| State matrix            | Storybook `StateMatrix` story                     | Human-readable visual reference containing every supported visual state and every distinct state-rendering route.                      |
| Visual regression       | Playwright screenshot of the state matrix         | Detect unintended rendered changes and provide a stable diff for human review.                                                         |
| Browser behavior        | focused Storybook Playwright spec when applicable | Real focus, keyboard, pointer, touch, drag, overlay, responsive, and browser-dependent behavior owned by the component.                |
| Pure behavior           | focused Vitest tests when applicable              | Extracted pure helpers, composables, state transitions, timing decisions, or cleanup logic.                                            |

A layer is not replaced by another layer. In particular:

- a screenshot does not prove semantics or interaction behavior;
- a Vue component test does not prove browser layout, focus, pointer, or visual output;
- a forced visual state does not prove that real user input reaches that state;
- green automated checks do not prove that a baseline visually matches Material guidance.

## Source of test cases

Test cases derive from the accepted family blueprint, not from implementation details.

The minimum source set is:

1. supported Material surface;
2. public API and native semantics;
3. semantic states;
4. interaction states;
5. rendered-property matrix;
6. foundation dependency table;
7. documented extensions and deviations;
8. existing consumer contracts affected by the change.

Do not create tests for unsupported optional Material capabilities. Do not omit a reachable supported state merely because it is difficult to display or automate.

## Component contract tests

Use `@vue/test-utils` for the colocated `<Component>.test.ts` file.

Cover applicable stable contracts:

- canonical defaults;
- public configuration props;
- supported semantic-state props;
- native element selection;
- explicit `href`, `type`, `disabled`, `tabindex`, `role`, and `aria-*` ownership;
- slots and fixed anatomy;
- emits and controlled-state behavior;
- invalid combinations and normalization explicitly accepted by the blueprint;
- component-to-foundation wiring that can be asserted without browser rendering;
- public project extensions.

Do not assert CSS appearance, layout, computed style, focus-visible behavior, pointer state, ripple, overlay lifecycle, or browser actionability in component contract tests.

Prefer contract assertions over internal DOM snapshots. Do not snapshot the complete Vue-rendered tree as a substitute for named expectations.

## Browser behavior tests

Use isolated Storybook stories and Playwright under `tests/e2e/storybook` for behavior requiring a browser.

Test only behavior owned by the component:

- real keyboard activation and navigation;
- real focus entry, movement, visibility, and restoration;
- pointer, touch, drag, and gesture behavior;
- expanded target areas and actual hit testing;
- overlay, teleport, escape/back, outside-interaction, and containment behavior;
- responsive or container-dependent component behavior;
- actual DOM property owners when browser rendering is required;
- motion completion or reduced-motion behavior when it is part of the component contract.

Drive the component through public inputs and real browser actions. Do not use forced visual-state providers, synthetic internal events, component methods, Vue internals, or direct state mutation to prove behavior.

A component with no browser-owned behavior may record `Browser behavior: not applicable` with the reason. Native behavior still requires a focused check when the component changes or constrains it.

## State matrix story

Every new or migrated public Material component has exactly one canonical Storybook export named `StateMatrix`.

Its purpose is:

- manual inspection of the complete supported visual state surface;
- initial comparison with official Material guidance;
- review of intentional visual changes;
- one deterministic visual-regression entry point.

The story may be implemented inline in `<Component>.stories.ts` or extracted to `<Component>StateMatrixStory.vue` when the template would otherwise obscure the component stories. Extraction is a Storybook fixture decision, not a production abstraction.

### Story identity

Use:

```text
Story export: StateMatrix
Root anchor: data-testid="visual-<component-kebab>-state-matrix"
Outer class: visual-checker-backdrop
```

Keep the story id and root anchor stable after acceptance. Update the visual spec and snapshots atomically when a rename is unavoidable.

### Matrix axes

The matrix is exhaustive by supported visual state, not by every possible content/configuration combination.

Columns normally represent interaction or terminal states:

- resting/default;
- hover, when supported;
- focus-visible, when supported;
- pressed, when supported;
- dragged, when supported;
- disabled, when supported;
- other component-owned interaction states such as loading/open when they produce a distinct visual result.

Rows normally represent the minimum cases needed to cover distinct visual routes:

- configuration variants whose state tokens or rendered properties differ;
- semantic states such as selected/unselected, checked/unchecked, error/normal, expanded/collapsed;
- anatomy modes that change state output;
- shape or elevation modes when state resolution differs;
- documented project extensions with a distinct visual state contract.

Sizes, labels, icon choices, and content lengths do not receive separate matrix rows unless they change state routing, state geometry, or an actual property owner. Cover ordinary geometry/configuration breadth in separate `Variants`, `Sizes`, or `Configurations` stories.

### Completeness rule

The state matrix must cover:

1. every supported semantic state;
2. every supported interaction state;
3. every disabled or unavailable state;
4. every distinct state route in the rendered-property matrix;
5. every simultaneous state combination with a distinct winner or coexistence result;
6. every documented extension or deviation that changes visual state output.

Do not build the full Cartesian product. Two cells may represent multiple equivalent routes only when the family blueprint proves that the same properties, owners, sources, winner rules, and foundation bridges apply.

The family README records a concise `State matrix coverage` table mapping each supported state route or grouped equivalent route to its visible matrix row and column. `Readiness: ready` is invalid when a supported visual route has no matrix cell.

### Human-readable layout

A reviewer must be able to understand every cell without reading source code.

Required:

- visible column headings;
- visible row headings;
- a visible section heading when one component requires multiple bounded matrices;
- consistent cell dimensions and alignment;
- fixture-only labels outside the production component when its own visible content does not identify the case;
- identical representative content across cells unless content/anatomy is the tested axis.

Do not rely only on tooltips, accessible names, test IDs, CSS classes, source order, or Storybook controls to identify cases.

Fixture labels must not change the component's internal layout or obscure focus indicators, state layers, elevation, outlines, or target areas.

### Deterministic visual states

The matrix may use accepted verification-only foundation adapters to render hover, focus, pressed, dragged, or other transient states deterministically.

Rules:

- verification adapters are not public component props or product APIs;
- adapters belong to the owning foundation testing surface, not to each component family;
- component code must not contain branches that exist only for the matrix;
- semantic and disabled states use the real public component contract;
- when a visual state cannot be represented accurately by an accepted adapter, the Playwright visual setup reaches it with real browser input before capture;
- forced states prove appearance only; separate browser tests prove acquisition and release behavior.

Missing generic verification capability is classified through the foundation workflow. Do not add family-local forced-state systems.

### Themes and contexts

The canonical state matrix uses the accepted default deterministic theme context.

Add another theme, surface, contrast, density, or container-context section only when:

- the component supports that context as part of its current contract; and
- the context changes component-owned visual output or a required foundation route.

Do not multiply every matrix by hypothetical themes or contexts. A foundation correction affecting all components uses representative consumers according to foundation verification rules.

## Visual regression test

Every canonical `StateMatrix` story has a Playwright visual test under the Material visual suite.

For new and migrated families, prefer:

```text
tests/e2e/visual/material/<family>.spec.ts
```

Legacy visual specs may remain in their current location until that family migrates.

The visual test:

1. opens the canonical `StateMatrix` story;
2. waits for fonts, icons, async rendering, and deterministic state setup;
3. screenshots the bounded matrix root or bounded sections;
4. uses stable Linux/Chromium baselines;
5. names snapshots by component and matrix section;
6. contains no business or interaction assertions.

Prefer one screenshot for the complete bounded matrix. When the complete story would produce an unreadably large image, keep one `StateMatrix` story but screenshot its visibly labelled bounded sections separately. Do not create one snapshot per cell.

The screenshot baseline is a regression reference, not proof of Material correctness. Initial baselines and intentional updates require human inspection against the checked official Material sources.

## Manual visual review gate

Human review of the state matrix is required when a PR:

- creates a new component;
- migrates a component without an accepted complete state matrix;
- changes component tokens, state routing, shape, color, elevation, typography, icon geometry, focus indicator, state layer, ripple, motion, or layout;
- intentionally updates a state-matrix baseline;
- changes an applicable foundation contract that affects the component's rendered output.

The PR verification report records:

```text
State matrix story: <story id>
State coverage: complete | incomplete (<gap>)
Automated visual baseline: passed | updated and inspected | not applicable (<reason>)
Human Material visual review: required | passed | blocked (<reason>)
```

A coding agent may create the matrix and automated evidence, but must not claim that a human reviewed visual correctness. Until a human reviewer approves the relevant matrix or diff, report `Human Material visual review: required`.

A relocation-only change with an unchanged accepted matrix and no screenshot diff may record that no new manual visual comparison is required.

## Storybook organization

A component's canonical story set should normally contain:

- `Overview` or `Default`;
- `Variants`/`Configurations`/`Sizes` only for supported axes;
- `StateMatrix`;
- focused behavior fixtures that browser tests need;
- usage, accessibility, tokens, unsupported surface, and deviations in docs.

Do not create separate `VisualStates` and `VisualInteractionStates` stories for new or migrated components when one labelled `StateMatrix` can represent the complete supported state surface. Legacy stories may remain until family migration, then consolidate them unless a bounded section must remain separate for readability or browser setup.

## Consistency and reuse

Use shared Storybook-only layout styles for matrix rows, columns, headings, cells, and checkerboard backdrop.

Do not create a production `MDStateMatrix` component, generic component-test DSL, runtime state registry, or component API only to standardize fixtures.

A shared Storybook fixture component or typed case helper may be introduced only after at least two migrated component families demonstrate the same concrete need and the helper reduces total fixture complexity without hiding the rendered cases.

## Validation

Verify-managed checks should identify:

- a new or migrated component without a colocated contract test;
- a new or migrated component without exactly one `StateMatrix` export;
- a state matrix without the canonical root anchor and checkerboard backdrop;
- a supported state or distinct state route missing from README matrix coverage;
- a matrix cell that cannot be identified from visible headings/labels;
- family-local forced-state infrastructure;
- visual state assertions implemented in Vitest or Vue Test Utils;
- browser behavior proved only through forced visual state;
- a state-matrix story without a visual Playwright assertion;
- a baseline update without recorded inspection;
- a claim of human review made by an automated agent;
- test files or risk registries not updated during family migration.

## Completion

Component verification is complete only when:

- the required test profile is recorded and all applicable layers exist;
- contract tests cover the accepted public contract;
- browser tests cover component-owned browser behavior;
- the state matrix covers every supported visual state route;
- the state-matrix visual regression passes;
- visual changes are available for human inspection;
- required human Material visual review is passed or explicitly remains a merge blocker;
- tests do not duplicate framework, browser, or foundation behavior outside component ownership;
- family README, stories, test files, risk registration, snapshots, and production code agree.
