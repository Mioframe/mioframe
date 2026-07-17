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

Do not modify production code, tests, stories, family `README.md`, exports, consumers, roadmap, registries, or policy during review.

The audit contains no branch, commit, pull-request, remote-check, or merge metadata.

## Evidence sets

Keep three evidence sets distinct:

1. **Implementation evidence** — production code, exports, consumers, tests, stories, rendered behavior, and applicable foundation/style implementations.
2. **Project documentation** — the family `README.md` plus directly applicable project architecture, foundation/style contracts, testing rules, and local instructions.
3. **Canonical evidence** — current official Material 3 Expressive documentation, exact token references, and the Design Kit only where published documentation does not resolve an applicable visual decision.

Project documentation is the intended Mioframe contract, but it is not Material authority. Tests and rendering are implementation evidence, not authority for either documentation layer.

Inspect the previous `AUDIT.md` when present, but independently re-evaluate every conclusion.

## Build the independent official capability inventory

Before accepting the README's coverage claims, independently reconstruct the complete contract-level capability inventory for the resolved official family.

Include all documented:

- public subcomponents and family members;
- variants, styles, sizes, shapes, widths, modes, and configurations;
- defaults, states, selected/unselected routes, and invalid combinations;
- native semantics, accessibility, target, focus, keyboard, pointer, touch, and adaptive behavior when applicable;
- anatomy, token surfaces, visual systems, motion, elevation, and documented interactions;
- official optional capability even when no current Mioframe consumer requires it.

Do not require one audit row for every individual token when a coherent grouped contract preserves complete traceability. Do not omit a capability because it is optional, low priority, unused, expensive, or planned for later.

Classify every official capability as:

- implemented and verified;
- implemented but partial, defective, provisional, or unverified;
- not implemented;
- unresolved because canonical evidence is incomplete or conflicting;
- outside the resolved family boundary, with the separate official owner named.

Current consumer demand affects implementation priority, not inventory completeness.

## Required audit order

Always perform the review in this order.

### Stage 1 — implementation against project documentation

First determine whether the actual implementation matches the contract documented by the project.

Check:

- every capability listed under `Implemented` actually works at its final owner;
- every documented API, default, invalid combination, semantic, accessibility, state, token, motion, and property route matches code and rendered behavior;
- every documented extension or deviation behaves as described;
- exports, consumers, migration state, tests, stories, and verification claims are accurate;
- every known defect, provisional route, omission, missing proof, or visual uncertainty is documented;
- every official capability absent from implementation appears under `Not implemented`, regardless of current project need;
- every partial or unverified official capability appears under `Known issues and required follow-up` rather than being presented as implemented or silently omitted;
- directly applicable project architecture and shared foundation/style rules are followed.

Report separately:

- documented capability missing or incorrect in implementation;
- implemented capability or behavior absent from documentation;
- implementation behavior contradicting project documentation;
- documentation claiming proof that tests or stories do not establish;
- official capability absent from implementation and absent from the README inventory;
- partial or unverified capability misclassified as fully implemented or fully absent;
- implementation violating an applicable project architecture or ownership rule.

A declaration, alias, placeholder, story, or test is not implementation by itself. A route exists only when changing its source input can affect the final output through a real dependency.

Do not yet assume that project documentation is correct relative to Material.

### Stage 2 — project documentation against Material 3 Expressive

Then independently compare the documented project contract and capability inventory with canonical Material 3 Expressive.

Check:

- official family choice and documentation mapping;
- whether the README's official capability inventory is complete against all current family pages;
- supported variants, sizes, shapes, modes, defaults, states, and invalid combinations;
- native semantics and accessibility requirements;
- anatomy and final property ownership;
- canonical color, elevation, icons, motion, shape, typography, state, ripple, and focus meanings;
- official token names, values, state routes, and component boundaries;
- whether every unimplemented official capability is named, regardless of current consumer need;
- whether omitted official capability is classified accurately and does not break the minimum complete implemented surface;
- whether project extensions and intentional deviations are explicitly identified rather than presented as canonical Material behavior;
- whether source pages and snapshots cited by the project actually support its claims.

Report separately:

- project documentation that contradicts Material 3 Expressive;
- invented, obsolete, or misinterpreted Material contracts;
- required canonical behavior missing from the documented implemented surface;
- undocumented deviation from Material;
- project extension presented as official Material behavior;
- any official capability missing from both `Implemented` and `Not implemented`/known-issue documentation;
- incomplete or inaccurate official capability inventory;
- insufficient or contradictory canonical source evidence.

