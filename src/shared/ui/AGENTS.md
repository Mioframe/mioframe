# src/shared/ui

Inherits `src/shared/AGENTS.md`. Applies to `src/shared/ui` and descendants until a deeper rule file refines it.

## Routing

- Use `shared-ui-implementation` for project-specific presentation primitives, wrappers, and generic shared UI infrastructure outside official Material component families.
- Use `material-library-status` for a read-only Material program status report.
- Use `material-library-next` when the user wants Material library work to continue without selecting a component; it selects exactly one family.
- Use `material-component` when the user provides a Material component or family name and expects creation, migration, alignment, or correction.
- Use `material-component-review` for an independent evidence-backed review without implementation changes.
- Use `material-component-authoring` as the canonical implementation workflow after the official family is resolved, including legacy `MD*` components outside `src/shared/ui/material`.
- Use `material-foundation` for real cross-family Material foundation or style contracts.
- Use `material3-guidelines` for official source lookup, component choice, usage, composition, and product-facing Material decisions.
- Inside `src/shared/ui/material`, follow `src/shared/ui/material/AGENTS.md` and `docs/material-3`.

A component name is sufficient input. The same message may include concrete operator feedback about visible behavior. Do not require the user to supply variants, API, files, tests, foundations, styles, consumers, expected defects, or a separate visual report file.

`material-library-next` requires no component name and selects only one family per run. `material-library-status` is read-only.

A completed `material-component-review` creates or replaces only:

```text
src/shared/ui/material/components/<official-docs-slug>/AUDIT.md
```

Review-only means no implementation, test, story, README, registry, roadmap, or policy changes.

Do not assemble an official Material component workflow from generic shared UI rules. `material-component-authoring` remains the primary implementation contract after target resolution.

## Contains

- `src/shared/ui/material`: canonical Material library;
- project-specific shared presentation primitives and wrappers outside the Material root;
- generic shared UI layout, interaction, and infrastructure that are not Material-owned.

## Boundaries

- Project-specific and generic shared UI stays outside official Material component families.
- New official public `MD*` components belong under `material/components/<official-docs-slug>`.
- Official cross-family foundation contracts belong under `material/foundations/<official-docs-slug>` when migrated.
- Official cross-family style systems belong under `material/styles/<official-docs-slug>` when migrated.
- Product-specific compositions remain outside the official Material library.
- Existing Material directories outside the canonical root are legacy and may receive only strict local repairs until focused migration.
- New Material ownership at a legacy path is forbidden.
- Shared UI must not import product layers or domain models.

## Documentation ownership

- Family `README.md` owns current implementation state, supported surface, omissions, known issues, dependencies, consumers, verification, review status, and persistent operator feedback.
- Family `AUDIT.md` owns the latest independent technical/canonical review.
- Implementing agents update README and never edit AUDIT.
- Reviewing agents update AUDIT and never edit implementation or README.
- Explicit visual feedback from the user is persisted in README.
- A reported visual defect remains rejected until production behavior changes and the user explicitly accepts the replacement.
- Any incomplete, deferred, provisional, unverified, defective, or visually rejected item must be recorded honestly.

## Verification

Shared UI changes require consumer and blast-radius review plus proof at the layer that owns the changed contract. Implementation completion requires applicable local repository verification and truthful documentation; independent review and operator visual acceptance remain separate steps.