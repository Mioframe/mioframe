# Floating action button implementation

Status: complete
ARCHITECTURE.md reference: `src/shared/ui/material/components/floatingActionButton/ARCHITECTURE.md`
Revision summary: Implemented the ready single-host medium primary-container FAB contract with direct decorative SVG icon composition and current family-owned proof.
Remaining blockers: none
Required return family: none
Required return stage: none
Architecture deviations: none
Migration readiness: ready

## Implemented passes

- Kept one `m3e-fab` host with the architecture-selected `medium` size and `primary-container` variant.
- Kept the explicit host-attribute boundary and native click forwarding.
- Documented and DEV-validated the required icon composition: exactly one direct decorative inline SVG root.
- Replaced canonical bare-text fixtures with a direct SVG add glyph and retained the real-interaction fixture's 80px-square layout.
- Updated component, browser, Storybook, and visual proof; inspected and refreshed only the four owned visual baselines.

## Public API implemented

`MDFab` exposes the required `label` prop, required named `icon` slot, and native `click` event. The label owns the host accessible name. Only merged `class`/`style`, `id`, `title`, and `data-*` attributes reach the host; renderer state and arbitrary attributes remain private.

## Tokens and renderer mappings

No public FAB token surface was added. The private `@m3e/web@2.7.4` mapping uses `m3e-fab`, `medium`, `primary-container`, and a direct default-slot SVG; the renderer owns its geometry, interaction states, and accessibility implementation.

## Dependencies

None. The architecture dependency queue remains empty.

## Component-owned proof

- `MDFab.test.ts`: renderer mapping, accessible name, direct SVG composition, DEV warnings, click forwarding, and host-attribute boundary.
- `MDFab.browser.spec.ts`: pointer activation through the visible SVG, keyboard activation, rendered 80px container/28px icon geometry, and rejected renderer-state overrides.
- `MDFab.visual.spec.ts`: resting, hover, focus, and pressed canonical appearances.
- `MDFab.stories.ts`: canonical direct-SVG fixtures for component, browser, and visual proof.

## Stage verification

- `pnpm verify --only unit-tests --files src/shared/ui/material/components/floatingActionButton/MDFab.test.ts` — passed (13 tests).
- `pnpm verify --only type-check` — passed.
- `pnpm verify --only format --files src/shared/ui/material/components/floatingActionButton/MDFab.vue src/shared/ui/material/components/floatingActionButton/MDFab.test.ts src/shared/ui/material/components/floatingActionButton/MDFab.stories.ts src/shared/ui/material/components/floatingActionButton/MDFab.browser.spec.ts src/shared/ui/material/components/floatingActionButton/IMPLEMENTATION.md` — passed.
- `pnpm verify --files src/shared/ui/material/components/floatingActionButton/MDFab.browser.spec.ts src/shared/ui/material/components/floatingActionButton/MDFab.stories.ts src/shared/ui/material/components/floatingActionButton/MDFab.test.ts src/shared/ui/material/components/floatingActionButton/MDFab.vue --profile local --only eslint` — passed.
- `pnpm verify --only storybook-build --files src/shared/ui/material/components/floatingActionButton/MDFab.stories.ts` — passed.
- `pnpm verify --only storybook-behavior --files src/shared/ui/material/components/floatingActionButton/MDFab.browser.spec.ts` — passed (4 tests).
- `pnpm verify --files src/shared/ui/material/components/floatingActionButton/MDFab.visual.spec.ts --profile local --only visual` — passed (4 tests).

The four visual snapshots were updated only after expected, actual, and diff inspection. This stage did not run migration, independent review, or a broad final gate.

## Architecture deviations

None.

## Remaining blockers

None.

## Migration readiness

Ready. No consumers were migrated; consumer inventory and adoption remain the migration stage's responsibility.