A documented optional capability outside the current implementation surface is not automatically an implementation defect. It must still be listed in both README and AUDIT. The audit reports official coverage separately from technical compliance.

## Reconcile the two stages

After both stages, determine the required correction direction.

- If implementation differs from correct project documentation, correct implementation.
- If project documentation differs from Material while implementation follows it, correct project documentation and implementation together.
- If implementation matches Material but project documentation is stale or wrong, correct project documentation; do not regress implementation to match the stale text.
- If both implementation and project documentation differ from Material, identify both mismatches explicitly.
- If a Mioframe extension or intentional deviation is required, keep it only when it is explicit, coherent, tested where applicable, and not represented as canonical Material.

The audit must make it possible to tell whether each problem belongs to implementation, project documentation, or both.

## Motion and shared routes

For motion, verify at both stages:

- what project documentation claims as the runtime contract;
- what the implementation actually consumes;
- what Material 3 Expressive requires;
- the actual animated property owner and state routing;
- absence of dead tokens, fake dependencies, or conflicting timing;
- reduced-motion handling when required.

Do not require frame-by-frame browser analysis for ordinary CSS transitions.

When numeric official spring parameters cannot drive CSS directly, they may remain documented canonical source evidence while one honest Web adaptation is the project runtime contract. Project documentation must clearly distinguish those two facts.

Treat root/system token, universal-selector, pseudo-element, and shared-formula changes as cross-family work. Compare their implementation with project ownership rules before comparing the documented shared contract with Material.

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

When one issue affects both stages, use the same concise issue name in both sections and state the combined correction order under `Required next work`.

Use:

- `critical` — invalid component choice, unsafe semantics, or severe accessibility/interaction corruption;
- `high` — required API, state, token, motion, ownership, migration, or major visual contract is wrong;
- `medium` — bounded mismatch, incomplete proof, misleading documentation, incomplete capability inventory, or non-critical canonical divergence;
- `low` — minor documentation or cleanup defect.

Do not report speculation as a finding. Put unresolved authoritative evidence under `Evidence gaps`.

## Compliance and coverage results

Use exactly one overall compliance result derived from both stages:

- `compliant` — the implemented surface matches truthful project documentation, and that documentation accurately represents Material 3 Expressive plus explicit extensions/deviations;
- `partially-compliant` — usable, but confirmed non-critical implementation, project-documentation, canonical-alignment, or verification gaps remain;
- `non-compliant` — a critical or high finding exists in either comparison stage;
- `blocked` — evidence required for either comparison stage is unavailable or materially conflicting.

Report official capability coverage separately:

- `full` — every official capability in the resolved family is implemented and verified;
- `partial` — at least one official capability is explicitly not implemented, partial, defective, provisional, or unverified;
- `unresolved` — the canonical inventory cannot yet be completed because evidence is unavailable or conflicting.

A family with `partial` coverage must not be described as fully implemented even when its implemented surface is compliant.

Visual comparison may still be required after a technically compliant audit. Record it separately; do not hide technical or documentation findings behind operator review.

## AUDIT.md structure

Replace the family audit with:

```text
# <Family> implementation audit

Reviewed: <date>
Result: compliant | partially-compliant | non-compliant | blocked
Official capability inventory: complete | incomplete | blocked
Official coverage: full | partial | unresolved
Project implementation documentation: README.md
Visual review: not required | required | blocked | accepted

## Evidence
### Project documentation reviewed
### Material 3 Expressive evidence

## Official capability coverage
### Implemented and verified
### Partial / defective / unverified
### Not implemented
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

The audit's `Not implemented` list is mandatory even when the README already contains the same omissions. It is the reviewer's independently verified coverage result, not a copy accepted without checking.

Use explicit `none` for empty findings, coverage categories, verified agreement, and evidence gaps.

## Output

Finish with:

```text
MATERIAL COMPONENT REVIEW
Official family:
Official documentation path:
Implementation path:
Project implementation documentation: <path>/README.md
Audit file: <path>/AUDIT.md
Official capability inventory: complete | incomplete | blocked
Official coverage: full | partial | unresolved
Stage 1 result: implementation matches | findings | blocked
Stage 2 result: documentation matches Material | findings | blocked
Overall result:
Visual review:
Implemented and verified:
Partial / defective / unverified:
Not implemented:
Unresolved official capability:
Implementation/documentation findings:
Documentation/Material findings:
Evidence gaps:
Required next work:
```

A review is complete only after the colocated `AUDIT.md` is written and independently lists the complete official capability coverage.
