# Material component testing

This document extends the project-wide policy in `docs/testing/architecture.md` for public Mioframe Material component families. It defines Material-specific proof and visual handoff; it does not replace general test ownership rules.

## Goal

Prove the accepted family contract with the smallest non-duplicative set of artifacts. Green automation proves regression against accepted repository evidence; it does not prove that the evidence matches current canonical Material 3 Expressive sources.

## Required proof model

| Proof                      | Requirement                                                                             | Purpose                                                                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Component contract         | Mandatory for every new or migrated public component                                    | Public API, native owner, explicit attributes, ARIA ownership, defaults, slots, emits, controlled state, invalid combinations, normalization, and non-browser foundation wiring |
| Canonical visual story     | Mandatory when the component renders visible output                                     | One stable readable reference for the accepted visible contract                                                                                                                 |
| State matrix               | Required only when multiple distinct component-owned visual routes exist                | Compare configurations, semantic states, transient appearances, simultaneous-state precedence, extensions, and deviations without a Cartesian product                           |
| Visual regression          | Required when the canonical visible contract is stable and regression would be material | Detect unintended changes in the bounded canonical reference                                                                                                                    |
| Browser behavior           | Required only when the component owns browser-dependent interaction                     | Real focus, keyboard, pointer, touch, drag, scrolling, overlay, responsive, motion, cancellation, and cleanup behavior                                                          |
| Pure behavior              | Required only when extracted component or foundation logic owns deterministic decisions | State transitions, timing, cancellation, cleanup, and derivations outside Vue rendering                                                                                         |
| Consumer preservation      | Required when imports, public API, wrappers, composition, or shared output change       | Preserve representative affected product usage without running unrelated suites                                                                                                 |
| Agent evidence review      | Mandatory for every new or migrated family                                              | Close source, architecture, accessibility, behavior, migration, and proof decisions before operator handoff                                                                     |
| Operator visual acceptance | Required when accepted visible output is created or intentionally changed               | Compare prepared canonical evidence with named official Material sources                                                                                                        |

A proof layer may be omitted only because the component does not own that contract, not because the correct test is difficult to write.

## Family contract as source of proof

Derive tests from the accepted family blueprint and current migration scope:

- supported public variants, sizes, states, slots, and extensions;
- native element and semantic ownership;
- component versus foundation ownership;
- Material token, shape, elevation, typography, icon, state, ripple, focus, motion, and layout routes;
- unsupported optional capabilities and explicit deviations;
- affected consumers and replaced legacy paths.

Do not create artifacts from a generic checklist when the family does not own the corresponding contract.

## Component contract

Use the colocated `<Component>.test.ts` and the `component-contract-testing` skill.

Cover applicable:

- canonical defaults and supported public configuration;
- native element and explicit DOM-critical attributes;
- accessible-name, ARIA, disabled, readonly, and controlled-state ownership;
- slots, fixed anatomy, emits, and invalid combinations;
- accepted normalization and warnings;
- public Mioframe extensions;
- component-to-foundation wiring that does not require browser rendering.

Do not prove computed appearance, geometry, real focus-visible acquisition, pointer/touch behavior, ripple, overlay lifecycle, motion lifecycle, or actionability in component tests.

Do not reproduce the visual state matrix in unit tests.

## Canonical visual evidence

Every visually rendered public component has one stable canonical visual reference.

Use:

- `StateMatrix` when multiple distinct component-owned visible routes exist;
- a bounded `Overview`, `Default`, or equivalent canonical story when one representative route is sufficient.

Record the canonical story id and bounded root in the family documentation or audit. The operator must be able to understand the visible cases from labels without reading source code.

### State matrix content

Include applicable:

- every supported configuration with distinct component-owned visible output;
- every semantic, disabled, unavailable, or transient state with distinct output;
- every simultaneous-state combination with a distinct winner or coexistence result;
- every project extension or accepted deviation that changes output.

Do not include equivalent combinations merely because variant, size, label, icon, or content names differ. Do not create one screenshot per cell.

### Transient appearance

A verification-only foundation adapter may represent generic hover, focus-visible, pressed, or dragged appearance when needed for deterministic screenshots.

It must:

