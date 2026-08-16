---
name: material-component-behavior-contract
description: 'Use for one official Material family to derive only its canonical observable behavior contract from the material3 MCP before implementation.'
---

# Material component behavior contract

Own exactly one artifact:

```text
src/shared/ui/material/components/<family>/BEHAVIOR.md
```

## Source

Material behavior facts come from the repository-configured `material3` MCP server in `.mcp.json`.

Do not substitute m3e behavior, legacy Mioframe behavior, application consumers, web search, or memory for Material 3 MCP.

A detail that Material does not prescribe after complete applicable source coverage is not an ambiguity and does not block the contract. Record it as Material-unspecified only when that boundary is useful to prevent a later stage from inventing a Material requirement.

Report `blocked` only when applicable Material source coverage cannot be established, official Material sources contradict one another, or an unavailable fact prevents defining a Material-owned observable requirement.

## Isolation

Run in a fresh isolated context.

Read only applicable `AGENTS.md`, `src/shared/ui/material/docs/component-contract.md`, the Material 3 MCP pages needed for behavior/specification/accessibility, and the minimum repository terminology needed to write `BEHAVIOR.md`.

Do not inspect m3e implementation/docs, legacy component implementation, consumers, migration code, or another contract worker's reasoning.

## Output

Record only normative observable Material behavior needed to implement and verify the family:

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

The final section is optional. Use it only for relevant boundaries that Material explicitly leaves unspecified or does not prescribe after complete applicable source coverage. It is not a list of missing documentation and does not make the result blocked.

Include exact geometry, spacing, touch targets, state transitions, accessible roles/states, content ownership and motion only when Material 3 MCP defines them for this component.

Do not require Material to define generic Web/HTML/ARIA mechanics, browser event semantics, renderer internals, or combined interaction-state precedence unless Material itself prescribes those details for the component.

Do not include Vue/m3e implementation strategy, renderer lifecycle/workarounds, tests, product behavior, migration instructions, or general usage prose that is not part of normative behavior.

## Completion check

Before returning `complete`:

1. Query Material 3 MCP using the official family/component name and behavior/specification/accessibility scope.
2. Inspect every applicable MCP route/result surfaced for anatomy, states, interaction, input/keyboard, accessibility, geometry/layout, and motion; do not stop after one matching page.
3. Re-read `BEHAVIOR.md` against those sources and verify no documented normative behavior in this worker's scope was omitted, guessed, or converted into implementation-specific prose.
4. Verify general usage advice is not duplicated here unless it is necessary to state a normative observable component rule.
5. Distinguish source failure/contradiction from Material silence: complete source coverage plus an unspecified detail may still return `complete`.
6. Report `blocked` only for incomplete source coverage, contradictory official requirements, or a missing fact required to decide a Material-owned observable rule.

## Report

```text
MATERIAL BEHAVIOR CONTRACT RESULT
family: <family>
artifact: <BEHAVIOR.md path>
Material 3 MCP coverage: complete | blocked
Material-unspecified behavior: none | <concise boundaries>
unresolved blocking ambiguity: none | <exact ambiguity>
result: complete | blocked
```

## Forbidden

- Reading m3e or consumers to infer expected behavior.
- Translating legacy behavior into Material requirements.
- Treating Material silence as a requirement to invent behavior.
- Treating a Material-unspecified Web/platform detail as a blocker when source coverage is complete.
- Editing `contract.ts`, `tokens.css`, runtime code, tests, consumers, or migration.
- Guessing missing Material behavior.
- Adding implementation or workflow history to `BEHAVIOR.md`.
