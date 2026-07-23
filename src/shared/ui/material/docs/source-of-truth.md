# Material 3 source of truth

## Canonical target

Official Mioframe Material components implement the current applicable **Material 3 Expressive** contract.

When official sources distinguish Expressive from baseline Material 3:

- current Expressive usage, anatomy, tokens, geometry, states, motion, and adaptive guidance are canonical;
- baseline Material 3 is not selected because it is simpler, familiar, or already implemented;
- baseline behavior or geometry may remain only when no applicable Expressive contract exists or an explicitly approved product requirement requires a deviation;
- one supported component surface must not silently mix baseline and Expressive contracts.

## Authority order

Use the narrowest current official source that resolves the decision:

1. current published Material 3 documentation on `m3.material.io` for documented usage, anatomy, behavior, accessibility, tokens, foundations, motion, and adaptive guidance;
2. the current official Material Design Kit in Figma for exact visual details not resolved by published documentation;
3. native platform and web standards for semantics and browser behavior not defined by Material.

Repository code, tests, stories, screenshots, previous reviews, and third-party implementations describe existing behavior. They do not prove Material correctness.

## Source access

Use these access mechanisms in order:

1. the `material3` MCP server from `Vyachean/m3-docs-mcp`;
2. `Vyachean/m3-docs-cache` when MCP is unavailable or incomplete for a required page;
3. direct verification against the current published page when available evidence is missing, stale, suspicious, or contradictory;
4. the official Material Design Kit only for an unresolved visual decision.

An access mechanism does not become an independent authority. Stop lookup when every relevant decision is resolved by current traceable evidence.

## Required evidence

For the supported surface, record:

- stable official page names;
- snapshot, capture, or direct-verification date;
- Design Kit file/version and component reference when used;
- unavailable, conflicting, unsupported, or deliberately deviated areas.

Check only sources relevant to the component or foundation under consideration, such as:

- component overview, specs, guidelines, and accessibility;
- current Expressive component and token pages;
- relevant design-token and foundation pages;
- interaction state, motion, color, typography, shape, elevation, layout, and adaptive guidance;
- current deprecation or migration guidance.

## Cache fallback

The documentation cache is a readable snapshot of `m3.material.io`, not an independent design system.

- Prefer files under `pages/`.
- Inspect `index.json` for capture metadata, failed URLs, redirects, and suspicious pages.
- Do not rely on a page whose capture metadata is missing, stale for the decision, failed, unexpectedly redirected, or marked suspicious without resolving that limitation through another source.
- Record the exact cache revision and path used.

## Material Design Kit

Use the current Expressive component set when one exists and published documentation cannot resolve an exact visual question, including:

- component geometry or expressive dimensions;
- anatomy relationships;
- simultaneous-state appearance;
- icon, shape, elevation, and alignment details.

The Design Kit does not override documented behavior, accessibility, native semantics, token meaning, or usage guidance.

Record:

```text
Design Kit source: <file/version>
Component or node reference: <stable reference>
Verified date: <YYYY-MM-DD>
```

When required visual evidence is unavailable, mark the exact decision unresolved. Do not infer it from the current implementation or screenshot baseline.

## Implementation references

Material Web or another implementation may be inspected only after the official contract is resolved and only as a non-authoritative implementation reference.

It must not:

- override official guidance;
- define Mioframe public API or ownership;
- justify unsupported behavior;
- replace native-platform reasoning or repository verification.

## Non-sources

Do not use as Material authority:

- generic search summaries;
- third-party component libraries;
- screenshots without official provenance;
- older Material versions when a current contract exists;
- memory;
- existing Mioframe rendering or snapshots.

## Unavailable or conflicting guidance

When required official guidance is unavailable, incomplete, stale, suspicious, or contradictory:

1. identify the exact unresolved decision;
2. determine whether unsupported optional scope can be omitted without losing a required scenario;
3. otherwise block the affected design decision before implementation;
4. record a deliberate deviation only when an explicit product requirement requires it.

Do not claim Material 3 Expressive alignment for unresolved surfaces.
