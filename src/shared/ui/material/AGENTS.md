# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical Material 3 Expressive library boundary.

## Routing

Use `material` as the default implementation entrypoint for any named Material artifact or bounded Material correction.

```text
material Button
material State layer
material Ripple
material Elevation
material Typography
```

The user does not need to classify the request.

The router resolves:

- component families → `material-component` → `material-component-authoring`;
- foundations and interaction primitives → `material-foundation`;
- styles and token systems → `material-foundation`;
- cross-layer requests → one canonical shared owner plus only affected consumer changes.

Specialized entrypoints remain valid:

- `material-component` for a component family;
- `material-component-review` for independent component review;
- `material-foundation` for a known foundation/style target;
- `material-library-status` for read-only program status;
- `material-library-next` for exactly one next queued migration target;
- `material3-guidelines` for official source resolution.

If a foundation/style request enters through `material-component`, reroute it and continue. Do not refuse it because the skill name contains `component`.

## Explicit-request rule

A valid explicit request for an official Material artifact is a current requirement.

Do not refuse or defer merely because:

- the artifact is not a component;
- no component migration is active;
- no current production consumer exists;
- only one current component consumes it;
- the roadmap names another family;
- the canonical directory is absent;
- the current owner is legacy.

When no production consumer exists, implement the smallest coherent requested official contract with owner-local tests and a bounded testing/Storybook fixture. Do not invent a fake product consumer.

Existing consumers determine migration and blast-radius proof, not whether the explicit request is allowed.

## Workflow evidence boundary

Material authoring and review use:

- the current user task;
- current workspace files;
- official Material sources;
- local project verification commands.

Do not run, inspect, or cite `git`, `gh`, GitHub, commits, branches, pull requests, diffs, blame, logs, tags, merge state, or repository history inside these workflows.

## Canonical navigation

```text
foundations/
styles/
components/
```

- `foundations/<official-slug>` — official foundation domains and interaction primitives;
- `styles/<official-slug>` — official visual systems;
- `components/<official-docs-slug>` — official component families.

Examples:

```text
m3.material.io/components/buttons
→ src/shared/ui/material/components/buttons

state layer / ripple / focus indication
→ src/shared/ui/material/foundations/interaction
```

Use a narrower official slug when official navigation defines one.

Do not create a top-level `patterns` tree without an equivalent official documentation owner.

## Canonical source status

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

Use `complete` only with current-complete evidence. Partial, truncated, suspicious, stale-only, missing, or spot-check-only evidence cannot certify complete current inventory.

## Capability classification

Classify each official item as exactly one of:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- officially unsupported or an invalid combination;
- unresolved because canonical evidence is incomplete or conflicting;
- outside the resolved owner boundary.

`Not implemented` is reserved for a real official capability that exists but is absent.

An officially unsupported or invalid combination is a constraint, not missing capability. Optional guidance is not automatically required capability.

## Local documentation

Every implemented or actively migrated owner has local documentation:

```text
foundations/<official-slug>/README.md
foundations/<official-slug>/AUDIT.md

styles/<official-slug>/README.md
styles/<official-slug>/AUDIT.md

components/<official-docs-slug>/README.md
components/<official-docs-slug>/AUDIT.md
```

- README is current implementation documentation and is updated by authoring.
- AUDIT is the latest independent review and is never edited by authoring.
- No separate operator report file is required.

README records official mapping, source status, inventory, coverage, implementation state, omissions, invalid routes, known issues, ownership, consumers, verification, and review state.

Component-family README also persists operator feedback and visual status.

## Operator feedback

For visible component or rendered foundation/style behavior, the user reports problems directly in the task message.

```text
Status: not reviewed | required | rejected | awaiting re-review | accepted
Latest operator feedback: none | <summary>
Implementation response: none | <summary>
```

- A reported visible defect means `rejected`.
- Authoring preserves the feedback.
- After production behavior changes, authoring may use `awaiting re-review`.
- Only explicit user acceptance may set `accepted`.
- Passing tests, technical routing, screenshots, or silence do not imply acceptance.

A production change sets `Review status: review required after changes`.

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
- product consumers use `@shared/ui/material`;
- private implementation, tests, fixtures, stories, docs, and audits are not public API.

Generic platform utilities remain generic when they contain no Material semantics. Material-specific state, token, clipping, focus, motion, or rendering ownership belongs in the Material library even when its legacy implementation currently lives elsewhere.

## Implementation rules

- Implement the smallest coherent surface required by the explicit user request and affected consumers.
- Use exact official token meanings and shortest final property routes.
- A route exists only when its source can affect the final output through a real dependency.
- Colocation, aliases, equality assertions, comments, stories, and tests do not create a route.
- Keep family-specific behavior local unless an official shared owner or explicit foundation/style request exists.
- Before changing root/system tokens, universal selectors, pseudo-elements, or shared formulas, identify affected consumers and add representative proof that exercises the route.
- Unchanged tests that never exercise a shared route are not proof.
- Create only files and abstractions required by the current request.
- Do not create fake consumers, placeholder implementation trees, universal validators, generic state registries, CSS DSLs, or broad wrappers.

## State layer and interaction foundations

State layer, ripple, and focus indication are valid direct implementation targets.

Their workflow must resolve applicable:

- semantic and state-input ownership;
- color/opacity routes;
- rendered bounds, clipping, and shape inheritance;
- pointer/focus/keyboard acquisition where owned;
- disabled and simultaneous-state behavior;
- lifecycle, cancellation, cleanup, and reduced motion;
- generic component-consumption bridge;
- testing-only forced-state support.

A token declaration alone does not implement the artifact. The final rendered owner and behavior must work.

## Proof

- New or migrated components have colocated component-contract tests and one stable canonical story when visible.
- Foundations/styles have owner-local contract tests and bounded fixtures when rendered behavior exists.
- Add browser, pure, consumer, state-matrix, and visual-regression layers only when the changed artifact owns those risks.
- Representative consumers are required for existing blast radius; a standalone owner fixture is valid when no consumer exists.
- Operator visual comparison does not replace technical review.

## Completion behavior

Authoring finishes by:

- updating local README truthfully;
- implementing the explicit requested contract rather than stopping at classification;
- migrating current consumers and obsolete ownership when applicable;
- preserving source limitations, proof gaps, and operator feedback;
- running applicable local verification;
- reporting `implementation finished` or one exact blocker.

A blocker may not consist only of missing current consumers, inactive roadmap position, legacy location, or absence of a pre-created canonical directory.

A Material owner is fully implemented only with current-complete evidence, full official coverage for its resolved scope, independent review, and explicit operator acceptance when visible review is required.
