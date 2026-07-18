# Material 3 Expressive source of truth

## Authority order

1. Current official `m3.material.io` documentation for component, foundation, style, usage, behavior, accessibility, and token contracts.
2. The current official Material Design Kit only when published documentation does not resolve an exact visual decision.
3. Current repository code and tests as evidence of Mioframe behavior, never proof of Material correctness.
4. Explicit operator feedback in the current user task as evidence of accepted or rejected perceived visual behavior.

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

## Operator feedback

Operator feedback does not define canonical Material. It determines whether the current visible Mioframe result is accepted.

- A reported visual defect is authoritative evidence that current output is rejected.
- Authoring persists the feedback in the family README.
- A production behavior change may move status to `awaiting re-review`.
- Only an explicit user acceptance message may set `accepted`.
- Tests, screenshots, technical routing, or silence do not imply acceptance.