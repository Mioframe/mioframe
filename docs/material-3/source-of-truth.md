# Material 3 source of truth

## Canonical target

Official Mioframe Material components implement the current official **Material 3 Expressive** contract.

When official sources distinguish Expressive from baseline Material 3:

- current Expressive usage, anatomy, tokens, geometry, state composition, motion, and adaptive guidance are canonical;
- baseline Material 3 is not selected because it is simpler, already implemented, or more familiar;
- baseline behavior may remain only when no applicable Expressive contract exists or an explicit product deviation requires it;
- one supported surface must not silently mix baseline and Expressive contracts.

## Official authority

Use the narrowest current official source that resolves the decision.

1. Current published Material 3 Expressive documentation on `m3.material.io`.
2. The current official Material Design Kit only when published documentation does not resolve an exact visual decision.
3. Current repository code and tests as evidence of Mioframe behavior, never proof of Material correctness.

The MCP server and documentation cache are access mechanisms for official content, not independent design authorities.

Source-control history is not Material or implementation-contract evidence. Material authoring and review do not run, inspect, or cite `git`, `gh`, GitHub, commits, branches, pull requests, diffs, blame, logs, tags, merge state, or repository history.

## Documentation access order

1. `material3` MCP server from `Vyachean/m3-docs-mcp`.
2. `Vyachean/m3-docs-cache` when MCP is unavailable or incomplete for a required page.
3. Direct verification against the current official page when cache evidence is missing, stale, partial, suspicious, or inconsistent and the environment can access it.
4. The official Material Design Kit only for unresolved visual decisions.

An access mechanism does not gain authority from lookup order.

## Canonical source status

Every family authoring and review run records one:

- `current-complete` — every current family page and required structured source was available, successfully inspected, and not reported partial, truncated, suspicious, or stale for the decision;
- `snapshot-complete-stale` — a named snapshot contains the complete known family source set, but currentness is unverified;
- `partial` — one or more pages, routes, tables, graphs, or source records are missing, truncated, failed, suspicious, or only spot-checked;
- `conflicting` — applicable official sources materially disagree;
- `unavailable` — required official evidence cannot be accessed.

Record inventory status separately:

```text
Official capability inventory:
  complete
  snapshot-complete (<snapshot>; currentness unverified)
  incomplete (<exact gap>)
  blocked (<exact reason>)
```

`complete` requires `current-complete` source status.

A stale snapshot may support `snapshot-complete`, not `complete`.

A partial cache, missing page, truncated token graph, or spot-check-only review requires `incomplete` or `blocked`.

Spot checks may verify specific values or routes. They do not prove that every family capability has been discovered.

## Documentation source

Before planning or implementing Material work, inspect the relevant official pages:

- component overview, specs, guidelines, and accessibility;
- current Expressive component and token pages;
- design-token and foundation pages;
- interaction, motion, color, typography, shape, elevation, layout, and adaptive guidance;
- current deprecation or migration guidance.

Record stable page names, snapshot metadata, and direct-verification dates in the family README and audit.

## Cache fallback

A cache is a readable snapshot of `m3.material.io`, not an independent design system.

Inspect its metadata for:

- capture date;
- coverage status;
- failed or missing URLs;
- redirects;
- suspicious or truncated pages;
- freshness.

Do not convert a cache's own `partial`, failed, suspicious, or truncated status into a complete inventory claim.

Do not use a stale cache page for a decision whose currentness is material without recording the limitation and seeking current confirmation.

## Official Material Design Kit

The Design Kit is the visual authority only when published documentation does not contain enough detail for an exact visual decision.

Use it for:

- exact geometry;
- anatomy relationships;
- visual state composition;
- icon, shape, elevation, and alignment details missing from published specs.

It does not override documented behavior, accessibility, semantics, token meaning, or usage guidance.

Record:

```text
Design Kit source: <file/version>
Node or component set: <stable name or node reference>
Verified date: <YYYY-MM-DD>
```

If required Design Kit evidence is unavailable, mark the exact visual decision partial or blocked. Do not infer it from existing Mioframe screenshots.

## Capability interpretation

Distinguish:

- **official capability** — a real supported component feature, variant, mode, state, behavior, or configuration;
- **officially unsupported or invalid combination** — a documented prohibition or absent route, not missing capability;
- **optional guidance** — a recommendation or “can” choice, not automatically a required capability;
- **required behavior** — a normative contract for the implemented surface.

Do not place invalid combinations under `Not implemented`.

Do not convert optional guidance into missing capability unless the official contract makes it required for the implemented surface.

## Implementation references

Material Web or another implementation may be inspected only after the official contract is resolved and only as a non-authoritative implementation reference.

It must not:

- override official guidance;
- define Mioframe public API or ownership;
- justify unsupported behavior;
- replace native-platform reasoning or project tests.

## Non-sources

Do not use as Material authority:

- generic web search;
- third-party component libraries;
- screenshots without official provenance;
- older Material versions;
- memory;
- existing Mioframe rendering or baselines;
- repository history.

## Unavailable or conflicting guidance

When required guidance is unavailable, partial, stale, suspicious, or contradictory:

1. identify the exact unresolved decision;
2. determine whether the implemented surface can be narrowed safely;
3. otherwise use `blocked` before production changes that depend on the decision;
4. record an intentional deviation only for an explicit product requirement.

Do not claim current complete alignment for unresolved surfaces.

## Evidence recording

Use stable page names and source metadata, for example:

- `components/buttons/overview`;
- `components/buttons/specs`;
- `components/buttons/guidelines`;
- `components/buttons/accessibility`;
- `styles/motion/overview`;
- official Design Kit file/version and component-set reference.

Review ownership and operator visual handoff are defined in `autonomous-review.md`.
