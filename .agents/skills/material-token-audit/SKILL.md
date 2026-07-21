---
name: material-token-audit
description: 'Internal read-only role for auditing only token taxonomy, ownership, dependency direction, public/private routing, static validation, and rendered token proof for a bounded Material concern set. Use only when material-component or material-foundation delegates the token lane.'
---

# Material token audit

Audit only the delegated token graph slice and its direct rendered consumers. Follow `src/shared/ui/material/docs/tokens.md`.

## Inputs

Receive:

- family or foundation domain;
- exact token concern set and supported scenarios;
- locked canonical token names, meanings, and value kinds;
- current repository ref;
- declaration, implementation, and proof paths to inspect;
- applicable repository instructions.

Do not audit unrelated API, layout, or motion behavior. Report a web or semantics dependency instead of absorbing it.

## Responsibility

Reconstruct every declaration and `var()` edge in the delegated graph slice:

- classification: `md-ref`, `md-sys`, `md-comp`, `mio-sys`, `mio-comp`, private route, invalid alias, or obsolete;
- declaration owner and allowed location;
- public/private status;
- direct dependencies and dependency direction;
- duplicate declarations, unresolved references, fallbacks, and cycles;
- configuration/state selector that chooses the route;
- final rendered property or narrow foundation bridge;
- expected value kind and actual CSS grammar;
- static guard, browser, and consumer proof.

Report invented names, ambiguous aliases, wrong placement, namespace collisions, public private-route dependencies, upward or cross-family edges, cycles, fallback-masked requirements, duplicate/dead component tokens, unnecessary private hops, and token-driven shorthand without computed-longhand proof.

## Evidence discipline

- The exact graph is a transient result, not README content.
- Official token semantics come from the locked target; do not re-research unrelated token groups.
- Run or inspect the repository token guard result when execution evidence is available. If required execution is unavailable, return `blocked — missing static token evidence`.
- Static success never proves rendered behavior.

## Result

```text
MATERIAL ROLE RESULT
Role: token-audit
Scope:
Graph slice:
Status: complete | blocked
Static token guard: passed | failed | unavailable
Findings: <consolidated, maximum 12>
Rendered-proof gaps:
External lane blockers: none | web | semantics | foundation | <exact blocker>
Blocker: none | <exact blocker>
```

## Forbidden

- repository edits or delegation;
- canonical-token changes;
- full-family semantics or motion review;
- correction-unit selection or implementation;
- copying the exact graph into the README;
- repeating confirmed source research without contradictory evidence;
- runtime token managers, registries, generators, or speculative abstractions.