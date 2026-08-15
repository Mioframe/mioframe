# Floating action button implementation

Status: complete
ARCHITECTURE.md reference: `src/shared/ui/material/components/floatingActionButton/ARCHITECTURE.md`
Revision summary: Correction pass — replaced the canonical `AddIcon` fixture and every dependent story/test fixture with filled Material-compatible SVG artwork (the standard Material Icons "add" glyph) at the unchanged 80/28 CSS-px geometry, corrected the icon-slot TSDoc and the "official standalone default" wording in `MDFab.vue`/`MDFab.stories.ts` to the precise Medium-recommendation/Primary-container-default/renderer-default distinction, and corrected this file's DEV-validation wording to describe only what runtime validation actually checks.
Remaining blockers: none
Required return family: none
Required return stage: none
Architecture deviations: none
Migration readiness: ready

## Implemented passes

- Kept one `m3e-fab` host with the architecture-selected `medium` size and `primary-container` variant; no runtime logic changed.
- Kept the explicit host-attribute boundary and native click forwarding unchanged.
- Replaced the canonical `AddIcon` artwork in `MDFab.stories.ts` (shared by `Default`, `VisualStates`, `BehaviorContracts`, `HostAttributeBoundary`, `GeometryContract`, and `RealInteractionFeedback`) with the standard filled Material Icons "add" glyph (`M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z`, `viewBox="0 0 24 24"`, `fill="currentColor"`, no `stroke`/`fill="none"`), and updated `MDFab.test.ts`'s inline SVG fixtures to the same filled path for consistency. The 80×80 CSS-px host / 28×28 CSS-px icon geometry contract and the decorative/direct-SVG/`currentColor` composition are unchanged — only the artwork's fill treatment changed.
- Updated the `#icon` slot TSDoc in `MDFab.vue` to document the filled-versus-outlined artwork requirement as a caller-contract requirement (enforced by fixture selection and review), not as a new runtime-validated property. No new runtime SVG-shape/semantic validation was added; the existing DEV check (exactly one direct `SVGSVGElement` child of the host) is unchanged.
- Corrected the "official standalone default" phrasing that reintroduced the conflated fact architecture retired: `MDFab.vue`'s renderer-constants comment and `MDFab.stories.ts`'s Autodocs component description now state the three distinct facts (Medium is Material's most-recommended size for general use, not a documented default size; Primary-container is the documented Material default color mapping; `medium` is also the independent `@m3e/web@2.7.4` renderer default size input) instead of calling the pair a single "official standalone default."
- Corrected this file's own DEV-validation wording (this pass): it now states precisely that runtime validation checks only that exactly one direct SVG root exists as a child of the host. Decorative semantics (`aria-hidden`, no interactive descendant), `viewBox`, `currentColor` painting, and filled-versus-outlined artwork remain caller-contract requirements documented in `MDFab.vue`'s Public Vue API/TSDoc and proven only through canonical fixture selection and review — not properties the runtime check inspects.
- `MDFab.browser.spec.ts` and `MDFab.visual.spec.ts` needed no code changes: both consume the canonical Storybook fixtures by story id, so they automatically exercise the new filled-icon artwork once `MDFab.stories.ts` changed. Existing pointer/Enter/Space/accessible-name/attribute-boundary numeric-geometry proof and the existing resting/hover/focus/pressed visual proof are unchanged and were re-run against the new fixture content.
- Inspected the visual proof outcome after the fixture change: the focused `visual` verifier run rebuilt Storybook fresh (confirmed the built `MDFab.stories-*.js` chunk contains only the new filled path, not the prior stroke path) and the four existing canonical baselines still matched the new filled-icon render, so no baseline image required refreshing.

## Public API implemented

Unchanged from the prior implementation: `MDFab` exposes the required `label` prop, the required named `icon` slot (now with TSDoc documenting the filled-artwork caller-contract requirement), and the native `click` event. The label owns the host accessible name. Only merged `class`/`style`, `id`, `title`, and `data-*` attributes reach the host; renderer state and arbitrary attributes remain private.

## Tokens and renderer mappings

No public FAB token surface was added or changed. The private `@m3e/web@2.7.4` mapping still uses `m3e-fab`, `medium`, `primary-container`, and a direct default-slot SVG; the renderer owns its geometry, interaction states, and accessibility implementation. No renderer divergence was found during this pass.

## Dependencies

None. The architecture dependency queue remains empty.

## Component-owned proof

- `MDFab.test.ts`: renderer mapping, accessible name, direct SVG composition (now filled artwork), DEV warnings, click forwarding, and host-attribute boundary. Assertions target only what runtime validation checks (one direct SVG root); they do not assert filled-versus-outlined artwork.
- `MDFab.browser.spec.ts`: pointer activation through the visible SVG, keyboard activation, rendered 80px container/28px icon geometry, and rejected renderer-state overrides — now exercised against the filled canonical fixture.
- `MDFab.visual.spec.ts`: resting, hover, focus, and pressed canonical appearances — now exercised against the filled canonical fixture; existing baselines confirmed still matching.
- `MDFab.stories.ts`: canonical filled-SVG fixtures shared by component, browser, and visual proof.

## Stage verification

- `pnpm verify --only unit-tests --files src/shared/ui/material/components/floatingActionButton/MDFab.test.ts` — passed.
- `pnpm verify --only type-check` — passed.
- `pnpm verify --only format --files src/shared/ui/material/components/floatingActionButton/MDFab.vue src/shared/ui/material/components/floatingActionButton/MDFab.test.ts src/shared/ui/material/components/floatingActionButton/MDFab.stories.ts` — passed.
- `pnpm verify --files src/shared/ui/material/components/floatingActionButton/MDFab.vue src/shared/ui/material/components/floatingActionButton/MDFab.test.ts src/shared/ui/material/components/floatingActionButton/MDFab.stories.ts --profile local --only eslint` — passed.
- `pnpm verify --only storybook-build --files src/shared/ui/material/components/floatingActionButton/MDFab.stories.ts` — passed.
- `pnpm verify --only storybook-behavior --files src/shared/ui/material/components/floatingActionButton/MDFab.browser.spec.ts` — passed (accessible name/click, Enter/Space activation, 80px/28px numeric geometry, rejected dynamic fallthrough — all against the filled canonical fixture).
- `pnpm verify --files src/shared/ui/material/components/floatingActionButton/MDFab.visual.spec.ts --profile local --only visual` — passed (4 tests: resting, hover, focus, pressed). The run rebuilt Storybook fresh; the built story chunk was confirmed to contain only the new filled-icon path. All four existing baselines matched the new render without needing a refresh.

This stage did not run migration, independent review, or a broad final gate.

## Architecture deviations

None.

## Remaining blockers

None.

## Migration readiness

Ready. No consumers were migrated; consumer inventory and adoption remain the migration stage's responsibility.
