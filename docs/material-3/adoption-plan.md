# Material 3 adoption plan

## Principle

Adopt Material incrementally through bounded real implementation tasks.

A task may be selected by:

- the automatic migration roadmap; or
- an explicit user request for an official component, foundation, style, interaction primitive, token system, migration, alignment, review, or correction.

An explicit request overrides automatic queue order for that task.

Do not build a complete validation framework, exhaustive migration database, generic test DSL, empty documentation-shaped runtime tree, or mass source migration before real work requires it.

Every in-scope shared UI artifact eventually reaches one outcome:

- canonical official Material component, foundation, or style owner;
- explicitly retained project-specific or generic UI owner outside Material;
- removed or consolidated obsolete owner.

Implementation may be incremental. Classification and source limitations remain explicit.

## Generalization boundary

This plan defines a universal adoption and calibration loop. Concrete pilots are program state only.

They do not define reusable anatomy, DOM structure, custom-property names, token values, state endpoints, wrappers, files, or test shapes.

Shared workflow refinements must be artifact-independent. Concrete pilot defects remain in the owning README, AUDIT, roadmap, inventory, implementation, tests, and task context.

When an existing rule already prohibited a defect, strengthen execution or report agent non-compliance instead of adding another universal rule.

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

The router resolves official ownership:

- component → `material-component-authoring`;
- independent component review → `material-component-review`;
- foundation/style → `material-foundation`;
- cross-layer request → one canonical shared owner plus affected consumer changes.

`material-component` is a compatibility alias only.

A request routed through the wrong specialized entrypoint is redirected and executed rather than refused for classification alone.

## Explicit-request rule

A valid explicit request for an official Material artifact is a current requirement.

Do not defer solely because:

- no component migration is active;
- no production consumer exists;
- only one consumer exists;
- the roadmap names another target;
- the canonical owner does not exist;
- the current owner is legacy.

When no production consumer exists:

- implement the smallest coherent official contract requested;
- add owner-local tests and a bounded testing or Storybook fixture;
- do not invent a fake product consumer;
- do not broaden the work into a universal framework or unrelated catalog.

Existing consumers determine migration and blast-radius proof, not whether an explicit request is permitted.

## Workflow evidence boundary

Material authoring and review operate from the current task, current workspace files, current successful Material MCP reads, official sources, and local verification.

Source-control history is not Material authority. The current diff may be inspected for scope, unrelated changes, missing cleanup, ownership drift, and regression risk.

A healthy complete current-run MCP read is working current evidence. Capture age alone is not a defect. Follow `source-of-truth.md` when evidence is partial, failed, suspicious, truncated, or conflicting.

## Calibrated implementation loop

Each bounded Material task follows:

1. resolve the requested artifact and official owner;
2. read all required current-run MCP sources;
3. inspect current owner, exports, consumers, tests, fixtures/stories, README, AUDIT, and current diff when available;
4. reconstruct the official contract and capability inventory;
5. classify capability as implemented, partial/unverified, not implemented, officially unsupported/invalid, unresolved, or outside the owner boundary;
6. diagnose every material problem and actual owner;
7. select `repair`, `restructure`, or `replace`;
8. update the canonical owner README without editing AUDIT;
9. implement through ordered semantics, ownership, geometry, routing, lifecycle, and migration gates;
10. remove superseded ownership and contradictory documentation;
11. add proportional proof, using real input for lifecycle claims;
12. run an evidence-backed objective authoring/foundation gate;
13. run local verification;
14. run independent contradiction-seeking review separately;
15. receive explicit operator acceptance or further feedback only after objective gates close;
16. update roadmap/inventory only when their owned facts change.

Do not stop after classification, research, an audit summary, or a plan.

If two correction rounds retain the same objective defect, add workarounds, or create new ownership ambiguity, stop patching and reconsider the implementation strategy from the reconstructed contract.

## Problem diagnosis

Use one primary category per problem:

- canonical behavior;
- implementation defect;
- architecture defect;
- foundation/style or generic-infrastructure defect;
- evidence gap;
- product deviation.

Diagnosis identifies the actual owner. A symptom visible in one component does not make that component the correct owner.

## Implementation strategy

Use:

- `repair` when contract, anatomy, and ownership are sound;
- `restructure` when supported capability remains valid but ownership, routes, lifecycle, or anatomy are wrong;
- `replace` when the implementation is based on a wrong contract or preserves multiple conflicting models.

Restructure and replacement remove superseded code, routes, tests, stories, documentation, and compatibility paths unless explicit compatibility is required.

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
  snapshot-complete (<snapshot>; currentness unresolved)
  incomplete (<exact gap>)
  blocked (<exact reason>)

Official coverage:
  full
  partial
  unresolved
