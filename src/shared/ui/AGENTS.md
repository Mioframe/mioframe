# src/shared/ui

Inherits `src/shared/AGENTS.md`. Applies to `src/shared/ui` and descendants until a deeper rule file refines it.

## Routing

- Use `shared-ui-implementation` for project-specific presentation primitives, wrappers, and generic shared UI infrastructure outside official Material component families.
- Inside `src/shared/ui/material`, follow `src/shared/ui/material/AGENTS.md` and applicable documents under `src/shared/ui/material/docs`.

Do not assemble a Material component workflow from generic shared UI rules. Material-specific skills will define that workflow once their contracts are approved.

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

## Verification

Shared UI changes require consumer and blast-radius review plus proof at the layer that owns the changed contract. Final completion requires repository verification.
