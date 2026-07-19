---
name: material-component-implementation
description: 'Internal Material workflow stage for implementing and proving one resolved component family, including representative consumer validation.'
---

# Material component implementation

Internal stage only. Use it after the family contract is ready and every required foundation prerequisite is available.

## Inputs

Read:

- root and applicable nested `AGENTS.md` files;
- `src/shared/ui/material/docs/architecture.md`;
- Stage 2 of `src/shared/ui/material/docs/component-development.md`;
- the ready family README and required foundation contracts;
- current production owner, representative consumer, public exports, stories, tests, and relevant verification mappings.

Load Vue and testing skills only for the exact implementation or proof layer currently required.

## Responsibility

Execute Stage 2 in order:

```text
primary vertical slice
→ representative consumer validation
→ complete supported family
```

Do not expand the family before the primary slice is coherent. Do not complete it before the representative consumer proves the public API in real composition.

When representative integration exposes a wrong source, ownership, API, DOM, state, token, or foundation decision, return an exact contract blocker. Do not add a consumer workaround or silently rewrite the contract.

## Exit gate

Pass only when the primary slice is coherent, the representative consumer works without contract workarounds, every supported route is implemented and proved, unsupported routes remain absent, and no required foundation gap remains.

## Result

```text
MATERIAL STAGE RESULT

Family:
Stage: implementation
Status: complete | blocked
Exit gate: passed | failed
Evidence:
Changed ownership:
Representative consumer result:
Supported family result:
Blocker: none | <exact blocker>
```

## Forbidden

- silent family-contract changes;
- migration of all remaining consumers or complete legacy-owner removal;
- roadmap updates or starting another stage;
- speculative surface, abstractions, managers, registries, validators, aliases, or extension points;
- unnecessary DOM nodes or generic tests for behavior the project does not own.
