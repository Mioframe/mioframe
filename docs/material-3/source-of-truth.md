# Material 3 Expressive source of truth

## Authority order

1. Current official `m3.material.io` documentation for component, foundation, style, usage, behavior, accessibility, and token contracts.
2. The current official Material Design Kit only when published documentation does not resolve an exact visual decision.
3. Current repository code and tests as evidence of Mioframe behavior, never proof of Material correctness.
4. Explicit operator feedback in the current task as evidence of accepted or rejected perceived visual behavior.

The Material MCP server and its cache are access mechanisms for official content, not independent design authorities.

Source-control history is not Material authority. The current diff may be inspected for scope, unrelated changes, ownership drift, and regression risk; it must not be used to infer the canonical Material contract.

## Documentation access order

1. Read the required family or foundation pages and structured token data through the current `material3` MCP server.
2. Use `Vyachean/m3-docs-cache` only when the MCP route is unavailable or incomplete for a required source.
3. Verify directly against the current official page when the MCP reports missing, partial, failed, suspicious, truncated, or conflicting evidence, or when a concrete reason suggests the contract changed.
4. Use the official Material Design Kit only for unresolved objective visual decisions.

An access mechanism does not gain authority from lookup order.

## Working freshness rule

A fresh successful MCP read is the current working official source when:

- every required page and structured source for the decision was read in the current run;
- the MCP does not report the result as partial, failed, suspicious, truncated, or conflicting;
- no inspected evidence contradicts the result;
- there is no concrete reason to believe current official behavior differs.

The underlying capture date is provenance metadata. Age alone does not downgrade a healthy current MCP read or create an implementation defect.

Use `snapshot-complete-stale` only when the run relies on a retained snapshot without a current successful MCP read, or when the access mechanism explicitly reports that freshness is materially unresolved.

## Canonical source status

Every authoring and review run records one:

- `current-complete` — all required current-run MCP routes were successfully inspected and none was incomplete, suspicious, truncated, or conflicting;
- `snapshot-complete-stale` — a named retained snapshot is complete for the known source set, but no current successful lookup established working freshness;
- `partial` — one or more required pages, routes, tables, graphs, or source records are missing, truncated, failed, suspicious, or only spot-checked;
- `conflicting` — applicable official sources materially disagree;
- `unavailable` — required official evidence cannot be accessed.

Record inventory status separately:

```text
Official capability inventory:
  complete
  snapshot-complete (<snapshot>; currentness unresolved)
  incomplete (<exact gap>)
  blocked (<exact reason>)
```

`complete` requires `current-complete` source status. Spot checks may verify named values or routes, but they do not prove complete family discovery.

## Required source coverage

Before planning or implementing Material work, inspect applicable:

- component overview, specs, guidelines, and accessibility;
- current Expressive component and token sources;
- design-token and foundation sources;
- interaction, motion, color, typography, shape, elevation, layout, and adaptive guidance;
- current deprecation or migration guidance.

Record stable page names, current-run lookup status, and source provenance in the owning README and AUDIT. Do not turn provenance dates into blockers without a material evidence problem.

## Cache failure handling

Inspect access metadata for:

- coverage status;
- failed or missing URLs;
- redirects;
- suspicious or truncated pages;
- reported freshness limitations.

Do not convert a partial, failed, suspicious, or truncated source into a complete inventory claim. Do not continue implementation when the missing evidence prevents an objective decision; record the exact blocker instead.

## Official Material Design Kit

The Design Kit is visual authority only when published documentation does not contain enough detail for an exact objective decision.

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

Operator feedback does not define canonical Material. It determines whether the visible Mioframe result is accepted.

- A reported visual defect is authoritative evidence that current output is rejected.
- Authoring persists the feedback in the family README.
- A production behavior change may move status to `awaiting re-review` only after affected objective gates are rechecked.
- Only an explicit user acceptance message may set `accepted`.
- Tests, screenshots, technical routing, review text, or silence do not imply acceptance.
