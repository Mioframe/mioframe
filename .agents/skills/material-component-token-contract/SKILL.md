---
name: material-component-token-contract
description: 'Use for one official Material family to derive only its canonical public component-token CSS contract from the material3 MCP before implementation.'
---

# Material component token contract

Own exactly one artifact:

```text
src/shared/ui/material/components/<family>/tokens.css
```

## Source

Material token facts come from the repository-configured `material3` MCP server in `.mcp.json`.

Do not substitute m3e token docs, legacy CSS, application overrides, web search, or memory for Material 3 MCP.

After complete applicable source coverage, a token/default/alias Material does not define is not an ambiguity. Do not invent one to make the catalogue look complete.

Report `blocked` only when applicable Material token source coverage cannot be established, official Material token data contradicts itself, or an unavailable fact prevents defining a Material-owned public token requirement.

## Isolation

Run in a fresh isolated context.

Read only applicable `AGENTS.md`, `src/shared/ui/material/docs/component-contract.md`, `src/shared/ui/material/docs/component-tokens.md`, the Material 3 MCP token pages needed for this family, and the minimum Material foundation naming conventions needed to serialize `tokens.css`.

Do not inspect m3e mappings, legacy component CSS, application consumers, runtime implementation, or another contract worker's reasoning.

## Output

Define only the canonical public component-token contract:

- official component tokens for the canonical family variants, parts and states;
- canonical `--md-comp-*` names derived from Material semantics;
- official defaults and `--md-sys-*` / `--md-ref-*` aliases where defined;
- comments only when needed to preserve a non-obvious official semantic distinction.

`tokens.css` is the executable public catalogue.

Use the repository's existing Material CSS authoring conventions when serializing official values. Material `dp` and `sp` units are supported project authoring units and are transformed by the repository PostCSS pipeline; do not replace them merely because browsers do not natively parse those units.

Do not add `--m3e-*`, `--md-private-*`, `--app-*`, renderer mappings/defaults, token enums, registries, DSLs, JSON mirrors, or compatibility aliases.

## Completion check

Before returning `complete`:

1. Query Material 3 MCP using the official family/component name and token scope.
2. Inspect every applicable MCP token route/table surfaced for the family, including variant/state/part-specific tables when present.
3. Re-read `tokens.css` against those sources and verify no documented public component token, official default, or official system/reference alias in this worker's scope was omitted, invented, or renamed from renderer/legacy vocabulary.
4. Verify values follow the repository's established Material CSS authoring conventions, including supported `dp`/`sp` units where Material specifies them.
5. Verify the artifact contains no private renderer bridges or application tokens.
6. Distinguish Material silence from a blocker: complete source coverage plus an unspecified token/default/alias may still return `complete`.
7. Report `blocked` only for incomplete source coverage, contradictory official token data, or a missing fact required to decide a Material-owned token rule.

## Report

```text
MATERIAL TOKEN CONTRACT RESULT
family: <family>
artifact: <tokens.css path>
Material 3 MCP coverage: complete | blocked
unresolved blocking ambiguity: none | <exact ambiguity>
result: complete | blocked
```

## Forbidden

- Reading m3e or consumers to select or name public tokens.
- Making the token surface demand-scoped.
- Treating absent Material token data as permission to invent a public token.
- Treating a non-existent Material token/default/alias as a blocker after complete source coverage.
- Editing `contract.ts`, `BEHAVIOR.md`, runtime code, tests, consumers, or migration.
- Guessing missing Material token facts.
- Replacing repository-supported Material `dp`/`sp` authoring units solely to mimic native browser syntax.
- Adding private renderer bridges to the public contract file.
