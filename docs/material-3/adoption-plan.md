# Material 3 adoption plan

## Principle

Adopt Material incrementally through bounded real implementation tasks.

A task may be selected by:

- the automatic migration roadmap; or
- an explicit user request for an official component, foundation, style, interaction primitive, token system, migration, alignment, or correction.

An explicit request overrides automatic queue order for that task.

Do not build a complete validation framework, exhaustive migration database, generic test DSL, empty documentation-shaped runtime tree, or mass source migration before real work requires it.

Every in-scope shared UI artifact eventually reaches one outcome:

- canonical official Material component, foundation, or style owner;
- explicitly retained project-specific or generic UI owner outside Material;
- removed or consolidated obsolete owner.

Implementation may be incremental. Classification and source limitations remain explicit.

## Library navigation

```text
src/shared/ui/material/
  foundations/
  styles/
  components/
```

Owner directories use official documentation slugs. Production directories are created when explicit implementation work or real consumer work begins.

## Universal request model

Use:

```text
material <artifact-or-request>
```

Examples:

```text
material Button
material State layer
material Ripple
material Elevation
material Motion
```

The router resolves official ownership:

- component → `material-component` and `material-component-authoring`;
- foundation/style → `material-foundation`;
- cross-layer request → one canonical shared owner plus affected consumer changes.

A request routed through `material-component` must be redirected when it resolves to a foundation/style. It must not be refused because it is not a component.

## Explicit-request rule

A valid explicit request for an official Material artifact is a current requirement.

Do not defer solely because:

- no component migration is active;
- no current production consumer exists;
- only one current family consumes the behavior;
- the roadmap names another family;
- the canonical owner does not exist;
- the current owner is legacy.

When no current production consumer exists:

- implement the smallest coherent official contract requested;
- add owner-local tests and a bounded testing/Storybook fixture;
- do not invent a fake product consumer;
- do not broaden the work into a universal framework or unrelated catalog.

Existing consumers determine migration and blast-radius proof, not whether an explicit request is permitted.

## Workflow evidence boundary

Material authoring and review operate from the current user task, current workspace files, official Material sources, and local project verification.

They do not use `git`, `gh`, GitHub, branches, commits, pull requests, diffs, blame, logs, tags, merge state, or repository history as evidence or workflow input.

## Implementation loop

Each bounded Material task follows:

1. resolve the requested artifact and official documentation path;
2. classify it as component, foundation, style, or cross-layer;
3. inspect current owner, exports, consumers, tests, fixtures/stories, README, and AUDIT when present;
4. record canonical source status;
5. reconstruct the supported contract-level inventory without overstating incomplete sources;
6. classify each item as implemented, partial/unverified, not implemented, officially unsupported/invalid, unresolved, or outside the owner boundary;
7. select the smallest coherent surface required by the explicit request and affected consumers;
8. update the canonical owner README without editing AUDIT;
9. correct directly applicable defective rules;
10. implement the selected surface;
11. migrate existing consumers and remove obsolete Material ownership when applicable;
12. add proportional tests and bounded rendered evidence;
13. run local verification;
14. run independent review separately;
15. receive explicit operator acceptance or further feedback when visible review is required;
16. update roadmap/inventory only when their owned facts change.

Do not stop after classification, research, an audit summary, or a plan.

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
- outside the resolved owner boundary.

`Not implemented` is reserved for real official capability that exists but is absent.

Officially unsupported combinations do not reduce coverage.

Optional or non-normative guidance is documented as a choice, deviation, or follow-up. It does not reduce coverage unless required for the implemented surface.

## Documentation ownership

### Authoring README

The implementing agent owns the current owner README:

```text
src/shared/ui/material/components/<official-docs-slug>/README.md
src/shared/ui/material/foundations/<official-slug>/README.md
src/shared/ui/material/styles/<official-slug>/README.md
```

It records official mapping, source status, inventory, coverage, implementation state, omissions, invalid routes, unresolved items, known issues, ownership, public/private contract, consumers, verification, and review status.

Visible behavior may persist operator feedback:

```text
Status: not reviewed | required | rejected | awaiting re-review | accepted
Latest operator feedback: none | <summary>
Implementation response: none | <summary>
```

Any production change marks review required. Authoring never edits AUDIT.

### Independent AUDIT

Independent review owns the local AUDIT beside the implementation owner.

The reviewer:

- uses only the current user task, current workspace, and official evidence;
- independently records source status and inventory limitations;
- checks implementation against project documentation;
- checks project documentation against canonical Material;
- separates absent capability from invalid combinations and optional guidance;
- requires representative proof for shared routes;
- verifies explicit operator feedback accurately;
- never invents visual acceptance.

Compliance, coverage, source status, and operator visual status remain separate.

## Foundations and styles

An official shared owner is justified by either:

1. an explicit user request to implement that official library artifact; or
2. a real current cross-family requirement.

State layer, ripple, and focus indication are valid direct foundation targets.

For a direct interaction-foundation request, resolve applicable semantics, state ownership, color/opacity routes, rendered bounds, clipping, focus/ripple ownership, lifecycle, reduced motion, generic consumer bridges, and owner-local proof.

An opacity token declaration alone does not implement State Layer. The final rendered layer and behavior must work.

Family-local behavior remains local only when it has no official shared owner and no explicit standalone library request.

## Operator visual feedback

The operator reports visible findings directly in the implementation message. No separate report file is required.

- reported visible defects are persisted as `rejected`;
- authoring may move to `awaiting re-review` only after changing production behavior;
- only explicit user acceptance may set `accepted`;
- tests, screenshots, technical routing, audit text, or silence do not imply acceptance.

## Pilot and sequential migration

Buttons remain the first component-family pilot. `MDSwitch` remains the default independent stateful component-family pilot.

These automatic pilots do not prevent an explicit request for another component, foundation, or style.

After the pilots, automatic migration:

1. selects one unblocked queued target;
2. resolves official sources and source status;
3. reconstructs and classifies the inventory honestly;
4. completes one coherent implementation surface, migration, proof, local verification, and independent audit;
5. completes operator visual review when required;
6. updates inventory and coverage state;
7. stops before a second automatic target.

## Rule refinement

When implementation exposes a rule defect:

- identify current-workspace evidence;
- update the owning rule with the smallest correction;
- update only directly affected instructions;
- do not preserve the defect through a family-specific exception;
- do not broaden the correction into unrelated architecture work.

## Shared domain changes

- Reuse an existing owner when sufficient.
- Create a shared owner for an explicit official foundation/style request or a real cross-family contract.
- Keep family-local behavior local when neither condition applies.
- Identify current affected consumers from current code.
- Require representative tests that exercise the shared route.
- Use an owner-local fixture when no production consumer exists.
- Do not count unrelated unchanged green tests as proof.
- Split broad work only when its impact cannot be reviewed safely as one coherent request.

## Evidence-driven automation

Add a guard only when repeated real work proves a stable, precise, inexpensive check with low false positives.