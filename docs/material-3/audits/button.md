# Button Material 3 Expressive compliance audit

- Requested name: button
- Resolved family: Button (`MDButton` — common and toggle buttons)
- Audit date: 2026-07-17
- Implementation ref: `fix/md-button-material-token-contract` (uncommitted working tree changes on top of commit `33f489411ec125742c57fa6dbd2ff9cf307f912f`)
- Current owner: `src/shared/ui/material/components/button/MDButton.vue`
- Canonical owner: `src/shared/ui/material/components/button`
- Compliance result: `compliant` (for the claimed supported surface below)
- Operator visual status: required

## Official evidence

- `material3` MCP Button documentation and token graph, including `md.comp.button.*.pressed.container.corner-size.motion.spring.stiffness`/`.damping` per size.
- Verified fallback snapshot: `Vyachean/m3-docs-cache` commit `49ffae58a61f86c28b23720696dc9d07b6945483`, captured `2026-07-13T12:48:04.850Z`.
- `pages/components/buttons/specs.md` publishes pressed container shape motion through `md.sys.motion.spring.fast.spatial.stiffness` (`800`) and damping (`0.6`) for every supported size.
- `src/shared/ui/material/README.md` defines `src/shared/ui/material/components/<family>` as canonical; the physical migration map now records the Button family as `migrated`.

This audit replaces the prior `non-compliant` review (2026-07-17, same day, pre-migration) which recorded three blockers: (1) the required end-to-end physical migration had not been performed, (2) the per-size spring component tokens did not participate in the rendered motion, (3) a shadow-color override did not reach the final rendered `box-shadow`. All three are resolved and verified below.

## Claimed supported surface

The repository claims five color styles, five sizes, round and square shapes, default and toggle variants, native button semantics, loading extension, public component-token overrides, state layers, ripple, focus indication, and Expressive shape motion.

## Required consumer scenarios

- primary, secondary, and tertiary actions in forms, dialogs, sheets, cards, and toolbars;
- toggle-style controls;
- disabled and loading states;
- light and dark themes;
- native pointer and keyboard activation.

## Findings resolved in this pass

1. Severity: high (resolved)
   Area: physical ownership and migration
   Prior mismatch: `MDButton` remained at `src/shared/ui/Button/MDButton.vue`; no canonical `material/components/button` owner, family README, Material root export, or consumer migration existed.
   Resolution: `MDButton.vue`, `MDButton.test.ts`, `MDButton.stories.ts`, `MDButtonOverrideContractVisualStory.vue`, and `MDButtonTargetHitVisualStory.vue` are physically moved to `src/shared/ui/material/components/button`; a family `README.md` records the adaptive contract; `src/shared/ui/material/index.ts` exports `MDButton` as the project-facing entry point; every direct consumer (25 files across `entities`, `features`, `pages`, `shared/ui`, and `widgets`) imports from `@shared/ui/material`; the legacy `MDButton` export is removed from `src/shared/ui/Button/index.ts` (sibling legacy families `MDIconButton`/`MDFab`/`MDExtendedFab`/`FabContainer` are unaffected, out of this family's scope).
   Evidence: `git mv` history for the five files; `pnpm verify --only type-check` and full `pnpm verify` pass with the new import graph; no remaining reference to the old path (`grep` verified).

2. Severity: high (resolved)
   Area: interaction motion implementation
   Prior mismatch: per-size `--md-comp-button-{size}-pressed-container-corner-size-motion-spring-stiffness`/`-damping` component tokens were declared but never consumed; the actual `border-radius` transition used a flat global duration/easing constant unconditionally.
   Resolution: each size block now also declares `--md-private-button-corner-motion-duration`/`-easing`, consuming the same documented fast-spatial Web adaptation (`src/shared/lib/md/tokens.css`, itself derived from `--md-sys-motion-spring-fast-spatial-stiffness: 800`/`damping: 0.6`), colocated with the official stiffness/damping declarations. The root `border-radius` transition now reads these per-size private variables instead of the flat global constant directly.
   Evidence: `tests/e2e/visual/shared-ui/md-button.spec.ts` (`MDButton per-size spring component tokens resolve to the fast-spatial system tokens and drive the actual border-radius transition`) asserts, for two sizes (`small`, `xlarge`), that the declared stiffness/damping equal the official spring values, that the size-scoped private duration/easing equal the documented adaptation, and that the root's actual computed `transition-duration`/`transition-timing-function` for `border-radius` equal that same adaptation — a genuine, tested route from declared token to rendered motion, not a re-implementation of spring physics in CSS (consistent with `component-testing.md`: a documented shared Web adaptation may be consumed directly).

3. Severity: high (resolved)
   Area: public shadow-color token final rendering
   Prior mismatch: overriding `--md-comp-button-*-container-shadow-color` reached the `--md-private-elevation-shadow-color` bridge variable, but the final rendered `box-shadow` did not consistently re-derive its color from it.
   Root cause (empirically confirmed via isolated browser probes, not assumed): `--md-sys-elevation-level0`–`level5` were declared only on `:root`. A custom property's `rgb(from var(...))` is resolved using the value of its dependency on the element where _that property_ is declared. Declaring the elevation-level formula only on `:root` freezes its color at `:root`'s default `--md-private-elevation-shadow-color`; a descendant component overriding that variable only _inherits_ the already-frozen string rather than recomputing it. This reproduced identically with `color-mix()` in place of `rgb(from ...)`, confirming it is a general custom-property-inheritance behavior, not a quirk specific to relative-color syntax.
   Resolution: `src/shared/lib/md/tokens.css` now also declares `--md-sys-elevation-level0`–`level5` on a universal selector (`*, ::before, ::after`), so every element recomputes the formula locally against its own cascaded `--md-private-elevation-shadow-color`. A vestigial, functionally-inert dark-theme reordering of `level1`/`level2` (a prior failed fix attempt for this same defect) was removed as dead code.
   Evidence: `tests/e2e/visual/shared-ui/md-button.spec.ts` (`MDButton container shadow-color override reaches the private elevation bridge and the final rendered box-shadow color`) now asserts the exact final rendered `box-shadow` string (geometry and color) for four override scenarios (elevated resting/hover, filled hover, tonal hover), not only the bridge variable and shadow-layer count. Fixed once at the shared foundation, so it benefits `MDIconButton`, `MDFab`, and `MDExtendedFab` identically (their own tests were not updated in this pass — tracked as remaining test-coverage work in `component-family-audit.md`, not a foundation blocker).

## Evidence gaps

- Final visual acceptance is an operator-only gate and has not yet occurred; the agent reports it as `required`, not `accepted`.

## Verified compliant areas

Existing token, semantics, accessibility, motion-ownership, and dark-theme inverse-token coverage recorded by the prior audit remain valid and are now additionally covered from the canonical location. Full `pnpm verify` (format, lint, type-check, unit tests, full-app e2e, Storybook behavior, 229-test visual regression suite, and mutation testing) passes on the final working tree.

## Recommended next action

Prepare and present the operator visual evidence package for `MDButton` (canonical Storybook stories under `Material 3/Components/Buttons/MDButton`). Once accepted, mark roadmap milestone M1 `done` and proceed to M2 (`MDSwitch` independent stateful pilot) via `material-library-next` or an explicit `material-component` run.
