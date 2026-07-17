# Material 3 source of truth

## Canonical target

Official Mioframe Material components implement the current official **Material 3 Expressive** contract.

When official sources distinguish Expressive from baseline Material 3:

- current Expressive usage, anatomy, tokens, geometry, state composition, motion, and adaptive guidance are canonical;
- baseline Material 3 must not be selected because it is simpler, already implemented, or more familiar;
- baseline behavior or geometry may remain only when the current official component has no Expressive contract for the supported surface, or when an explicit product compatibility requirement records it as a deviation;
- one supported component surface must not silently mix baseline and Expressive contracts;
- the family blueprint records the exact Expressive sources used and any unavailable, unsupported, or deliberately deviated surface.

`Canonical Material default` means the current Expressive default when an official Expressive contract exists.

## Official authority

Use the narrowest current official source that resolves the decision.

1. Current published Material 3 Expressive documentation on `m3.material.io` owns documented component usage, anatomy, behavior, accessibility, tokens, foundations, motion, and adaptive guidance.
2. The current official Material Design Kit in Figma owns exact visual geometry, state composition, expressive measurements, and component anatomy only when published documentation does not resolve the visual decision.
3. Current repository code and tests are evidence of existing Mioframe behavior, never proof of Material correctness.

The MCP server and documentation cache are access mechanisms for official documentation, not independent design authorities. A task handoff or previous audit may describe an accepted delta, but it is not a substitute for the current official source and repository contract.

## Documentation access order

Access the official published documentation in this order:

1. `material3` MCP server from `Vyachean/m3-docs-mcp`.
2. `Vyachean/m3-docs-cache` when MCP is unavailable or incomplete for the required page.
3. Direct verification against the current official published page when MCP or cache evidence is missing, stale, internally inconsistent, or marked suspicious and the environment can access the page.
4. The official Material Design Kit only for an applicable visual decision that the published documentation does not resolve.

An access mechanism does not gain authority merely because it is first in the lookup order. Stop source lookup when the required decisions are resolved by current, traceable official evidence.

## Documentation source

Before planning or implementing Material work, check the relevant official pages. Prefer only pages that resolve the touched surface:

- component overview, specs, guidelines, and accessibility;
- current Expressive component guidance and tokens when published separately;
- design-token and foundation pages;
- interaction-state, motion, color, typography, shape, elevation, layout, and adaptive guidance;
- current deprecation or migration guidance.

Record stable page names and the verified snapshot, capture date, or direct verification date in the family blueprint or foundation registry.

## Cache fallback

Use `Vyachean/m3-docs-cache` only when MCP is unavailable or incomplete.

The cache is a readable snapshot of `m3.material.io`, not an independent design system. Prefer files under `pages/` and inspect `index.json` for capture metadata, failed URLs, redirects, and suspicious pages.

Do not rely on a cache page whose capture metadata is missing, stale for the decision, failed, redirected unexpectedly, or marked suspicious without resolving that limitation through another current official source. A cache-backed decision records the exact cache snapshot and path.

## Official Material Design Kit

The official Material Design Kit is the visual authority only when published documentation does not contain enough detail for an exact visual decision.

Use the current Expressive component set when one exists. Use it for questions such as:

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

When required official guidance is unavailable, incomplete, stale, suspicious, or contradictory:

1. identify the exact unresolved decision;
2. determine whether the supported surface can be narrowed without losing a required scenario;
3. otherwise use `blocked` before production edits;
4. record a deliberate Mioframe deviation only when the product requirement explicitly requires it and the architecture handoff approves it.

Do not claim full Material 3 Expressive alignment for unresolved surfaces.

## PR expectation

Material PR descriptions or review notes name the exact sources used, for example:

- `components/buttons/overview`;
- `components/buttons/specs`;
- current Expressive component/token pages when distinct;
- `foundations/design-tokens/overview`;
- `foundations/interaction/states/overview`;
- `styles/color/roles`;
- official Design Kit file/version and component-set reference when visual evidence was required.

Use stable page names, snapshot metadata, direct verification dates, and Design Kit references instead of raw screenshots or generic source descriptions.

Review ownership and the required agent/operator evidence handoff are defined in `autonomous-review.md`.
