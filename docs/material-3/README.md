# Material 3 Expressive policies

This directory contains durable policy for building `src/shared/ui/material` against official Material 3 Expressive sources.

## Library model

```text
src/shared/ui/material/
  foundations/
  styles/
  components/
```

Official owners follow official documentation navigation and slugs.

Examples:

```text
m3.material.io/components/buttons
→ src/shared/ui/material/components/buttons

state layer / ripple / focus indication
→ src/shared/ui/material/foundations/interaction
```

Use a narrower official slug when official navigation defines one.

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
- `library-roadmap.md` owns the active migration milestone and automatic next action.
- `ui-library-inventory.md` owns classification, priority, and queue state.
- `source-of-truth.md` owns official source hierarchy and source-status rules.
- Local owner `README.md` owns current implementation documentation.
- Local owner `AUDIT.md` owns the latest independent review.
- Registries are summaries and do not override local owner documentation.

An explicit user request is allowed to select an official Material artifact outside the current automatic roadmap order.

## Workflow evidence boundary

Material authoring and review use the current user task, current workspace files, official Material sources, and local project verification.

They do not run, inspect, or cite `git`, `gh`, GitHub, branches, commits, pull requests, diffs, blame, logs, tags, merge state, or repository history as implementation or Material evidence.

## Universal implementation entrypoint

Use:

```text
material <artifact-or-request>
```

Examples:

```text
material Button
material State layer
material Ripple
material Focus indicator
material Color roles
material Elevation
material Motion
material Typography
material Fix the Button target geometry
```

The user does not need to classify the request.

The router resolves:

- component families → `material-component` and `material-component-authoring`;
- foundations and interaction primitives → `material-foundation`;
- styles and token systems → `material-foundation`;
- cross-layer changes → one canonical shared owner plus only affected consumer work.

A request sent through `material-component` by mistake must be rerouted when it resolves to a foundation/style. It must not be rejected merely because it is not a component.

## Explicit-request rule

A valid explicit request for an official Material artifact is a current requirement and is sufficient to start the applicable workflow.

Do not defer solely because:

- no component migration is active;
- no current production consumer exists;
- only one current family consumes the behavior;
- the roadmap currently names another family;
- the canonical directory is absent;
- the current implementation is still in a legacy owner.

When no production consumer exists, implement the smallest coherent requested official contract with owner-local tests and a bounded testing or Storybook fixture. Do not invent a fake product consumer.

Existing consumers still determine migration and blast-radius proof.

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
  snapshot-complete (<snapshot>; currentness unverified)
  incomplete (<exact gap>)
  blocked (<exact reason>)

Official coverage:
  full
  partial
  unresolved
```

`complete` requires current-complete evidence. A stale snapshot may be snapshot-complete. Partial, truncated, suspicious, missing, or spot-check-only evidence cannot certify complete current inventory.

## Capability classification

Each official item is exactly one of:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- officially unsupported or an invalid combination;
- unresolved because canonical evidence is incomplete or conflicting;
- outside the resolved owner boundary.

`Not implemented` means a real official capability exists but is absent.

Officially unsupported combinations are constraints, not missing capability, and do not reduce coverage.

Optional or non-normative guidance is recorded as a choice, deviation, or follow-up. It does not reduce coverage unless required for the implemented surface.

## Local owner documentation

Each implemented or actively migrated owner contains local documentation:

```text
src/shared/ui/material/foundations/<official-slug>/README.md
src/shared/ui/material/foundations/<official-slug>/AUDIT.md

src/shared/ui/material/styles/<official-slug>/README.md
src/shared/ui/material/styles/<official-slug>/AUDIT.md

src/shared/ui/material/components/<official-docs-slug>/README.md
src/shared/ui/material/components/<official-docs-slug>/AUDIT.md
```

### README

Authoring-owned implementation documentation. It records source status, inventory, coverage, implemented/partial/absent/invalid/unresolved capability, known issues, ownership, public/private contract, consumers, verification, and review status.

Visible component or rendered foundation/style feedback is supplied directly in user messages and persisted when applicable:

```text
Status: not reviewed | required | rejected | awaiting re-review | accepted
Latest operator feedback: none | <summary>
Implementation response: none | <summary>
```

A reported visible defect means `rejected`. After production behavior changes, authoring may use `awaiting re-review`. Only explicit user acceptance may set `accepted`.

Authoring never edits AUDIT.

### AUDIT

Reviewer-owned independent review. It compares current implementation with project documentation, then project documentation with canonical Material evidence. It independently records source status and classification.

## Foundation and style ownership

An official shared owner is justified by either:

1. an explicit request to implement that official Material foundation/style artifact; or
2. a real current cross-family requirement.

State layer, ripple, and focus indication are valid direct foundation targets. Their workflow must resolve semantics, state ownership, color/opacity routes, rendered bounds, clipping, focus/ripple ownership, lifecycle, reduced motion, generic consumer bridges, and representative proof.

An opacity token declaration alone does not implement State Layer. The final rendered layer and behavior must work.

## Motion and visual acceptance

Verify a shared motion style deeply once.

At component level, use proportional evidence:

- real input activates the intended rendered property;
- one meaningful intermediate state when needed;
- correct endpoint;
- safe interruption or cancellation;
- consumption of the documented shared contract.

Do not require frame-by-frame component analysis or duplicate equivalent input paths. Forced state proves appearance, not motion.

Technical routing or green tests cannot close a rejected visual result. Only a production behavior change followed by explicit user acceptance can do so.

## Shared routes

Root/system tokens, universal selectors, pseudo-elements, and shared formulas require:

- current affected-consumer analysis;
- the narrowest valid owner;
- representative tests that actually exercise the route;
- explicit current ownership and blast radius.

Unchanged tests that never exercise the route are not proof.

## Specialized entrypoints

### Component implementation

```text
material-component <component-or-family-name>
```

If the supplied name resolves to a foundation/style, this entrypoint reroutes to `material-foundation` and continues.

### Component review

```text
material-component-review <component-or-family-name>
```

Changes only the component-family AUDIT.

### Known foundation/style implementation

```text
material-foundation <artifact-or-correction>
```

Implements, migrates, aligns, or corrects foundations and styles, including State Layer.

### Continue automatic migration

```text
material-library-next
```

Selects exactly one queued target and never overrides an explicit user-selected artifact.

### Read program status

```text
material-library-status
```

Reads roadmap, inventory, registries, README, and AUDIT without changing files.

## Required behavior

- Implement the current applicable Material 3 Expressive contract for the explicit requested surface.
- Use official documentation slugs for canonical ownership.
- Continue through implementation; do not stop after classification, research, or a plan.
- Keep implementation scope coherent and classification honest.
- Separate real absent capability from invalid combinations and optional guidance.
- Never certify complete inventory from partial, stale-only, truncated, suspicious, or spot-check-only evidence.
- Never infer implementation from declarations, aliases, stories, or tests when the final route does not work.
- Require representative proof for shared routes.
- Preserve operator rejection until corrected and explicitly accepted.
- Remove obsolete Material ownership during migration.
- Do not create fake consumers, placeholder implementation trees, universal validators, fixed file profiles, generic state registries, or a second metadata database.

A blocker may not consist only of missing current consumers, inactive roadmap priority, legacy location, or absence of a pre-created canonical directory.