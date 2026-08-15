---
name: material-component-contract
description: 'Use for one official Material family to derive or refresh the canonical renderer-independent contract files from official Material sources before implementation or consumer migration.'
---

# Material component contract

Create or refresh one family’s canonical Material contract and return control to the orchestrator.

## Authority

Read applicable `AGENTS.md`, `src/shared/ui/material/docs/component-contract.md`, and only the supporting Material foundation/token rules required by the affected contract.

The contract worker owns official Material → canonical Mioframe contract. It does not own m3e integration, production implementation, consumer migration, or review.

## Isolation

Run in a fresh worker context.

Before the canonical contract is resolved, do not inspect m3e implementation/docs, legacy component implementation, product consumers, or current call-site demand to choose public API, behavior, or tokens.

Existing canonical contract files may be read when refreshing them. Repository Material foundation/token conventions may be read to preserve canonical naming and ownership.

## Sources

Use authoritative official Material sources. Follow repository-provided Material source/cache tooling and fallbacks when available.

Record exact sources, revisions/check date, delegated official contracts, conflicts and extraction gaps in `SOURCES.md`.

Do not guess an unavailable or contradictory official fact.

## Output

Write or refresh exactly the canonical family contract owned by `component-contract.md`:

```text
components/<family>/contract.ts
components/<family>/tokens.css
components/<family>/BEHAVIOR.md
components/<family>/GUIDANCE.md
components/<family>/SOURCES.md
```

Do not create DESIGN/ARCHITECTURE/IMPLEMENTATION/MIGRATION/REVIEW artifacts.

## Contract rules

- `contract.ts`: props, slots, emits, public value/state/variant/configuration types, defaults and valid combinations; official terminology with idiomatic Vue mechanics; complete TSDoc for touched public exports.
- `tokens.css`: official public component tokens for the supported official family surface; official semantic names/default aliases only; no m3e/private/app tokens and no duplicate registry.
- `BEHAVIOR.md`: normative anatomy/content roles, states, interaction/input, keyboard, accessibility semantics, geometry/layout, motion and unresolved behavior conflicts.
- `GUIDANCE.md`: purpose, when to use/not use, variant/configuration guidance, content guidance, consumer accessibility responsibilities and related-component composition.
- `SOURCES.md`: provenance/conflicts only.

Do not omit official surface because the current application does not use it. Do not add undocumented/platform-inapplicable surface for completeness.

## Consistency pass

Before success, cross-check that:

- API types, behavior and guidance agree on variants/states/content roles;
- event/state semantics are explicit enough for implementation;
- tokens cover the official supported variants/parts/states without renderer leakage;
- fixed geometry, motion and accessibility requirements needed for proof are explicit;
- source conflicts are surfaced instead of normalized by guesswork.

Parallel official-source extraction may be used when runtime support exists and subtasks are genuinely independent, but it is not required. One contract worker owns synthesis and consistency.

## Architecture escalation

Use `needs-architect` only when official Material plus repository-wide conventions leave a real non-deterministic public-contract/ownership decision. Do not escalate routine Vue typing, source normalization, or formatting work.

## Report

```text
MATERIAL CONTRACT RESULT
family: <canonical-family>
contract files: <paths>
official sources checked: <concise list>
contract changed: yes | no
source conflicts: none | <exact conflicts>
remaining blocker: none | <exact blocker>
result: complete | blocked | needs-architect
```

## Forbidden

- Deriving public API from current consumers, legacy props, or m3e vocabulary.
- Reading renderer/legacy implementation before contract decisions to make the contract easier to implement.
- Creating a demand-scoped Material API.
- Exposing raw DOM/m3e types, events, attributes, tags, or CSS variables.
- Creating token enums/registries/DSLs/JSON mirrors.
- Guessing missing Material facts.
- Implementing the Vue component or migrating consumers.
- Persisting workflow history or review conclusions in contract files.
