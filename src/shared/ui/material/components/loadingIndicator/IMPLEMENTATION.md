# Loading indicator implementation

Status: complete  
DESIGN.md reference: `./DESIGN.md` (`Status: current`, design document date 2026-07-30)  
ARCHITECTURE.md reference: `./ARCHITECTURE.md` (`Status: ready`, architecture date 2026-07-30)  
Implementation workspace state: canonical Loading Indicator runtime, token, exports, renderer integration, component proof, and Button composition inspected.

## Implemented passes

1. Audited `MDLoadingIndicator.vue`, family export and root Material export, Vue custom-element selection, and package-derived renderer declaration against the ready architecture.
2. Revalidated the installed renderer artifact and public entry-point types. Retained M3E-001 and M3E-002 exactly as accepted: explicit overall host geometry plus the effective private active-size input at `overall × 38 / 48`.
3. Audited the family token declaration, public token catalogue, renderer mapping, component contract tests, Storybook stories, browser behavior, visual baselines, and renderer-boundary ownership.
4. Audited Button composition through the public `MDLoadingIndicator` API without changing Button architecture or product consumers.

No runtime correction was required: the retained implementation matches the accepted architecture.

## Public API implemented

- Root-exported `MDLoadingIndicator` Vue component.
- Required `label: string` accessible-purpose prop.
- Optional `size?: number`, default 48, finite clamp to 24-240, non-finite normalization to 48, and development warnings for normalized input.
- Single custom-element host with native/global attribute fallthrough; no slots, emits, exposed methods, variant, progress value, loading state, or operation-state ownership.

## Tokens and renderer mappings implemented

- `--md-comp-loading-indicator-active-indicator-color` is declared at the family owner with `var(--md-sys-color-primary)` fallback and mapped privately to the renderer active-indicator color input.
- Public overall size sets explicit host width and height.
- Private active size uses the installed renderer's effective size input at the official `38 / 48` ratio.
- M3E-001 and M3E-002 remain confirmed for the installed version, family-local, exact-version-gated, and removable on a corrected renderer upgrade.
- Button composition overrides only the public family token to `currentColor`.

## Dependencies completed

- Material foundation primary color ownership is canonical and available.
- No official component-family dependency is required by the selected surface.
- The installed Loading Indicator package remains a private renderer dependency.
- Button is an audited parent composition consumer, not a Loading Indicator implementation dependency.

## Proof completed

- Colocated component contract tests cover label forwarding, public token fallthrough, default and explicit overall geometry, proportional private mapping, clamping, and non-finite normalization.
- Package-derived Vue custom-element typing and selected-tag configuration keep renderer integration constrained to the Material boundary.
- Storybook browser behavior covers the named progressbar, actual host geometry, public color behavior, and legacy-surface isolation.
- Canonical visual stories cover the size matrix, standalone default/override colors, legacy-surface isolation, and Button-composed presentation.
- Button component/browser proof covers decorative child semantics, 24 px composition, `aria-busy`, `currentColor`, and icon restoration while leaving disabled/re-entry ownership outside Loading Indicator.
- Renderer-boundary and token-catalogue checks cover public/private ownership and declarations.

## Verification performed

Focused implementation-stage project verification passed. The migration stage owns final family verification.

## Architecture deviations

None.

## Remaining implementation blockers

None. Explicit operator visual/motion acceptance is a later review gate, not an implementation blocker.

## Migration readiness

Ready. The canonical family implementation, selected token, renderer mappings, exports, defects, and component-owned proof agree with the accepted architecture.
