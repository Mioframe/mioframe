# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical Material 3 Expressive library boundary.

## Routing

- Use `material-component-authoring` for creating, migrating, aligning, or materially changing an official public component family.
- Use `material-foundation` for cross-family Material foundation changes.
- Use `material3-guidelines` for current official Material 3 Expressive sources, component choice, usage, composition, and minimum supported surface.
- Use `vue-component-implementation` only for Vue mechanics after the Material blueprint is ready.
- Use the specialized testing skills and `verification` for their owned proof layers.
- Use `docs/material-3/autonomous-review.md` for agent evidence review and operator visual handoff.
- Use `docs/material-3` as the durable source of schemas and invariants.

Do not use `shared-ui-implementation` as the authoring workflow for an official Material family. This file owns scoped boundaries and routing; `material-component-authoring` owns execution order and stop conditions.

## Canonical target

- Official components implement the current official Material 3 Expressive contract where one exists.
- Baseline Material 3 is not a silent fallback and may remain only when current official sources provide no Expressive contract for the supported surface or an explicit deviation is approved.
- Existing Mioframe rendering, old snapshots, another implementation, and memory are not Material authority.
- Missing or conflicting source evidence is a blocker, not a visual-review task.

## Contains

Only:

- `foundation`: cross-family Material contracts;
- `components`: official public Material component families;
- `patterns`: accepted reusable official Material compositions;
- local family/domain contracts and curated public entry points.

Policy and source-evidence documents remain under `docs/material-3`. Project-specific UI and generic platform infrastructure remain outside this library.

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
- Do not create foundation wrappers only to route generic DOM, event, geometry, lifecycle, teleport, or browser behavior.
- Foundation must not import components or patterns.
- Families must not deep-import another family's private files or variables.
- Patterns use only public component/foundation contracts and correctly owned generic utilities.
- Library code must not import product layers.
- Generic infrastructure must not depend on Material component-family knowledge.

## New artifacts and ownership

- New official components belong under `components/<family>`.
- New Material foundation runtime or testing owners belong under `foundation/<domain>`.
- New patterns require official composition evidence, a current scenario, and no narrower owner.
- A multi-component family requires an official relationship and a real current shared contract.
- Do not add empty directories, placeholder files, speculative extension points, universal bases, or project-specific UI under official families.

## Public API

- Product consumers use `@shared/ui/material` after the root entry point exists.
- Internal library code does not import the root barrel.
- External deep imports into implementation, private, or testing files are forbidden.
- Every public export has one owner, accurate TSDoc, and matching blueprint or registry status.

## Migration boundary

- Existing Material code outside this directory is legacy, not a template for new ownership.
- Strict local repairs may remain at legacy paths only under a valid `Architecture impact: none` decision.
- Migrate one cohesive family or foundation domain per focused PR.
- A migration must update all affected consumers, exports, contracts, registries, inventory, roadmap, stories, tests, snapshots, risk registration, and the migration map, then remove obsolete paths.
- Temporary compatibility requires exact consumers, no new usage, and a removal target.

## Verification and review boundary

- Automation enforces deterministic repository facts and test outcomes.
- The coding agent owns source-backed architecture, Material contract, accessibility, behavior, route-equivalence, migration, and proof-layer evidence review.
- The operator normally owns only final comparison of prepared `StateMatrix` screenshots with named official sources.
- The agent must not report operator visual acceptance as accepted.
- Unresolved architecture, source, foundation, compatibility, product-deviation, or behavior decisions remain explicit blockers and are not delegated to screenshot review.

Do not claim that automation alone proves free-form architecture or visual correctness. Final completion requires agent evidence review, applicable operator visual acceptance, and repository verification.