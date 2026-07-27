# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical project-facing Material library boundary.

## Required workflow

- Read `docs/architecture.md`, `docs/component-adapter.md`, `docs/component-tokens.md`, `docs/token-api.md`, `docs/m3e-defects.md`, `docs/roadmap.md`, and the selected family README.
- Use `material-component-adapter` for one explicitly selected official Material component.
- Use `architect-handoff` when a requirement changes unresolved cross-family ownership, renderer strategy, or public token architecture, or cannot be assigned safely.
- If the selected component requires another official Material component, implement or complete that dependency as its own canonical `MD*` adapter before composing it.
- If the decision creates or changes a separate non-Material component under `src/shared/ui`, also apply `.agents/skills/shared-ui-implementation/SKILL.md`.

## Authority

1. Official Material 3 Expressive documentation owns the public `MD*` component and token models.
2. Current Mioframe consumers determine which subset is required now.
3. The installed lockfile-resolved `@m3e/web` artifact and observable browser behavior determine what can be delegated to the private renderer and how it actually behaves.
4. The accepted family matrix records the selected Material subset, public Vue API, exact renderer mapping, dependencies, gaps, selected/deferred tokens, ownership, and proof.
5. Canonical Material CSS declarations plus `docs/token-api.md` own the supported public token surface.
6. `docs/m3e-defects.md` owns stable identities and lifecycle state for confirmed incorrect m3e implementations and documentation mismatches.

Upstream m3e source, tags, demos, and changelogs are supporting evidence only. m3e and legacy Mioframe components are not public API authorities.

## Source interpretation

Inspect overview, specs, guidelines, and accessibility pages. Follow related-component placement and composition references.

- Token tables are not complete capability or validity matrices.
- Absence from one page, token family, m3e, legacy code, or tests is not proof of prohibition.
- Negative or restrictive decisions require positive official evidence.
- When official sources conflict, record `source-conflict`; do not invent a restriction.
- A composition mapping must distinguish the parent component's tokens from the dependency component's own constraints.
- Keep m3e absence and m3e defects distinct: unsupported capability is `missing` in the family matrix; confirmed incorrect documented or implemented behavior is `divergent`, references a stable `M3E-*` ID, and is recorded in `docs/m3e-defects.md`.
- Do not create an `M3E-*` record for deferred optional surface, Material source conflict, Mioframe extension, observably equivalent internal implementation, or unverified suspicion.

## Material-first public API

A public `MD*` component exposes only the demand-scoped official Material contract, expressed idiomatically in Vue.

- Use Material terminology and semantics for public props, values, slots, events, states, defaults, and combinations.
- Do not expose raw m3e vocabulary or preserve conflicting legacy API.
- Do not add unused renderer/native surface for hypothetical completeness.
- If the public API permits two states simultaneously, define their precedence and verify the combination.
- A combination may be rejected only through an explicit public/runtime contract backed by positive Material evidence.

## Token ownership

The physical declaration owner must match the semantic owner.

- `foundation/tokens.css` owns supported renderer-independent `--md-ref-*` and `--md-sys-*` foundations.
- `foundation/theme.css` owns the default palette and light/dark system color assignments.
- `components/<family>/tokens.css` owns only that family's supported official `--md-comp-<family>-*` subset and private m3e mappings.
- `docs/token-api.md` lists every supported public token. Runtime declarations and catalogue entries change together.
- `--app-*` belongs outside the Material library.
- `--m3e-*` and `--md-private-*` are private and must not appear in the public token catalogue.

Do not copy the complete Material component-token catalogue or m3e defaults. Unsupported official tokens remain `deferred` in family matrices.

`src/shared/lib/md/tokens.css` is a legacy mixed-owner file. Do not add new public tokens there. A token-ownership migration must inventory and split retained declarations, update the global import, populate `token-api.md`, remove the legacy file, and leave no compatibility alias or duplicate declaration owner.

For every supported token, verify its CSS value grammar against all selected current consumers. Equal numeric meaning does not make unitless and percentage forms interchangeable in every CSS grammar. Prefer one foundation representation when it works for all selected consumers; otherwise keep conversion private to the owning adapter under the documented mapping/workaround rules.

## Official Material dependencies

An official Material component used by another `MD*` remains independently owned.

1. Identify it in the parent matrix.
2. Implement or complete its canonical demand-scoped `MD*` adapter first.
3. Give it its own official-source review, matrix, root public export, renderer typing, accessibility contract, token/presentation boundary, divergence record, tests, stories, visual proof, and operator review where applicable.
4. Make the parent compose the dependency adapter, not the raw dependency `m3e-*` element.
5. Keep the parent responsible only for composition meaning, placement, state, and public handoff.

