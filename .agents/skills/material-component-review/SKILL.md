---
name: material-component-review
description: 'Use when the user provides a Material component or family name and wants an independent two-stage review: implementation against project documentation, then project documentation against canonical Material 3 Expressive. Replace only the family AUDIT.md.'
---

# Material component review

Use this as the one-name, review-only entrypoint.

## Input

```text
material-component-review Button
material-component-review Switch
material-component-review Navigation rail
```

The component name is sufficient.

## Review boundary

Resolve the official documentation family and canonical directory:

```text
src/shared/ui/material/components/<official-docs-slug>/
```

The only file changed by this workflow is:

```text
src/shared/ui/material/components/<official-docs-slug>/AUDIT.md
```

Do not modify production code, tests, stories, family `README.md`, `VISUAL_REVIEW.md`, exports, consumers, roadmap, registries, or policy during review.

Work from the current workspace only. Do not run, inspect, or cite `git`, `gh`, GitHub, commits, branches, pull requests, diffs, blame, logs, tags, merge state, or repository history. The audit contains no source-control or remote metadata.

## Evidence sets

Keep four evidence sets distinct:

1. **Implementation evidence** — current production code, exports, consumers, tests, stories, rendered behavior, and applicable foundation/style implementations.
2. **Project documentation** — the family `README.md` plus directly applicable architecture, foundation/style contracts, testing rules, and local instructions.
3. **Canonical evidence** — official Material 3 Expressive documentation, exact token references, and the Design Kit only where published documentation does not resolve an applicable visual decision.
4. **Operator visual evidence** — the family `VISUAL_REVIEW.md` when present.

Project documentation is the intended Mioframe contract, but it is not Material authority. Tests and rendering are implementation evidence, not authority.

Inspect the previous `AUDIT.md`, but independently re-evaluate every conclusion from current files and official sources.

`VISUAL_REVIEW.md` is operator-owned. Read it exactly as written. Never modify it, downgrade `rejected` to `required`, infer acceptance, or close its findings.

## Canonical source status

Record one:

- `current-complete`;
- `snapshot-complete-stale`;
- `partial`;
- `conflicting`;
- `unavailable`.

Use inventory status:

- `complete`;
- `snapshot-complete (<snapshot>; currentness unverified)`;
- `incomplete (<exact gap>)`;
- `blocked (<exact reason>)`.

`complete` requires every current family page and required structured source to be available and inspected without partial, truncated, suspicious, or unresolved coverage.

A stale snapshot can be snapshot-complete, but cannot certify current canonical completeness. A partial cache, missing page, truncated token graph, or spot-check-only review requires `incomplete` or `blocked`. Spot checks may verify particular implementation facts; they cannot certify the complete family inventory.

## Build the independent capability inventory

Classify each official item as exactly one of:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- officially unsupported or an invalid combination;
- unresolved because canonical evidence is incomplete or conflicting;
- outside the resolved family boundary, with the separate official owner named.

`Not implemented` contains only real official capability that exists but is absent.

An officially unsupported or invalid combination is a constraint, not a missing capability. It does not reduce official coverage when the implementation rejects or normalizes it coherently.

Optional or non-normative guidance is not automatically a capability. Record relevant non-adoption as a project choice, deviation, or follow-up. It reduces coverage only when the canonical contract makes it required for the implemented surface.

Current consumer demand affects implementation priority, not inventory completeness.

## Required audit order

### Stage 1 — implementation against project documentation

Check:

- every documented implemented capability works at its final owner;
- API, defaults, invalid combinations, semantics, accessibility, states, tokens, motion, and property routes match current code and rendering;
- extensions and deviations behave as documented;
- exports, consumers, migration state, tests, stories, and verification claims are accurate;
- every known defect, omission, missing proof, source limitation, shared blast radius, and visual uncertainty is documented;
- classification separates absent capability from officially invalid combinations and optional guidance;
- README visual claims agree with `VISUAL_REVIEW.md` when it exists;
- directly applicable architecture and shared foundation/style rules are followed.

A declaration, alias, placeholder, story, test, or unchanged green check is not implementation or representative proof by itself.

Do not use historical provenance to resolve a current ownership or compliance question. Review current owner, current consumers, current behavior, and current documented contract.

A README claim that a visually rejected behavior is resolved is a Stage 1 finding even when the technical route is connected.

### Stage 2 — project documentation against Material 3 Expressive

Check:

- official family mapping and boundary;
- source status and inventory completeness claims;
- variants, sizes, shapes, modes, defaults, states, invalid combinations, semantics, and accessibility;
- anatomy and final property ownership;
- canonical color, elevation, icons, motion, shape, typography, state, ripple, and focus meanings;
- exact token names, values, routes, and component boundaries;
- classification of implemented, partial, absent, officially unsupported, unresolved, and out-of-family items;
- optional guidance is not inflated into a missing capability;
- extensions and deviations are explicit;
- cited sources actually support the claims.

If current canonical evidence is stale, partial, truncated, or conflicting, report the exact limitation. Do not certify a current-complete inventory from it.

## Reconcile the stages

