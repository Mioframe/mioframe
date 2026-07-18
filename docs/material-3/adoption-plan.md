# Material 3 adoption plan

## Principle

Adopt Material incrementally through real family migrations.

Do not build a complete validation framework, exhaustive migration database, generic test DSL, empty documentation-shaped runtime tree, or mass source migration before real families prove the need.

Every in-scope shared UI artifact eventually reaches one outcome:

- canonical official Material component, foundation, or style owner;
- explicitly retained project-specific or generic UI owner outside Material;
- removed or consolidated obsolete owner.

Implementation may be incremental. Classification and source limitations must remain explicit.

## Library navigation

The canonical library mirrors official Material navigation:

```text
src/shared/ui/material/
  foundations/
  styles/
  components/
```

Family and domain directories use official documentation slugs. Production directories are created only when implementation work begins.

## Workflow evidence boundary

Material family authoring and review operate from current workspace files, official Material sources, and local project verification.

They do not use `git`, `gh`, GitHub, branches, commits, pull requests, diffs, blame, logs, tags, merge state, or repository history as evidence or workflow input.

## Family migration loop

Each family follows one loop:

1. inspect current implementation, exports, consumers, tests, stories, README, and previous audit;
2. resolve the official family and documentation path;
3. record canonical source status;
4. reconstruct the supported contract-level inventory without overstating incomplete sources;
5. classify each item as implemented, partial/unverified, not implemented, officially unsupported/invalid, unresolved, or outside the family boundary;
6. select the minimum coherent implementation surface required by current scenarios;
7. update the canonical family README;
8. correct directly applicable defective rules;
9. change shared foundations/styles only for a real cross-family need;
10. implement the selected surface and migrate consumers;
11. remove obsolete ownership;
12. add proportional tests and visual evidence;
13. run local verification;
14. run an independent current-workspace review that changes only AUDIT;
15. perform operator visual review when required;
16. update the queue and select another family in a later run.

Current consumer need determines implementation priority, not whether an item is classified.

## Source and inventory status

Record:

```text
Canonical source status:
  current-complete
  snapshot-complete-stale
  partial
  conflicting
  unavailable

Official capability inventory:
  complete
  snapshot-complete (<snapshot>; currentness unverified)
  incomplete (<exact gap>)
  blocked (<exact reason>)

Official coverage:
  full
  partial
  unresolved
```

Use `complete` only with current-complete evidence.

A stale snapshot may be snapshot-complete. A partial, truncated, suspicious, missing, or spot-check-only source cannot certify complete inventory.

## Classification rules

Use exactly one category per item:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- officially unsupported or an invalid combination;
- unresolved because canonical evidence is incomplete or conflicting;
- outside the resolved family boundary.

`Not implemented` is reserved for real supported capability that exists but is absent.

Officially unsupported combinations do not reduce coverage.

Optional or non-normative guidance is documented as a choice, deviation, or follow-up. It does not reduce coverage unless required for the implemented surface.

## Documentation contract

### Authoring README

The implementing agent owns:

```text
src/shared/ui/material/components/<official-docs-slug>/README.md
```

It records:

- official mapping and source status;
- inventory status and official coverage;
- implemented capability;
- partial, defective, provisional, ambiguous, or unverified capability;
- every actual capability not implemented;
- officially unsupported and invalid combinations;
- unresolved and out-of-family items;
- known issues and required follow-up;
- API, semantics, states, tokens, and final property ownership;
- foundation/style dependencies;
- extensions and deviations;
- consumers, verification, review status, and visual status.

Any production change marks review required. Authoring never edits AUDIT.

A known operator-rejected visual behavior remains open until production behavior changes and new evidence is accepted.

### Independent AUDIT

The reviewer owns:

```text
src/shared/ui/material/components/<official-docs-slug>/AUDIT.md
```

The reviewer:

- changes only AUDIT;
- uses only current workspace and official evidence;
- independently records source status and inventory limitations;
- checks implementation against project documentation;
- checks project documentation against canonical Material;
- separates absent capability from invalid combinations and optional guidance;
- requires representative proof for shared routes;
- preserves known visual rejection until accepted.

Compliance, coverage, source status, and visual status remain separate.

## Pilot 1 — Buttons

Buttons validate:

- official path `components/buttons`;
- full legacy-to-canonical migration;
- honest source and inventory status;
- correct classification of capability, invalid combinations, and optional guidance;
- public API, semantics, accessibility, state, token, shape, elevation, and motion ownership;
- representative proof for shared routes;
- proportional motion evidence without frame-by-frame component testing;
- persistence of operator-rejected visual defects until accepted;
- consumer migration and obsolete-owner removal;
- independent review.

Current state and findings live only in:

- `src/shared/ui/material/components/buttons/README.md`;
- `src/shared/ui/material/components/buttons/AUDIT.md`.

## Pilot 2 — independent stateful family

`MDSwitch` is the default candidate unless inventory evidence identifies a better family.

It should validate:

- controlled semantic state;
- disabled and presentation contracts;
- materially distinct input paths only;
- cancellation and cleanup;
- multiple anatomy owners;
- accessibility, target area, focus, ripple, motion, shape, and color;
- the same source-status, classification, README/AUDIT, and visual-rejection model without Button assumptions.

After two pilots, consolidate only mechanisms both migrations prove useful.

## Sequential migration

After the pilots:

1. select one unblocked queued family;
2. resolve official sources and source status;
3. reconstruct and classify the inventory honestly;
4. complete one coherent implementation surface, migration, proof, local verification, and independent audit;
5. complete visual review when required;
6. update inventory and coverage state;
7. stop before starting a second family.

## Rule refinement

When implementation exposes a rule defect:

- identify current-workspace evidence;
- update the owning rule with the smallest correction;
- update only directly affected instructions;
- do not preserve the defect through a family-specific exception;
- do not broaden the correction into unrelated architecture work.

## Shared domain changes

- Reuse an existing owner when sufficient.
- Keep family-local behavior local.
- Create a shared owner only for a real cross-family contract.
- Identify current affected families from current code.
- Require representative tests that exercise the shared route.
- Do not count unrelated unchanged green tests as proof.
- Split broad work only when its impact cannot be reviewed safely with the family.

## Evidence-driven automation

Add a guard only when repeated real work proves a stable, precise, inexpensive check with low false positives.

Do not automate interpretation of official documentation, semantic completeness, architectural correctness, Markdown honesty, perceived motion quality, or visual fidelity.

## Program completion

The program is complete when every in-scope artifact has a terminal owner and every Material-owned artifact has one canonical current owner.

A family is fully implemented only when:

- canonical evidence is current-complete;
- the independent audit reports `Official coverage: full`;
- required visual review is accepted.
