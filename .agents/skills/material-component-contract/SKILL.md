---
name: material-component-contract
description: 'Internal Material workflow stage for resolving one component family contract before production implementation.'
---

# Material component contract

This is an internal stage skill. Use it only when `material-component` has locked one family, objective, scenarios, and non-goals.

It owns source-backed family decisions before production edits. It does not implement the component, migrate consumers, update the roadmap, or start another stage.

## Required sources

Read:

- root and applicable nested `AGENTS.md` files;
- `src/shared/ui/material/docs/architecture.md`;
- `src/shared/ui/material/docs/sources.md`;
- `src/shared/ui/material/docs/component-development.md`;
- the current implementation, exports, consumers, stories, tests, snapshots, and legacy contract when present;
- current official Material 3 Expressive sources for the required scenarios.

## Resolve

1. Confirm the current and canonical family owners.
2. Define the minimum complete supported surface and explicit unsupported surface.
3. Resolve public API, invalid combinations, native semantics, accessibility, anatomy, DOM ownership, target ownership, state ownership, lifecycle, token routing, and final rendered-property ownership.
4. Select one representative consumer that can validate the primary architecture in real composition.
5. Identify only foundation dependencies required by the supported surface.
6. Define proportional proof and the complete consumer migration boundary.
7. Create or update the single family contract at `components/<family>/README.md`.

A legacy family still outside the canonical root may temporarily use `docs/legacy/<family>.md`, but an end-to-end migration must move the contract beside the canonical implementation.

## Exit gate

Pass only when:

```text
Unresolved: none
Readiness: ready
```

and the contract records every required foundation dependency and representative consumer.

When a required cross-family foundation capability is missing, return it as an exact blocker to `material-component`. Do not create a family-local substitute or invoke another stage directly.

## Result

```text
MATERIAL STAGE RESULT

Family:
Stage: contract
Status: complete | blocked
Exit gate: passed | failed
Evidence:
Changed ownership:
Required foundation work: none | <exact work>
Representative consumer:
Blocker: none | <exact blocker>
```

## Forbidden

- production component edits;
- consumer migration;
- roadmap updates;
- speculative variants, APIs, foundations, abstractions, or extension points;
- placeholders that defer ownership, API, DOM, state, token, or scenario decisions to implementation;
- a second family contract, audit, checklist, registry, or progress record.
