# src/shared/ui

Inherits `src/shared/AGENTS.md`. Applies to `src/shared/ui` and descendants until a deeper rule file refines it.

## Routing

- Use `shared-ui-implementation` for project-specific presentation primitives, wrappers, and generic shared UI infrastructure outside official Material component families.
- Use `material-component` when the user provides only a Material component or family name and expects autonomous creation, migration, or alignment.
- Use `material-component-review` when the user provides a Material component or family name and wants an evidence-backed compliance review without implementation changes.
- Use `material-component-authoring` as the canonical execution workflow after the Material family is resolved, including legacy `MD*` components outside `src/shared/ui/material`.
- Use `material-foundation` for changes to cross-family Material foundation contracts.
- Use `material3-guidelines` for official source lookup, component choice, usage, composition, and product-facing Material decisions.
- Inside `src/shared/ui/material`, follow `src/shared/ui/material/AGENTS.md` and the canonical architecture under `docs/material-3`.

A one-name invocation is sufficient input for `material-component` and `material-component-review`; do not require the user to supply variants, API, files, tests, foundations, consumers, or expected defects before repository and source discovery.

A completed `material-component-review` run must create or replace `docs/material-3/audits/<family-slug>.md`. Review-only means no implementation, test, registry, family-contract, or policy changes; the durable audit artifact is required.

Do not assemble an official Material component workflow from generic shared UI rules. `material-component-authoring` remains the primary execution contract after target resolution.

## Contains

- `src/shared/ui/material`: canonical Material library;
- project-specific shared presentation primitives and wrappers outside the Material root;
- generic shared UI layout, interaction, and infrastructure that are not Material-owned.

## Boundaries

- Project-specific and generic shared UI stays outside official Material component families.
- New official public `MD*` components belong under `material/components/<family>`.
- New Material foundation runtime/testing owners belong under `material/foundation/<domain>`.
- Reusable official Material compositions belong under `material/patterns/<pattern>` only after the pattern gate passes.
- Existing Material directories outside the canonical root are legacy and may receive only strict local repairs until focused migration.
- New Material ownership at a legacy path is forbidden.
- Shared UI must not import product layers or domain models.

Detailed generic component rules belong to `shared-ui-implementation`. Material target resolution belongs to `material-component`; review-only compliance assessment and durable audit creation belong to `material-component-review`; detailed execution belongs to `material-component-authoring` and `src/shared/ui/material/AGENTS.md`.

## Verification

Shared UI changes require consumer and blast-radius review plus proof at the layer that owns the changed contract. Final completion requires repository verification.