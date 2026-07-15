# src/shared/ui

Inherits `src/shared/AGENTS.md`. Applies to `src/shared/ui` and descendants until a deeper rule file refines it.

Use `shared-ui-implementation` for shared UI work and `material3-guidelines` for Material-related decisions.

Public Material implementation also follows:

- `docs/material-3/library-architecture.md`;
- `docs/material-3/foundation-architecture.md`;
- `docs/material-3/component-architecture.md`;
- `docs/material-3/component-testing.md`;
- `src/shared/ui/material/AGENTS.md` inside the canonical library root.

## Contains

- `src/shared/ui/material`: canonical Material library;
- project-specific shared presentation primitives and wrappers outside the Material root;
- generic shared UI layout, interaction, and infrastructure that are not Material-owned.

## Material boundary

- New official public `MD*` components belong under `material/components/<family>`.
- New Material foundation runtime/testing owners belong under `material/foundation/<domain>`.
- Reusable official Material compositions belong under `material/patterns/<pattern>` only after the pattern gate passes.
- Existing Material directories outside the root are legacy and may receive only strict local repairs until focused migration.
- Project-specific UI and generic platform infrastructure stay outside official Material families.

## Shared UI rules

- Use explicit props, emits, slots, native semantics, and narrow behavior ownership.
- Accessibility, keyboard, pointer/touch, focus, lifecycle, visual output, and property ownership are part of the contract where applicable.
- Prefer an existing correctly owned primitive before adding a near-duplicate.
- Keep scroll, sticky/floating, teleport, and overlay behavior tied to the rendered hierarchy.
- Do not style or reposition neighboring parent-flow elements.
- Do not hide unrelated behavior behind a broad options prop.
- Do not import product layers or domain models.

## Material component rules

- Record `standard-authoring`, `handoff-authoring`, or `blocked` before production edits.
- Use the complete canonical family blueprint from `component-architecture.md`; no other document adds mandatory fields.
- Select the smallest profile: `simple`, `configured`, `stateful`, or `configured-stateful`.
- Add token, route, state, behavior, context, or helper layers only under their objective conditions.
- Every new or migrated component has a colocated contract test, one canonical `StateMatrix`, visual regression, and real browser tests when applicable.
- The matrix covers distinct supported component-owned visible routes; non-visual state contracts remain in component/browser tests.
- Forced state proves appearance only.
- Blueprint, library map, registries, code, exports, Storybook, tests, snapshots, risk registration, and consumers must agree.
- Use `blocked` instead of inventing ownership, compatibility, local foundation substitutes, extensions, or test-only production APIs.

## Anti-patterns

Do not introduce without a current requirement:

- universal Material base;
- runtime token/state registry;
- generic resolver or global property precedence;
- CSS DSL or cross-family state machine;
- duplicate theme/overlay/foundation systems;
- production state-matrix component or generic test DSL;
- optional Material capabilities, aliases, or speculative abstractions.

Do not create new Material ownership at legacy paths, move project-specific UI into official families, assert appearance in Vue unit tests, or claim human visual review from automation.

## Verification

Use focused proof for changed location, imports, API, semantics, state/property routing, foundation dependencies, contract behavior, real browser behavior, distinct visual routes, consumers, and review gates. Final completion requires repository verification.

Family/domain migration updates all consumers, exports, stories, tests, snapshots, risk registrations, registries, and the migration map and removes obsolete paths unless a temporary contract is explicitly approved.

Initial or intentionally changed visual baselines require human comparison with recorded official sources.
