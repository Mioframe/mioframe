# Material 3 Expressive policies

This directory contains durable policy for building `src/shared/ui/material` against official Material 3 Expressive sources.

## Library model

```text
src/shared/ui/material/
  foundations/
  styles/
  components/
```

Official owners follow official documentation navigation and slugs:

```text
m3.material.io/components/<official-family-slug>
→ src/shared/ui/material/components/<official-family-slug>

<official-foundation-domain>
→ src/shared/ui/material/foundations/<official-foundation-slug>

<official-style-domain>
→ src/shared/ui/material/styles/<official-style-slug>
```

Use the narrowest official owner available.

## Generalization boundary

Shared policies and skills contain only artifact-independent routing, ownership, naming, diagnosis, evidence, and completion rules.

Do not put concrete family selectors, DOM node names, custom-property names, token values, state endpoints, defect symptoms, or proposed family structures into shared policy.

Concrete facts belong in the owning README, AUDIT, implementation, tests, fixtures/stories, roadmap when it records current work, and task context.

A pilot finding may refine shared policy only through a rule applicable to every artifact owning the same category of risk. When an existing rule already prohibited a defect, strengthen execution or report agent non-compliance instead of adding another rule.

## Core policies

### Program and ownership

- [Adoption plan](./adoption-plan.md)
- [Library roadmap](./library-roadmap.md)
- [Library architecture](./library-architecture.md)
- [Shared UI inventory](./ui-library-inventory.md)
- [`src/shared/ui/material` navigation](../../src/shared/ui/material/README.md)

### Sources, foundations, and styles

- [Source of truth](./source-of-truth.md)
- [Foundations and styles architecture](./foundation-architecture.md)
- [Foundation registry](./foundation-registry.md)
- [Units](./units.md)
- [Tokens](./tokens.md)
- [Accessibility](./accessibility.md)
- [Interaction states](./interaction-states.md)
- [Layout and adaptive behavior](./layout-adaptive.md)
- [Icons](./icons.md)

### Components and proof

- [Component architecture](./component-architecture.md)
- [Component testing](./component-testing.md)
- [Autonomous review](./autonomous-review.md)
- [Component registry](./component-registry.md)
- [Component tokens](./component-tokens.md)
- [Authoring checklist](./component-conversion-checklist.md)
- [Storybook](./storybook.md)
- [Verification](./verification.md)
- [Deviations](./deviations.md)

## Fact ownership

- Architecture documents own durable boundaries and workflow rules.
- `library-roadmap.md` owns the active automatic migration milestone and next action.
- `ui-library-inventory.md` owns classification, priority, and queue state.
- `source-of-truth.md` owns official source hierarchy and source-status rules.
- Local owner `README.md` owns current implementation documentation.
- Local owner `AUDIT.md` owns the latest independent review.
- Registries are summaries and do not override local owner documentation.

An explicit user request may select an official Material artifact outside the automatic roadmap order.

## Evidence boundary

Material authoring and review use the current task, current workspace files, current successful Material MCP reads, official sources, and local verification.

Source-control history is not Material authority. The current diff may be inspected for scope, unrelated changes, missing cleanup, ownership drift, and regression risk.

A healthy complete current-run MCP read is working current evidence. Capture age alone is provenance, not a defect. Follow `source-of-truth.md` when evidence is partial, failed, suspicious, truncated, or conflicting.

## Universal implementation entrypoint

Use:

```text
material <artifact-or-request>
```

The user does not need to classify the request.

The router resolves:

- component families → `material-component-authoring`;
- independent component review → `material-component-review`;
- foundations and interaction primitives → `material-foundation`;
- styles and token systems → `material-foundation`;
- cross-layer changes → one canonical shared owner plus affected consumer work.

`material-component` is a compatibility alias only. It does not own a duplicate workflow.

A request sent through the wrong specialized entrypoint must be rerouted and executed rather than rejected for classification alone.

## Explicit-request rule

A valid explicit request for an official Material artifact is a current requirement and is sufficient to start the applicable workflow.

Do not defer solely because:

- no component migration is active;
- no production consumer exists;
- only one consumer exists;
- the roadmap names another target;
- the canonical directory is absent;
- the current implementation is in a legacy owner.