```

Use `snapshot-complete-stale` only when relying on a retained snapshot without a healthy current read or when freshness is explicitly unresolved.

Partial, failed, truncated, suspicious, conflicting, missing, or spot-check-only evidence cannot certify complete inventory.

## Classification rules

Use exactly one category per item:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- officially unsupported or invalid;
- unresolved;
- outside the resolved owner boundary.

`Not implemented` is reserved for real official capability that exists but is absent.

Officially unsupported combinations do not reduce coverage. Optional guidance is documented as a choice, deviation, or follow-up unless required for the implemented surface.

## Documentation ownership

### Authoring README

The implementing agent owns the current owner README beside the component, foundation, or style.

It records:

- official mapping and current-run source status;
- reconstructed contract and inventory;
- diagnosis and implementation strategy;
- implementation state, omissions, invalid routes, unresolved items, and known issues;
- ownership, public/private contract, consumers, proof, and verification;
- operator feedback and review status.

Any production change marks review required. Authoring never edits AUDIT.

### Independent AUDIT

Independent review owns the local AUDIT beside the implementation owner.

The reviewer:

- reconstructs evidence independently rather than accepting README conclusions;
- actively searches for contradictions across implementation, README, stories, tests, verification, and operator feedback;
- checks implementation against project documentation;
- checks project documentation against canonical Material;
- reviews diagnosis and repair/restructure/replace strategy;
- requires representative proof for shared routes and real input for lifecycle claims;
- verifies explicit operator feedback accurately;
- records findings and gaps concisely rather than duplicating the complete README;
- never invents visual acceptance.

Compliance, coverage, source status, and operator visual status remain separate.

## Foundations and styles

An official shared owner is justified by either:

1. an explicit user request to implement that official library artifact; or
2. a real current cross-family requirement.

For a rendered foundation or interaction primitive, resolve applicable semantics, state ownership, token/color/opacity routes, rendered bounds, clipping, focus/ripple ownership, lifecycle, reduced motion, generic consumer bridges, and owner-local proof.

A token declaration alone does not implement a rendered artifact. Final rendered behavior must work.

Family-local behavior remains local only when it has no official shared owner and no explicit standalone request.

Do not patch a shared-foundation defect inside a component to avoid correcting the real owner.

## Objective proof boundary

- Forced states prove stable appearance only.
- Screenshots prove regression stability only.
- Real browser input proves acquisition, release, trajectory, interruption, cancellation, and cleanup.
- Intermediate transition evidence is required only when endpoints cannot prove the changed or reported composition risk.
- Operator review proves perceived fidelity only after objective gates close.

Do not substitute one proof layer for another.

## Operator visual feedback

The operator reports visible findings directly. No separate report file is required.

- reported visible defects are persisted as `rejected`;
- authoring may move to `awaiting re-review` only after changing production behavior and rechecking objective surfaces;
- only explicit user acceptance may set `accepted`;
- tests, screenshots, technical routing, audit text, or silence do not imply acceptance.

## Current pilots and sequential migration

Concrete pilot names and statuses live in the roadmap and owning artifact documentation. They are scheduling and progress facts, not templates for unrelated artifacts.

A pilot validates universal workflow properties such as source handling, contract reconstruction, diagnosis, implementation strategy, ownership, evidence, review separation, and operator-feedback persistence. Its specific DOM, tokens, states, defects, and fixes never become universal requirements by implication.

After the pilots, automatic migration:

1. selects one unblocked queued target;
2. executes the calibrated implementation loop;
3. completes one coherent implementation surface, migration, proof, objective gate, local verification, and independent audit;
4. completes operator visual review when required;
5. updates inventory and coverage state;
6. stops before a second automatic target.

## Rule refinement

When implementation exposes a possible rule defect:

1. identify current-workspace evidence;
2. determine whether the rule is missing or the agent ignored an existing rule;
3. extract an artifact-independent invariant only for a real policy gap;
4. update the narrowest owning rule and directly affected instructions;
5. keep concrete symptoms and fixes in owning artifact documentation;
6. do not preserve the defect through a family-specific exception;
7. do not broaden the correction into unrelated architecture work.

## Shared domain changes

- Reuse an existing owner when sufficient.
- Create a shared owner for an explicit official foundation/style request or a real shared contract.
- Keep consumer-specific behavior local when neither condition applies.
- Identify affected consumers from current code.
- Require representative tests that exercise the shared route.
- Use an owner-local fixture when no production consumer exists.
- Do not count unrelated unchanged green tests as proof.
- Split broad work only when its impact cannot be reviewed safely as one coherent request.

## Evidence-driven automation

Add an automated guard only when repeated real work proves a stable, precise, inexpensive check with low false positives.

Do not automate semantic completeness, anatomy correctness, or visual fidelity through Markdown validators or generic rule engines.
