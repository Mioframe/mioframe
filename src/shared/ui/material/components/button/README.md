# Button

Canonical owner of the official Material 3 Expressive **Buttons** family (`components/buttons/*`
on `m3.material.io`): elevated, filled, filled tonal, outlined, and text buttons, including the
`toggle` (selection) variant.

Canonical library rules:

- [`../../docs/architecture.md`](../../docs/architecture.md)
- [`../../docs/sources.md`](../../docs/sources.md)
- [`../../docs/component-development.md`](../../docs/component-development.md)
- [`../../docs/tokens.md`](../../docs/tokens.md)

## Scope

Common (labeled) buttons only. Separate official families, out of scope: Icon Button
(`md.comp.icon-button`), Button Groups / segmented buttons, FAB / Extended FAB — currently legacy
under `src/shared/ui/Button` (`MDIconButton.vue`, `MDSegmentedButtons.vue`, `MDFab.vue`,
`MDExtendedFab.vue`, `FabContainer.vue`), each requiring its own future `material-component` run.
`src/shared/ui/ButtonGrid`, `ButtonGroup`, `ButtonsBar` are generic non-Material layout wrappers,
out of scope.

Applicable platform: Web. The token specification on m3.material.io is platform-agnostic and fully
covers Expressive Buttons; the official per-platform availability table lists Web Expressive as
`Unavailable` (only a non-Expressive baseline Web package exists) — there is no official Web
reference implementation to cross-check against.

## Supported surface

- Colors (5): elevated, filled, tonal, outlined, text.
- Sizes (5): extra-small, small (default), medium, large, extra-large.
- Shapes (2): round (default, fully rounded/stadium), square (per-size corner radius).
- Variants: `default` and `toggle` (selection; toggle supported for elevated/filled/tonal/outlined
  only — official Specs page: "There is no toggle text button"). `color="text"` + `variant="toggle"`
  is unsupported (0 of 20 `text` tokens are `selected`/`unselected`, vs. 24-52 for the other four
  styles) and normalizes to `variant="default"` with a dev warning
  (`resolveButtonPresentation.ts`).
- Optional single leading icon (RTL mirrors to the right; not an independent trailing-icon
  feature). Two icons, trailing-only icon placement, and underlined text-button labels are
  explicit official "Don't"s.
- Small-size padding: 16dp is current/recommended (Expressive update); 24dp (used by medium) is
  legacy/"no longer recommended" at small size.
- Corner geometry — round(rest): full/stadium at every size; square(rest): XS=12, S=12, M=16,
  L=28, XL=28dp; pressed/selected shape-morph corner sizes: XS=8, S=8, M=12, L=16, XL=16dp.
- Container heights 32/40/56/96/136dp, icon sizes 20/20/24/32/40dp, outlined outline widths
  1/1/1/2/3dp for XS/S/M/L/XL respectively.
- Label typescale mapping: label-large (XS/S), title-medium (M), headline-small (L),
  headline-large (XL), rendered via the shared `MD_TYPESCALE` classes (no decomposed
  `--md-comp-*` path exists for this composite official token).
- Labels must never truncate or wrap on Web — always a single line (Guidelines page: "Don't
  truncate or wrap label text... always fully visible on a single line"; see Source decisions —
  the Android two-line-at-200%-text-size allowance does not apply to Web). A button's container
  may render wider than its containing block instead of wrapping or truncating.

Unsupported / invalid combinations: `color="text"` + `variant="toggle"`; fixed container width
narrower than the label; truncated or wrapped label text on Web; the deprecated pre-Expressive
single-height (40dp), round-only token namespace (`md.comp.<color>-button.*`, distinct from the
current `md.comp.button.<color>.*` — explicitly labeled `[Deprecated]` in the source token data).

Anatomy (official, exactly 3 named parts): Container, Label text (required, 1-3 words, sentence
case, never truncated/wrapped on Web), Icon (optional, leading only). No formal "state layer"
anatomy part is named, though every color style publishes hover/focus/pressed state-layer tokens.

## Public API

