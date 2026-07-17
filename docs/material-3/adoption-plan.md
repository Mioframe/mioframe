# Material 3 adoption plan

## Principle

Adopt Material incrementally through real family migrations.

Do not build a complete validation framework, exhaustive migration database, generic test DSL, empty documentation-shaped runtime tree, or mass source migration before real families prove the need.

Every in-scope shared UI artifact eventually reaches one outcome:

- canonical official Material component, foundation, or style owner;
- explicitly retained project-specific or generic UI owner outside Material;
- removed or consolidated obsolete owner.

Implementation may be incremental. Documentation and audit coverage for a selected official family must be complete.

## Library navigation

The canonical library mirrors official Material navigation:

```text
src/shared/ui/material/
  foundations/
  styles/
  components/
```

Family and domain directories use official documentation slugs. Production directories are created only when implementation work begins.

## Family migration loop

Each component family follows one loop:

1. inspect the current implementation, exports, consumers, tests, stories, and previous local audit;
2. resolve the official Material 3 Expressive family and documentation path;
3. independently reconstruct the complete official contract-level capability inventory;
4. select the minimum coherent implementation surface required by current scenarios;
5. create or update the canonical family README beside implementation;
6. classify every official capability as implemented, partial/unverified, not implemented, unresolved, or outside the family boundary;
7. correct inaccurate or unnecessarily complex applicable rules;
8. change shared foundations or styles only when the family proves a real cross-family need;
9. implement the selected surface and migrate consumers;
10. remove obsolete ownership;
11. add proportional tests and visual evidence;
12. run applicable local verification;
13. run an independent review that reconstructs the official inventory again and changes only the colocated AUDIT;
14. perform operator visual review when required;
15. update the queue and select another family in a later run.

Current consumer need determines implementation priority, not whether official capability is documented.

The default unit of implementation is one cohesive family end to end.

## Documentation contract

### Authoring README

The implementing agent owns:

```text
src/shared/ui/material/components/<official-docs-slug>/README.md
```

It records:

- official documentation mapping and inventory completeness;
- official coverage: full, partial, or unresolved;
- implemented surface;
- every official capability not implemented, regardless of current consumer demand;
- every partial, defective, provisional, ambiguous, or unverified capability;
- known issues and required follow-up;
- API, semantics, states, tokens, and final property ownership;
- foundation/style dependencies;
- extensions and deviations;
- consumers and migration state;
- verification;
- review status.

Any production change marks review as required. The implementation agent never edits the audit.

### Independent AUDIT

The reviewer owns:

```text
src/shared/ui/material/components/<official-docs-slug>/AUDIT.md
```

The reviewer independently reconstructs the complete official family inventory, lists all unimplemented capability, checks implementation against project documentation, and checks project documentation against current canonical Material 3 Expressive. The review changes no production or authoring files.

Compliance and coverage are separate. A technically correct implemented subset may still have `Official coverage: partial` and must not be described as fully implemented.

## Pilot 1 — Buttons

Buttons validate:

- official path `components/buttons` as canonical navigation;
- full legacy-to-canonical migration;
- complete official family capability accounting;
- truthful implementation documentation;
- public API, native semantics, accessibility, state, token, shape, elevation, and motion ownership;
- required shared style/foundation work;
- consumer migration and obsolete-owner removal;
- proportional tests and independent review;
- operator visual acceptance after technical findings are resolved.

Current state and findings live only in:

- `src/shared/ui/material/components/buttons/README.md`;
- `src/shared/ui/material/components/buttons/AUDIT.md`.

## Pilot 2 — independent stateful family

`MDSwitch` is the default candidate unless inventory evidence identifies a better family.

It should validate:

- controlled semantic state;
- disabled and presentation contracts;
- materially distinct keyboard and pointer/touch paths;
- cancellation and cleanup;
- multiple anatomy owners;
- accessibility, target area, focus, ripple, motion, shape, and color;
- complete accounting of official capability not implemented;
- the same local README/AUDIT model without Button-specific assumptions.

After two pilots, consolidate only mechanisms both migrations prove useful.

## Sequential migration

After the pilots:

1. select one unblocked queued family by accepted priority;
2. use its official documentation slug;
3. reconstruct its complete official capability inventory;
4. complete implementation, documentation, migration, proof, local verification, and independent audit for one selected coherent surface;
5. complete visual review when required;
6. update its inventory state and official coverage state;
7. stop before starting a second family.

Priority considers consumer reach, critical workflows, interaction frequency, Material leverage, correctness risk, dependency readiness, blast radius, and removal/consolidation value.

## Rule refinement

When implementation exposes a rule defect:

- identify the concrete evidence;
- update the owning rule with the smallest correction;
- update only directly affected instructions;
- do not preserve the rule through a family-specific exception;
- do not broaden the correction into unrelated architecture work.

## Shared domain changes

Audit and change foundations/styles only for the selected family.

- Reuse an existing owner when sufficient.
- Keep family-local behavior local.
- Create a shared owner only for a real cross-family contract.
- Split broad work only when its impact cannot be reviewed safely with the family.
- Do not relocate every shared domain in advance merely to fill the target tree.

## Evidence-driven automation

Add a guard only when repeated real work proves a stable, precise, inexpensive check with low false positives.

Do not automate interpretation of official documentation, semantic completeness, architectural correctness, Markdown honesty, or visual fidelity.

## Program completion

The program is complete when every in-scope artifact has a terminal outcome and every Material-owned artifact has one canonical current owner.

Implementing every optional Material component or capability immediately is not required. Every official capability in each migrated family must still be classified and visible. A family is fully implemented only when its independent audit reports `Official coverage: full`.