# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical Material 3 Expressive library boundary.

## Routing

- Use `material-library-status` for a read-only report based on roadmap, inventory, registries, and colocated family documentation.
- Use `material-library-next` to select and execute exactly one next family.
- Use `material-component` when the user supplies a component or family name for creation, migration, or alignment.
- Use `material-component-review` for an independent source-backed review without production changes.
- Use `material-component-authoring` after the target family is resolved.
- Use `material-foundation` when a real cross-family foundation or style contract changes.
- Use `material3-guidelines` for official sources and supported surface.

A component name is sufficient. Resolve API, consumers, dependencies, tests, omissions, invalid combinations, and source limitations from current workspace and official evidence.

## Workflow evidence boundary

Material component authoring and review use:

- current workspace files;
- official Material sources;
- local project verification commands.

Do not run, inspect, or cite `git`, `gh`, GitHub, commits, branches, pull requests, diffs, blame, logs, tags, merge state, or repository history inside these workflows.

Historical provenance is not required to judge current ownership, behavior, consumers, or compliance.

## Canonical navigation

```text
foundations/
styles/
components/
```

- `foundations/<official-slug>` — official foundation domains.
- `styles/<official-slug>` — color, elevation, icons, motion, shape, typography, and other official style domains.
- `components/<official-docs-slug>` — official component families.

Use the official documentation slug. Button belongs in `components/buttons`, matching `m3.material.io/components/buttons`.

Do not create a top-level `patterns` tree without an equivalent official documentation owner. Product compositions remain outside the official library.

## Canonical source status

Every active family records:

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

Use `complete` only with current-complete evidence. A partial, truncated, suspicious, stale-only, missing, or spot-check-only source cannot certify complete inventory.

## Capability classification

Classify each official item as exactly one of:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- officially unsupported or an invalid combination;
- unresolved because canonical evidence is incomplete or conflicting;
- outside the resolved family boundary.

`Not implemented` is reserved for a real supported capability that exists but is absent.

An officially unsupported or invalid combination is a constraint, not a missing capability. It does not reduce coverage when rejection or normalization is coherent.

Optional or non-normative guidance is recorded as a project choice, deviation, or follow-up. It reduces coverage only when required for the implemented surface.

## Family documentation

Every implemented or actively migrated family may own:

```text
components/<official-docs-slug>/README.md
components/<official-docs-slug>/AUDIT.md
components/<official-docs-slug>/VISUAL_REVIEW.md
```

- README is current implementation documentation and is updated by authoring.
- AUDIT is the latest independent technical/canonical review and is updated only by `material-component-review`.
- VISUAL_REVIEW is the durable operator decision and is created or replaced only after operator review.

README records official mapping, source status, inventory, coverage, implementation state, omissions, invalid combinations, known issues, dependencies, consumers, verification, and review state.

A production change sets `Review status: review required after changes`. Authoring never edits AUDIT or VISUAL_REVIEW.

A review-only run creates or replaces only AUDIT. It reads but never edits VISUAL_REVIEW.

A rejected VISUAL_REVIEW remains authoritative until the operator reviews new evidence and replaces it. Agents must not downgrade it to `required`, infer acceptance, or call the visible behavior resolved.

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
- a family does not deep-import another family's private files;
- Material code does not import product layers;
- product consumers use `@shared/ui/material`;
- private implementation, tests, stories, docs, audits, and visual reviews are not public API.

## Implementation rules

- Implement the minimum coherent surface required by current consumers.
- Use exact official token meanings and shortest final property routes.
- A route exists only when its source can affect the final output through a real dependency.
- Colocation, aliases, equality assertions, comments, stories, and tests do not create a route.
- Keep behavior family-local unless a real cross-family contract exists.
- Before changing root/system tokens, universal selectors, pseudo-elements, or shared formulas, identify current affected families, prefer the narrowest owner, and add representative proof that exercises the route.
- Unchanged tests that never exercise a shared route are not proof.
- Create only files and abstractions required by current work.

## Motion proof

Verify a shared motion foundation deeply once.

At component level, prove only:

- real input activates the intended rendered property;
- one meaningful intermediate state when needed;
- correct endpoint;
- safe interruption or cancellation;
- consumption of the documented shared contract.

Do not require frame-by-frame analysis. Do not duplicate equivalent input paths. Forced state proves appearance, not motion.

Perceived fidelity is operator-owned. A rejected VISUAL_REVIEW is an open implementation defect even when technical routing is correct.

## Proof

- Every new or migrated component has colocated component-contract tests.
- Every visible component has one stable canonical story.
- Add state-matrix, browser, pure, consumer, and visual-regression layers only when the family owns those risks.
- Operator visual comparison does not replace technical review.

## Completion behavior

Authoring finishes by:

- updating README truthfully;
- preserving source limitations, shared proof gaps, and operator visual status;
- running applicable local verification;
- reporting `implementation finished` or one exact blocker;
- recommending `material-component-review <family>`.

Review records the independent result in AUDIT and mirrors VISUAL_REVIEW without changing it.

A family is fully implemented only with current-complete evidence, independent `Official coverage: full`, and accepted required visual review. A family cannot leave active migration while VISUAL_REVIEW is rejected or blocked.