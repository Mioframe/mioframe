# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical Material 3 Expressive library boundary.

## Routing

- Use `material3-guidelines` for current official Material 3 Expressive sources, component choice, usage, composition, supported surface, and product-facing Material decisions.
- Use `material-component-implementation` only after an architect-approved family contract is marked `Readiness: ready` and an explicit implementation task exists.
- Use `material-component-review` for the independent full-PR technical review and durable family audit after implementation.
- Use `material-foundation` only for an explicitly approved cross-family foundation change.
- Use Vue and testing skills only for applicable implementation and proof layers.
- Use `src/shared/ui/material/docs/workflow.md` for stage and role ownership.

A component name alone is not an implementation contract. Family selection, supported surface, ownership, public API, acceptance criteria, and foundation decisions must be resolved before coding begins.

## Canonical target

- Official components implement the current applicable Material 3 Expressive contract.
- Baseline Material 3 is not a silent fallback.
- Legacy output, existing snapshots, other implementations, and memory are not Material authority.
- Missing or conflicting source evidence is resolved by narrowing unsupported scope or returning an exact architecture blocker.

## Contains

Only:

- `docs` — Material library architecture, source policy, workflow, foundation policies, roadmap, inventory, audits, and verification contracts;
- `foundation` — cross-family Material contracts required by approved current work;
- `components` — official public Material component families;
- `patterns` — accepted reusable official Material compositions;
- local family/domain contracts and curated public entry points.

Product-specific UI and generic platform infrastructure remain outside.

## Dependency direction

```text
shared/lib generic infrastructure
  ├─→ material/foundation
  ├─→ material/components
  └─→ material/patterns

material/foundation → material/components → material/patterns
material library → project-specific shared UI and product layers
```

- Any Material layer may use a correctly owned generic utility directly.
- Foundation must not import components or patterns.
- Families must not deep-import another family's private files.
- Patterns use public component/foundation contracts only.
- Library code must not import product layers.
- Generic infrastructure must not depend on Material family knowledge.

## Documentation ownership

- `src/shared/ui/material/docs/**` is the only canonical Material-library documentation tree.
- Family `README.md` files own approved family contracts.
- `src/shared/ui/material/docs/workflow.md` owns stage and role separation.
- `src/shared/ui/material/docs/audits/<family>.md` owns the latest independent family review.
- `src/shared/ui/material/docs/foundation-registry.md` owns current foundation readiness and gaps.
- `src/shared/ui/material/docs/library-roadmap.md` owns the current program milestone, blocker, and next action.
- `src/shared/ui/material/docs/ui-library-inventory.md` owns classification, priority, dependencies, and terminal outcomes.
- Executable procedures live in `.agents/skills`; they must not duplicate architecture policy.

Do not add Material policy, roadmap, audit, registry, or workflow documents under root `docs`.

## Public API

- Product consumers use `@shared/ui/material` after the root entry point exists.
- Internal library code does not import the root barrel.
- External deep imports into private implementation or testing files are forbidden.
- Every public export has one clear owner.

## Implementation gate

Production edits require:

- an approved family or foundation contract;
- `Readiness: ready`;
- explicit goal, non-goals, scenarios, ownership, public API, supported surface, acceptance criteria, and verification ownership;
- an implementation task that defines scope and Forbidden.

The coding agent implements the contract. It does not select another family, broaden scope, approve architecture, silently rewrite policy, perform independent review, or claim merge readiness.

## Migration boundary

- Existing Material code outside this directory is legacy, not a template for new work.
- Use one cohesive end-to-end family migration by default.
- Split foundation, relocation, or alignment work only when blast radius, compatibility, reviewability, or a safer independently valid state justifies it.
- Migrate affected consumers and remove obsolete ownership.
- Temporary compatibility requires exact consumers, no new usage, and a removal target.

## Verification and review

- Every new or migrated component has component-contract tests.
- Use browser, pure, consumer, visual-regression, and operator-review layers only when the component owns those contracts.
- Automation proves only deterministic facts represented by actual tooling.
- Independent review checks the complete PR against the approved contract and official evidence.
- The operator owns only final comparison of prepared visible evidence when required.
- The coding agent never approves its own implementation or reports operator acceptance as accepted.

After two correction rounds still showing ownership drift, missing scenarios, unstable public contracts, mixed responsibilities, or growing workaround logic, stop patching and redo the architecture decision.
