# Progress indicator

Canonical owner of the **circular** variant of the official Material 3 **Progress indicators**
family (`components/progress-indicators/*` on `m3.material.io`, tokens under
`md.comp.progress-indicator.*`).

Canonical library rules:

- [`../../docs/architecture.md`](../../docs/architecture.md)
- [`../../docs/sources.md`](../../docs/sources.md)
- [`../../docs/tokens.md`](../../docs/tokens.md)

## Scope

Circular progress indicator only — the sole variant currently consumed inside this repository
(as a decorative loading replacement composed by `MDButton` and other shared UI). The **linear**
variant (`md.comp.progress-indicator.linear.*`) is out of scope, requiring its own future
`material-component` run.

Applicable platform: Web. The official per-platform availability table lists a baseline Web
package as `Available` (no Expressive-specific reference); `Web: Expressive` is `Unavailable`. This
implementation follows the baseline (non-wavy, fixed 4dp thickness) contract; the Expressive
variable-thickness and wavy-track configurations are an explicit known gap (see below).

## Public API

`MDCircularProgressIndicator` — props: `progress?: number` (0-1 determinate value; omit for the
indeterminate/spinning visual — `0` is a valid determinate value, distinct from indeterminate);
`size?: number` (rendered diameter in CSS pixels, default `40`, matching
`md.comp.progress-indicator.circular.size`); `label?: string` (accessible name; see Accessibility).
No emits or slots.

## Ownership

Sole owner: `src/shared/ui/material/components/progress-indicator/`. Public export:
`MDCircularProgressIndicator` from `@shared/ui/material` and the family-local `index.ts`. No legacy
owner remains under `src/shared/ui/ProgressIndicators`.

## Anatomy and DOM

Single `svg` root (`.md-circular-progress-indicator`) containing a static full-circle track
(`__track`) and one active-indicator circle (`__progress`). The active-indicator circle carries an
SVG `<animate>` (dasharray sweep) and the root carries an `<animateTransform>` (rotation) only while
indeterminate.

## Accessibility

Every current consumer renders this component as a decorative loading replacement inside a surface
that already owns its own accessible name (a button's label, a list item's text, a dialog's
heading) — none needs the indicator itself to announce anything. Accordingly:

- Without `label`: the root is `aria-hidden="true"` and carries no `role`.
- With `label`: the root exposes `role="progressbar"`, `aria-label`, `aria-valuemin="0"`,
  `aria-valuemax="100"`, and `aria-valuenow` (omitted while indeterminate, per the WAI-ARIA
  indeterminate-progressbar technique).

## Token architecture

`progress-indicator.tokens.css` owns `--md-comp-progress-indicator-active-indicator-color` and
`--md-comp-progress-indicator-track-color`. `MDCircularProgressIndicator.vue` routes them to the
rendered `stroke` of the active-indicator and track circles; the active-indicator route is also the
documented external generic foundation contract `--md-circular-progress-color` (`docs/tokens.md`,
"External generic foundation contracts"), the public override point consumers (e.g. `MDButton`) set
to recolor the indicator for their own container.

Stroke thickness (4dp, matching `md.comp.progress-indicator.circular.active-indicator.thickness`
and `.track.thickness`, both 4dp) and the default rendered size (40, matching
`md.comp.progress-indicator.circular.size`) are geometry constants that drive SVG arc-length math
directly; they have no CSS-rendered property to route through and are not declared as CSS custom
properties (`docs/tokens.md`: a value used only to drive computation, not a rendered CSS
declaration, is not a token-architecture token).

Proof: `scripts/materialTokenArchitecture.test.mjs`, `scripts/materialCanonicalTokenOwnership.test.mjs`.

## Known gaps

- No linear variant (see Scope).
- No Expressive wavy-track or variable-thickness configuration (Web Expressive unavailable; no
  official reference to validate an approximation against).
- No rendered `active-indicator-track-space` gap between the active-indicator arc and the track
  ring; the active-indicator is drawn directly over the track.
