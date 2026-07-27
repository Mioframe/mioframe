# Loading indicator adapter contract

Material component: Loading indicator

Migration target: `MDLoadingIndicator`

Implementation ownership: `migrated`

Canonical implementation: `src/shared/ui/material/components/loading-indicator/MDLoadingIndicator.vue`

## Why this adapter exists

Loading indicator is a separate official Material 3 Expressive component with its own overview, specs, guidelines, accessibility, tokens, geometry, and motion contract.

`MDButton` previously rendered `m3e-loading-indicator` directly. That bypassed the canonical Material Vue boundary and incorrectly made Button own Loading indicator renderer typing, accessibility, sizing, private CSS inputs, divergences, and motion.

Required ownership, now implemented:

```text
MDButton.loading
  → MDLoadingIndicator
      → @m3e/web/loading-indicator
```

`MDButton` owns the documented loading composition state and placement. `MDLoadingIndicator` owns the Loading indicator component contract and private renderer integration.

## Official sources

- `/components/loading-indicator/overview`;
- `/components/loading-indicator/specs`;
- `/components/loading-indicator/guidelines`;
- `/components/loading-indicator/accessibility`.

Related composition source:

- Button placement guidance in `/components/loading-indicator/guidelines` ("Loading indicators can be placed within other components, such as buttons");
- Button icon geometry from `/components/buttons/specs` official `md.comp.button.<size>.icon.size` tokens (20dp extra-small/small, 24dp medium, 32dp large, 40dp extra-large);
- Loading indicator contrast-in-composition guidance from `/components/loading-indicator/accessibility` ("When integrated into another component, such as a button, make sure that the active indicator provides a visual contrast of at least 3:1 against the other component").

Renderer package:

- `@m3e/web@^2.6.2`, resolved `2.6.2`;
- entry point `@m3e/web/loading-indicator`;
- `M3eLoadingIndicatorElement` is the private renderer type source (inspected; not currently imported because no demand-scoped public prop maps to a typed element property — see "Renderer typing" below).

## Confirmed official Material facts

- Loading indicator represents an ongoing process and is never decorative.
- It is intended for short indeterminate loading, generally 200ms–5s ("Loading indicator Guidelines").
- It must not be used for a process that transitions from indeterminate to determinate.
- It has default/uncontained and contained configurations; uncontained is the renderer default.
- It "can scale in size", with a documented flexible range of 24dp–240dp and a default of 38dp active-indicator size / 48dp container size (`loading-indicator/specs` token table and "Responsive layout" guidance).
- The active indicator needs at least 3:1 contrast against its background or containing component (`loading-indicator/accessibility`).
- It uses the `progressbar` ARIA role and needs an accessible label describing what is loading, e.g. "loading news article" or "refreshing page" (`loading-indicator/accessibility`, "Labeling elements").
- It may be placed inside a Button (`loading-indicator/guidelines`, "Placement").

## Current demand

Current direct product demand is only the Button composition:

- indeterminate boolean loading state;
- uncontained presentation in the Button leading-icon position;
- accessible purpose supplied by the parent action (Button hands off its own `label`);
- size normalized to the current Button icon geometry;
- active indicator color inherited from the rendered Button label/icon color;
- loading presentation compatible with disabled and selected Button states.

No standalone product consumer currently requires contained presentation. Contained configuration remains deferred.

## Material–m3e–Vue matrix

