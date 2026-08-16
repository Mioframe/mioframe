---
name: material-component-behavior-contract
description: 'Use after the API contract is complete to derive only canonical observable Material behavior from material3 MCP.'
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
```

Read it only as the current structural vocabulary/boundary: configurations, content roles and public values already established for the family. It is not behavior authority.

## Source

Material behavior facts come only from the repository-configured `material3` MCP server in `.mcp.json`.

Do not substitute m3e behavior, legacy behavior, application consumers, web search, memory, or `contract.ts` prose for Material behavior evidence.

A detail Material does not prescribe after complete source coverage is not an ambiguity. Record it as Material-unspecified only when useful to prevent later invention.

## Isolation

Run in a fresh isolated context.

Read only applicable `AGENTS.md`, `component-contract.md`, completed `contract.ts`, the Material 3 MCP pages needed for behavior/specification/accessibility, and minimum repository terminology needed to write `BEHAVIOR.md`.

Do not inspect m3e implementation/docs, legacy component implementation, consumers, migration code, `tokens.css`, or another worker's reasoning.

## Output

Record only normative observable Material behavior needed to implement and verify the family, using applicable sections:

```text
## Anatomy and content roles
## States and state precedence
## Interaction and input behavior
## Keyboard behavior
## Accessibility semantics
## Geometry and layout
## Motion
## Material-unspecified behavior
```

If behavior evidence proves that `contract.ts` omits a required Material content role/configuration/public value, or exposes one that current Material behavior explicitly excludes, do not compensate in prose. Return `return-to-api-contract` with the exact structural mismatch.

Include exact geometry, spacing, touch targets, state transitions, accessibility semantics, content ownership and motion only when Material 3 MCP defines them for this component.

Do not require Material to define generic Web/HTML/ARIA mechanics, browser event semantics, renderer internals, or combined state precedence unless Material itself prescribes them.

Do not include Vue/m3e strategy, renderer lifecycle/workarounds, tests, product behavior, migration instructions, or general usage prose.

## Completion check

Before writing the artifact and returning `complete`:

1. Read `contract.ts` only for current structural scope/terminology.
2. Query Material 3 MCP using official family/component name and behavior/specification/accessibility scope.
3. Inspect every applicable route/result for anatomy, states, interaction, keyboard, accessibility, geometry/layout and motion.
4. Verify no documented normative behavior in scope is omitted, guessed, or converted into implementation prose.
5. Verify every required content role/configuration/public value is structurally representable by `contract.ts`.
6. If Material behavior evidence contradicts that structural boundary, return `return-to-api-contract` rather than editing either artifact opportunistically.
7. Distinguish source failure/contradiction from Material silence.
8. Only now write/replace `BEHAVIOR.md` once.

If blocked or returning to API before step 8, do not create a new partial `BEHAVIOR.md`.

## Report

```text
MATERIAL BEHAVIOR CONTRACT RESULT
family: <family>
artifact: <BEHAVIOR.md path>
Material 3 MCP coverage: complete | blocked
API boundary: compatible | return-to-api-contract
API finding: none | <exact structural mismatch>
Material-unspecified behavior: none | <concise boundaries>
unresolved blocking ambiguity: none | <exact ambiguity>
result: complete | blocked | return-to-api-contract
```

## Forbidden

- Reading m3e or consumers to infer expected behavior.
- Treating `contract.ts` as behavior authority rather than structural scope.
- Translating legacy behavior into Material requirements.
- Repairing an API mismatch inside `BEHAVIOR.md`.
- Treating Material silence as permission to invent behavior.
- Treating an unspecified Web/platform detail as a blocker after complete source coverage.
- Editing `contract.ts`, `tokens.css`, runtime code, tests, consumers, or migration.
- Leaving a new partial `BEHAVIOR.md` on blocked/return.
- Guessing missing Material behavior.
- Adding implementation/workflow history.
