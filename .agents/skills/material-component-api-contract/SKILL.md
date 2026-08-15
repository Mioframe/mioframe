---
name: material-component-api-contract
description: 'Use for one official Material family to derive only its canonical Vue public parameters/props, slots, events, public value types and defaults from the material3 MCP before implementation.'
---

# Material component API contract

Own exactly one artifact:

```text
src/shared/ui/material/components/<family>/contract.ts
```

## Source

Material facts come from the repository-configured `material3` MCP server in `.mcp.json`.

Do not substitute m3e docs, legacy Mioframe code, application consumers, web search, or memory for Material 3 MCP.

If the required Material API is unavailable or contradictory in Material 3 MCP, report the exact blocker instead of guessing.

## Isolation

Run in a fresh isolated context.

Read only applicable `AGENTS.md`, `src/shared/ui/material/docs/component-contract.md`, the Material 3 MCP pages needed for API/content roles, and the minimum Vue/project type conventions needed to write `contract.ts`.

Do not inspect m3e, legacy component implementation, consumers, migration code, or token/behavior implementation details.

## Output

Define only the canonical renderer-independent public structural contract:

- parameters/props;
- slots/content inputs;
- events/emits;
- public value/state/variant/configuration types required by those inputs/events;
- defaults;
- valid combinations when TypeScript can express them clearly;
- concise TSDoc for touched public exports.

Prefer explicit `MD<Component>Props`, `MD<Component>Slots`, and `MD<Component>Emits` contracts where applicable so the Vue SFC can consume them directly.

Do not add implementation helpers, renderer types, legacy aliases, speculative convenience API, or surface omitted from Material 3 MCP.

## Completion check

Before returning `complete`:

1. Query Material 3 MCP using the official family/component name and API/content-role scope.
2. Inspect every applicable MCP route/result surfaced for that scope, not only the first matching page.
3. Re-read `contract.ts` against those sources and verify no documented prop/parameter, content role, event semantic, public value/configuration, default, or valid combination in this worker's scope was omitted or guessed.
4. Verify the artifact contains no m3e, legacy, consumer-demand, token, or behavior implementation decisions.
5. If complete source coverage cannot be established, report `blocked`; do not return `complete`.

## Report

```text
MATERIAL API CONTRACT RESULT
family: <family>
artifact: <contract.ts path>
Material 3 MCP coverage: complete | blocked
unresolved ambiguity: none | <exact ambiguity>
result: complete | blocked
```

## Forbidden

- Reading m3e or consumers to shape the API.
- Designing from current demand or legacy props.
- Editing `tokens.css`, `BEHAVIOR.md`, runtime code, tests, consumers, or migration.
- Guessing missing Material facts.
- Creating DESIGN/ARCHITECTURE workflow documents.
