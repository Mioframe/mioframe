# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical project-facing Material library boundary.

## Required workflow

- Read `docs/architecture.md`, `docs/component-adapter.md`, `docs/component-tokens.md`, `docs/token-api.md`, `docs/m3e-defects.md`, `docs/roadmap.md`, and the selected family README.
- Use `material-component-adapter` for one explicitly selected official Material component.
- Use `architect-handoff` only when work changes unresolved cross-family ownership, renderer strategy, global theme ownership, public token architecture, or another decision not already resolved by the canonical documents.
- Complete required official Material dependency adapters before composing them from a parent.

## Authority

1. Official Material 3 Expressive documentation defines the public component and token model.
2. Current Mioframe scenarios select the subset required now.
3. The installed lockfile-resolved `@m3e/web` artifact and observable browser behavior define the private renderer capability actually consumed.
4. The selected family README records the accepted Material–m3e–Vue mapping and proof.
5. Canonical CSS declarations plus `docs/token-api.md` define the supported public token surface.
6. `docs/m3e-defects.md` owns confirmed renderer-defect identities and lifecycle.

Upstream source, tags, demos, and changelogs are supporting evidence only. Legacy Mioframe and m3e APIs are not public-contract authorities.

## Public API and ownership

- Expose a demand-scoped official Material contract expressed idiomatically in Vue.
- Keep public types and terminology independent from m3e.
- Do not add unused renderer/native/token surface for hypothetical completeness.
- Define precedence and restoration for public states that may coexist.
- A composed official Material component remains independently owned and is used through its canonical `MD*` API.
- The parent owns composition meaning and state handoff; the dependency owns its renderer mapping, accessibility, geometry, tokens, defects, tests, and visual proof.
- Visual loading/busy presentation and activation blocking are independent. Loading must not imply disabled state or suppress activation unless the accepted family contract explicitly assigns both to the component.

## Token ownership

- `foundation/tokens.css` owns supported renderer-independent `--md-ref-*` and `--md-sys-*` foundations.
- `foundation/theme.css` owns the default palette and light/dark system-color assignments.
- `components/<family>/tokens.css` owns only that family’s selected official `--md-comp-<family>-*` surface and private renderer mappings.
- `docs/token-api.md` lists every supported public token; declarations and catalogue entries change together.
- `--app-*` belongs outside Material. `--m3e-*` and `--md-private-*` remain private.
- Verify CSS value grammar against every selected current consumer. Equal numeric meaning does not guarantee grammar compatibility.
- Do not recreate a mixed-owner legacy token file, compatibility alias, duplicate public owner, TypeScript token registry, token DSL, or exhaustive copy of Material/m3e defaults.

## Renderer boundary

Prefer documented m3e APIs. Keep renderer imports, tags, types, events, and private CSS inputs inside the canonical owning adapter.

A temporary exact-version workaround is allowed only when the complete gate in `docs/component-adapter.md` is satisfied and the linked family matrix and `docs/m3e-defects.md` record remain current. It must use only public host-level inputs, remain owner-local and removable, and must not recreate renderer-owned interaction, accessibility, geometry, state, or motion systems.

Do not override renderer-owned interaction timing or transient geometry with host pseudo-classes such as `:active`, `:not(:active)`, `:hover`, or `:focus-visible`, or by switching renderer CSS inputs around those pseudo-classes. If observable renderer behavior is unacceptable, classify it as `divergent`, `m3e-fix`, or `blocked`; do not compensate with a parallel wrapper state or timing path.

Vue custom-element glue must derive from package-exported element classes or `HTMLElementTagNameMap`. Handwritten `new () => HTMLElement` declarations are not package-derived.

`config/vueCustomElements.ts` is the exact raw-tag allow-list. Do not mirror it with `vue/no-undef-components.ignorePatterns`: those entries are regular expressions matched against normalized component names and are broader than an exact tag list. Keep unselected, misspelled, and differently cased renderer tags as lint errors; use a described local lint exception only on an actual selected raw tag when the generic undefined-component rule cannot consume the compiler predicate.

## Verification and completion

Use the proof model defined by `docs/component-adapter.md` and repository testing policy. Observable renderer-owned appearance requires browser or visual proof; host state, token presence, event receipt, or source inspection alone is insufficient.

Final verification uses the exact task scope required by the root `AGENTS.md`; Material-specific documents must not replace it with an unscoped command.

A component remains `migrating` until its selected contract, dependencies, public exports, token ownership, defect records, consumer migration, required proof, current-head verification, and reported operator issues are resolved. Green CI alone is not architecture approval.

## Boundary

Outside this directory, product code must not import `@m3e/web`, render `m3e-*`, use renderer types/events, depend on `--m3e-*`, or inspect renderer DOM.

Do not introduce Lit directly, a generic adapter framework, or another public token registry without a demonstrated repeated need and a separate architecture decision.