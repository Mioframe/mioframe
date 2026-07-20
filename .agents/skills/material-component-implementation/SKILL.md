---
name: material-component-implementation
description: 'Internal-only Material stage. Never use directly for a user request. Use exclusively when material-component delegates proof-first implementation of a ready family through documented units, primary composition, representative consumer validation, and complete supported surface.'
---

# Material component implementation

Internal stage only. Use it after the family contract is ready and every required foundation prerequisite is available.

## Inputs

Read:

- root and applicable nested `AGENTS.md` files;
- `src/shared/ui/material/docs/architecture.md`;
- the component-implementation phase of `src/shared/ui/material/docs/component-development.md`;
- the ready family README and required foundation contracts;
- current production owner, representative consumer, public exports, stories, tests, and relevant verification mappings.

Load Vue and testing skills only for the exact implementation or proof layer currently required.

## Responsibility

Execute the implementation phase in order:

```text
applicable initial failing proof
→ documented implementation units
→ primary composed slice
→ representative consumer validation
→ complete supported family
```

Before production edits, create applicable contract, deterministic, or regression proof and confirm it fails for the expected reason. Define real-browser scenarios before implementation when browser semantics own the contract. Do not create visual baselines before official comparison and acceptance.

Implement responsibility owners in the README's recorded order. Keep public Vue components as thin composition roots. Use owner-local TypeScript modules, focused composables, and separate owner-local stylesheets when the documented responsibilities, reasons to change, or proof owners differ. Do not split files mechanically and do not add wrapper components or DOM nodes merely for separation.

Do not expand the family before the primary composed slice is coherent. Do not complete it before the representative consumer proves the public API in real composition.

When implementation or representative integration exposes a wrong source, ownership, API, DOM, state, decomposition, style, token, proof, or foundation decision, return an exact contract blocker. Do not add a consumer workaround or silently rewrite the contract.

## Exit gate

Pass only when:

- applicable initial proof now passes;
- implementation matches the documented decomposition and order;
- public composition roots remain focused;
- non-trivial visual contracts have explicit owner-local style ownership;
- the primary slice is coherent;
- the representative consumer works without contract workarounds;
- every supported route is implemented and proved;
- unsupported routes remain absent;
- no required foundation gap remains.

## Result

```text
MATERIAL STAGE RESULT

Family:
Stage: implementation
Status: complete | blocked
Exit gate: passed | failed
Evidence:
Changed ownership:
Initial proof result:
Implementation units:
Composition-root result:
Style-owner result:
Representative consumer result:
Supported family result:
Blocker: none | <exact blocker>
```

## Forbidden

- direct user invocation;
- production edits before the applicable initial-proof gate;
- silent family-contract changes;
- monolithic implementation that ignores documented independent owners;
- file fragmentation that only moves lines without clarifying ownership or proof;
- migration of all remaining consumers or complete legacy-owner removal;
- roadmap updates or starting another stage;
- speculative surface, abstractions, managers, registries, validators, aliases, or extension points;
- unnecessary DOM nodes or generic tests for behavior the project does not own.