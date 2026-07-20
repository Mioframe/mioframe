# src/shared/ui

Inherits `src/shared/AGENTS.md`. Applies to `src/shared/ui` and descendants until a deeper rule file refines it.

## Routing

- Use `shared-ui-implementation` for project-specific presentation primitives, wrappers, and generic shared UI infrastructure outside official Material families.
- Use `material-component` as the sole implementation entry point for exactly one official Material family.
- Use `material-component-review` only for independent review-only assessment without production changes.
- Use `material-foundation` for a focused real cross-family Material foundation contract change.
- Use `material3-guidelines` for official source lookup, component choice, usage, and composition.
- Use `material-library-status` only for concise read-only roadmap, PR, and verification status.
- Inside `src/shared/ui/material`, follow its `AGENTS.md`; it owns internal Material stages and detailed workflow routing.

A component or family name is sufficient input. When none is supplied, `material-component` may continue only the one active family recorded by the roadmap. Resolve variants, API, foundations, consumers, files, and proof from official sources and the repository rather than asking the user to design the component.

Implementation and review are separate entry points. Do not invoke internal Material stage skills directly.

## Boundaries

- All canonical Material-owned implementation, documentation, family/domain contracts, stories, fixtures, and focused tests belong under `src/shared/ui/material`.
- Project-specific and generic shared UI remains outside official Material ownership.
- New official public `MD*` families belong under `material/components/<family>`.
- New cross-family Material owners belong under `material/foundation/<domain>` only after a real need is proven.
- Reusable official Material compositions belong under `material/patterns/<pattern>` only after the pattern gate passes.
- Existing Material directories outside the canonical root are legacy and may receive only strict local repairs until focused migration.
- Shared UI must not import product layers or domain models.

Do not create Material registries, inventories, durable audits, separate checklists, progress ledgers, or duplicate workflow policy outside the Material root.

## Verification

Shared UI changes require consumer and blast-radius review plus proof at the layer that owns the changed contract. Final completion requires repository verification.