A parent may directly import raw m3e only for its own renderer family and non-catalog renderer-internal primitives. Parents must not set dependency-private `--m3e-*` variables or type against dependency renderer classes.

## Renderer boundary and controlled workaround

Prefer documented m3e APIs. Do not access private shadow DOM, copy internals, build a parallel renderer, or spread renderer workarounds across parents.

A temporary exact-version renderer workaround is allowed only inside the canonical owning `MD*` adapter when all conditions hold:

- a selected current Material scenario requires the behavior;
- the documented m3e API is missing, broken, or observably divergent;
- the effective host-level input is confirmed from the installed lockfile-resolved artifact;
- the workaround uses only a host property, attribute, CSS custom property, or host dimension and does not access private DOM or methods;
- it remains private to the owning adapter and does not leak into its public Vue API, parents, or consumers;
- the family matrix records renderer status `divergent`, decision `temporary-renderer-workaround`, long-term owner `m3e-fix`, exact version, risk, removal trigger, and applicable stable `M3E-*` ID;
- the linked `docs/m3e-defects.md` entry records exact evidence, affected and last-revalidated versions, upstream and Mioframe statuses, mitigation, correct upstream result, removal trigger, and revalidation history;
- focused tests prove the required observable result;
- every m3e version update revalidates all non-resolved defect entries against the newly consumed artifact and owned browser proof.

Such a workaround is technical debt, but not a blocker when the gate above is satisfied. It must not replace renderer-owned interaction, accessibility, state, or motion systems.

An upstream fix remains `awaiting-upgrade` until the fixed m3e version is consumed, the workaround or blocker is removed, and owned verification passes. Upstream source or changelog evidence alone does not advance Mioframe status.

## Renderer typing

- Derive Vue custom-element glue from the exported element class or `HTMLElementTagNameMap`.
- Handwritten `new () => HTMLElement` declarations are not package-derived.
- There is no exemption merely because the current adapter maps no typed renderer property.
- Keep public Material types independent and private mapper outputs constrained by exact package types.

## Accessibility and native behavior

- Put ARIA, native state, focus, and interaction semantics on the actual owner.
- Preserve normal native event propagation unless an accepted contract requires interception.
- For custom elements, attribute assertions alone do not prove accessibility. Browser proof must resolve the required role and accessible name from actual rendered semantics.
- When a progress indicator is composed inside another interactive component, verify both owners in the browser accessibility tree or record an explicit accepted alternative.

## Verification

Each selected adapter and required dependency must have proof matching its owned contract:

- package-derived type-check;
- colocated component-contract tests;
- browser tests for current native and accessibility scenarios;
- observable browser or visual proof for selected renderer-owned interaction feedback; host `:active`, event receipt, token presence, or source inspection alone is insufficient;
- stories and visual evidence for independently owned stable presentation and geometry;
- public token declaration/catalogue/mapping agreement and representative override proof;
- exact-version divergence and reduced-motion assessment;
- complete linked `M3E-*` records for confirmed renderer defects;
- parent-to-dependency handoff tests;
- final `pnpm verify`;
- operator visual/motion acceptance where applicable.

A parent screenshot does not replace independent visual evidence for a dependency that owns visible geometry or presentation.

Production-representable combinations such as disabled plus loading and selected plus loading must be covered when the API permits them.

## Completion truthfulness

A component remains `migrating` until its selected contract and dependencies are implemented, root-exported, verified, and accepted by the operator where required.

- Green CI is not architecture approval.
- A README or roadmap may say a scenario is covered only when an existing test or story asserts that exact scenario.
- Do not claim package-derived typing, accessibility-tree proof, root export, visual proof, token support, combination coverage, or confirmed-defect tracking from adjacent evidence.
- Do not mark a component `migrated`, a blocker resolved, or “no further implementation required” while required verification, operator review, source conflict, dependency work, token ownership/catalogue migration, accepted workaround documentation, or linked `M3E-*` work remains incomplete.

## Boundary

Outside this directory, product code must not import `@m3e/web`, render `m3e-*`, use renderer types/events, depend on private `--m3e-*` variables, or inspect renderer DOM.

Do not introduce Lit directly, create a generic adapter framework, token DSL, or duplicate public token registry without a demonstrated repeated need and a separate architecture decision.