- Correct implementation when it differs from correct project documentation.
- Correct documentation and implementation when both follow a non-canonical contract.
- Correct only documentation when implementation matches Material but local text is stale.
- Record both mismatches when implementation and documentation independently diverge.
- Keep extensions only when explicit, coherent, and not presented as canonical Material.

The audit must identify whether each correction belongs to implementation, project documentation, or both.

## Motion and visual evidence

Verify the shared motion foundation deeply once.

At component level, require only proportional evidence that:

- real input activates the intended rendered property;
- a meaningful intermediate state is observable when needed to prove the route;
- the correct endpoint is reached;
- interruption or cancellation leaves no stale state;
- the component consumes the documented shared motion contract.

Do not require frame-by-frame component analysis or duplicate equivalent input paths. Forced state proves appearance, not motion.

When `VISUAL_REVIEW.md` exists:

- copy its status into the audit;
- include it under operator visual evidence;
- treat every rejection as a confirmed open defect;
- require production correction and a later operator review;
- do not change its status based on tests, comments, documentation, or technical routing.

When it is absent, report `required`, `blocked`, or `not required` based on the visible change. The automated reviewer never reports `accepted` without an accepted operator file.

## Shared routes

Treat root/system tokens, universal selectors, pseudo-elements, and shared formulas as cross-family work.

A shared route is resolved only when:

- current affected families are identified from current code;
- the owner is appropriately narrow;
- representative tests actually exercise the route across affected contract classes;
- documentation describes current ownership and blast radius without unsupported historical claims.

Unchanged tests that never exercise the shared route are not representative proof.

## Finding formats

### Stage 1 finding

```text
Severity: critical | high | medium | low
Project requirement:
Implementation evidence:
Implementation-to-project mismatch:
Required correction:
```

### Stage 2 finding

```text
Severity: critical | high | medium | low
Material 3 Expressive requirement:
Project documentation claim:
Project-to-Material mismatch:
Required correction:
```

Use:

- `critical` — invalid component choice, unsafe semantics, or severe accessibility/interaction corruption;
- `high` — required API, state, token, motion, ownership, migration, major visual contract, or unchanged operator-rejected behavior is wrong;
- `medium` — bounded mismatch, incomplete representative proof, misleading documentation, inaccurate inventory, or non-critical canonical divergence;
- `low` — minor documentation or cleanup defect.

Put unresolved authoritative evidence under `Evidence gaps`, not speculative findings.

## Compliance and coverage

Use one overall result:

- `compliant` — the implemented surface matches truthful project documentation, current canonical evidence is sufficient, and no confirmed technical or documentation finding remains;
- `partially-compliant` — usable, but non-critical implementation, documentation, canonical-freshness, or verification gaps remain;
- `non-compliant` — a critical or high finding exists, including an unchanged rejected visual contract;
- `blocked` — evidence required for a material decision is unavailable or conflicting.

A snapshot-complete but stale source cannot produce a fully current `compliant` result. Use `partially-compliant` when the implemented surface is otherwise verified and currentness is the only non-critical gap; use `blocked` when the unresolved currentness affects a material decision.

Report coverage separately:

- `full` — every actual official capability is implemented and verified;
- `partial` — at least one actual official capability is absent, partial, defective, provisional, or unverified;
- `unresolved` — the capability inventory is not current-complete.

Officially unsupported combinations do not reduce coverage. Optional guidance does not reduce coverage unless it is required for the implemented surface.

## AUDIT.md structure

Replace the family audit with:

```text
# <Family> implementation audit

Reviewed: <date>
Result: compliant | partially-compliant | non-compliant | blocked
Canonical source status: current-complete | snapshot-complete-stale | partial | conflicting | unavailable
Official capability inventory: complete | snapshot-complete (...) | incomplete (...) | blocked (...)
Official coverage: full | partial | unresolved
Project implementation documentation: README.md
Operator visual evidence: missing | VISUAL_REVIEW.md
Visual review: not required | required | rejected | blocked | accepted

## Evidence
### Project documentation reviewed
### Material 3 Expressive evidence
### Operator visual evidence

## Official capability coverage
### Implemented and verified
### Partial / defective / unverified
### Not implemented
### Officially unsupported / invalid combinations
### Unresolved evidence
### Outside this family boundary

## Stage 1 — implementation vs project documentation
### Findings
### Verified agreement

## Stage 2 — project documentation vs Material 3 Expressive
### Findings
### Verified agreement

## Evidence gaps
## Required next work
```

Use explicit `none` for empty categories. The `Not implemented` list is independently verified, not copied from the README.

## Output

Finish with:

```text
MATERIAL COMPONENT REVIEW
Official family:
Official documentation path:
Implementation path:
Project implementation documentation:
Audit file:
Operator visual evidence: missing | <path>/VISUAL_REVIEW.md
Canonical source status:
Official capability inventory:
Official coverage:
Stage 1 result:
Stage 2 result:
Overall result:
Visual review:
Implemented and verified:
Partial / defective / unverified:
Not implemented:
Officially unsupported / invalid combinations:
Unresolved / out-of-family:
Implementation/documentation findings:
Documentation/Material findings:
Evidence gaps:
Required next work:
```

A review is complete only after `AUDIT.md` is written, uses only current-workspace and official evidence, and reports source status, classification, compliance, coverage, and operator visual status honestly.