| Material contract and exact source                                                     | Required now and evidence                                                     | Public Vue representation                                                                                              | m3e 2.6.2 support                                                                                                                                | Owner                | Decision                                                                                                                                                                                     | Verification                                                                                             |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Loading indicator component identity (`loading-indicator/overview`)                    | yes — required by Button composition                                          | `MDLoadingIndicator` canonical component and public export                                                             | `m3e-loading-indicator`, `direct`                                                                                                                | `MDLoadingIndicator` | `implement-now`                                                                                                                                                                              | `MDLoadingIndicator.test.ts`; `MDLoadingIndicator.stories.ts`                                            |
| Default/uncontained configuration (`loading-indicator/specs`)                          | yes — Button composition                                                      | no `variant` prop; renderer default (`uncontained`) used as-is                                                         | renderer default `"uncontained"`, `direct`                                                                                                       | `MDLoadingIndicator` | `implement-now`                                                                                                                                                                              | `MDLoadingIndicator.stories.ts` (`Default`)                                                              |
| Contained configuration (`loading-indicator/specs`)                                    | no current consumer                                                           | none                                                                                                                   | renderer `"contained"` variant, `direct` (unused)                                                                                                | `MDLoadingIndicator` | `defer`                                                                                                                                                                                      | none                                                                                                     |
| Ongoing short indeterminate process (`loading-indicator/overview`)                     | yes                                                                           | component exists only while `MDButton.loading` is true; no determinate API                                             | renderer is indeterminate (no `aria-valuenow` set), `direct`                                                                                     | `MDLoadingIndicator` | `implement-now`                                                                                                                                                                              | `MDLoadingIndicator.test.ts`                                                                             |
| Accessible purpose label and progressbar semantics (`loading-indicator/accessibility`) | yes                                                                           | required `label: string` prop mapped to the native `aria-label` attribute                                              | renderer sets `role="progressbar"` and `ariaValueMin`/`ariaValueMax` defaults via the platform ARIAMixin; supplies no accessible name, `partial` | `MDLoadingIndicator` | `wrapper-correction` — `label` is required so every usage supplies a purpose string                                                                                                          | `MDLoadingIndicator.test.ts` (`aria-label`)                                                              |
| Active-indicator contrast in another component (`loading-indicator/accessibility`)     | yes — Button composition                                                      | no public prop; `MDLoadingIndicator` inherits `currentColor` in scoped style                                           | `--m3e-loading-indicator-active-indicator-color` documented and implemented identically, `direct`                                                | `MDLoadingIndicator` | `implement-now` via inherited-color mapping; parent never sets this variable                                                                                                                 | `MDLoadingIndicator.stories.ts` (`InheritedColorOnColoredSurfaces`, operator visual review)              |
| Scalable size (`loading-indicator/overview`, specs, "Responsive layout")               | yes — Button icon geometry varies by size (`md.comp.button.<size>.icon.size`) | optional `size?: string` CSS-length prop; unset uses the Material default                                              | `--m3e-loading-indicator-active-indicator-size` documented; 2.6.2 implementation reads `--m3e-loading-indicator-size`, `divergent`               | `MDLoadingIndicator` | `wrapper-correction` — map `size` to the confirmed effective variable name, not the documented one; record divergence for future m3e correction                                              | `MDLoadingIndicator.test.ts` (explicit and default size); `MDLoadingIndicator.stories.ts` (`SizeMatrix`) |
| Official component tokens (`loading-indicator/specs`)                                  | selected subset required for Button color/size handoff                        | no public `--md-comp-*` alias yet; parent hands off state through the `size`/`label` props and inherited color instead | renderer has `--m3e-loading-indicator-*` inputs, `direct`/`divergent` (see size row)                                                             | `MDLoadingIndicator` | `defer` — current demand is satisfied by props/inherited color; introduce a public `--md-comp-loading-indicator-*` token only if a future consumer needs CSS-level customization             | none                                                                                                     |
| Renderer motion and reduced-motion behavior                                            | yes — visible ongoing animation while mounted                                 | no public animation controls (none required by Material sources found)                                                 | 2.6.2 uses an infinite shape-morph/rotation animation (4666ms cycle); source inspection found no `prefers-reduced-motion` handling               | m3e (renderer-owned) | recorded divergence; no official Material source found requiring reduced-motion suppression for this component, so not a blocker — flagged for operator review and possible future `m3e-fix` | exact-version source inspection above; operator motion review pending                                    |
| Forced colors                                                                          | yes — renderer already handles it                                             | none needed                                                                                                            | `@media (forced-colors: active) { .active-indicator { background-color: CanvasText !important; } }`, `direct`                                    | m3e (renderer-owned) | `implement-now` (no wrapper action needed)                                                                                                                                                   | operator visual review                                                                                   |

## Public boundary

`MDLoadingIndicator`:

- is a canonical exported Vue component under `src/shared/ui/material/components/loading-indicator`, re-exported from `index.ts`;
- exposes only `label` (required) and `size` (optional CSS length);
- keeps `M3eLoadingIndicatorElement`, raw `m3e-loading-indicator` vocabulary, and the private `--m3e-loading-indicator-*` inputs internal;
- owns geometry normalization (`size` → private size variable) and the confirmed size-variable-naming divergence;
- owns its stories, tests, and motion assessment.

## Renderer typing

No demand-scoped public prop currently maps to a typed `M3eLoadingIndicatorElement` property (`variant` is deferred); `label` maps to the native `aria-label` attribute and `size` maps to a private CSS custom property, neither of which are typed renderer properties. `src/shared/ui/material/m3eLoadingIndicator.d.ts` declares the Vue template surface for `<m3e-loading-indicator>` without importing unused renderer property types, consistent with the demand-driven scope. If a future prop maps to `variant` or another typed element property, import `M3eLoadingIndicatorElement` at that time and type the mapping against it, following the `m3eButton.d.ts` pattern.

## MDButton composition contract

`MDButton` (see `../button/README.md`):

- renders `MDLoadingIndicator`, not raw m3e;
- hands off its own `label` as the dependency's accessible loading purpose;
- hands off Button icon size through the accepted `md.comp.button.<size>.icon.size` values, expressed in rem (`1.25rem`/`1.5rem`/`2rem`/`2.5rem`), via the `size` prop;
- relies on inherited color (no explicit color prop needed) for the rendered label/icon color handoff;
- defines loading precedence over the normal icon route (selected-icon route is unaffected, since selected/loading are mutually exclusive by current usage);
- preserves Button label and normal native event behavior;
- covers disabled plus loading and selected plus loading via existing Button tests/stories.

## Verification

Completed:

- package-derived type-check (`pnpm vue-tsc --noEmit`);
- colocated component-contract tests (`MDLoadingIndicator.test.ts`) for the accessible label, default vs. explicit size mapping;
- colocated stories (`MDLoadingIndicator.stories.ts`) for default presentation, size matrix, and inherited color on colored surfaces;
- `MDButton` behavior-contract story and `tests/e2e/storybook/md-button-family.spec.ts` prove the parent renders `MDLoadingIndicator`'s `m3e-loading-indicator` output and hands off the accessible label correctly.

Pending:

- operator visual and motion review (renderer-owned shape-morph animation; no reduced-motion path found in m3e 2.6.2, recorded above);
- final `pnpm verify`.

## Completion gate

`MDLoadingIndicator` is `migrated`:

- the source-backed matrix above is accepted;
- the demand-scoped Material Vue API (`label`, `size`) is implemented;
- accessibility labeling and progress semantics are correct;
- size/color handoff for the Button integration is correct and source-backed;
- the m3e 2.6.2 size-variable-naming divergence is recorded and assigned;
- package-derived typing is used for the Vue custom-element declaration (no unused renderer type imports);
- tests, stories, and focused type-check pass.

Remaining before full sign-off: final `pnpm verify` and operator motion/visual acceptance (tracked in `../../docs/roadmap.md`).
