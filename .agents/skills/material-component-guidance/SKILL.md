---
name: material-component-guidance
description: 'Use for one official Material family to derive only its developer-facing description and correct-usage guidance from the material3 MCP into the family README before migration.'
---

# Material component guidance

Own exactly one artifact:

```text
src/shared/ui/material/components/<family>/README.md
```

## Source

Material description and usage guidance come from the repository-configured `material3` MCP server in `.mcp.json`.

Do not substitute m3e docs, legacy Mioframe code, application consumers, web search, or memory for Material 3 MCP.

After complete applicable source coverage, guidance Material does not provide is not an ambiguity. Omit unsupported guidance instead of filling gaps with generic advice.

Report `blocked` only when applicable Material guidance source coverage cannot be established, official Material guidance contradicts itself, or an unavailable fact prevents deciding a Material-owned usage rule.

## Isolation

Run in a fresh isolated context.

Read only applicable `AGENTS.md`, `src/shared/ui/material/docs/component-contract.md`, the Material 3 MCP pages needed for component overview/guidelines/accessibility usage responsibilities, and the minimum repository naming convention needed to write the family `README.md`.

Do not inspect m3e implementation/docs, legacy component implementation, product consumers, migration code, or another Material worker's reasoning.

An existing family `README.md` may be a legacy staged-workflow index. It is not Material authority. When processing that family, replace the legacy index content with the canonical Material guidance rather than preserving stage links/status prose.

## Output

Write concise developer-facing Material guidance with this shape when applicable:

```text
# <Official Material component name>

<short canonical description>

## Purpose
## When to use
## When not to use
## Choosing variants and configurations
## Content guidance
## Consumer accessibility responsibilities
## Related components and choosing alternatives
## Adaptive or platform guidance
```

Include only sections supported by Material 3 MCP. Omit an inapplicable or undocumented section rather than filling it with generic advice.

The README explains what the component is and how a developer should apply it correctly. It does not define implementation mechanics.

Do not duplicate:

- prop/slot/event/type tables from `contract.ts`;
- token catalogues from `tokens.css`;
- normative interaction, keyboard, geometry or motion rules from `BEHAVIOR.md`;
- m3e integration details;
- product-specific migration instructions;
- repository workflow history or legacy stage indexes.

When usage guidance references a variant, configuration, content role or related Material component, preserve official Material terminology. Do not invent Mioframe convenience concepts.

## Completion check

Before returning `complete`:

1. Query Material 3 MCP using the official family/component name and overview/guidelines/usage/accessibility-responsibility scope.
2. Inspect every applicable MCP route/result surfaced for purpose, when-to-use/not-use guidance, variants/configurations, content guidance, consumer accessibility responsibilities, related-component distinctions, and adaptive/platform guidance when present.
3. Re-read `README.md` against those sources and verify no documented guidance in this worker's scope was omitted, guessed, or replaced by Mioframe/legacy convenience.
4. Verify the README does not duplicate the technical API, token, or normative behavior contracts.
5. Distinguish Material silence from a blocker: complete source coverage plus undocumented/inapplicable guidance may still return `complete`.
6. Report `blocked` only for incomplete source coverage, contradictory official guidance, or a missing fact required to decide a Material-owned usage rule.

## Report

```text
MATERIAL GUIDANCE RESULT
family: <family>
artifact: <README.md path>
Material 3 MCP coverage: complete | blocked
legacy README index replaced: yes | no | not-applicable
unresolved blocking ambiguity: none | <exact ambiguity>
result: complete | blocked
```

## Forbidden

- Reading m3e or consumers to decide correct Material usage.
- Turning current product usage into canonical guidance.
- Treating an existing legacy README as Material source evidence.
- Treating Material silence as permission to invent guidance.
- Treating an undocumented/inapplicable guidance section as a blocker after complete source coverage.
- Editing `contract.ts`, `tokens.css`, `BEHAVIOR.md`, runtime code, tests, consumers, or migration.
- Adding Vue/m3e implementation examples that are not owned by this guidance artifact.
- Guessing missing Material guidance.
- Duplicating technical contract tables already owned by another artifact.
