# Material implementation review

This document separates independent technical review from operator visual comparison.

## Review boundary

`material-component-review` replaces only the family `AUDIT.md`.

The reviewer uses:

1. current implementation evidence;
2. current project documentation;
3. official Material 3 Expressive evidence.

The reviewer does not use source-control or remote state. Do not run, inspect, or cite `git`, `gh`, GitHub, commits, branches, pull requests, diffs, blame, logs, tags, merge state, or repository history.

Historical provenance is not needed to review current ownership, current behavior, current consumers, or the current documented contract.

## Canonical source status

Record one:

- `current-complete`;
- `snapshot-complete-stale`;
- `partial`;
- `conflicting`;
- `unavailable`.

Record inventory status as:

- `complete`;
- `snapshot-complete (<snapshot>; currentness unverified)`;
- `incomplete (<exact gap>)`;
- `blocked (<exact reason>)`.

`complete` requires all current family pages and required structured sources to be available and inspected without partial, truncated, suspicious, or unresolved coverage.

A stale snapshot may support a snapshot-complete inventory. It cannot certify current completeness. Spot checks verify specific claims, not family completeness.

## Capability classification

Classify each official item as exactly one of:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- officially unsupported or an invalid combination;
- unresolved because canonical evidence is incomplete or conflicting;
- outside the resolved family boundary.

`Not implemented` is reserved for a real official capability that exists but is absent.

An officially unsupported or invalid combination is a constraint, not a missing capability. It does not reduce official coverage when the implementation rejects or normalizes it coherently.

Optional or non-normative guidance is not automatically a capability. Record a relevant non-adoption as a project choice, deviation, or follow-up. It reduces coverage only when the canonical contract makes it required for the implemented surface.

## Stage 1 — implementation vs project documentation

Review:

- production code and physical ownership;
- public exports and consumers;
- family README claims and classification;
- applicable architecture and foundation/style contracts;
- public API, native semantics, accessibility, states, tokens, motion, and final property routing;
- extensions and deviations;
- tests, stories, rendered evidence, and verification claims;
- known defects, shared proof gaps, source limitations, and visual status.

Report:

- documented behavior missing from implementation;
- implementation behavior absent from documentation;
- code contradicting documented API, semantics, state, token, motion, or ownership rules;
- documentation claiming proof that tests or stories do not establish;
- real capability absent from implementation and absent from `Not implemented`;
- officially invalid combinations misclassified as missing capability;
- optional guidance inflated into required capability;
- partial or unverified capability misclassified;
- shared routes without representative proof;
- unfinished or rejected visible work hidden from README.

A declaration, alias, placeholder, story, test, or unchanged green check is not implementation or representative proof by itself.

## Stage 2 — project documentation vs Material 3 Expressive

Review:

- official family mapping and boundary;
- canonical source status and inventory claim;
- variants, sizes, shapes, modes, defaults, states, invalid combinations, semantics, and accessibility;
- anatomy and final property ownership;
- official color, elevation, icon, motion, shape, typography, interaction, ripple, and focus contracts;
- exact token names, values, meanings, and routes;
- classification of implemented, partial, absent, officially unsupported, unresolved, and out-of-family items;
- optional guidance and normative requirements;
- project extensions and deviations;
- exact pages, snapshots, and Design Kit evidence.

Do not certify current completeness from a partial, truncated, suspicious, stale-only, or spot-check-only source.

## Reconciliation

- Correct implementation when it differs from correct project documentation.
- Correct documentation and implementation when both follow a non-canonical contract.
- Correct only documentation when implementation matches Material but local text is stale.
- Record both mismatches when both layers diverge.
- Keep extensions only when explicit, coherent, and not presented as canonical Material.

The audit identifies whether each correction belongs to implementation, documentation, or both.

## Motion evidence

Verify a shared motion foundation deeply once.

At component level, require proportional evidence only:

- real input activates the intended rendered property;
- one meaningful intermediate state when needed to establish the route;
- the correct endpoint;
- safe interruption or cancellation;
- consumption of the documented shared motion contract.

Do not require frame-by-frame analysis. Do not duplicate equivalent pointer, touch, and keyboard paths. Forced state proves appearance, not motion.

## Shared route evidence

Root/system tokens, universal selectors, pseudo-elements, and shared formulas are cross-family work.

A shared route is resolved only when:

- current affected families are identified from current code;
- the owner is appropriately narrow;
- representative tests actually exercise the shared route;
- documentation describes current ownership and blast radius without unsupported historical claims.

Unchanged tests that never exercise the route do not close the evidence gap.

## Operator visual review

The operator evaluates visible fidelity, including geometry, spacing, shape, color, typography, elevation, state composition, focus indication, and perceived motion quality.

Visual status is:

- `not required`;
- `required`;
- `rejected`;
- `blocked`;
- `accepted`.

A known operator rejection is a confirmed open defect until production behavior changes and new evidence is accepted. A renamed contract, revised comment, or new test cannot close it.

The automated reviewer never invents operator acceptance.

## Compliance and coverage

Use:

- `compliant` — implementation and truthful documentation agree, current canonical evidence is sufficient, and no finding remains;
- `partially-compliant` — usable, but non-critical implementation, documentation, canonical-freshness, or verification gaps remain;
- `non-compliant` — a critical or high finding exists;
- `blocked` — evidence required for a material decision is unavailable or conflicting.

A stale snapshot cannot produce a fully current compliant result. Use `partially-compliant` when currentness is the only non-critical gap and `blocked` when it affects a material decision.

Coverage is:

- `full` — every actual official capability is implemented and verified;
- `partial` — at least one actual capability is absent, partial, defective, provisional, or unverified;
- `unresolved` — the inventory is not current-complete.

Officially unsupported combinations do not reduce coverage. Optional guidance does not reduce coverage unless required for the implemented surface.

## Correction loop

```text
AUDIT.md findings → material-component <family> → README/code/tests update →
material-component-review <family> → updated AUDIT.md
```

Authoring never edits the audit to declare its own work correct.

## Completion gate

A family leaves active migration only when:

- implementation and README agree;
- README accurately represents canonical Material and source limitations;
- classification is complete for the available evidence;
- every unsupported, partial, unresolved, extended, deviated, and remaining item is explicit;
- shared routes have representative proof;
- consumers are migrated and obsolete ownership is removed;
- local verification passes;
- required visual review is accepted.

A family is fully implemented only with current-complete canonical evidence, `Official coverage: full`, and accepted required visual review.
