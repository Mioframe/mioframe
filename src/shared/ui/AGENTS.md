# src/shared/ui

Inherits `src/shared/AGENTS.md`. Applies to `src/shared/ui` and descendants until a deeper rule file refines it.

## Routing

- Use `shared-ui-implementation` for project-specific presentation primitives, wrappers, and generic shared UI infrastructure outside official Material component families.
- Use `material-component-authoring` for any new, migrated, aligned, or materially changed official public Material component family, including legacy `MD*` components outside `src/shared/ui/material`.
- Use `material-foundation` for changes to cross-family Material foundation contracts.
- Use `material3-guidelines` for official source lookup, component choice, usage, composition, and product-facing Material decisions.
- Inside `src/shared/ui/material`, also follow `src/shared/ui/material/AGENTS.md` and the canonical architecture under `docs/material-3`.

Do not assemble an official Material component workflow from generic shared UI rules. `material-component-authoring` is the primary execution contract for that work.

## Contains

- `src/shared/ui/material`: canonical Material library;
- project-specific shared presentation primitives and wrappers outside the Material root;
- generic shared UI layout, interaction, and infrastructure that are not Material-owned.

## Shared UI rules

- Use explicit props, emits, slots, native semantics, and narrow behavior ownership.
- Accessibility, keyboard, pointer/touch, focus, lifecycle, visual output, and property ownership are part of the contract where applicable.
- Prefer an existing correctly owned primitive before adding a near-duplicate.
- Keep scroll, sticky/floating, teleport, and overlay behavior tied to the rendered hierarchy.
- Do not style or reposition neighboring parent-flow elements.
- Do not hide unrelated behavior behind a broad options prop.
- Do not import product layers or domain models.
- Keep project-specific wrappers and behavior outside official Material families.

## Material boundary

- New official public `MD*` components belong under `material/components/<family>`.
- New Material foundation runtime/testing owners belong under `material/foundation/<domain>`.
- Reusable official Material compositions belong under `material/patterns/<pattern>` only after the pattern gate passes.
- Existing Material directories outside the canonical root are legacy and may receive only strict local repairs until focused migration.
- New Material ownership at a legacy path is forbidden.

These are routing and boundary rules only. Component profiles, blueprint requirements, foundation dependencies, migration passes, `StateMatrix`, and Material completion gates belong to `material-component-authoring` and the canonical Material architecture.

## Verification

- Shared UI changes require consumer and blast-radius review.
- Use focused contract, browser, or visual proof at the layer that owns the changed behavior.
- Final completion requires repository verification.
