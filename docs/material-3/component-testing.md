# Material component testing architecture

This document defines proportional proof for public components in the Mioframe Material library.

Tests prove contracts the component or changed foundation actually owns. They do not retest Vue, CSS, or browser internals.

## Principles

- Derive proof from the accepted family contract and current change.
- Use the smallest set of layers that completely proves the supported surface.
- Keep component contracts, browser behavior, pure logic, visual appearance, and consumer preservation in their owning layers.
- Do not test unsupported optional capability.
- Do not duplicate framework, browser, foundation, or product behavior.
- Green automation does not prove that an accepted baseline matches Material 3 Expressive.

## Proof layers

| Layer | Use when | Purpose |
| --- | --- | --- |
| Component contract | Every new or migrated public component | API, native owner, ARIA, defaults, slots, emits, controlled state, invalid combinations, and static foundation wiring |
| Canonical visual story | Visible output exists | One stable reference for accepted appearance |
| `StateMatrix` | Multiple distinct component-owned visual routes exist | Compare configurations, states, and simultaneous visible outcomes without a Cartesian product |
| Visual regression | A stable visual contract has material regression risk | Detect unintended changes against a bounded accepted baseline |
| Browser behavior | The component changes or constrains browser-owned behavior | Focus, input, layout, overlay, scrolling, responsive, cancellation, or runtime lifecycle |
| Pure behavior | Extracted logic or lifecycle exists | Helpers, composables, state transitions, timing, cancellation, and cleanup |
| Consumer preservation | Imports, wrappers, or product usage change | Preserve affected integration contracts |
| Agent review | Every new or migrated family | Source-backed architecture, Material, accessibility, migration, and proof review |
| Operator visual acceptance | Visible output is created or intentionally changed | Compare prepared evidence with named official sources |

A layer may be omitted because the component does not own that contract. Difficulty alone is not a reason to omit an owned contract.

## Component contract tests

Use colocated Vue Test Utils tests for applicable:

- defaults and supported configuration;
- native element and DOM-critical attributes;
- ARIA, disabled, readonly, and accessible-name ownership;
- slots and fixed anatomy;
- emits and controlled state;
- invalid combinations and accepted normalization;
- non-browser component-to-foundation wiring;
- public Mioframe extensions.

Do not use component tests for computed appearance, layout, real focus-visible, pointer/touch behavior, ripple, overlay lifecycle, or browser actionability.

Prefer named contract assertions over complete rendered-tree snapshots.

## Browser behavior tests

Use isolated Storybook Playwright tests only when correctness depends on behavior the component changes or constrains:

- custom keyboard activation or navigation;
- focus entry, movement, visibility, or restoration;
- pointer/touch acquisition, target hit testing, gesture, capture, or cancellation;
- overlay, escape, outside interaction, or containment;
- scrolling, layout, measurement, responsive, or container-dependent behavior;
- JavaScript/WAAPI lifecycle;
- final computed CSS propagation that source and contract tests cannot establish reliably.

Use public input and assert public outcomes. Forced state, direct Vue mutation, private methods, and synthetic internal events do not prove browser behavior.

A component with no browser-owned behavior may omit this layer with a concise reason.

## Motion proof boundary

Motion is split by ownership:

- official documentation defines the required motion contract;
- a shared foundation owns any official-to-Web adaptation and its focused proof;
- the component owns correct consumption, actual property ownership, state routing, and family-specific behavior;
- the operator owns final perceptual comparison.

For ordinary CSS motion, source review and focused contract tests are sufficient when they prove the accepted foundation route and no conflicting local transition exists.

Do not test browser interpolation frames, overshoot, or equivalent input paths merely to confirm a correctly configured CSS transition.

Use browser tests for motion only when the component owns custom acquisition/cancellation, JavaScript/WAAPI lifecycle, reduced-motion behavior beyond foundation wiring, uncertain computed propagation, or a reproducible runtime defect.

## Canonical visual evidence

Every visible public component has one stable canonical visual story.

Use:

- `StateMatrix` for multiple distinct component-owned visual routes;
- a bounded `Overview`, `Default`, or equivalent story when one representative route is sufficient.

A matrix includes distinct visible configurations, states, simultaneous-state winners/coexistence, and visible extensions or deviations. Do not build a full Cartesian product or duplicate equivalent sizes, labels, icons, and content.

The operator should understand the cases without reading source code.

## Deterministic transient appearance

A generic foundation testing adapter may represent hover, focus-visible, pressed, or dragged appearance.

It must remain testing-only, family-agnostic, and prove appearance only. Real acquisition or cleanup requires browser input only when the component owns or changes that behavior.

## Visual regression

Add bounded Playwright screenshots when stable regression protection is valuable.

- Open the canonical story.
- Wait for deterministic fonts, icons, and asynchronous rendering.
- Screenshot the bounded component or labelled section.
- Use stable repository baselines.
- Keep behavior assertions elsewhere.

Prefer one readable screenshot. A baseline is regression evidence, not proof of Material correctness.

## Consumer preservation

When migration changes imports, API usage, wrappers, or product composition, select focused checks from the actual blast radius. Do not require unrelated product suites merely because a shared component changed.

## Agent evidence review

Before operator handoff, confirm:

- official sources resolve the supported contract;
- component and foundation ownership is coherent;
- semantics, accessibility, states, lifecycle, tokens, and final property ownership are correct;
- each distinct visible route is represented when applicable;
- proof layers are proportional and non-duplicative;
- changed consumers and obsolete paths are handled;
- no technical decision is hidden behind visual review.

## Operator visual acceptance

Operator comparison is required when a PR creates a visible component or intentionally changes visible tokens, shape, color, elevation, typography, icon geometry, focus, ripple, motion appearance, layout, or a rendered foundation contract.

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

The operator checks visible fidelity. API, semantics, accessibility, source interpretation, ownership, migration, and test sufficiency remain agent responsibilities. An automated agent never reports operator acceptance as `accepted`.

## Automation and anti-overengineering

Use existing repository checks. Add a structural guard only after real migrations prove a stable repeated need with a precise low-maintenance check.

Do not create:

- a production state-matrix component;
- runtime state or token registries;
- a generic component-test DSL;
- public test-only API;
- a family-specific forced-state system;
- shared fixtures before multiple current families prove the need;
- frame-level motion infrastructure for ordinary CSS transitions.

## Completion

Proof is complete when applicable contracts are covered at the correct layers, visible evidence is readable and proportional, browser behavior is tested only where owned, changed consumers are preserved, agent review passes, required operator acceptance is recorded, and repository verification passes.