# Material 3 validation policy

## Purpose

Validation protects stable deterministic contracts that real migrations have proved valuable to enforce.

It must not pretend that automation can prove:

- Material source interpretation;
- family or foundation ownership rationale;
- scenario sufficiency;
- semantic completeness;
- visual equivalence;
- operator acceptance.

There is no standalone validation milestone and no requirement to automate every documented rule.

## Current verification model

Use, in order:

1. existing repository format, lint, type, test, browser, visual, and mutation checks;
2. focused component, foundation, and consumer tests owned by the current change;
3. source-backed agent review for semantic and architectural decisions;
4. operator visual acceptance when visible fidelity changes.

A documented rule is reviewable immediately. It becomes mechanically enforced only when a precise guard actually exists.

## When to add a guard

Add automation only when all conditions hold:

- a real migration demonstrates a stable accepted contract;
- the failure has repeated or carries a clearly material regression risk;
- the check can identify the violation precisely with a low false-positive rate;
- existing repository tooling can express it without a parallel architecture system;
- maintenance cost is lower than the review burden it removes.

Do not add a guard merely because a future mistake is imaginable.

## Suitable automated checks

Automation is appropriate for deterministic facts such as:

- syntax, formatting, type safety, and existing lint boundaries;
- exact token vocabulary when a verified machine-readable source exists;
- duplicate declarations with an unambiguous canonical owner;
- an existing public export or referenced file no longer resolving;
- prohibited test-only production API;
- stale risk registration or snapshot reference when the owning tooling already models it;
- a repeated migration invariant that can be derived from repository facts rather than prose.

The first migration that discovers a possible rule normally records evidence. A shared guard is considered after the need is confirmed, not before useful component work.

## Unsuitable automated claims

Do not encode automation that claims to decide:

- whether a component family boundary is correct;
- whether the supported Material surface is sufficient;
- whether an optional capability should be implemented;
- whether a foundation abstraction reduces total complexity;
- whether state or anatomy ownership reasoning is correct;
- whether visual routes are complete or equivalent;
- whether a screenshot matches current Material 3 Expressive;
- whether a rule should remain unchanged when real implementation contradicts it.

These are agent or operator review responsibilities.

## Token validation

Public `--md-*` contracts require exact verified official meaning.

For changed tokens, verify applicable:

- official path and current source snapshot;
- canonical owner;
- absence of invented, shortened, duplicated, or project-only public names;
- affected consumers and rendered routes;
- representative visual evidence when output changes.

Prefer existing token tooling and focused tests. Do not create a second handwritten token inventory solely for validation.

## Architecture and migration validation

For the selected family, review deterministic repository facts directly:

- canonical and legacy owners;
- public exports and affected imports;
- obsolete paths after migration;
- dependency direction;
- directly affected map, registry, inventory, story, test, snapshot, and risk records.

Only records whose owned facts changed must be updated.

A family-specific exception is not a valid way to preserve an inaccurate architecture rule. Correct the owning rule through the rule-refinement process.

## Test-artifact validation

Proof is proportional under `component-testing.md`.

Do not require:

- `StateMatrix` for a component with one meaningful visual route;
- visual regression when no stable material visual contract exists;
- browser tests for behavior the component does not own;
- empty route, state, token, or helper files for structural symmetry;
- a complete fixed artifact profile for every component.

Automation may later verify a proven artifact convention, but the convention must first be stable across real migrations.

## Findings and rollout

When a missing guard is discovered:

1. record the concrete defect or risk;
2. determine whether the underlying rule is accurate;
3. correct the rule first when needed;
4. fix the current implementation;
5. add automation only when the criteria above are satisfied.

Do not block the migration merely because a hypothetical validator has not been built.

## Material PR report

Report only applicable:

- selected family and change mode;
- official source snapshot and supported surface;
- ownership and affected consumers;
- foundation changes;
- token or behavior changes;
- proportional proof performed;
- existing repository checks run;
- rule corrections made and their evidence;
- agent review and operator visual status;
- removed legacy paths and remaining explicit blockers.
