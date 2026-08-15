# Floating action button review

Verdict: blocked
Required return family: self
Required return stage: implementation
Completion status: blocked
Final workflow verification readiness: blocked
Operator visual status: defect-reported
Blockers: none
Major issues: none
Minor issues: The DEV diagnostic emitted by `MDFab.vue` still says the icon slot must render an "exactly one direct decorative inline SVG root", although the runtime check validates only that there is exactly one direct SVG root in the SVG namespace. This contradicts the corrected architecture/implementation contract, which intentionally leaves decorative semantics, `viewBox`, `currentColor`, and filled-versus-outlined artwork as caller-contract/review requirements rather than runtime-validated properties.
Accepted risks: none

## Goal and scenarios reviewed

Reviewed the complete current `floatingActionButton` family after the filled-icon/default-wording correction. The selected library-only contract remains an icon-only Medium FAB in Primary-container color, with a required accessible action label and native activation. There is still no product consumer; `MDExtendedFab`/`FabContainer` remain separately owned and unchanged.

## Official design compliance

The selected Material facts are now represented correctly:

- Medium FAB is selected because Material recommends it for most situations; it is not described as an official default size.
- Primary-container / on-primary-container remains the documented Material default color mapping.
- FAB icon content is icon-only and canonical proof now uses filled Material-compatible artwork instead of stroke-only artwork.
- unavailable actions remain omitted rather than exposed as disabled.

The architect independently corroborated the relevant facts against the current `Vyachean/m3-docs-cache`; the coding/design workflow continues to use its Material3 MCP source. No design correction is required.

## Architecture compliance

`ARCHITECTURE.md` correctly distinguishes the three independent facts: Material recommends Medium, Material documents Primary-container as the default color mapping, and `@m3e/web@2.7.4` independently defaults its renderer size input to `medium`.

The direct-SVG composition remains justified by exact-version renderer evidence and browser-level geometry proof. The selected icon contract now explicitly requires filled Material-compatible canonical artwork while keeping filled-versus-outlined semantics outside runtime SVG inspection. No new icon abstraction, renderer element, public token, size/color API, or generic adapter was introduced.

No architecture defect remains.

## Implementation compliance

The substantive implementation correction is correct:

- canonical Storybook fixtures now share the filled Material-compatible add path `M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z` with `fill="currentColor"` and no stroke-only treatment;
- component tests use the same filled artwork where applicable;
- the public API and renderer mapping remain unchanged;
- the browser proof still exercises the canonical composition and retains the 80×80 host / 28×28 SVG geometry contract;
- pointer, Enter, Space, accessible-name, and rejected renderer-state proof remain intact;
- no runtime filled-vs-outlined detection or other unnecessary semantic SVG parser was added.

One implementation-owned diagnostic wording defect remains. The actual DEV check is:

```ts
children.length !== 1 ||
!(icon instanceof SVGSVGElement) ||
icon.namespaceURI !== 'http://www.w3.org/2000/svg'
```

but its warning still says:

```text
MDFab: the `icon` slot must render exactly one direct decorative inline SVG root.
```

`decorative` is not established by that check. The diagnostic must describe only the condition actually validated, for example "exactly one direct inline SVG root". Decorative accessibility, `viewBox`, `currentColor`, and filled artwork remain documented caller-contract requirements and must not be claimed as runtime-validated unless the implementation actually validates them. No additional runtime validation is required.

## Migration and legacy removal

The correction is family-local and does not invalidate `MIGRATION.md`. There is still no canonical product consumer, the legacy plain `MDFab` owner remains removed, and the separate `MDExtendedFab` scenario remains unchanged.

## Proof and stage verification

The focused unit/type/lint/format/Storybook/browser/visual verification recorded by implementation remains relevant. The filled artwork correction did not weaken geometry or interaction proof.

The exact-head PR branch is currently synchronized with `develop`, but authoritative GitHub CI does not override the remaining implementation finding.

Preserved operator evidence remains unchanged: ripple behavior was reported visually correct; the earlier wrong-size/bare-text composition defect is resolved by the direct-SVG path and numeric geometry proof.

## Blockers

None.

## Major issues

None.

## Minor issues

1. Fix the DEV warning in `MDFab.vue` so it claims only the SVG-root condition actually checked. Do not add semantic SVG runtime validation merely to justify the current wording.

## Accepted risks

None.

## Items not required

- No architecture rerun.
- No migration rerun.
- No new icon abstraction or `m3e-icon` exposure.
- No broader FAB size/color/disabled/link/form/tooltip/FAB-menu API.
- No runtime SVG artwork or accessibility parser.

## Routing evidence

Route to `self/implementation`. Architecture and the filled-icon correction are sound; only the production DEV diagnostic still overclaims what its runtime condition validates. After changing that message, run the smallest affected focused verification and then a fresh independent review. Migration may remain preserved unless the correction unexpectedly changes consumer-facing semantics.