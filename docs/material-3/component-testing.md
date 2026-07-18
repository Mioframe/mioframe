# Material component testing architecture

This document defines proportional proof for public components in the Mioframe Material library.

Tests prove contracts the component or changed foundation actually owns. They do not retest Vue, CSS, browser internals, or subjective operator perception. They must still prove objective anatomy, geometry, ownership, and visible endpoints before operator handoff.

## Principles

- Derive proof from the official family contract, project rules, and current change.
- Use the smallest set of layers that completely proves the implemented surface.
- Keep component contracts, browser behavior, pure logic, visual regression, independent review, and operator review in their owning layers.
- Green automation does not prove that a baseline matches Material 3 Expressive.
- Green automation does not override rejected operator feedback.
- A test proves a named risk only when its setup enters that risk.
- Numeric equality on the wrong DOM owner is not conformance proof.
- Objective structural defects are agent-owned, not operator-owned.

## Proof layers

| Layer | Use when | Purpose |
| --- | --- | --- |
| Component contract | Every new or migrated public component | API, native owner, ARIA, defaults, slots, emits, controlled state, invalid combinations, and structural wiring |
| Canonical visual story | Visible output exists | Stable readable surface using real production anatomy |
| `StateMatrix` | Multiple distinct visible routes exist | Compare configurations, states, winners, and coexistence |
| Visual regression | Stable visual contract has regression risk | Detect unintended changes against a bounded baseline |
| Browser behavior | Correctness depends on browser behavior or layout | Focus, input, hit testing, layout, clipping, measurement, cancellation, or runtime lifecycle |
| Pure behavior | Extracted logic or lifecycle exists | Helpers, composables, timing, cancellation, and cleanup |
| Consumer preservation | Imports, wrappers, or usage change | Preserve affected integration contracts |
| Independent review | Every new or migrated family | Compare implementation with project documentation, then documentation with Material |
| Operator review | Final perceived fidelity remains | Explicit acceptance or concrete feedback in a user message |

Difficulty alone is not a reason to omit an owned contract.

## Proof causality

A test name, comment, timeout, or endpoint assertion does not establish that the named condition occurred.

To claim interruption, cancellation, replacement, fallback, or recovery proof:

1. establish the initial active state;
2. trigger the competing event before it settles;
3. prove the competing branch began;
4. prove the final public outcome and absence of stale state.

Waiting for the first endpoint proves sequential behavior, not interruption. Forced state proves appearance, not acquisition, trajectory, interruption, or cleanup.

## Component contract tests

Use colocated Vue Test Utils tests for applicable:

- defaults and supported configuration;
- native element and DOM-critical attributes;
- ARIA, disabled, readonly, and accessible-name ownership;
- slots and fixed anatomy;
- emits and controlled state;
- invalid combinations and normalization;
- non-browser foundation wiring;
- public Mioframe extensions.

Component tests may verify that required structural elements exist and have the intended semantic role. They do not prove computed layout, hit regions, clipping, focus-visible, ripple, or visual shape.

Prefer named contract assertions over complete rendered-tree snapshots.

## Mandatory geometry proof

When a visible interactive component has distinct or non-obvious geometry, browser proof must identify and compare the concrete bounds of:

```text
semantic host
layout footprint
interaction bounds
visual container
content bounds
state-layer bounds
ripple render and clip bounds
focus-indicator bounds
outline/elevation/shape owner
```

Prove applicable relations:

- the intended target is one coherent rectangular region;
- layout reserves the required interaction space;
- the interaction target does not overlap adjacent controls;
- the visual container has the official size and position within the layout target;
- state layer and ripple are clipped to the intended visual container;
- focus indication follows the intended visible target;
- content remains centered/aligned and unclipped;
- background, outline, elevation, shape, and motion are applied to the correct owner.

For custom or expanded targets, test representative:

- center;
- each relevant edge;
- at least one corner;
- boundary with an adjacent control;
- points outside the intended target.

A test clicking one convenient central point is not proof of complete target geometry.

Do not accept an absolutely positioned descendant extending outside its semantic host when it creates a cross-shaped, partial, overlapping, or non-layout hit region.

## Final rendered-owner proof

For each visible route, assert the final property on the actual owner.

A computed token or CSS variable on an ancestor, wrapper, or helper does not prove the visible result.

For shape:

- identify the actual visual container;
- assert its resting and state endpoint geometry;
- verify clipping and box sizing do not change the visible shape;
- verify pressed, selected, disabled, and simultaneous-state endpoints;
- reject a visibly rectangular or malformed endpoint even when a scalar radius matches an expected value.

A scalar `border-radius` assertion alone is insufficient.

