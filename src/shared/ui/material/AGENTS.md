# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical Material 3 Expressive library boundary.

## Generalization boundary

These instructions contain only artifact-independent routing, ownership, evidence, naming, and completion rules.

Do not add concrete family selectors, DOM nodes, custom-property names, token values, state endpoints, defect symptoms, or proposed family structures.

Concrete facts belong in the owning README, AUDIT, code, tests, fixtures/stories, roadmap when it records current work, and task-specific PR description.

A pilot finding may refine these instructions only through a rule applicable to every artifact owning the same risk.

## Routing

Use `material` as the default implementation entrypoint:

```text
material <artifact-or-request>
```

The router resolves:

- component families → `material-component` → `material-component-authoring`;
- foundations and interaction primitives → `material-foundation`;
- styles and token systems → `material-foundation`;
- cross-layer requests → one canonical shared owner plus affected consumer changes.

Specialized entrypoints remain valid:

- `material-component` for a component family;
- `material-component-review` for independent component review;
- `material-foundation` for a known foundation/style target;
- `material-library-status` for read-only program status;
- `material-library-next` for exactly one next automatic migration target;
- `material3-guidelines` for official source resolution.

If a request enters through the wrong specialized Material entrypoint, reroute it and continue. Do not refuse it for classification alone.

## Explicit-request rule

A valid explicit request for an official Material artifact is a current requirement.

Do not refuse or defer merely because:

- the artifact is not a component;
- no component migration is active;
- no production consumer exists;
- only one consumer exists;
- the roadmap names another target;
- the canonical directory is absent;
- the current owner is legacy.

When no production consumer exists, implement the smallest coherent requested contract with owner-local tests and a bounded fixture. Do not invent a fake consumer.

Existing consumers determine migration and blast-radius proof, not whether the request is allowed.

## Evidence boundary

Material authoring and review use:

- the current user task;
- current workspace files;
- official Material sources;
- local project verification commands.

Do not use source-control history or remote workflow state as implementation or Material evidence.

## Canonical navigation

```text
foundations/<official-slug>
styles/<official-slug>
components/<official-docs-slug>
```

Map official documentation mechanically:

```text
m3.material.io/components/<official-family-slug>
→ src/shared/ui/material/components/<official-family-slug>

<official-foundation-domain>
→ src/shared/ui/material/foundations/<official-foundation-slug>

<official-style-domain>
→ src/shared/ui/material/styles/<official-style-slug>
```

Use the narrowest official owner available. Do not create a top-level patterns tree without an official equivalent.

## Source and inventory status

Every active owner records:

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

A stale, partial, truncated, suspicious, missing, or spot-check-only source cannot certify current completeness.

## Capability classification

Classify every official item exactly once:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- officially unsupported or invalid;
- unresolved;
- outside the resolved owner boundary.

Invalid combinations are constraints, not missing capability. Optional guidance is not automatically required capability.

## Local documentation

Every implemented or actively migrated owner has:

```text
README.md
AUDIT.md
```

- README is current authoring-owned documentation.
- AUDIT is the latest independent review and is never edited by authoring.
- No separate operator report file is required.

README records source status, inventory, coverage, implementation state, invalid routes, known issues, ownership, consumers, verification, and review state.

## Operator feedback

For visible behavior, persist when applicable:

```text
Status: not reviewed | required | rejected | awaiting re-review | accepted
Latest operator feedback: none | <summary>
Implementation response: none | <summary>
```

- A reported visible defect means `rejected`.
- Broad feedback reopens the complete affected surface.
- Authoring may use `awaiting re-review` only after production behavior changes and objective surfaces are rechecked.
- Only explicit user acceptance sets `accepted`.
- Tests, screenshots, technical routing, audit wording, or silence do not imply acceptance.

A production change sets review required after changes.

## Canonical target

- Implement current applicable Material 3 Expressive guidance.
- Baseline Material 3 is not a silent fallback.
- Existing output, snapshots, other implementations, memory, and repository history are not Material authority.
- Source limitations remain explicit.

## Dependency direction

```text
shared generic infrastructure
  → material/foundations and material/styles
  → material/components
  → product layers
```

- foundations and styles do not import components;
- a component family does not deep-import another family's private files;
- Material code does not import product layers;
- product consumers use the curated Material entry point;
- private implementation, tests, fixtures, stories, docs, and audits are not public API.

Generic platform utilities remain generic when they contain no Material semantics. Material-specific state, token, clipping, focus, motion, or rendering ownership belongs in the Material library even when the current implementation is legacy.

## Implementation rules

- Implement the smallest coherent surface required by the explicit request and affected consumers.
- Use exact official token meanings and shortest final-property routes.
- A route exists only when its source can affect final output through a real dependency.
- Colocation, aliases, equality assertions, comments, stories, screenshots, and tests do not create a route.
- Keep consumer-specific behavior local unless an official shared owner or explicit foundation/style request exists.
- Before changing root/system tokens, universal selectors, pseudo-elements, or shared formulas, identify affected consumers and add representative proof through final output.
- Create only files and abstractions required by the request.
- Do not create fake consumers, placeholder implementation trees, universal validators, generic registries, CSS DSLs, or broad wrappers.

## Rendered foundations and interaction primitives

A rendered foundation or interaction primitive is a valid direct target.

Resolve applicable:

- semantic and input-state ownership;
- token/color/opacity routes;
- rendered bounds, clipping, and shape inheritance;
- acquisition paths owned by the primitive;
- disabled and simultaneous-state behavior;
- lifecycle, cancellation, cleanup, and reduced motion;
- generic consumer bridge;
- testing-only forced-state support.

A token declaration alone does not implement the artifact. Final rendered behavior must work.

## Proof

- New or migrated components have colocated component-contract tests and one stable canonical story when visible.
- Foundations/styles have owner-local tests and bounded fixtures when rendered behavior exists.
- Add browser, pure, consumer, state-matrix, and visual-regression layers only when the changed artifact owns those risks.
- Representative consumers are required for an existing blast radius; an owner-local fixture is valid when no consumer exists.
- Operator visual comparison does not replace technical review.

## Completion

Authoring finishes by:

- updating local README truthfully;
- implementing the explicit request rather than stopping at classification;
- migrating consumers and obsolete ownership when applicable;
- preserving source limitations, proof gaps, and operator feedback;
- running applicable local verification;
- reporting implementation finished or one exact blocker.

A blocker may not consist only of missing consumers, inactive roadmap position, legacy location, or absence of a pre-created canonical directory.

A Material owner is fully implemented only with current-complete evidence, full official coverage for its resolved scope, independent review, and explicit operator acceptance when visible review is required.