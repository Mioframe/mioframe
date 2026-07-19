# Material 3 Expressive sources

## Canonical target

Official Mioframe Material components implement the current applicable Material 3 Expressive contract.

When official sources distinguish Expressive from baseline Material 3:

- current Expressive usage, anatomy, tokens, geometry, state composition, motion, and adaptive guidance are canonical;
- baseline Material 3 is not selected because it is simpler, familiar, or already implemented;
- baseline behavior may remain only when no applicable Expressive contract exists for the supported surface or an explicit compatibility decision records a deviation;
- one supported surface must not silently mix baseline and Expressive contracts.

## Authority order

Use the narrowest current official source that resolves the decision:

1. current published Material 3 Expressive documentation on `m3.material.io` for documented usage, anatomy, behavior, accessibility, tokens, foundations, motion, and adaptive guidance;
2. the current official Material Design Kit for exact visual geometry or state composition only when published documentation does not resolve the decision;
3. current repository code and tests only as evidence of existing Mioframe behavior, never as proof of Material correctness.

The `material3` MCP server and `Vyachean/m3-docs-cache` are access mechanisms, not independent authorities.

## Access workflow

1. Use the `material3` MCP server first.
2. Use `Vyachean/m3-docs-cache` only when MCP is unavailable or incomplete for the required page.
3. Verify the current published page directly when cached evidence is missing, stale, suspicious, redirected unexpectedly, or contradictory and direct access is available.
4. Use the official Design Kit only for an applicable visual decision unresolved by published guidance.
5. Stop lookup when the decisions required by the supported surface are resolved by traceable evidence.

Record stable page names and snapshot, capture, or direct verification dates in the owning family or foundation README. When Design Kit evidence is used, record the file/version and stable component or node reference.

## Non-authoritative references

Material Web or another implementation may be inspected only after the official contract is resolved and only as a non-authoritative implementation reference.

Do not use as Material authority:

- generic web search results;
- third-party component libraries;
- screenshots without official provenance;
- older Material versions;
- memory;
- existing Mioframe rendering or snapshots.

## Missing or conflicting evidence

When evidence required for a current scenario is unavailable, incomplete, stale, suspicious, or contradictory:

1. name the exact unresolved decision;
2. narrow unsupported optional surface when required scenarios remain complete;
3. otherwise report `blocked` before production edits;
4. record a deviation only when an explicit current requirement needs it and its owner is clear.

Do not claim full Material 3 Expressive alignment for unresolved surface.
