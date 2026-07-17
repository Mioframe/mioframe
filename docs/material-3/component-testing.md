# Material component testing architecture

This document defines proportional proof for public components in the Mioframe Material library.

Tests must prove the contracts a component actually owns. A fixed artifact set is not a substitute for understanding semantics, behavior, visible output, and consumer impact.

## Principles

- Derive proof from the accepted family contract and current migration scope.
- Use the smallest set of layers that completely proves the supported surface.
- Keep visual appearance, browser behavior, pure logic, and consumer preservation in their owning test layers.
- Do not test unsupported optional capabilities.
- Do not duplicate framework, browser, foundation, or product behavior.
- Green automation does not prove that a baseline matches current Material 3 Expressive.

## Proof layers

| Layer | Use when | Purpose |
| --- | --- | --- |
| Component contract | Every new or migrated public component | Public API, native owner, ARIA, defaults, slots, emits, controlled state, invalid combinations, and structural wiring |
| Canonical visual story | The component has visible output | One stable, readable reference for the accepted visible contract |
| State matrix | More than one distinct component-owned visual route exists | Compare configurations, states, and simultaneous visible outcomes without a Cartesian product |
| Visual regression | A stable visual contract exists and regression would be material | Detect unintended changes in a bounded canonical visual reference |
| Browser behavior | The component constrains browser-owned interaction | Real focus, keyboard, pointer, touch, overlay, responsive, motion, cancellation, and cleanup behavior |
| Pure behavior | Extracted logic or lifecycle exists outside Vue rendering | Helpers, composables, transitions, timing, cancellation, and cleanup |
| Consumer preservation | Existing consumers or public imports change | Preserve product-visible usage and integration contracts |
| Agent evidence review | Every new or migrated family | Source-backed architecture, Material, accessibility, behavior, migration, and proof review |
| Operator visual acceptance | Visible output is created or intentionally changed | Compare prepared evidence with named official sources |

A layer may be omitted only because the component does not own that contract, not because the contract is difficult to test.

## Component contract tests

Use colocated Vue Test Utils tests for stable public contracts.

Cover applicable:

- canonical defaults and supported configuration;
- native element and DOM-critical attributes;
- ARIA, disabled, readonly, and accessible-name ownership;
- slots and fixed anatomy;
- emits and controlled-state behavior;
- invalid combinations and accepted normalization;
- component-to-foundation wiring that does not require browser rendering;
- public Mioframe extensions.

Do not use component tests to prove:

- computed visual appearance;
- layout or geometry;
- real focus-visible acquisition;
- pointer or touch behavior;
- ripple, overlay, or browser lifecycle;
- browser actionability.

Prefer named contract assertions over complete rendered-tree snapshots.

## Browser behavior tests

Use isolated Storybook stories and Playwright when the component changes or constrains browser-owned behavior.

Test through public inputs and real browser actions:

- native or custom keyboard activation and navigation;
- focus entry, movement, visibility, and restoration;
- pointer, touch, drag, gesture, capture, cancellation, and cleanup;
- expanded target-area hit testing;
- overlay, escape, outside interaction, and containment;
- responsive or container-dependent behavior;
- motion completion and reduced-motion behavior when contractual.

Forced visual state, direct Vue mutation, private methods, and synthetic internal events do not prove behavior.

A component with no browser-owned behavior may omit this layer with a concise ownership-based reason.

## Canonical visual evidence

Every visually rendered public component has one stable canonical visual reference.

Use:

- `StateMatrix` when the supported surface has multiple distinct component-owned visual routes;
- an ordinary bounded `Overview`, `Default`, or equivalent canonical story when one representative route is sufficient.

The family contract records the canonical story id and bounded root when visual proof applies.

### State matrix rule

A `StateMatrix` covers visible contracts, not every state name.

Include:

- every supported state that changes component-owned visible output;
- every distinct configuration route that changes visible ownership or values;
- every simultaneous-state combination with a distinct visible winner or coexistence result;
- every extension or deviation that changes visible output.

