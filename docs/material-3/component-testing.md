# Material component testing

This document extends `docs/testing/architecture.md` only with Material-specific proof and operator handoff. General proof ownership, execution lanes, `TEST IMPACT`, accessibility ownership, automatic impact metadata, and safe fallback remain defined by the project-wide testing architecture and testing skills.

## Goal

Prove the accepted Material family contract with the smallest non-duplicative set of artifacts. Green automation protects accepted repository evidence; it does not prove correspondence with current canonical Material 3 Expressive sources.

## Required family evidence

| Evidence                   | Requirement                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------- |
| Component contract         | Mandatory for every new or migrated public component                                    |
| Canonical visual story     | Mandatory when the component renders visible output                                     |
| State matrix               | Only when multiple distinct component-owned visual routes exist                         |
| Visual regression          | When the accepted visible contract is stable and regression would be material           |
| Browser behavior           | Only when the family owns browser-dependent interaction                                 |
| Deterministic behavior     | Only when component/foundation logic owns deterministic decisions outside Vue rendering |
| Consumer preservation      | When imports, public API, wrappers, native owners, composition, or shared output change |
| Agent evidence review      | Mandatory before operator handoff                                                       |
| Operator visual acceptance | Required when accepted Material output is created or intentionally changed              |

Evidence may be omitted only because the family does not own that contract, not because correct proof is difficult.

## Source of proof

Derive `TEST IMPACT` from the accepted family blueprint and current migration scope:

- supported variants, sizes, states, slots, and extensions;
- native element, semantics, ARIA, and controlled-state ownership;
- component versus foundation ownership;
- token, shape, elevation, typography, icon, state, ripple, focus, motion, and layout routes;
- unsupported official capabilities and accepted deviations;
- affected consumers and removed legacy paths;
- required Storybook behavior, app E2E, visual, snapshot-owner, or other repository impact-metadata updates.

Do not create tests from a generic artifact checklist when the family does not own the corresponding contract.

## Component contract

Every new or migrated public Material component has a colocated `<Component>.test.ts` following `component-contract-testing`.

Cover applicable defaults, public configuration, native owner, explicit attributes, accessible name, ARIA, disabled/readonly semantics, slots, anatomy, emits, controlled state, invalid combinations, normalization, extensions, and non-browser foundation wiring.

Do not reproduce the visual state matrix or generic foundation behavior in component tests.

## Canonical visual evidence

Every visibly rendered public component records one stable canonical story and bounded root in family documentation or audit.

Use:

- `StateMatrix` when multiple distinct component-owned visible routes exist;
- bounded `Overview`, `Default`, or equivalent when one representative route is sufficient.

A state matrix includes only distinct visible outputs: supported configurations, semantic/transient states, simultaneous-state precedence, extensions, and deviations. Do not create Cartesian products, duplicate equivalent combinations, or one screenshot per cell.

A verification-only foundation adapter may prepare generic transient appearance when it remains outside public API, belongs to foundation testing, contains no family-specific routing, and claims appearance only.

## Foundation ownership

Generic focus indicator, state layer, ripple, elevation, motion, and token-precedence behavior is proved once by the owning foundation.

A component family proves only:

- routing into the accepted foundation contract;
- family-specific anatomy or semantic ownership;
- documented extension or deviation;
- unique browser or visible output not already owned by foundation.

Do not repeat generic foundation matrices in every family.

## Browser behavior

Use isolated Storybook behavior tests only when the family owns real focus, keyboard, pointer/touch, drag, expanded-target, overlay, responsive, motion, cancellation, cleanup, or browser-rendered property behavior.

Use public controls and real browser input. Forced state, direct Vue mutation, private methods, and synthetic internal events do not prove behavior.

A family with no browser-owned behavior records `Browser behavior: not applicable` with an ownership-based reason.

## Consumer preservation

When migration changes public usage:

1. identify actual affected consumers;
2. select representative materially different integration paths;
3. preserve complete product scenarios only where product behavior may change;
4. remove obsolete legacy tests and paths with their implementation;
5. update every affected Storybook behavior, app E2E, and visual impact mapping in the same change;
6. keep source mappings limited to production, story, fixture, or owned support paths rather than spec grouping.

A shared Material change does not automatically require unrelated product suites.

## Agent evidence review

Before operator handoff, the coding agent confirms:

- official sources resolve the supported contract;
- component/foundation ownership is coherent;
- semantics, accessibility, lifecycle, and state ownership are correct;
- distinct visible routes are represented proportionately;
- proof is non-duplicative and matches `TEST IMPACT`;
- repository impact metadata matches the actual changed sources, specs, stories, and baselines;
- changed consumers and obsolete paths are handled;
- no unresolved non-visual decision is delegated to operator review.

Report `passed` or `blocked`. Do not pass while source, architecture, accessibility, behavior, migration, proof, or impact ownership remains unresolved.

## Operator visual acceptance

Operator comparison is required for:

- a first accepted canonical Material reference;
- intentional visible token, state-routing, shape, color, elevation, typography, icon, focus/ripple appearance, motion appearance, layout, or rendered foundation changes;
- an intentional baseline update caused by a changed visible contract.

Prepare:

```text
Canonical visual story: <story id>
Visual coverage: complete | incomplete (<gap>)
Automated visual baseline: passed | updated and inspected | not applicable (<reason>)
Agent evidence review: passed | blocked (<reason>)
Official visual sources: <named evidence>
Expected deviations: none | <records>
Operator visual acceptance: required | accepted | rejected | blocked (<reason>)
```

The operator checks visible fidelity only. An automated agent never reports operator acceptance as `accepted`.

## Automation policy

Use existing infrastructure. Add structural automation only after repeated migrations prove a precise low-maintenance need. Automation may validate deterministic paths, exports, story ids, specs, snapshot ownership, and prohibited test-only API; it must not infer semantic completeness or visual correctness from Markdown or screenshots.

## Forbidden

- production state-matrix components or runtime state registries;
- generic component-test DSLs;
- public test-only props, events, or branches;
- family-specific forced-state systems;
- duplicate foundation suites in every family;
- mandatory artifact counts disconnected from actual family ownership;
- shared fixtures before multiple current families prove the same concrete need;
- stale or semantically overloaded test-impact mappings.

## Completion

Material proof is complete when applicable contracts are covered at the correct proof types, canonical visual evidence is readable, browser behavior uses real input when owned, foundation behavior is not duplicated, consumers and obsolete paths are handled, repository impact metadata is consistent, agent evidence review passes, required operator acceptance is recorded, and repository verification passes.
