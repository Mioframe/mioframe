# src/shared/ui

Inherits `src/shared/AGENTS.md`. Applies to `src/shared/ui` and descendants until a deeper rule file refines it.

Use `shared-ui-implementation` and `material3-guidelines` for shared UI work.

Public Material implementation additionally follows:

- `docs/material-3/library-architecture.md`;
- `docs/material-3/foundation-architecture.md`;
- `docs/material-3/component-architecture.md`;
- the deeper `src/shared/ui/material/AGENTS.md` after entering the library root.

## Contains

- `src/shared/ui/material`: the canonical Material library;
- project-specific shared presentation primitives and wrappers outside the Material root;
- generic shared UI layout building blocks, interaction helpers, and infrastructure that are not Material-owned.

## Material library boundary

- New official public `MD*` components belong only under `src/shared/ui/material/components/<family>`.
- New Material foundation runtime artifacts belong only under `src/shared/ui/material/foundation/<domain>`.
- Reusable official Material compositions belong under `src/shared/ui/material/patterns/<pattern>` only after the pattern gate passes.
- Existing Material directories outside `material` are legacy and may receive only strict local repairs until focused migration.
- Project-specific shared UI must stay outside official Material component families even when it consumes Material primitives.
- Generic infrastructure must stay outside the Material library unless the contract itself is Material-owned.

## Patterns

- Drive components through explicit props, emits, slots, native semantics, and narrowly owned behavior.
- Accessibility, keyboard, pointer, touch, focus, and property ownership are part of the component contract.
- Extend an existing primitive before adding a near-duplicate component.
- Keep scroll-aware, sticky, floating, and teleport behavior tied to the actual rendered hierarchy.
- Do not style or reposition neighboring parent-flow elements.
- For a new or materially changed public Material component, use `standard-authoring`, `handoff-authoring`, or `blocked` before production edits.
- In `standard-authoring`, derive and write the compact family README blueprint from required scenarios, official Material sources, accepted foundation contracts, library ownership, and native semantics.
- Select exactly one smallest objective profile: `simple`, `configured`, `stateful`, or `configured-stateful`.
- Add token, route, state, and private alias layers only when their documented condition applies; empty or convenience-only layers are forbidden.
- Family README, library migration map, production code, public exports, registries, Storybook, and verification must agree.
- Use `blocked` rather than inventing behavior, ownership, migration compatibility, or local foundation substitutes.

## Anti-patterns

- Do not import `entities`, `features`, `widgets`, `pages`, or `app` here.
- Do not couple shared UI to document, property, or view models.
- Do not hide unrelated behavior behind one broad options prop.
- Do not introduce a universal Material base, runtime token registry, generic resolver, global property precedence, CSS DSL, cross-family state machine, or family knowledge in generic foundations.
- Do not add optional Material capabilities, project extensions, compatibility aliases, or abstractions without a named current scenario.
- Do not create new Material artifacts at legacy paths.
- Do not move project-specific components into the Material library merely to centralize files.

## Constraints

- Base control, foundation, layout, and public-library export changes have wide UI blast radius.
- Minimum verification: type-check plus focused verify-managed checks for changed location, imports, API, semantics, state routing, property ownership, browser behavior, or appearance. Final completion requires repository verification.
- Standard component authoring must stay bounded to the relevant Material surface and named consumers.
- A family/domain migration updates all consumers and removes the obsolete path in the same focused PR unless a temporary compatibility contract is explicitly approved.
