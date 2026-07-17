# Material 3 verification

## Principle

Verify each contract at its owning layer and in proportion to the selected family's real surface and risk.

Visual screenshots alone are insufficient. Green automation is necessary but does not prove that an accepted visual baseline matches current Material 3 Expressive.

## Verification layers

| Layer                     | Expected proof                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Repository                | Existing format, lint, type, unit, browser, visual, mutation, and build checks applicable to the change                               |
| Component contract        | Colocated Vue Test Utils tests for public API, native owner, ARIA, defaults, slots, emits, controlled state, and invalid combinations |
| Browser behavior          | Storybook Playwright tests for browser-owned interaction the component changes or constrains                                          |
| Pure behavior             | Focused tests for extracted helpers, composables, transitions, timing, cancellation, and cleanup                                      |
| Consumer preservation     | Focused checks for changed imports, wrappers, or product-visible usage                                                                |
| Canonical visual evidence | One stable bounded story for visible output; `StateMatrix` only when multiple distinct visual routes exist                            |
| Visual regression         | Bounded screenshots when a stable visual contract and material regression risk justify them                                           |
| Agent review              | Source-backed architecture, Material, accessibility, behavior, migration, rule, and proof review                                      |
| Operator review           | Visible comparison with named official sources when visible output is created or changed                                              |

A layer may be omitted only because the component does not own that contract.

## Verification by changed concern

### Source and supported surface

Verify:

- current official documentation snapshot;
- Design Kit evidence only when applicable visual details are unresolved by published guidance;
- supported and unsupported surface;
- explicit extensions and deviations.

When evidence is incomplete, narrow the supported surface or report `blocked`. Do not infer full alignment from legacy output.

### Ownership and migration

Verify applicable:

- canonical and legacy owners;
- public exports and affected imports;
- complete consumer migration;
- obsolete-path removal;
- dependency direction;
- directly affected migration map, registry, inventory, roadmap, story, test, snapshot, and risk records.

Do not update records whose owned facts did not change.

### API and semantics

Use type checking and component-contract tests for:

- props, emits, slots, and defaults;
- native element and action semantics;
- ARIA, disabled, readonly, and accessible-name ownership;
- controlled state and invalid combinations.

Use a real browser when the component changes native actionability, focus, keyboard, pointer, touch, target area, overlay, or responsive behavior.

### State and lifecycle

Verify the owning layer:

- semantic state through public contracts;
- browser interaction facts through real browser input;
- component-owned gesture, overlay, animation, timing, cancellation, and cleanup through browser or pure tests as appropriate;
- visible state output through canonical visual evidence.

Forced visual state proves appearance only.

### Tokens and rendering

Verify applicable:

- exact official token path and owner;
- shortest property route;
- state and configuration ownership;
- actual DOM property owner;
- affected visible routes and consumers.

Use representative visual evidence when rendered output changes. Do not require a fixed CSS file profile.

### Foundation changes

For an additive foundation change, verify the owner contract and affected component.

For a correction or replacement, verify complete direct consumers and representative proof for every meaningfully different affected path.

Foundation work must not create a family-local substitute or parallel permanent owner.

## Canonical visual evidence

Every visible component has one stable canonical visual story.

Use `StateMatrix` when multiple distinct component-owned visual routes exist. Use a bounded `Overview`, `Default`, or equivalent story when one route is sufficient.

A matrix covers distinct visible output, not every state name or every size, label, icon, and content combination.

Automated screenshots detect regression against an accepted baseline. They do not establish Material correctness.

## Operator visual acceptance

Operator comparison is required when a change:

- creates a visible component;
- creates its first accepted canonical visual reference;
- intentionally changes visible tokens, state routing, shape, color, elevation, typography, icon geometry, focus, ripple, motion appearance, or layout;
- changes a foundation contract with rendered impact;
- updates a baseline because the accepted visible contract changed.

Report:

```text
Canonical visual story: <story id>
Visual coverage: complete | incomplete (<gap>)
Automated visual baseline: passed | updated and inspected | not applicable (<reason>)
Agent evidence review: passed | blocked (<reason>)
Official visual sources: <snapshot and Design Kit reference when required>
Operator visual acceptance: required | accepted | rejected | blocked (<reason>)
```

An automated agent reports `required` or `blocked`, never `accepted`.

## Automation boundary

Automation proves deterministic repository facts and test outcomes already represented by tooling.

Add a new guard only when real migrations prove a stable, repeated, materially risky, and precisely detectable invariant. Do not require speculative static or structured validators before component work.

Automation must not infer architecture reasoning, source interpretation, route completeness, or visual correctness from prose or screenshots.

## Rule refinement

When verification exposes a conflict between implementation evidence and a project rule:

1. determine whether the component or the rule is defective;
2. correct the owning rule when it is inaccurate or unnecessarily complex;
3. update directly affected sources only;
4. resume verification after the contract is coherent.

Do not create a local exception to keep a defective rule green.

## Final verification

After implementation:

- run focused checks for changed contracts;
- run the final repository verification required by `AGENTS.md`;
- state what was and was not applicable;
- complete agent evidence review;
- record required operator visual acceptance.

## Review questions

Reviewers should be able to answer:

1. Which official sources and snapshots define the supported surface?
2. Which owners, consumers, tokens, APIs, semantics, behaviors, or visible routes changed?
3. Which proof layers apply, and why are omitted layers not owned by this component?
4. Were any project rules corrected from real evidence?
5. Are obsolete owners and compatibility paths removed?
6. Which conclusions come from automation, agent review, and operator visual review?
7. Are unsupported capabilities, deviations, and remaining blockers explicit?
