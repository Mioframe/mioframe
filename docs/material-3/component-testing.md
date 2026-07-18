# Material component testing architecture

This document defines proportional proof for public components in the Mioframe Material library.

Tests prove contracts the component or changed foundation actually owns. They do not retest Vue, CSS, browser internals, or optional documentation wording.

## Principles

- Derive proof from the truthful family contract and current change.
- Use the smallest set of layers that completely proves the implemented surface.
- Keep component contracts, browser behavior, pure logic, visual appearance, shared foundations, and consumer preservation in their owning layers.
- Test implemented capability and owned rejection/normalization behavior.
- Do not create tests that imply unimplemented capability exists.
- Do not treat officially invalid combinations as missing capability.
- Do not inflate optional or non-normative guidance into required test coverage.
- Green automation does not prove Material correctness or operator visual acceptance.

## Proof layers

| Layer                       | Use when                                                   | Purpose                                                                                                               |
| --------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Component contract          | Every new or migrated public component                     | API, native owner, ARIA, defaults, slots, emits, controlled state, invalid combinations, and static foundation wiring |
| Canonical visual story      | Visible output exists                                      | One stable reference for intended appearance                                                                          |
| `StateMatrix`               | Multiple distinct component-owned visual routes exist      | Compare configurations, states, and simultaneous visible outcomes without a Cartesian product                         |
| Visual regression           | A stable visual contract has material regression risk      | Detect unintended changes against a bounded accepted baseline                                                         |
| Browser behavior            | The component changes or constrains browser-owned behavior | Focus, input, layout, overlay, scrolling, responsive, cancellation, or runtime lifecycle                              |
| Pure behavior               | Extracted logic or lifecycle exists                        | Helpers, composables, state transitions, timing, cancellation, and cleanup                                            |
| Consumer preservation       | Imports, wrappers, or product usage change                 | Preserve affected integration contracts                                                                               |
| Shared foundation proof     | A real cross-family route changes                          | Prove the shared owner and representative consumers actually consume the changed route                                |
| Independent two-stage audit | Every new or migrated family                               | Compare implementation with project documentation, then project documentation with Material 3 Expressive              |
| Operator visual acceptance  | Visible output is created or intentionally changed         | Compare prepared evidence with named official sources                                                                 |

A layer may be omitted because the component does not own that contract. Difficulty alone is not a reason to omit an owned contract.

## Component contract tests

Use colocated Vue Test Utils tests for applicable:

- defaults and supported configuration;
- native element and DOM-critical attributes;
- ARIA, disabled, readonly, and accessible-name ownership;
- slots and fixed anatomy;
- emits and controlled state;
- invalid combinations and owned normalization/rejection;
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
- final computed CSS propagation that source and contract tests cannot establish reliably;
- a reproducible runtime defect.

Use public input and assert public outcomes. Forced state, direct Vue mutation, private methods, and synthetic internal events do not prove browser behavior.

A component with no browser-owned behavior may omit this layer with a concise reason.

## Motion proof boundary

Motion is split by ownership:

- official documentation defines the canonical requirement;
- project documentation defines an accepted official-to-Web adaptation;
- a shared foundation/style owner implements and proves a cross-family runtime contract deeply once;
- the component owns correct consumption, property ownership, state routing, and family-specific behavior;
- independent audit checks implementation-to-project and project-to-Material alignment;
- the operator owns final perceptual comparison.

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

Source review and focused tests may prove a technically honest route. They do not close a known operator-rejected perceived motion defect. That defect remains open until production behavior changes and new visual evidence is accepted.

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

A baseline is regression evidence, not proof of Material correctness or acceptance.

## Consumer preservation

When migration changes imports, API usage, wrappers, or product composition, select focused checks from the actual blast radius. Do not require unrelated product suites merely because a shared component changed.

## Independent evidence review

Before operator handoff, `material-component-review` performs both comparisons.

### Stage 1 — implementation vs project documentation

Confirm:

- implementation matches README and applicable project contracts;
- semantics, accessibility, states, lifecycle, tokens, motion, and final property ownership behave as documented;
- exports, consumers, tests, stories, and verification claims are accurate;
- no unfinished, provisional, unverified, shared-proof, source, or visual issue is hidden;
- proof layers establish only what documentation claims;
- actual absent capability, invalid combinations, and optional guidance are classified separately.

### Stage 2 — project documentation vs Material 3 Expressive

Confirm:

- official sources and source status support the documented family scope and inventory claim;
- canonical component, token, state, semantics, accessibility, and property meanings are interpreted correctly;
- actual unsupported capability is documented as not implemented;
- invalid combinations are not mislabeled as missing capability;
- optional guidance is not inflated into required capability;
- project extensions and deviations are explicit;
- source records are consistent and honest about freshness and coverage.

No technical or documentation decision may be hidden behind visual review.

## Operator visual acceptance

Operator comparison is required when a change creates or intentionally changes visible tokens, shape, color, elevation, typography, icon geometry, focus, ripple, motion appearance, layout, or a rendered shared contract.

Use:

```text
Canonical visual story: <story id>
Visual coverage: complete | incomplete (<gap>)
Automated visual baseline: passed | updated and inspected | not applicable (<reason>)
Stage 1 audit: passed | findings | blocked
Stage 2 audit: passed | findings | blocked
Official visual sources: <source status, snapshot, and Design Kit reference when required>
Expected extensions/deviations: none | <records>
Operator visual acceptance: required | accepted | rejected | blocked (<reason>)
```

The operator checks visible fidelity. API, semantics, accessibility, source interpretation, ownership, migration, test sufficiency, and documentation correctness remain reviewer responsibilities.

An automated agent never invents `accepted`.

A recorded `rejected` status persists until production behavior changes and the operator accepts replacement evidence.

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

Proof is complete when applicable contracts are covered at the correct layers, shared routes have representative proof, source status is honest, the two-stage audit passes or records exact remaining work, visible evidence is readable and proportional, browser behavior is tested only where owned, changed consumers are preserved, required operator acceptance is recorded, and applicable local verification passes.
