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

If required token data is unavailable or contradictory in Material 3 MCP, report the exact blocker instead of guessing.

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

### Web serialization

Material documentation may express values in design/platform notation such as `dp` or `sp`. `tokens.css` is Web CSS, so source notation must not be copied when it is not a valid value for the CSS grammar that will consume the token.

- Prefer the official `--md-sys-*` / `--md-ref-*` alias whenever Material provides one.
- Literal spatial dimensions expressed in Material `dp` serialize to the same numeric CSS `px` value for the Mioframe Web contract.
- Do not emit literal `dp` or `sp` units in a family public token value.
- For typography or any other source value without an official alias, use a repository-defined Web representation only when the mapping is deterministic and preserves the Material value. If no such mapping is defined, report `blocked` rather than inventing one.
- Preserve semantic values such as colors, opacities, weights and durations in their valid CSS grammar; do not mechanically stringify source-table cells.

Do not add `--m3e-*`, `--md-private-*`, `--app-*`, renderer mappings/defaults, token enums, registries, DSLs, JSON mirrors, or compatibility aliases.

## Completion check

Before returning `complete`:

1. Query Material 3 MCP using the official family/component name and token scope.
2. Inspect every applicable MCP token route/table surfaced for the family, including variant/state/part-specific tables when present.
3. Re-read `tokens.css` against those sources and verify no documented public component token, official default, or official system/reference alias in this worker's scope was omitted, invented, or renamed from renderer/legacy vocabulary.
4. Verify every literal public token value is a valid deterministic Web serialization of the Material value; no family declaration value contains raw `dp` or `sp` units.
5. Verify the artifact contains no private renderer bridges or application tokens.
6. If complete source coverage or deterministic Web serialization cannot be established, report `blocked`; do not return `complete`.

## Report

```text
MATERIAL TOKEN CONTRACT RESULT
family: <family>
artifact: <tokens.css path>
Material 3 MCP coverage: complete | blocked
Web serialization: complete | blocked
unresolved ambiguity: none | <exact ambiguity>
result: complete | blocked
```

## Forbidden

- Reading m3e or consumers to select or name public tokens.
- Making the token surface demand-scoped.
- Editing `contract.ts`, `BEHAVIOR.md`, runtime code, tests, consumers, or migration.
- Guessing missing Material token facts or Web conversions.
- Copying Material `dp`/`sp` notation directly into family public CSS token values.
- Adding private renderer bridges to the public contract file.