## CSS custom-property proof boundary

Tests may prove public overrides reach final owners. Tests must not normalize invalid naming.

Before testing, authoring and review classify touched variables as:

- exact official `--md-ref-*`, `--md-sys-*`, or `--md-comp-*`;
- justified `--md-private-*` route;
- genuine `--app-*` token;
- invalid or unnecessary alias.

Do not write tests that bless ad-hoc public-looking names such as:

```text
--md-button-border-radius
--md-button-height
--md-button-padding-left
--md-button-icon-gap
```

Private variables are implementation details, not consumer API. Test the official source or public extension and the final output, not the private alias itself unless a generic foundation boundary explicitly owns that bridge.

## Normalization and fallback proof

For every materially different input class, compare:

- actual returned, emitted, or rendered result;
- native semantics and accessibility;
- warning or error text;
- README and API documentation;
- test assertion.

A clamped result, ignored input, rejected combination, and fallback mode are different contracts.

## Browser behavior tests

Use isolated Storybook Playwright tests when correctness depends on behavior the component changes or constrains:

- custom keyboard activation or navigation;
- focus entry, movement, visibility, or restoration;
- pointer/touch acquisition, hit testing, gesture, capture, or cancellation;
- overlay and containment;
- layout, measurement, responsive, or container-dependent behavior;
- JavaScript/WAAPI lifecycle;
- final computed propagation that source review cannot establish reliably.

Use public input and assert public outcomes. Forced state and direct mutation do not prove browser behavior.

## Motion proof boundary

Motion ownership is split:

- official documentation defines the requirement;
- project documentation defines an accepted Web adaptation;
- shared foundation implements and proves cross-family runtime behavior deeply once;
- component owns correct property, geometry owner, state routing, and family-specific endpoints;
- reviewer checks technical and canonical alignment;
- operator owns final perceived quality.

At component level prove:

- real input activates the intended property on the correct visual owner;
- one meaningful intermediate state when needed;
- correct visible endpoint;
- safe interruption/cancellation;
- reduced motion when owned.

Do not claim motion fixed when timing changes but the visible endpoint, owning geometry, or rendered shape remains wrong.

Technical route proof never closes rejected operator feedback.

## Shared foundation proof

Changes to root/system tokens, universal selectors, pseudo-elements, shared formulas, theme roles, or public shared APIs require representative proof.

Representative proof must:

- identify current affected contract classes;
- exercise the changed source through final rendered output;
- include more than the motivating family when multiple families consume it;
- distinguish identical default output from actual override/state behavior.

Unchanged tests that never exercise the route are not representative proof.

## Canonical visual evidence

Every visible public component has one stable canonical story.

The story must:

- use real production anatomy;
- use representative real child components rather than placeholder glyphs when child geometry is claimed;
- present distinct visible states and configurations readably;
- expose the complete surface the operator is asked to review.

Use `StateMatrix` only when multiple distinct visual routes exist. Do not build a Cartesian product.

## Visual regression

A visual baseline detects changes from the stored baseline. It does not prove Material correctness, correct anatomy, correct ownership, or operator acceptance.

Do not create or update a baseline until the underlying structural contract is understood. A baseline preserving a malformed component is regression evidence for the malformed output, not conformance evidence.

## Independent review

Before operator handoff, reviewer confirms:

- geometry ownership map is complete and coherent;
- final properties are checked on correct owners;
- CSS custom-property namespaces are valid;
- tests prove their named risks causally;
- canonical stories use real anatomy;
- no objective defect is hidden behind operator review;
- README preserves current feedback accurately.

A high-severity anatomy, target, geometry, shape, final-owner, invalid-namespace, or unchanged visible defect requires `non-compliant`.

## Operator review

Operator review is performed through normal user messages.

The operator evaluates final visible fidelity and perceived motion quality. The operator does not own discovery of incorrect DOM anatomy, interaction bounds, visual-container ownership, CSS naming, clipping, or test insufficiency.

Only explicit user acceptance sets accepted status.

## Anti-overengineering

Use existing test infrastructure. Do not create:

- a production state-matrix component;
- runtime token or geometry registries;
- a generic component-test DSL;
- public test-only API;
- family-specific forced-state systems;
- frame-level infrastructure for ordinary CSS transitions;
- separate operator report files.

## Completion

Proof is complete only when applicable contracts are covered at correct layers, geometry relationships are coherent, final properties are asserted on correct owners, CSS namespaces are valid, named-risk setups are causal, normalization branches agree, independent review records exact remaining work, visible evidence uses real anatomy, required operator acceptance is explicit, and applicable local verification passes.