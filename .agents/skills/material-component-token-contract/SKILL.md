---
name: material-component-token-contract
description: 'Use after the API contract is complete to derive only the current public Material component-token CSS contract from material3 MCP.'
---

# Material component token contract

Own exactly one artifact:

```text
src/shared/ui/material/components/<family>/tokens.css
```

## Input

Require completed:

```text
src/shared/ui/material/components/<family>/contract.ts
```

Read it only to know the current developer-selectable configurations/content terminology already established for the family. It is not a source for token facts.

## Source

Material token facts come only from the repository-configured `material3` MCP server in `.mcp.json`.

Do not substitute m3e token docs, legacy CSS, application overrides, web search, memory, or `contract.ts` contents for Material token evidence.

After complete source coverage, a token/default/alias Material does not define is not an ambiguity. Do not invent one.

## Isolation

Run in a fresh isolated context.

Read only applicable `AGENTS.md`, `component-contract.md`, `component-tokens.md`, completed `contract.ts`, the Material 3 MCP token/spec pages needed for this family, and minimum Material foundation naming conventions needed to serialize CSS.

Do not inspect m3e mappings, legacy component CSS, application consumers, runtime implementation, `BEHAVIOR.md`, or another worker's reasoning.

## Output

Define only the canonical public token contract for the current Material 3 Expressive family:

- official tokens for current configurations, parts and states reachable through `contract.ts` or unconditional to the family;
- canonical `--md-comp-*` names derived from Material semantics;
- official defaults and `--md-sys-*` / `--md-ref-*` aliases where defined;
- comments only for non-obvious official distinctions.

Material pages may mix current and historical rows in one section/table. Classify at row/group level from surrounding Material headings/prose and current family semantics; do not treat every row in a current-looking table as current automatically.

If token evidence proves that `contract.ts` exposes a historical/non-current configuration, or reveals a current developer-selectable configuration missing from `contract.ts`, do not compensate in CSS. Return `return-to-api-contract` with the exact configuration mismatch.

Use repository Material CSS authoring conventions. Material `dp` and `sp` are supported authoring units transformed by the project pipeline.

Do not add `--m3e-*`, `--md-private-*`, `--app-*`, renderer mappings/defaults, token enums, registries, DSLs, JSON mirrors, or compatibility aliases.

## Completion check

Before writing the artifact and returning `complete`:

1. Read the current configuration/content boundary from `contract.ts` without changing it.
2. Query Material 3 MCP using official family/component name and token/spec scope.
3. Inspect every applicable token route/table and surrounding classification prose.
4. Classify current versus baseline/legacy/deprecated rows/groups; do not rely on table title alone.
5. Verify every current token/default/alias required by reachable configurations is present and no historical-only group is promoted.
6. Verify no token group describes a configuration the public contract cannot reach.
7. Verify values follow repository conventions, including `dp`/`sp` when specified.
8. Verify no private renderer/application token entered the artifact.
9. Only now write/replace `tokens.css` once.

If source evidence conflicts with the API boundary, return `return-to-api-contract` before writing. If blocked for source coverage/contradiction, do not create a new partial `tokens.css`.

## Report

```text
MATERIAL TOKEN CONTRACT RESULT
family: <family>
artifact: <tokens.css path>
Material 3 MCP coverage: complete | blocked
API boundary: compatible | return-to-api-contract
API finding: none | <exact configuration mismatch>
unresolved blocking ambiguity: none | <exact ambiguity>
result: complete | blocked | return-to-api-contract
```

## Forbidden

- Reading m3e or consumers to select/name public tokens.
- Treating `contract.ts` as token authority rather than structural scope.
- Making token surface demand-scoped.
- Copying all rows from a mixed current/baseline table without classification.
- Repairing an API-boundary mismatch inside `tokens.css`.
- Treating absent Material token data as permission to invent a token.
- Editing `contract.ts`, `BEHAVIOR.md`, runtime code, tests, consumers, or migration.
- Leaving a new partial `tokens.css` on blocked/return.
- Replacing supported `dp`/`sp` solely to mimic browser syntax.
- Adding private renderer bridges to the public contract file.