`MDButton` — props: `label: string` (required, also the accessible name); `color?:
'elevated'|'filled'|'tonal'|'outlined'|'text'` (default `filled`); `size?:
'extra-small'|'small'|'medium'|'large'|'extra-large'` (default `small`); `shape?:
'round'|'square'` (default `round`); `variant?: 'default'|'toggle'` (default `default`);
`selected?: boolean` (applied only when the applied variant is `toggle`); `disabled?: boolean`;
`nativeType?: 'button'|'submit'|'reset'` (default `button`); `loading?: number|boolean` (project
extension, see Extensions). Emits — `click: [event: MouseEvent]`. Slots — `icon()`.

## Ownership

Sole owner: `src/shared/ui/material/components/button/`. Public export: `MDButton` from
`@shared/ui/material` and the family-local `index.ts`. No legacy `MDButton.*` remains under
`src/shared/ui/Button`. Consumers import from `@shared/ui/material`; none deep-import the family
path or a legacy alias.

## Anatomy and DOM

`button` → non-layout `aria-hidden` `__target` span (hit-area, see Accessibility) → `MDStateLayer`
→ `__content` (optional `__icon`, `__label-text`, optional `MDCircularProgressIndicator` when
loading). No nested interactive elements or extra wrappers.

`MDButton.vue` stops native click propagation (`@click.stop`) so it never bubbles to an ancestor
actionable surface (`components/cards/accessibility.md`: "An action shouldn't be placed on an
actionable surface"). The same unconditional stop is used by `MDIconButton`, `MDFab`,
`MDExtendedFab`, and `MDChipBase`; `MDCard`/`MDListItem` stop propagation only in a narrower
disabled-link case, not generally. Proof: `MDButton.test.ts` mounts the button DOM-attached with a
real ancestor click listener and asserts the listener never fires while the button's own `click`
still emits.

Keyboard/disabled/click semantics are native (`<button :type :disabled>`); `MDButton.vue` adds no
synthesized activation path. The shared `useRipple` keyboard debounce only re-triggers the ripple
visual on key-repeat.

## Accessibility

- Color contrast: 3:1 vs. background (container for elevated/filled/tonal; label text for
  outlined/text).
- Keyboard: Tab to reach, Space/Enter to activate — the entire official keyboard table; no other
  bindings.
- Accessible name must match the visible label text (`:aria-label="props.label"`, always set).
- No ARIA attribute is named by M3 itself for the toggle state; `aria-pressed` is the correct
  external (WAI-ARIA APG) technique for a two-state toggle button on the web (see Source decisions).
  `:aria-pressed` is present only when the applied variant is `toggle`, mirrors `selected`.
- Touch/target size: the standalone Buttons Accessibility page has no touch-target language. The
  only Buttons-family-page touch-target sentence (Specs page, "Target areas") is
  verbatim-identical to the Icon Buttons page's target-size text and literally names "icon
  buttons," not common/labeled buttons — this reads as template reuse targeting a different family,
  not a deliberate common-Buttons rule (see Source decisions). Two general, platform-wide
  foundation pages independently carry the same ~48dp guidance:
  `foundations/designing/structure.md` ("consider making touch targets at least 48 x 48dp") and
  `foundations/layout/grids-spacing/density.md` ("default target size should be at least 48x48 CSS
  pixels"). `MDButton.vue` applies this as a non-layout 48dp `__target` hit-area span for XS/S
  sizes, a reasonable application of the general rule.

## State model

Enabled/Disabled/Hovered/Focused/Pressed for all default-variant styles; toggle adds
Unselected/Selected crossed with the same states (elevated/filled/tonal/outlined only). No
`dragged` state exists for Buttons (absent from both the official states enumeration and the token
state axis; a `dragged.state-layer.opacity` token does exist, but only in the deprecated legacy
`md.comp.filled-button.*` namespace, out of scope here).

Elevation: elevated = level1 enabled/focused/pressed, level2 hovered, level0 disabled; filled =
level0 base/focused/pressed/disabled, level1 hovered; tonal has the identical shape to filled —
level0 base/focused/pressed/disabled, level1 hovered
(`md.comp.button.tonal.hovered.container.elevation` aliases `md.sys.elevation.level1`); outlined
and text publish zero `container.elevation` tokens in any state (elevation is not part of their
token set at all, not an official "level0" value — functionally flat either way since no shadow is
rendered).

Disabled container tint: elevated/filled/tonal publish a complete `disabled.container.color`+
`.opacity` (0.1) pair; text also publishes a complete pair
(`disabled.container.color` aliased to `md.sys.color.on-surface`, `disabled.container.opacity` =
0.1) despite having no container fill at any other state — official, intentional behavior, not an
inconsistency. Outlined publishes only `disabled.container.opacity` (0.1) with no matching `.color`
token in its base (non-toggle) set, so it renders no disabled container tint at rest.

Label/icon opacity 0.38 for every style. State-layer opacities: hover 0.08, focus 0.10, pressed
0.10. Confirmed to hold exactly across all five current-namespace color styles.

## Token architecture

`components/button/button.tokens.css` owns every official `--md-comp-button-<color>-*` and
`--md-comp-button-<size>-*` declaration. `MDButton.css` owns `--md-private-button-*` implementation
routes and the final rendered CSS. Each `--md-private-button-rendered-<property>` (container color,
label color, icon color, outline color, elevation, state-layer color) is set directly from
component tokens or literals at every state × variant selector that needs it — one direct route per
declaration, not a multi-stage base/state alias chain; template/CSS reads only `rendered-*`.
Structural/layout properties (`border-radius`, `height`, `padding-left`/`-right`, `icon-gap`,
`border-width`, `border-style`, `box-sizing`, `target-size`, `icon-size`) and the label/icon opacity
pair (`label-opacity`/`icon-opacity`, driven by `disabled-label-opacity`/`disabled-icon-opacity`)
remain their own directly-set, directly-read private routes outside the rendered-color/elevation
family.

`MDButton.css` sets three documented external generic foundation contract properties
(`docs/tokens.md`, "External generic foundation contracts") on its `__icon`/`__progress-indicator`
wrapper elements so a consumer-slotted icon or the composed progress indicator inherits Button's
resolved color/size automatically: `--md-content-color` and `--md-symbol-size` (public contract of
`MDSymbol`, `src/shared/ui/Icon/MDSymbol.vue`) and `--md-circular-progress-color` (public contract
of `MDCircularProgressIndicator`, `src/shared/ui/material/components/progress-indicator/MDCircularProgressIndicator.vue`).
Button consumes these external contracts; it does not own or relocate them.

Required foundation dependencies: `md.sys.color.*` roles, `md.sys.elevation.level0/1/2` + shadow
color, `md.sys.shape.corner.full/small/medium/large/extra-large`,
`md.sys.state.hover/focus/pressed.state-layer-opacity`,
`md.sys.motion.spring.fast.spatial.damping/stiffness` (referenced as documentation only, see
Motion), `md.sys.typescale.label-large/title-medium/headline-small/headline-large`.
`useStateLayer`/`useRipple`/`MDStateLayer` (`@shared/ui/State`), `MDCircularProgressIndicator`
(sibling canonical family `../progress-indicator`), `MD_TYPESCALE` (`@shared/lib/md`) are
correctly-owned generic shared infrastructure. Dependency direction, cross-family references, and
cycles are clean: no `--md-comp-<other-family>-*` reference, no circular token dependency.

Proof: `scripts/materialTokenArchitecture.test.mjs` (static architecture guard).

## Motion

Pressed/selected shape morph: `.md-button` transitions `border-radius`/`box-shadow`, 350ms
`cubic-bezier(0.42, 1.67, 0.21, 0.9)` (foundation "fast-spatial" pair). The official motion model
for this morph is spring physics (damping 0.6, stiffness 800, aliased to
`md.sys.motion.spring.fast.spatial.*`), identical across all five sizes — not a duration/easing
pair. No official CSS `transition-timing-function`/duration equivalent exists in the source data,
and no official Web Expressive reference implementation exists to validate a spring-approximation
technique against; the spring parameters are recorded as the official motion contract, the CSS
approximation as current (unresolved, see Source decisions and Known gaps). No
`prefers-reduced-motion` override.

Color/background/border "effects" transition: `.md-button` transitions `color`/`background-color`/
`border-color`, 150ms `cubic-bezier(0.31, 0.94, 0.34, 1)` (foundation "fast-effects" pair); not
addressed by the official token data. No `prefers-reduced-motion` override.

Loading-state icon/label opacity fade (project extension, not official Material surface):
`__icon`/`__label-text` each transition `opacity` using the same 150ms fast-effects pair,
triggered by `.md-button_loading &` setting `opacity: 0`. Standard CSS transition reversal applies
when `loading` toggles off mid-fade; no explicit cancellation logic. No `prefers-reduced-motion`
override.

`MDStateLayer` background transition, ripple (WAAPI), and the loading indicator's SVG
`<animate>`/`<animateTransform>` are foundation-owned (`@shared/ui/State`, sibling canonical family
`../progress-indicator`), out of Button's own file scope. No `@keyframes`, `will-change`, or
`transition: all` exist anywhere in Button-owned CSS.

Proof: `tests/e2e/visual/shared-ui/md-button.spec.ts` (browser lane; reads computed
`transition-property`/`-duration`/`-timing-function` longhands, box-shadow/elevation values, and
icon/label bounding-box positions, not literals).

## Source decisions

```text
SOURCE DECISION
Concern: Whether common (labeled) Buttons require a documented 48x48dp/CSS-px minimum touch
  target, especially at XS (32dp)/S (40dp) container heights.
Applicable platform: Web
Source A and statement: Buttons Accessibility page — no touch-target language.
Source B and statement: Buttons Specs page "Target areas" — verbatim-identical to Icon Buttons'
  target-size text, names "icon buttons" literally.
Source C and statement: two general, platform-wide foundation pages both carry equivalent
  guidance: `foundations/designing/structure.md` ("consider making touch targets at least 48 x
  48dp") and `foundations/layout/grids-spacing/density.md` ("default target size should be at
  least 48x48 CSS pixels") — neither is Buttons-specific.
Conflict or missing evidence: the only Buttons-family-page touch-target sentence literally names
  a different, excluded family; no Buttons-specific `--md-comp-button-*` touch-target token
  exists to confirm or deny family-specific applicability either way.
Decision: apply the general 48x48 CSS-px minimum as system-wide guidance reconciled with XS/S
  button heights via hit-area, not as a Buttons-family component token (none exists to route
  from).
Status: unresolved (whether common Buttons specifically, as opposed to only generic UI elements,
  require this minimum remains unproven by a Buttons-specific source; the current `__target`
  hit-area implementation is a reasonable application of the general rule either way)
```

```text
SOURCE DECISION
Concern: 200% text-size / label-wrapping guidance is stated only for Android.
Applicable platform: Web
Source A: Accessibility page, "200% text size" — explicitly "On Android, ...".
Source B: Guidelines page, "Label text" — "Don't truncate or wrap label text... always fully
  visible on a single line" (unqualified by platform).
Decision: Web follows the unqualified single-line rule; the Android two-line-at-200% allowance
  does not apply to Web.
Status: resolved
```

```text
SOURCE DECISION
Concern: Spring-physics pressed/selected shape-morph motion (damping 0.6, stiffness 800) has no
  official CSS timing-function equivalent, and no official Web Expressive reference exists.
Applicable platform: Web
Decision: record the spring parameters as the official motion contract; the CSS/Web
  spring-approximation technique is an open dependency for a future motion correction, not
  invented here.
Status: unresolved
```

```text
SOURCE DECISION
Concern: `aria-pressed` for the toggle variant — M3 names no ARIA attribute at all.
Decision: use the standard WAI-ARIA APG toggle-button technique (`aria-pressed`) as the required
  technical mapping for the officially-documented two-state toggle behavior.
Status: resolved
```

## Extensions

`loading?: number | boolean` — no official Material Button counterpart. Composes
`MDCircularProgressIndicator`; does not disable the control or change the accessible name.

## Known gaps

Spring-to-CSS motion mapping (Source decision above) has no official CSS equivalent and no
official Web Expressive reference implementation to validate an approximation against. The current
`cubic-bezier` transition is Button's own approximation, not a derivation from the official spring
parameters, and remains an open motion-category item; the spring tokens are recorded as
documentation only (see Motion), not as driving component tokens, since a declared-but-unreachable
token is a token-architecture defect (`docs/tokens.md`).