When no production consumer exists, implement the smallest coherent requested contract with owner-local tests and a bounded fixture. Do not invent a fake product consumer.

Existing consumers determine migration and blast-radius proof.

## Calibrated authoring loop

For components, foundations, and styles:

```text
resolve official owner and current-run sources
→ reconstruct the contract
→ diagnose each material problem
→ choose repair | restructure | replace
→ implement through ordered ownership gates
→ build proportional proof
→ run an evidence-backed objective gate
→ run independent contradiction-seeking review
→ request operator acceptance only for remaining perceived fidelity
```

Diagnosis categories are:

- canonical behavior;
- implementation defect;
- architecture defect;
- foundation/style or generic-infrastructure defect;
- evidence gap;
- product deviation.

If two correction rounds retain the same objective defect, add workarounds, or create new ownership ambiguity, stop patching and reconsider the implementation strategy.

## Source and inventory status

Every active Material owner records:

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

Use `snapshot-complete-stale` only when relying on a retained snapshot without a healthy current read or when freshness is explicitly unresolved. Partial, failed, truncated, suspicious, conflicting, missing, or spot-check-only evidence cannot certify complete inventory.

## Capability classification

Each official item is exactly one of:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- officially unsupported or invalid;
- unresolved;
- outside the resolved owner boundary.

Invalid combinations are constraints, not missing capability. Optional guidance is not automatically required capability.

## Local owner documentation

Each implemented or actively migrated owner contains current README documentation and may contain an independent AUDIT.

README records:

- official mapping and current-run source status;
- reconstructed contract;
- diagnosis and repair/restructure/replace strategy;
- implemented, partial, absent, invalid, unresolved, and out-of-boundary capability;
- API, anatomy, ownership, tokens, states, lifecycle, foundations, consumers, and proof;
- known defects and operator status.

AUDIT is independent reviewer-owned. Authoring never edits it. Review seeks contradictions before accepting README claims and records findings concisely rather than duplicating the complete contract.

Visible feedback is supplied directly in user messages and persisted when applicable:

```text
Status: not reviewed | required | rejected | awaiting re-review | accepted
Latest operator feedback: none | <summary>
Implementation response: none | <summary>
```

Only explicit user acceptance sets `accepted`.

## Foundation and style ownership

An official shared owner is justified by either:

1. an explicit request for that official artifact; or
2. a real current shared requirement.

A rendered primitive is not implemented merely because a token declaration exists. The route must reach the correct final owner with correct bounds, clipping, state precedence, lifecycle, and consumer behavior.

Do not patch a shared foundation defect locally inside a component.

## Motion and visual acceptance

Verify a shared motion contract deeply once. At consumer level prove applicable real-input activation, final owner, meaningful intermediate composition when endpoints cannot reveal the risk, endpoints, interruption/cancellation, and reduced motion.

Forced state proves stable appearance only. It does not prove acquisition, trajectory, release, interruption, cancellation, or cleanup.

Technical routing or green tests cannot close rejected perceived output. Only corrected production behavior followed by explicit acceptance can do so.

## Shared routes

Root/system tokens, universal selectors, pseudo-elements, shared formulas, theme roles, shared lifecycle, and public shared APIs require:

- affected-consumer analysis;
- the narrowest valid owner;
- representative proof through final output;
- explicit ownership and blast radius.

Unchanged tests that never exercise the route are not proof.

## Specialized entrypoints

```text
material-component <component-family>        # compatibility alias
material-component-review <component-family>
material-foundation <foundation-or-style-artifact>
material-library-next
material-library-status
```

A specialized entrypoint does not override official artifact classification.

## Required behavior

- Implement the applicable current Material 3 Expressive contract for the explicit surface.
- Continue through implementation; do not stop after classification, research, or a plan.
- Keep scope coherent and classification honest.
- Never infer implementation from declarations, aliases, stories, screenshots, or tests when the final route does not work.
- Require real-input evidence for lifecycle claims and representative proof for shared routes.
- Preserve visible rejection until corrected and explicitly accepted.
- Remove obsolete ownership during restructure, replacement, or migration.
- Do not create fake consumers, placeholder implementation trees, universal semantic validators, fixed file profiles, generic registries, or a second metadata database.

A blocker may not consist only of missing consumers, inactive roadmap position, legacy location, or absence of a pre-created canonical directory.
