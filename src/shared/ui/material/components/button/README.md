# Button

```text
MATERIAL COMPONENT CONTRACT

Authoring mode: standard-authoring
Change mode: end-to-end-migration

Family: Button
Components: MDButton (default and toggle variants)
Family ownership basis: single official Material 3 "Common buttons" / "Toggle buttons" family (elevated, filled, tonal, outlined, text styles share one anatomy, token graph, and state model).

Current owner: none
Canonical owner: src/shared/ui/material/components/button
Migration status: migrated
Public export: MDButton from `@shared/ui/material` (also `@shared/ui/material/components/button`)
Affected consumers: every direct importer of `MDButton` across `src/entities`, `src/features`, `src/pages`, `src/shared/ui`, and `src/widgets` (migrated to the canonical import path in this PR)

Required scenarios: primary/secondary/tertiary actions in forms, dialogs, sheets, cards, and toolbars; toggle-style controls; disabled and loading states; light and dark themes; native pointer and keyboard activation.
Non-goals: Split Button, Standard Button Group, Connected Button Group (no current consumer requires them; add only when a real scenario needs them).
Official sources and snapshot: `material3` MCP Button documentation and token graph; verified fallback snapshot `Vyachean/m3-docs-cache` commit `49ffae58a61f86c28b23720696dc9d07b6945483`, captured `2026-07-13T12:48:04.850Z`, cross-checked against `pages/components/buttons/overview.md`, `specs.md`, `accessibility.md`, and `guidelines.md`.

Supported Material surface: five color styles (`elevated`, `filled`, `tonal`, `outlined`, `text`), five sizes (`extra-small`, `small`, `medium`, `large`, `extra-large`), `round`/`square` shapes with pressed and selected shape morphing, `default`/`toggle` variants, native `<button>` semantics, state layer/ripple/focus indication, Expressive pressed-shape spring motion, and public `--md-comp-button-*` component-token overrides for label/icon/outline/container/elevation/shadow-color per style and interaction state.
Unsupported Material surface: `color="text"` combined with `variant="toggle"` (the verified token graph publishes no text-toggle color route; normalizes to `variant="default"` with a development warning); Split Button; Standard Button Group; Connected Button Group.

Public API: see `MDButton.vue` props (`nativeType`, `color`, `label`, `disabled`, `loading`, `variant`, `size`, `shape`, `selected`), `click` emit, and the optional `icon` slot — each documented with TSDoc at the call site.
Native semantics and accessibility: renders a native `<button>`; `aria-label` from `label`; `aria-pressed` reflects `selected` only when the applied variant is `toggle`; `aria-busy="true"` while loading; native `disabled` blocks click/hover/focus/pressed visuals.
Invalid combinations: `color="text"` + `variant="toggle"` normalizes to `default` (dev warning); `selected` without `variant="toggle"` has no effect (dev warning); an out-of-range or non-finite numeric `loading` value clamps to `[0, 1]` (dev warning).

Applicable foundation dependencies:
- Elevation (`src/shared/lib/md/tokens.css`, legacy foundation owner): `--md-sys-elevation-level0`–`level5` and the `--md-private-elevation-shadow-color` bridge, declared on a universal selector so per-component shadow-color overrides reach the final rendered `box-shadow`.
- Motion (`src/shared/lib/md/tokens.css`, legacy foundation owner): `--md-private-motion-expressive-fast-spatial-*`/`fast-effects-*` Web adaptations of the `--md-sys-motion-spring-fast-spatial-*` springs; Button's per-size pressed-corner spring component tokens are colocated with a private duration/easing pair consuming this same adaptation.
- State layer, ripple, focus (`src/shared/ui/State`, legacy foundation owner): `MDStateLayer`, `useRipple`, `useStateLayer`.
- Typography (`@shared/lib/md`): `MD_TYPESCALE` label/title/headline classes per size.
- Progress indicator (`@shared/ui/ProgressIndicators`): `MDCircularProgressIndicator` for the loading extension.

Production and public files: `MDButton.vue`, `index.ts`, this `README.md`, `MDButton.test.ts`, `MDButton.stories.ts`, `MDButtonOverrideContractVisualStory.vue`, `MDButtonTargetHitVisualStory.vue`.
Applicable proof: colocated component-contract test (`MDButton.test.ts`); canonical Storybook visual states plus a size/shape geometry matrix and a forced-state gallery (no `StateMatrix` helper needed beyond the existing per-state stories); Playwright browser proof in `tests/e2e/visual/shared-ui/md-button.spec.ts` covering token routing, override contracts, shape precedence, motion routes, shadow-color final route, and accessibility.
Extensions or deviations: `loading` (numeric or boolean) is a Mioframe extension with no official Button token; numeric values clamp to `[0, 1]` with a development warning for invalid input.

Unresolved: none
Readiness: ready
```
