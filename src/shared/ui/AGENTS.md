# src/shared/ui

Inherits `src/shared/AGENTS.md`. Applies to `src/shared/ui` and descendants until a deeper rule file refines it.

## Routing

- Use `shared-ui-implementation` for project-specific presentation primitives, wrappers, and generic shared UI infrastructure outside official Material families.
- Use `material-component` as the sole implementation entry point for exactly one official Material family.
- Use `material-component-review` only for independent review-only assessment without production changes.
- Use `material-foundation` for focused convergence of a real cross-family Material foundation contract.
- Use `material3-guidelines` for official source lookup, component choice, usage, and composition.
- Use `material-library-status` only for concise read-only roadmap, PR, and verification status.
- Inside `src/shared/ui/material`, follow its `AGENTS.md`; it owns internal Material stages and detailed workflow routing.

A component or family name is sufficient input. When none is supplied, `material-component` may continue only the one active family recorded by the roadmap. Resolve the canonical target, current defects, foundations, consumers, owners, files, and proof from official sources and repository evidence rather than asking the user to design the component.

Implementation and review are separate entry points. Do not invoke internal Material stage skills directly.

## Boundaries

- All canonical Material-owned implementation, documentation, family/domain contracts, stories, fixtures, and focused tests belong under `src/shared/ui/material`.
- Project-specific and generic shared UI remains outside official Material ownership.
- New official public `MD*` families belong under `material/components/<family>`.
- New cross-family Material owners belong under `material/foundation/<domain>` only after a real need is proven.
- Reusable official Material compositions belong under `material/patterns/<pattern>` only after the pattern gate passes.
- Existing official Material directories outside the canonical root are legacy owners. They may be assessed and corrected in place through `material-component` until a complete relocation is safe. Do not create parallel active owners or force relocation before correctness.
- Shared UI must not import product layers or domain models.

Do not create Material registries, inventories, durable audits, separate checklists, alignment scorecards, progress ledgers, or duplicate workflow policy outside the Material root.

## Verification

Shared UI changes require consumer and blast-radius review plus proof at the layer that owns the changed contract. Final completion of each correction objective requires repository verification; full family completion additionally requires an `aligned` family status.
