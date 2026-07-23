# src/shared/ui

Inherits `src/shared/AGENTS.md`. Applies to `src/shared/ui` and descendants until a deeper rule file refines it.

## Routing

- Use `shared-ui-implementation` for project-specific presentation primitives, wrappers, and generic shared UI infrastructure outside official Material component families.
- Use `material3-guidelines` for official Material source lookup, component choice, usage, composition, supported surface, and product-facing Material decisions.
- Use `material-component-implementation` only for an official Material family with an architect-approved `Readiness: ready` contract and explicit implementation task.
- Use `material-component-review` for independent full-PR review of an implemented Material family and durable audit creation.
- Use `material-foundation` only for an explicitly approved cross-family Material foundation change.
- Inside `src/shared/ui/material`, follow `src/shared/ui/material/AGENTS.md` and `src/shared/ui/material/docs/workflow.md`.

Do not start Material production work from only a component name. The architect owns family selection, supported surface, ownership, public API, acceptance criteria, implementation task, and merge recommendation.

A completed `material-component-review` run may create or replace only `src/shared/ui/material/docs/audits/<family-slug>.md`. Review-only means no production implementation, test, story, registry, family-contract, roadmap, or policy changes.

Do not assemble an official Material component workflow from generic shared UI rules. `material-component-implementation` remains the coding procedure after a ready contract exists.

## Contains

- `src/shared/ui/material`: canonical Material library;
- project-specific shared presentation primitives and wrappers outside the Material root;
- generic shared UI layout, interaction, and infrastructure that are not Material-owned.

## Boundaries

- Project-specific and generic shared UI stays outside official Material component families.
- New official public `MD*` components belong under `material/components/<family>`.
- New Material foundation runtime/testing owners belong under `material/foundation/<domain>` only when approved current work proves the cross-family need.
- Reusable official Material compositions belong under `material/patterns/<pattern>` only after the pattern gate passes.
- Existing Material directories outside the canonical root are legacy and may receive only strict local repairs until focused migration.
- New Material ownership at a legacy path is forbidden.
- Shared UI must not import product layers or domain models.

Detailed generic component rules belong to `shared-ui-implementation`. Material source decisions belong to `material3-guidelines`; approved implementation belongs to `material-component-implementation`; independent technical review belongs to `material-component-review`; stage ownership belongs to `src/shared/ui/material/docs/workflow.md`.

## Verification

Shared UI changes require consumer and blast-radius review plus proof at the layer that owns the changed contract. Final completion requires repository verification. Implementation completion does not imply architecture approval or merge readiness.