Do not build the full Cartesian product. Equivalent sizes, labels, icons, content, and configurations do not receive duplicate cells.

The matrix must use readable row, column, and section labels. The operator should understand each case without inspecting source code.

### Simple visual components

Do not manufacture a matrix for a component with one meaningful visual route. Use one bounded canonical story and screenshot when regression protection is useful.

## Deterministic transient appearance

Verification-only foundation adapters may represent generic hover, focus-visible, pressed, or dragged appearance.

They must:

- remain outside public product API;
- belong to the owning foundation testing surface;
- contain no family-specific token routing or precedence;
- prove appearance only.

Real acquisition, release, cancellation, and cleanup still require browser input when contractual.

## Visual regression

Add Playwright visual regression when a bounded stable reference provides material value.

The test:

1. opens the canonical story;
2. waits for deterministic fonts, icons, and asynchronous rendering;
3. screenshots the bounded component or labelled sections;
4. uses stable repository baselines;
5. contains no business or behavior assertions.

Prefer one bounded screenshot. Split only when readability requires it. Do not create one snapshot per matrix cell.

A baseline is a regression reference, not proof of Material correctness.

## Consumer preservation

When migration changes imports, API usage, wrappers, or product composition, add focused checks for affected consumers.

Do not require unrelated product suites merely because a shared component changed. Select representative checks from the actual blast radius.

## Agent evidence review

Before operator handoff, the coding agent confirms:

- official sources resolve the supported contract;
- component and foundation ownership is coherent;
- semantics, accessibility, state ownership, and lifecycle are correct;
- each distinct visible route is represented when applicable;
- test layers are proportionate and non-duplicative;
- changed consumers and obsolete paths are handled;
- no unresolved non-visual decision is hidden behind visual review.

The agent may mark this review `passed`. It must report `blocked` when required evidence or decisions remain unresolved.

## Operator visual acceptance

Operator comparison is required when a PR:

- creates a visible component;
- creates its first accepted canonical visual reference;
- intentionally changes visible tokens, state routing, shape, color, elevation, typography, icon geometry, focus, ripple, motion appearance, or layout;
- updates a visual baseline because the accepted visible contract changed;
- changes a foundation contract with rendered impact.

The agent prepares:

```text
Canonical visual story: <story id>
Visual coverage: complete | incomplete (<gap>)
Automated visual baseline: passed | updated and inspected | not applicable (<reason>)
Agent evidence review: passed | blocked (<reason>)
Official visual sources: <snapshot and Design Kit reference when required>
Expected deviations: none | <records>
Operator visual acceptance: required | accepted | rejected | blocked (<reason>)
```

The operator checks visible fidelity only. API, semantics, accessibility, source interpretation, ownership, migration completeness, and test sufficiency remain agent responsibilities.

An automated agent never reports operator acceptance as `accepted`.

## Automation policy

Use existing repository checks and test infrastructure.

Add a structural guard only after real migrations demonstrate a stable repeated need with a precise low-maintenance check. Do not require a new validator merely because a rule is documented.

Automation may verify deterministic facts such as an existing story id, public export, or prohibited test-only API. It must not infer semantic completeness or visual correctness from Markdown or screenshots.

## Anti-overengineering

Do not create:

- a production state-matrix component;
- a runtime state registry;
- a generic component-test DSL;
- public test-only props, events, or branches;
- a family-specific forced-state system;
- shared fixtures after only one family demonstrates a need.

Extract a shared fixture or helper only after multiple current families prove the same concrete contract and total complexity decreases.

## Completion

Component proof is complete when:

- applicable public contracts are covered at the correct layers;
- visible evidence is readable and proportional;
- browser behavior uses real input when required;
- changed consumers are preserved;
- agent evidence review passes;
- required operator visual acceptance is recorded;
- repository verification passes.