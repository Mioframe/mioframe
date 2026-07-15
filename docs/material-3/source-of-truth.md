# Material 3 source of truth

## Authority order

Use the narrowest official source that resolves the decision.

1. `material3` MCP server from `Vyachean/m3-docs-mcp`.
2. `Vyachean/m3-docs-cache` when MCP is unavailable or incomplete for the required page.
3. The official Material Design Kit in Figma when exact visual geometry, state composition, expressive measurements, or component anatomy cannot be resolved from the published documentation alone.
4. Current repository code and tests only as evidence of existing Mioframe behavior, never as proof of Material correctness.

A task handoff or previous audit may describe an accepted delta, but it is not a substitute for the current official source and repository contract.

## Documentation source

Before planning or implementing Material work, check the relevant official pages through MCP. Prefer only pages that resolve the touched surface:

- component overview, specs, guidelines, and accessibility;
- design-token and foundation pages;
- interaction-state, motion, color, typography, shape, elevation, layout, and adaptive guidance;
- current deprecation or migration guidance.

Record stable page names and the verified snapshot or capture date in the family blueprint or foundation registry.

## Cache fallback

Use `Vyachean/m3-docs-cache` only when MCP is unavailable or incomplete.

The cache is a readable snapshot of `m3.material.io`, not an independent design system. Prefer files under `pages/` and inspect `index.json` for capture metadata, failed URLs, redirects, and suspicious pages.

A cache-backed decision records the exact cache snapshot and path.

## Official Material Design Kit

The official Material Design Kit is the visual authority only when published documentation does not contain enough detail for an exact visual decision.

Use it for questions such as:

- exact component geometry or expressive dimensions;
- anatomy relationships not fully described in text;
- visual state composition and simultaneous-state appearance;
- icon, shape, elevation, and alignment details missing from published specs.

The Design Kit does not override documented behavior, accessibility, native semantics, token meaning, or usage guidance.

Record:

```text
Design Kit source: <file/version>
Node or component set: <stable name or node reference>
Verified date: <YYYY-MM-DD>
```

If the required Design Kit evidence is unavailable, mark the exact visual decision as `partial` or `blocked`. Do not infer it from an existing screenshot baseline.

## Implementation references

Material Web or another implementation may be inspected only after the official contract is resolved and only as a non-authoritative implementation reference.

An implementation reference must not:

- override official Material guidance;
- define Mioframe public API or ownership;
- justify unsupported behavior;
- replace native-platform reasoning or repository tests.

## Non-sources

Do not use the following as Material authority:

- generic web search;
- third-party component libraries;
- screenshots without official provenance;
- older Material versions;
- memory;
- existing Mioframe rendering or snapshots.

## Unavailable or conflicting guidance

When required official guidance is unavailable, incomplete, or contradictory:

1. identify the exact unresolved decision;
2. determine whether the supported surface can be narrowed without losing a required scenario;
3. otherwise use `blocked` before production edits;
4. record a deliberate Mioframe deviation only when the product requirement explicitly requires it and the architecture handoff approves it.

Do not claim full Material alignment for unresolved surfaces.

## PR expectation

Material PR descriptions or review notes name the exact sources used, for example:

- `components/buttons/overview`;
- `components/buttons/specs`;
- `foundations/design-tokens/overview`;
- `foundations/interaction/states/overview`;
- `styles/color/roles`;
- official Design Kit file/version and component-set reference when visual evidence was required.

Use stable page names, snapshot metadata, and Design Kit references instead of raw screenshots or generic source descriptions.