- remain outside public product API;
- belong to the owning foundation testing surface;
- contain no family-specific token routing or precedence;
- prove appearance only.

Real acquisition, release, transition, cancellation, cleanup, focus movement, and actionability still require browser input when contractual.

## Visual regression

Follow `visual-regression-testing`.

A Material visual spec:

1. opens the canonical story;
2. waits for deterministic fonts, icons, rendering, and state preparation;
3. captures the bounded component, matrix, or labelled sections;
4. contains no business or behavior success criteria;
5. uses stable repository baselines.

Prefer one bounded screenshot. Split only when readability requires labelled sections. Do not encode complete Material token tables as computed-style assertion matrices.

A baseline is a regression reference, not proof of Material correctness.

## Browser behavior

Follow `ui-browser-behavior` and use isolated Storybook behavior tests when the family owns browser-dependent interaction.

Test applicable behavior through public controls and real input:

- native or custom keyboard activation and navigation;
- focus entry, focus-visible, movement, and restoration;
- pointer, touch, drag, gesture, capture, cancellation, and cleanup;
- expanded target-area hit testing;
- overlay containment, escape, outside interaction, and lifecycle;
- responsive or container-dependent behavior;
- motion completion and reduced-motion behavior when component-owned;
- actual DOM property ownership when browser rendering is required.

Forced states, direct Vue mutation, private methods, and synthetic internal events do not prove behavior.

A component with no browser-owned behavior records `Browser behavior: not applicable` with an ownership-based reason.

## Foundation ownership

Generic Material foundation behavior is proved once by the owning foundation tests. Component families prove only:

- that they route accepted family values into the foundation contract;
- family-specific anatomy or semantic ownership;
- a documented extension or deviation;
- a unique browser or visible outcome not already owned by foundation.

Do not repeat generic focus indicator, state layer, ripple, motion, elevation, or token-precedence matrices in every consumer family.

## Consumer preservation

When migration changes imports, public API usage, wrappers, native owners, or product composition:

1. identify the actual affected consumers;
2. choose representative checks for materially different integration paths;
3. preserve complete user scenarios where the migration changes product behavior;
4. remove obsolete legacy tests and paths with their implementation.

Do not require unrelated product suites merely because a shared Material component changed.

## Agent evidence review

Before operator handoff, the coding agent confirms:

- official sources resolve the supported contract;
- component and foundation ownership is coherent;
- semantics, accessibility, state ownership, and lifecycle are correct;
- every distinct visible route is represented when applicable;
- proof layers are proportionate and non-duplicative;
- changed consumers and obsolete paths are handled;
- no unresolved non-visual decision is hidden behind visual review.

The agent reports this review as `passed` or `blocked`. It must not pass while required source, architecture, accessibility, behavior, migration, or proof decisions remain unresolved.

## Operator visual acceptance

Operator comparison is required when a PR:

- creates a visible public Material component;
- creates its first accepted canonical visual reference;
- intentionally changes visible tokens, state routing, shape, color, elevation, typography, icon geometry, focus, ripple, motion appearance, or layout;
- updates a baseline because the accepted visible contract changed;
- changes a foundation contract with rendered impact.

Prepare:

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

Use existing test and verification infrastructure.

Add a structural guard only after repeated real migrations demonstrate a stable need that can be checked precisely with low maintenance. A documented rule alone is not justification for a validator.

Automation may verify deterministic facts such as an existing story id, public export, or prohibited test-only API. It must not infer semantic completeness or visual correctness from Markdown or screenshots.

## Forbidden

Do not create:

- a production state-matrix component or runtime state registry;
- a generic component-test DSL;
- public test-only props, events, or branches;
- a family-specific forced-state system;
- duplicate foundation behavior suites in every family;
- shared fixtures after only one family demonstrates a need;
- mandatory artifact counts that ignore actual family ownership.

Extract shared test infrastructure only after multiple current families prove the same concrete need and total complexity decreases.

## Completion

Material component proof is complete when:

- applicable public contracts are covered at the correct owning layers;
- canonical visual evidence is readable and proportional;
- browser behavior uses real input when required;
- foundation behavior is not duplicated by consumers;
- changed consumers and obsolete paths are handled;
- agent evidence review passes;
- required operator visual acceptance is recorded;
- repository verification passes.
