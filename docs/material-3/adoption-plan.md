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

```text
src/shared/ui/material/
  foundations/
  styles/
  components/
```

Family and domain directories use official documentation slugs. Production directories are created only when implementation work begins.

## Workflow evidence boundary

Material family authoring and review operate from the current user task, current workspace files, official Material sources, and local project verification.

They do not use `git`, `gh`, GitHub, branches, commits, pull requests, diffs, blame, logs, tags, merge state, or repository history as evidence or workflow input.

## Family migration loop

Each family follows one loop:

1. inspect current implementation, exports, consumers, tests, stories, README, and AUDIT when present;
2. read explicit operator feedback from the current user message and existing README;
3. resolve the official family and documentation path;
4. record canonical source status;
5. reconstruct the supported contract-level inventory without overstating incomplete sources;
6. classify each item as implemented, partial/unverified, not implemented, officially unsupported/invalid, unresolved, or outside the family boundary;
7. select the minimum coherent implementation surface required by current scenarios;
8. update the canonical family README without editing AUDIT;
9. correct directly applicable defective rules;
10. change shared foundations/styles only for a real cross-family need;
11. implement the selected surface and migrate consumers;
12. remove obsolete ownership;
13. add proportional tests and visual evidence;
14. run local verification;
15. run an independent current-workspace review that changes only AUDIT;
16. receive explicit operator acceptance or further feedback through a normal user message;
17. update the queue and select another family in a later run.

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

## Documentation ownership

### Authoring README

The implementing agent owns:

```text
src/shared/ui/material/components/<official-docs-slug>/README.md
```

It records official mapping, source status, inventory, coverage, implementation state, omissions, invalid combinations, unresolved items, known issues, operator feedback, API, semantics, states, tokens, dependencies, extensions, consumers, verification, and review status.

Operator feedback is supplied in task messages and persisted in README:

```text
Status: not reviewed | required | rejected | awaiting re-review | accepted
Latest operator feedback: none | <summary>
Implementation response: none | <summary>
```

Any production change marks review required. Authoring never edits AUDIT.

### Independent AUDIT

The reviewer owns:

```text
src/shared/ui/material/components/<official-docs-slug>/AUDIT.md
```

The reviewer:

- changes only AUDIT;
- uses only the current user task, current workspace, and official evidence;
- independently records source status and inventory limitations;
- checks implementation against project documentation;
- checks project documentation against canonical Material;
- separates absent capability from invalid combinations and optional guidance;
- requires representative proof for shared routes;
- verifies that README accurately preserves explicit operator feedback;
- never invents visual acceptance.

Compliance, coverage, source status, and operator visual status remain separate.

## Operator visual feedback

The operator reports visible findings directly in the implementation message. No separate report file is required.

Rules:

- reported visible defects are persisted as `rejected` in README;
- authoring may move to `awaiting re-review` only after changing production behavior;
- only an explicit user acceptance message may set `accepted`;
- tests, screenshots, technical routing, audit text, or silence do not imply acceptance.

## Pilot 1 — Buttons

Buttons validate:

- official path `components/buttons`;
- full legacy-to-canonical migration;
- honest source and inventory status;
- correct classification of capability, invalid combinations, and optional guidance;
- public API, semantics, accessibility, state, token, shape, elevation, and motion ownership;
- representative proof for shared routes;
- proportional motion evidence without frame-by-frame component testing;
- persistence of operator-rejected visual defects in README until explicitly accepted;
- consumer migration and obsolete-owner removal;
- independent review.

Current state and findings live in:

- `src/shared/ui/material/components/buttons/README.md`;
- `src/shared/ui/material/components/buttons/AUDIT.md`.

## Pilot 2 — independent stateful family

`MDSwitch` is the default candidate unless inventory evidence identifies a better family.

It should validate controlled state, disabled/presentation contracts, materially distinct input paths, cancellation, anatomy, accessibility, target area, focus, ripple, motion, shape, color, and the same README/AUDIT plus message-based operator-feedback model without Button assumptions.

After two pilots, consolidate only mechanisms both migrations prove useful.

## Sequential migration

After the pilots:

1. select one unblocked queued family;
2. resolve official sources and source status;
3. reconstruct and classify the inventory honestly;
4. complete one coherent implementation surface, migration, proof, local verification, and independent audit;
5. complete operator visual review through an explicit user message when required;
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
- required visual review is explicitly accepted by the user and recorded in README.
