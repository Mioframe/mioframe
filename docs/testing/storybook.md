# Storybook architecture

This document defines the durable Storybook ownership and file-placement rules for Mioframe. `docs/testing/architecture.md` remains the canonical policy for proof types and execution lanes.

## Goal

Make Storybook work mechanically with FSD ownership so a coding agent can find a component, its documented states, and every component-owned proof without searching a mirrored central test tree or inventing a new structure.

## Architecture decision

Storybook is not an application layer and does not own product behavior. It is the isolated rendering surface for:

- documented UI states;
- deterministic browser fixtures;
- visual-regression inputs.

The FSD module that owns the rendered UI also owns its stories and component-specific browser and visual specs.

## File ownership

Use sibling files next to the current UI owner. Do not restructure a module only to create this shape.

```text
<Component>.vue
<Component>.test.ts
<Component>.stories.ts
<Component>.browser.spec.ts       # optional
<Component>.visual.spec.ts        # optional
<Component>BrowserFixture.vue     # rare, optional
```

Ownership is determined by the current FSD module:

- `shared`: reusable low-level UI and foundations;
- `entities`: small entity UI;
- `features`: user-action UI and feature states;
- `widgets`: product-block composition;
- `pages`: route or pane composition.

Cross-owner product scenarios remain under `tests/e2e`. Storybook infrastructure smoke may remain under the central Storybook test infrastructure because it has no component owner.

Do not export stories, fixtures, test helpers, specs, or snapshots through production `index.ts` files.

## Proof decision table

| Contract | Primary owner |
| --- | --- |
| Props, emits, slots, native owner, explicit attributes, ARIA ownership, controlled state, and non-browser wiring | `<Component>.test.ts` |
| Isolated supported rendering state | `<Component>.stories.ts` |
| Real focus, keyboard, pointer/touch, drag, geometry, scrolling, overlays, responsive behavior, motion lifecycle, or browser APIs | `<Component>.browser.spec.ts` |
| Bounded accepted appearance | `<Component>.visual.spec.ts` against a story tagged `visual` |
| Complete scenario crossing FSD, service, worker, persistence, navigation, provider, permission, or reload boundaries | `tests/e2e/*.spec.ts` |

One contract has one primary proof owner. Do not duplicate the complete contract in another lane.

## Stories

A story prepares one deterministic initial rendering state. It may use local fixture state required to operate the public component contract.

A story must not:

- contain assertions;
- perform the behavior under test;
- use `play` as merge proof;
- connect product stores, persistence, services, workers, diagnostics, network, accounts, or app bootstrap;
- reproduce business rules;
- change the production public API for test convenience.

Do not create a story for every Vue file. Create one when the UI has a meaningful isolated state, public reusable contract, browser fixture need, or visual-review value.

### Story classes

Use only these roles:

- catalog story: a supported state or configuration for development and documentation;
- visual story: a canonical bounded story tagged `visual` and referenced by a colocated visual spec;
- browser fixture: deterministic initial state used by a colocated browser spec.

A browser fixture prepares state only. The browser spec performs real public input and assertions.

## Browser specs

Use `<Component>.browser.spec.ts` only when the browser owns semantics that Vitest cannot faithfully model.

Browser specs:

- use real public input;
- contain no screenshots;
- assert component-owned browser outcomes only;
- do not expand into a complete product scenario;
- use a sibling story or fixture as the initial surface;
- fail when required preconditions or outcomes are absent.

Split a broad family spec when independent components have separate owners or contracts. Keep a family-level spec only when the family itself owns one shared observable browser contract.

## Visual specs

Use `<Component>.visual.spec.ts` for explicit local ownership and reviewability. A small repeated open-stabilize-screenshot sequence is preferable to a hidden generic runner that introduces story-id orchestration or obscures baseline ownership.

Visual specs:

- open only named canonical stories;
- stabilize rendering through shared mechanical helpers;
- capture bounded screenshots;
- contain no click, keyboard, pointer, focus, navigation, semantic, token-table, or geometry success criteria;
- keep snapshots owned by the colocated spec through the repository snapshot convention.

Do not snapshot every story or every Cartesian combination of props.

## Storybook hierarchy

File placement follows FSD ownership. Storybook titles follow one deterministic catalogue hierarchy.

Material library:

```text
Material 3/Components/<Family>/<Component>
Material 3/Patterns/<Pattern>
```

Other UI:

```text
Shared/<Slice>/<Component>
Entities/<Slice>/<Component>
Features/<Slice>/<Component>
Widgets/<Slice>/<Component>
Pages/<Slice>/<Component>
```

Do not introduce `Project UI` or another arbitrary top-level namespace. A title may omit redundant path segments, but must not hide or contradict the owning FSD layer and slice.

## Verification impact

Storybook behavior and visual lanes remain independent.

The target resolver model is:

1. a changed colocated spec selects itself;
2. a changed component, sibling story, or owned fixture selects its matching colocated specs by repository naming convention;
3. a deleted or renamed spec or unresolved baseline uses full owning-lane fallback;
4. cross-cutting foundations, shared helpers, Storybook configuration, fonts, icons, theme, and renderer infrastructure use explicit mappings or full-lane fallback;
5. an unmapped relevant path never silently skips proof.

Do not place spec paths in source-prefix mappings. Local convention owns local relations; explicit mappings exist only where colocation cannot truthfully express cross-cutting impact.

## TypeScript and discovery

Production application type-checking must exclude Storybook stories and colocated Playwright specs. Storybook and Playwright checks must include their own files through dedicated configuration.

Playwright discovery must use explicit `testMatch` patterns for colocated `*.browser.spec.ts` and `*.visual.spec.ts` files plus the small central infrastructure specs. Do not rely on a mirrored test directory as ownership metadata.

## Shared helpers

Keep story and test setup local by default. Add a shared helper only after multiple unrelated owners need the same mechanical operation and extraction reduces total complexity.

Shared helpers may open a story, stabilize fonts/rendering, select a bounded surface, or provide strict semantic actions. They must not decide component behavior or silently recover from missing state.

## Forbidden

- central component-spec trees that mirror `src`;
- component browser or visual specs separated from their owner without a concrete cross-owner reason;
- assertions or interaction scripts in stories;
- screenshots in browser-behavior specs;
- browser behavior, computed token matrices, or geometry assertions in visual specs;
- Storybook `play` functions as a parallel merge-proof system;
- production runtime dependencies in stories;
- test-only exports from production barrels;
- a generic Storybook test DSL, registry, or runner without repeated demonstrated need;
- a new taxonomy chosen independently for each story;
- moving application behavior into Storybook fixtures.

## Migration

Migrate incrementally without reducing current coverage:

1. establish discovery and TypeScript support for colocated Playwright specs;
2. migrate Storybook behavior specs to their actual FSD owners and split mixed-owner suites;
3. migrate visual specs and baselines to their actual owners;
4. move behavior and computed-style assertions out of visual specs to the correct proof owners;
5. simplify impact mappings to local convention plus explicit cross-cutting mappings;
6. normalize story titles and remove obsolete duplicate fixtures;
7. update agent skills and concise `AGENTS.md` rules;
8. run complete owning lanes before removing legacy paths or fallbacks.

Every intermediate commit and the final PR must preserve valid commands, discoverability, baseline ownership, and existing regression protection.
