---
name: material-component-implementation
description: 'Use after the three Material technical contracts are ready to implement and prove one standalone canonical Vue component through the exact installed m3e renderer without inspecting consumers.'
---

# Material component implementation

Implement or resume one standalone canonical Material family from three fixed technical contracts.

## Input gate

Require completed:

```text
components/<family>/contract.ts
components/<family>/tokens.css
components/<family>/BEHAVIOR.md
```

Do not start while a current correction still targets one of these contracts.

Before production edits, perform only this local consistency check:

1. Every developer-selectable configuration in `contract.ts` has a coherent token/behavior owner when applicable.
2. Every public token group belongs to a reachable configuration or unconditional component behavior.
3. Every structural state/content role required by `BEHAVIOR.md` is representable by the public contract.
4. Every behavior rule requiring consumer-supplied accessibility/native information has an explicit public prop or narrow native/ARIA allow-list seam; do not silently drop required `aria-*`, native action, labeling or relationship inputs.
5. No simpler documented renderer seam already satisfies the contract.

If checks 1–3 prove a technical contract wrong, return its exact owner. Check 4 is implementation-owned when the contracts already require the semantic input and the missing piece is only the adapter allow-list/native seam.

Do not invoke generic `implementation-preflight` for this deterministic stage.

## Authority

Read applicable `AGENTS.md`, `component-adapter.md`, `component-tokens.md`, the three family contracts, exact lockfile-resolved `@m3e/web` documentation/examples/public artifacts, and only the testing conventions needed for selected proof.

The contracts define what must be exposed and observably satisfied. m3e defines only the private implementation seam.

## Isolation

Run in a fresh context. Do not inspect application consumers, legacy call sites, migration code, README guidance, or current demand to shape the standalone component.

When resuming an interrupted implementation, inspect the current family runtime/proof first and preserve already-correct work. Do not rewrite contracts, restyle unrelated code, regenerate snapshots, or broaden proof merely because the previous worker context is unavailable.

## Implementation

1. Consume `contract.ts` types directly through typed Vue APIs.
2. Use documented exact-version m3e public inputs for props/content/events/state.
3. Keep renderer tags, types, variables and workarounds private to the family.
4. Map every supported public token group to an actual renderer/result path.
5. Prefer explicit family-local mappings over broad abstractions. A generated/string-composed token mapping is acceptable only when one exact grammar is proven for every covered token and it materially reduces total complexity; otherwise keep mappings explicit and statically inspectable.
6. Forward only the explicit public/native/ARIA inputs needed by `contract.ts` and `BEHAVIOR.md`; adapter-owned renderer configuration must win over conflicting fallthrough.
7. Do not recreate renderer-owned state layer, ripple, focus, elevation, accessibility internals, geometry engines, or motion unless an explicit renderer defect requires the smallest documented family-local correction.
8. Add only proof required by the contracts and materially distinct renderer paths.
9. Run focused verifier-managed checks and return to the orchestrator.

## Contract corrections

Implementation never edits a technical contract because implementation evidence disagrees with it.

Return exactly one of:

```text
return-to-api-contract
return-to-token-contract
return-to-behavior-contract
```

with the exact contradictory fact and affected scope.

If faithful support would require private DOM coupling, duplicated renderer systems, new shared infrastructure, or weakening a correct contract, return `needs-architect`.

## Proof

Use the lowest faithful proof for each changed contract.

Unit/component tests may prove:

- public prop/slot/event/default mapping;
- host attribute allow-list/boundary;
- deterministic adapter-owned state or event forwarding.

Browser/visual proof owns observable renderer results such as:

- accessible role/name/focus/keyboard behavior;
- consumer-supplied accessibility labeling/relationships when allowed by the contract;
- fixed geometry;
- RTL/layout behavior;
- hover/focus/pressed appearance;
- public token overrides reaching actual rendered parts/states;
- required motion and reduced-motion behavior.

Do **not** add tests whose only assertion is that one CSS custom-property string was assigned to another string. Source mapping presence is not proof that the renderer consumes it correctly. A screenshot alone is not proof of fixed numeric geometry or state semantics.

Proof should be proportional: one test may cover several tokens that share a genuinely identical rendered mapping path, but materially different configuration/state grammars require independent observable coverage.

## Report

```text
MATERIAL IMPLEMENTATION RESULT
family: <canonical family>
standalone component: complete | blocked
focused verification: <commands/results>
contract correction owner: none | api-contract | token-contract | behavior-contract
contract finding: none | <exact finding>
architecture escalation: none | <exact decision>
remaining blocker: none | <exact blocker>
result: complete | blocked | return-to-api-contract | return-to-token-contract | return-to-behavior-contract | needs-architect
```

## Forbidden

- Inspecting consumers or legacy call sites to shape runtime implementation.
- Migrating consumers.
- Changing canonical contracts to fit m3e/current demand.
- Re-declaring public Props/Slots/Emits/value unions inside the SFC.
- Dropping behavior-required accessibility/native inputs merely because the renderer root uses `inheritAttrs: false`.
- Exposing raw m3e details outside the family.
- Adding speculative adapters, generic token frameworks, or runtime mapping abstractions solely to reduce line count.
- Treating source-level CSS wiring as rendered token proof.
- Rewriting already-correct family work during an interrupted-run resume without an exact defect.
- Running broad local verification solely to duplicate architect-owned exact-head CI.
