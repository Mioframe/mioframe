---
name: material-component-behavior-contract
description: 'Use after API and token contracts are complete to derive canonical observable Material behavior without duplicating token-owned visual values.'
---

# Material component behavior contract

Own exactly one artifact:

```text
src/shared/ui/material/components/<family>/BEHAVIOR.md
```

## Input

Require completed:

```text
src/shared/ui/material/components/<family>/contract.ts
src/shared/ui/material/components/<family>/tokens.css
```

Read `contract.ts` only as the current structural vocabulary/boundary: configurations, content roles and public values already established for the family. It is not behavior authority.

Read `tokens.css` only as the exclusion boundary for visual facts already owned by the public component-token contract. It is not behavior authority and must not be used to infer behavior absent from Material3 MCP.

## Source

Material behavior facts come only from the repository-configured `material3` MCP server in `.mcp.json`.

Do not substitute m3e behavior, legacy behavior, application consumers, web search, memory, `contract.ts` prose, or token names for Material behavior evidence.

A detail Material does not prescribe after complete source coverage is not an ambiguity. Record it as Material-unspecified only when useful to prevent later invention.

## Isolation

Run in a fresh isolated context.

Read only applicable `AGENTS.md`, `component-contract.md`, completed `contract.ts`, completed `tokens.css` for duplicate-exclusion only, the Material 3 MCP pages needed for behavior/specification/accessibility, and minimum repository terminology needed to write `BEHAVIOR.md`.

Do not inspect m3e implementation/docs, legacy component implementation, consumers, migration code, or another worker's reasoning.

## Output

Record only normative observable Material behavior needed to implement and verify the family that is not already represented as a tokenized visual value, using applicable sections:

```text
## Anatomy and content roles
## States and state precedence
## Interaction and input behavior
## Keyboard behavior
## Accessibility semantics
## Layout relationships and non-tokenized constraints
## Motion
## Material-unspecified behavior
```

If behavior evidence proves that `contract.ts` omits a required Material content role/configuration/public value, or exposes one that current Material behavior explicitly excludes, do not compensate in prose. Return `return-to-api-contract` with the exact structural mismatch.

### Token/behavior boundary

`tokens.css` is the sole family contract owner for official tokenized visual values. Do not repeat in `BEHAVIOR.md` any value already represented by the family token contract, including as applicable:

- color values;
- component dimensions/sizes;
- shape/corner values;
- typography values;
- internal spacing values;
- elevation values;
- state-layer colors/opacities;
- focus-indicator color/thickness/offset;
- any other current official component-token value.

Behavior may describe the condition or relationship around a tokenized visual state without copying its value. Example: state that a focus indicator appears for a particular focused configuration, while its color/thickness/offset remain only in `tokens.css`.

Include exact geometry or another visual constraint only when Material 3 MCP normatively defines it and the completed family `tokens.css` has no corresponding official component-token representation. Keep external parent/layout placement guidance out of the family contract unless it is actually an intrinsic component requirement.

Include non-tokenized state transitions, accessibility semantics, content ownership, layout relationships and motion only when Material 3 MCP defines them for this component.

Do not require Material to define generic Web/HTML/ARIA mechanics, browser event semantics, renderer internals, or combined state precedence unless Material itself prescribes them.

Do not include Vue/m3e strategy, renderer lifecycle/workarounds, tests, product behavior, migration instructions, general usage prose, or a prose mirror of `tokens.css`.

## Completion check

Before writing the artifact and returning `complete`:

1. Read `contract.ts` only for current structural scope/terminology.
2. Read completed `tokens.css` only to identify visual values already owned by the token contract.
3. Query Material 3 MCP using official family/component name and behavior/specification/accessibility scope.
4. Inspect every applicable route/result for anatomy, states, interaction, keyboard, accessibility, layout/geometry and motion.
5. Remove from the behavior artifact every visual value already represented by `tokens.css`; preserve only the Material-defined condition/relationship when behavior needs it.
6. Verify no documented non-tokenized normative behavior in scope is omitted, guessed, or converted into implementation prose.
7. Verify every required content role/configuration/public value is structurally representable by `contract.ts`.
8. If Material behavior evidence contradicts that structural boundary, return `return-to-api-contract` rather than editing either artifact opportunistically.
9. Distinguish source failure/contradiction from Material silence.
10. Only now write/replace `BEHAVIOR.md` once.

If blocked or returning to API before step 10, do not create a new partial `BEHAVIOR.md`.

## Report

```text
MATERIAL BEHAVIOR CONTRACT RESULT
family: <family>
artifact: <BEHAVIOR.md path>
Material 3 MCP coverage: complete | blocked
token exclusion boundary: complete | blocked
API boundary: compatible | return-to-api-contract
API finding: none | <exact structural mismatch>
Material-unspecified behavior: none | <concise boundaries>
unresolved blocking ambiguity: none | <exact ambiguity>
result: complete | blocked | return-to-api-contract
```

## Forbidden

- Reading m3e or consumers to infer expected behavior.
- Treating `contract.ts` as behavior authority rather than structural scope.
- Treating `tokens.css` as behavior authority rather than duplicate-exclusion boundary.
- Duplicating token-owned visual values in `BEHAVIOR.md`.
- Translating legacy behavior into Material requirements.
- Repairing an API mismatch inside `BEHAVIOR.md`.
- Treating Material silence as permission to invent behavior.
- Treating an unspecified Web/platform detail as a blocker after complete source coverage.
- Editing `contract.ts`, `tokens.css`, runtime code, tests, consumers, or migration.
- Leaving a new partial `BEHAVIOR.md` on blocked/return.
- Guessing missing Material behavior.
- Adding implementation/workflow history.
