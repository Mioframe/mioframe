# src/shared/ui

Inherits `src/shared/AGENTS.md`. Applies to `src/shared/ui` and descendants until a deeper rule file refines it.

## Routing

- Use `shared-ui-implementation` for project-specific presentation primitives, wrappers, and generic shared UI infrastructure outside official Material families.
- Use `material-component` for creation, migration, alignment, or review of an official Material component family.
- Use `material-component-authoring` after the family and change mode are resolved.
- Use `material-foundation` for cross-family Material foundation changes.
- Use `material3-guidelines` for official source lookup, component choice, usage, and composition.
- `material-library-next` and `material-library-status` are thin roadmap/status entry points and must not create independent Material state.
- Inside `src/shared/ui/material`, follow its `AGENTS.md` and minimal documentation set.

A component or family name is sufficient input. Resolve variants, API, foundations, consumers, files, and proof from official sources and the repository rather than asking the user to design the component.

Review-only work reports findings in the conversation or PR review. It must not create a durable audit document.

## Boundaries

- All Material-owned implementation, documentation, family/domain contracts, stories, fixtures, and focused tests belong under `src/shared/ui/material`.
- Project-specific and generic shared UI remains outside official Material ownership.
- New official public `MD*` families belong under `material/components/<family>`.
- New cross-family Material owners belong under `material/foundation/<domain>` only after a real need is proven.
- Reusable official Material compositions belong under `material/patterns/<pattern>` only after the pattern gate passes.
- Existing Material directories outside the canonical root are legacy and may receive only strict local repairs until focused migration.
- Shared UI must not import product layers or domain models.

Do not create Material registries, inventories, durable audits, or duplicate workflow policy outside the Material root.

## Verification

Shared UI changes require consumer and blast-radius review plus proof at the layer that owns the changed contract. Final completion requires repository verification.
