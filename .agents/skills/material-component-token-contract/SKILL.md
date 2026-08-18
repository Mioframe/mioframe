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

Require completed `contract.ts`. Read it only for the current developer-selectable configuration/content boundary; it is not token authority.

## Source

Material token facts come only from the repository-configured `material3` MCP server in `.mcp.json`.

Do not substitute m3e docs, legacy CSS, application overrides, web search, memory, or current implementation for Material token evidence.

After complete source coverage, a token/default/alias Material does not define is not an ambiguity. Do not invent one.

## Isolation

Run in a fresh isolated context.

Read only applicable `AGENTS.md`, `component-contract.md`, `component-tokens.md`, completed `contract.ts`, the Material 3 MCP token/spec pages needed for this family, and minimum Material foundation/naming conventions needed to serialize CSS.

Do not inspect m3e mappings, legacy component CSS, application consumers, runtime implementation, `BEHAVIOR.md`, or another worker's reasoning.

## Output

Define only the canonical public token contract for the current Material 3 Expressive family:

- official tokens for current configurations, parts and states reachable through `contract.ts` or unconditional to the family;
- canonical `--md-comp-*` names derived from Material semantics;
- official defaults and `--md-sys-*` / `--md-ref-*` aliases where defined;
- comments only for non-obvious official distinctions.

### Cascade model

Family `tokens.css` is the single owner of public token names and Material defaults, but family defaults are declared on `:root`:

```css
:root {
  --md-comp-example-action-primary-container-color: var(--md-sys-color-primary);
  --md-comp-example-action-small-container-height: 56dp;
}
```

The family directory owns these declarations even though the selector is global. `:root` gives every instance an inheritable default while allowing a closer ancestor/component declaration to override the public token through normal CSS inheritance.

Do **not** declare family defaults on `.md-<component>` or another local selector. A host-level declaration shadows contextual/ancestor overrides and can make composition depend on specificity/source order.

Do not solve composition with stronger selectors, `!important`, inline token wiring, or bundle order.

Material reference/system tokens are application-wide theme inputs. Component defaults may reference them from `:root`. Independent subtree Material system themes are not part of the current contract; contextual `--md-comp-*` overrides remain supported.

Material pages may mix current and historical rows in one section/table. Classify at row/group level from surrounding Material headings/prose and current family semantics.

If token evidence proves that `contract.ts` exposes a historical/non-current configuration, or reveals a current developer-selectable configuration missing from `contract.ts`, return `return-to-api-contract`; do not compensate in CSS.

Use repository Material CSS authoring conventions. Material `dp` and `sp` are supported authoring units transformed by the project pipeline.

The public token catalogue lives only in CSS. Do not mirror token names, defaults, aliases, groups, or metadata into TypeScript, JSON, enums, registries, DSLs, generated runtime maps, or a second catalogue.

Do not add `--m3e-*`, `--md-private-*`, `--app-*`, renderer mappings/defaults, or compatibility aliases.

## Decision examples

Examples illustrate the rule only; current Material 3 MCP remains authority.

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

Why: the family owns one executable default catalogue while normal inheritance keeps contextual overrides effective.

BAD:

```css
.md-example-action {
  --md-comp-example-action-primary-container-color: var(--md-sys-color-primary);
}
```

Why: every component instance redeclares the public input and may shadow an ancestor/composer override.

GOOD — a different component may intentionally override a nested family's public token in its own implementation CSS:

```css
.md-button {
  --md-comp-loading-indicator-color: currentColor;
}
```

That override is composition, not ownership of the Loading Indicator default. It does not belong in Button's token contract worker because this worker cannot inspect consumers/composition.

BAD:

```ts
export const exampleActionTokens = {
  containerColor: '--md-comp-example-action-primary-container-color',
} as const;
```

Why: TypeScript becomes a second token catalogue.

BAD:

```css
:root {
  --m3e-example-action-container-color: ...;
}
```

Why: renderer vocabulary is private implementation ownership.

## Completion check

Before writing the artifact and returning `complete`:

1. Read the current configuration/content boundary from `contract.ts` without changing it.
2. Query Material 3 MCP using official family/component name and token/spec scope.
3. Inspect every applicable token route/table and surrounding classification prose.
4. Classify current versus baseline/legacy/deprecated rows/groups.
5. Verify every current token/default/alias required by reachable configurations is present and no historical-only group is promoted.
6. Verify no token group describes a configuration the public contract cannot reach.
7. Verify every family-owned `--md-comp-*` default declaration is under `:root`, never the component host/local selector.
8. Verify values follow repository conventions, including `dp`/`sp` when specified.
9. Verify no private renderer/application token or second non-CSS token catalogue entered the artifact/worktree.
10. Only now write/replace `tokens.css` once.

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
- Declaring family-owned component-token defaults on `.md-<component>` or another local selector instead of `:root`.
- Using specificity escalation, `!important`, inline token wiring, or bundle-order dependence to make contextual overrides win.
- Editing `contract.ts`, `BEHAVIOR.md`, runtime code, tests, consumers, or migration.
- Leaving a new partial `tokens.css` on blocked/return.
- Replacing supported `dp`/`sp` solely to mimic browser syntax.
- Adding private renderer bridges to the public contract file.
- Creating TypeScript/JSON token catalogues, token-name enums, token registries, token DSLs, or runtime token metadata mirrors.
