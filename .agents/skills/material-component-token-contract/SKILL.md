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

The public token catalogue lives only in CSS. Do not mirror token names, defaults, aliases, groups, or token metadata into TypeScript, JSON, enums, registries, DSLs, or generated runtime maps. `tokens.css` is the source of truth for the public family token surface.

Do not add `--m3e-*`, `--md-private-*`, `--app-*`, renderer mappings/defaults, token enums, registries, DSLs, JSON mirrors, or compatibility aliases.

## Decision examples

These examples illustrate the decision rule and CSS shape only. They are not Material source evidence. If an example conflicts with current Material 3 MCP, current Material wins.

### Public token catalogue is executable CSS

Suppose the current Material family has a `primary` configuration with container/icon colors, a hovered state-layer opacity, and a fixed small container height. Material defines system aliases for the colors/state opacity and a direct `56dp` value for the height.

GOOD:

```css
:root {
  --md-comp-example-action-primary-container-color: var(--md-sys-color-primary);
  --md-comp-example-action-primary-icon-color: var(--md-sys-color-on-primary);
  --md-comp-example-action-primary-hovered-state-layer-opacity: var(
    --md-sys-state-hover-state-layer-opacity
  );
  --md-comp-example-action-small-container-height: 56dp;
}
```

Why: the public contract is directly executable, preserves official aliases when they exist, and preserves an official literal when Material does not provide a system alias.

BAD:

```ts
export const exampleActionTokens = {
  primaryContainerColor: '--md-comp-example-action-primary-container-color',
  primaryIconColor: '--md-comp-example-action-primary-icon-color',
  smallContainerHeight: '--md-comp-example-action-small-container-height',
} as const;
```

Why: TypeScript becomes a second token catalogue that can drift from CSS and encourages runtime token machinery.

### Do not invent aliases

Suppose Material gives `16dp` as the component spacing value and does not give a system/reference alias for that row.

GOOD:

```css
--md-comp-example-action-icon-label-space: 16dp;
```

BAD:

```css
--md-comp-example-action-icon-label-space: var(--md-sys-spacing-large);
```

Why: an attractive-looking system alias is still invented semantics when Material does not define it.

### Current versus historical rows

Suppose one Material token page contains a current Expressive configuration and a separately identified baseline configuration retained for historical reference.

GOOD: include only token rows belonging to configurations reachable through the current `contract.ts` plus unconditional current-family rows.

BAD: copy both groups because both appear under the same component page or table.

Why: page/table membership alone does not establish current canonical ownership.

### API mismatch is returned, not repaired in CSS

Suppose `contract.ts` exposes `primary | secondary`, but token/spec evidence clearly establishes a third current developer-selectable `tertiary` configuration.

GOOD:

```text
return-to-api-contract
finding: current Material token/spec evidence includes developer-selectable tertiary configuration absent from contract.ts
```

BAD: silently add `tertiary` token groups to `tokens.css` while leaving the public API unable to select that configuration.

Why: the three contracts must describe one reachable family rather than individually plausible files.

### Renderer tokens never enter the public catalogue

GOOD:

```css
:root {
  --md-comp-example-action-primary-container-color: var(--md-sys-color-primary);
}
```

BAD:

```css
:root {
  --m3e-example-action-container-color: var(--md-comp-example-action-primary-container-color);
}
```

Why: `tokens.css` owns Material public tokens only. The later implementation may bridge them to the private renderer, but renderer vocabulary must not become part of this contract artifact.

## Completion check

Before writing the artifact and returning `complete`:

1. Read the current configuration/content boundary from `contract.ts` without changing it.
2. Query Material 3 MCP using official family/component name and token/spec scope.
3. Inspect every applicable token route/table and surrounding classification prose.
4. Classify current versus baseline/legacy/deprecated rows/groups; do not rely on table title alone.
5. Verify every current token/default/alias required by reachable configurations is present and no historical-only group is promoted.
6. Verify no token group describes a configuration the public contract cannot reach.
7. Verify values follow repository conventions, including `dp`/`sp` when specified.
8. Verify no private renderer/application token or second non-CSS token catalogue entered the artifact/worktree.
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
- Creating TypeScript/JSON token catalogues, token-name enums, token registries, token DSLs, or runtime token metadata mirrors.
