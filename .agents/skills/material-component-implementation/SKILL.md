---
name: material-component-implementation
description: 'Use after the API, token, and behavior contracts complete to implement and prove one standalone canonical Vue Material component through the exact installed m3e renderer, without inspecting application consumers.'
---

# Material component implementation

Implement one standalone canonical Material family from three fixed technical contracts.

## Input gate

Require successful technical contracts:

```text
components/<family>/contract.ts
components/<family>/tokens.css
components/<family>/BEHAVIOR.md
```

Do not start if any technical contract worker reported unresolved Material ambiguity.

Before inspecting m3e or editing production code, check the three technical contracts for direct internal contradictions only. Public states/content roles required by `BEHAVIOR.md` must be representable by `contract.ts`, and token variant/state/part terminology must not contradict the structural or behavior contracts. If they conflict, route the exact finding to the owning definition worker; do not synthesize a new contract in implementation.

## Authority

Read applicable `AGENTS.md`, `component-contract.md`, `component-adapter.md`, `component-tokens.md`, current testing ownership, and the three technical family contract artifacts.

The technical contracts define what the component must expose and observably do. Exact lockfile-resolved `@m3e/web` documentation/examples/public artifacts define only how the private renderer can implement those contracts.

## Isolation

Run in a fresh isolated context.

Do not inspect application consumers, legacy call sites, migration code, or usage guidance to shape runtime implementation. Do not use current demand to reinterpret or shrink the contracts.

You may inspect existing Material foundation/shared infrastructure and the owning family runtime files needed to implement the canonical component. Do not copy legacy public API merely because it exists.

## Preflight

Before production edits, run `implementation-preflight` scoped only to:

- standalone canonical component implementation;
- private m3e mapping;
- component-owned tests/browser/visual proof;
- exports required for the canonical component;
- focused verifier-managed commands.

Do not include consumer migration or legacy-call-site adaptation in this preflight.

## Implementation order

1. Read `contract.ts`, `tokens.css`, and `BEHAVIOR.md` as fixed runtime inputs.
2. Inspect exact lockfile-resolved m3e docs/examples/public artifacts for each affected mapping.
3. Implement the Vue `MD*` component using the exported Props/Slots/Emits/public value types from `contract.ts` directly through typed Vue APIs.
4. Keep m3e tags, attributes, events, types, CSS variables and workarounds private to the Material family.
5. Map public `--md-comp-*` tokens privately to renderer inputs without adding renderer vocabulary to `tokens.css`.
6. Implement only the minimum family-local correction required when documented m3e behavior does not satisfy a correct contract.
7. Add/update standalone component, browser, accessibility, geometry, token and visual proof required by the three contracts.
8. Run focused verifier-managed checks.
9. Return after standalone component correctness is established. Do not migrate consumers in this worker.

## Contract corrections

Implementation does not edit a contract merely because implementation evidence contradicts it.

Return the exact owner:

```text
return-to-api-contract
return-to-token-contract
return-to-behavior-contract
```

with the exact observable/material fact that invalidates the current artifact.

A correct Material contract remains correct even when m3e cannot implement it directly.

## Renderer gaps

When m3e cannot faithfully implement a correct contract, prefer:

1. documented direct support;
2. the smallest family-local public-seam correction;
3. a documented removable exact-version workaround satisfying `m3e-defects.md`;
4. `needs-architect` when faithful support would require private DOM coupling, duplicated renderer systems, new shared infrastructure, or weakening the canonical contract.

Do not recreate renderer-owned state layer, ripple, focus system, elevation, accessibility internals, geometry engine, or motion without an explicit architecture decision.

## Proof

As applicable prove:

- SFC uses `contract.ts` as the public type source rather than re-declaring it;
- props/slots/emits/defaults and allowed attribute boundary;
- accepted/rejected controlled intent and one source of truth;
- pointer/keyboard/focus/native event behavior;
- accessible role/name/state and ownership;
- fixed Material geometry with numeric browser assertions;
- public token overrides through actual rendered results;
- renderer-owned appearance/motion through faithful browser/visual evidence;
- dependency composition through canonical public APIs.

A story, declaration, host attribute, source mapping, CSS variable presence, or screenshot alone is not proof of a different observable contract.

## Report

```text
MATERIAL IMPLEMENTATION RESULT
family: <canonical-family>
standalone component: complete | blocked
focused verification: <commands/results>
contract correction owner: none | api-contract | token-contract | behavior-contract
contract finding: none | <exact finding>
architecture escalation: none | <exact decision>
remaining blocker: none | <exact blocker>
result: complete | blocked | return-to-api-contract | return-to-token-contract | return-to-behavior-contract | needs-architect
```

## Forbidden

- Inspecting consumers, legacy call sites, or usage guidance to shape runtime implementation.
- Migrating consumers or removing a legacy owner still used by the application.
- Changing canonical contracts to fit m3e or current demand.
- Re-declaring public Props/Slots/Emits/value unions inside the SFC instead of consuming `contract.ts`.
- Exposing raw m3e details outside the Material family.
- Adding speculative adapters, compatibility layers, generic frameworks or token registries.
- Creating IMPLEMENTATION.md workflow logs.
- Running broad local verification solely to duplicate exact-head PR CI.
- Depending on Git/PR/check state for implementation correctness.
