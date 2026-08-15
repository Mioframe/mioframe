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

If required behavior is unavailable or contradictory in Material 3 MCP, record the exact ambiguity and report blocked instead of guessing.

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
## Unresolved Material ambiguity
```

Include exact geometry, spacing, touch targets, state transitions, accessible roles/states, content ownership and motion only when Material 3 MCP defines them for this component.

Do not include Vue/m3e implementation strategy, renderer lifecycle/workarounds, tests, product behavior, migration instructions, or general usage prose that is not part of normative behavior.

## Completion check

Before returning `complete`:

1. Query Material 3 MCP using the official family/component name and behavior/specification/accessibility scope.
2. Inspect every applicable MCP route/result surfaced for anatomy, states, interaction, input/keyboard, accessibility, geometry/layout, and motion; do not stop after one matching page.
3. Re-read `BEHAVIOR.md` against those sources and verify no documented normative behavior in this worker's scope was omitted, guessed, or converted into implementation-specific prose.
4. Verify general usage advice is not duplicated here unless it is necessary to state a normative observable component rule.
5. If complete source coverage cannot be established, report `blocked`; do not return `complete`.

## Report

```text
MATERIAL BEHAVIOR CONTRACT RESULT
family: <family>
artifact: <BEHAVIOR.md path>
Material 3 MCP coverage: complete | blocked
unresolved ambiguity: none | <exact ambiguity>
result: complete | blocked
```

## Forbidden

- Reading m3e or consumers to infer expected behavior.
- Translating legacy behavior into Material requirements.
- Editing `contract.ts`, `tokens.css`, runtime code, tests, consumers, or migration.
- Guessing missing Material behavior.
- Adding implementation or workflow history to `BEHAVIOR.md`.
