# Material component testing architecture

This document defines proportional proof for public components in the Mioframe Material library.

Tests prove contracts the component or changed foundation actually owns. They do not retest Vue, CSS, browser internals, or operator-perceived visual fidelity.

## Principles

- Derive proof from the accepted family contract and current change.
- Use the smallest set of layers that completely proves the implemented surface.
- Keep component contracts, browser behavior, pure logic, visual appearance, consumer preservation, independent audit, and operator review in their owning layers.
- Do not test unsupported optional capability as if it were implemented.
- Do not duplicate framework, browser, foundation, or product behavior.
- Green automation does not prove that an accepted baseline matches Material 3 Expressive.
- Green automation does not override a rejected `VISUAL_REVIEW.md`.

## Proof layers

| Layer                       | Use when                                                   | Purpose                                                                                                               |
| --------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Component contract          | Every new or migrated public component                     | API, native owner, ARIA, defaults, slots, emits, controlled state, invalid combinations, and static foundation wiring |
| Canonical visual story      | Visible output exists                                      | One stable reference for accepted appearance                                                                          |
| `StateMatrix`               | Multiple distinct component-owned visual routes exist      | Compare configurations, states, and simultaneous visible outcomes without a Cartesian product                         |
| Visual regression           | A stable visual contract has material regression risk      | Detect unintended changes against a bounded accepted baseline                                                         |
| Browser behavior            | The component changes or constrains browser-owned behavior | Focus, input, layout, overlay, scrolling, responsive, cancellation, or runtime lifecycle                              |
| Pure behavior               | Extracted logic or lifecycle exists                        | Helpers, composables, state transitions, timing, cancellation, and cleanup                                            |
| Consumer preservation       | Imports, wrappers, or product usage change                 | Preserve affected integration contracts                                                                               |
| Independent two-stage audit | Every new or migrated family                               | Compare implementation with project documentation, then project documentation with Material 3 Expressive              |
| Operator visual review      | Visible fidelity requires human comparison                 | Persist accepted/rejected/blocked visible evidence in `VISUAL_REVIEW.md`                                              |

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

- official documentation defines the canonical requirement;
- project documentation defines an accepted official-to-Web adaptation;
- a shared foundation/style owner implements and proves a cross-family runtime contract deeply once;
- the component owns correct consumption, property ownership, state routing, and family-specific behavior;
- independent audit checks implementation-to-project and project-to-Material alignment;
- the operator owns final perceptual comparison in `VISUAL_REVIEW.md`.

At shared foundation level, prove:

- canonical evidence and the documented adaptation;
- the real source-to-runtime dependency;
- timing/easing or runtime model;
- interruption and reduced-motion behavior;
- representative consumers.

At component level, use real input only to prove:

- the intended rendered property consumes the selected contract;
- one meaningful intermediate state when needed to establish the route;
- the correct endpoint;
- interruption or cancellation leaves no stale state;
- component-specific reduced-motion behavior when owned.

Do not require frame-by-frame component analysis, overshoot sampling, or duplicate equivalent pointer/touch/keyboard paths for ordinary CSS transitions.

Forced state proves transient appearance, not motion acquisition or trajectory.

Source review and focused tests may prove a technically honest route. They do not close a rejected visual result. A rejection remains current until production behavior changes and the operator replaces `VISUAL_REVIEW.md` after reviewing new evidence.

## Shared foundation proof

Changes to root/system tokens, universal selectors, pseudo-elements, shared formulas, theme roles, or public shared APIs require representative proof.

Representative proof must:

- identify current affected contract classes from current code;
- exercise the changed shared input through the final rendered output;
- include more than the family that motivated the global change when multiple families consume it;
- distinguish identical default output from actual override or state-route behavior.

Unchanged tests that never exercise the shared route are not representative proof.

A component-specific check alone cannot close a global blast-radius gap.

## Canonical visual evidence

Every visible public component has one stable canonical visual story.

Use:

- `StateMatrix` for multiple distinct component-owned visual routes;
- a bounded `Overview`, `Default`, or equivalent story when one representative route is sufficient.

A matrix includes distinct visible configurations, states, simultaneous-state winners/coexistence, and visible extensions or deviations. Do not build a full Cartesian product or duplicate equivalent sizes, labels, icons, and content.

The operator should understand the cases without reading source code.

## Deterministic transient appearance

A generic foundation testing adapter may represent hover, focus-visible, pressed, or dragged appearance.

It remains testing-only, family-agnostic, and proves appearance only. Real acquisition or cleanup requires browser input only when the component owns or changes that behavior.

## Visual regression

Add bounded Playwright screenshots when stable regression protection is valuable.

- Open the canonical story.
- Wait for deterministic fonts, icons, and asynchronous rendering.
- Screenshot the bounded component or labelled section.
- Use stable repository baselines.
- Keep behavior assertions elsewhere.

A baseline is regression evidence, not proof of Material correctness or operator acceptance.

## Consumer preservation

When migration changes imports, API usage, wrappers, or product composition, select focused checks from the actual blast radius. Do not require unrelated product suites merely because a shared component changed.

## Independent evidence review

Before operator handoff, `material-component-review` performs both comparisons and reads the current operator file when present.

### Stage 1 — implementation vs project documentation

Confirm:

- implementation matches the family README and directly applicable project contracts;
- semantics, accessibility, states, lifecycle, tokens, motion, and final property ownership behave as documented;
- exports, consumers, tests, stories, and verification claims are accurate;
- no unfinished, provisional, unverified, or undocumented behavior is hidden;
- proof layers establish only what the project documentation claims;
- README visible-status claims agree with `VISUAL_REVIEW.md`.

### Stage 2 — project documentation vs Material 3 Expressive

Confirm:

- official sources support the documented family scope and contract;
- canonical component, token, state, semantics, accessibility, and property meanings are interpreted correctly;
- unsupported official capability is documented accurately;
- project extensions and deviations are explicit and not presented as canonical Material;
- project documentation and canonical evidence use one consistent source record.

No technical or documentation decision may be hidden behind visual review.

## Operator visual review

Operator review creates or replaces:

```text
src/shared/ui/material/components/<official-docs-slug>/VISUAL_REVIEW.md
```

It records:

```text
Reviewed: <date>
Status: accepted | rejected | blocked
Evidence reviewed:
Findings:
Required correction:
```

The operator evaluates visible fidelity. API, semantics, accessibility, source interpretation, ownership, migration, test sufficiency, and project-documentation correctness remain reviewer responsibilities.

Authoring and reviewing agents never edit this file. A rejected result remains authoritative until the operator reviews new evidence and replaces it.

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

Proof is complete when applicable contracts are covered at the correct layers, the two-stage audit passes or records exact remaining work, visible evidence is readable and proportional, browser behavior is tested only where owned, changed consumers are preserved, required operator acceptance is recorded in `VISUAL_REVIEW.md`, and applicable local verification passes.
