# Extended FAB implementation

Status: complete
ARCHITECTURE.md reference: `src/shared/ui/material/components/extendedFab/ARCHITECTURE.md`
Revision summary: Initial implementation. Adds canonical `MDExtendedFab` composing the same `m3e-fab` renderer element `floatingActionButton` already owns, fixed to small size, primary-container color, and `extended`, with a required visible `label` and an optional decorative icon slot.
Remaining blockers: none
Required return family: none
Required return stage: none
Architecture deviations: none
Migration readiness: ready

## Implemented passes

All 10 architecture-numbered passes were implemented in one pass set (new family, no correction capsule):

1. Created `MDExtendedFab.vue`: one `m3e-fab` host, package-derived private typing (`FabSize`, `FabVariant`, `M3eFabElement` from `@m3e/web/fab`), explicit `small`/`primary-container`/`extended: true` constants, `inheritAttrs: false`, explicit `label` prop and `click` emit, local host-attribute allow-list filtering (`id`, `title`, `data-*`, merged `class`/`style`) — structurally following `floatingActionButton/MDFab.vue`, adapted for the named `label` slot and the optional (not required) `icon` slot.
2. Bound `label` to both the renderer's named `label` slot (as light-DOM text in a `<span>` carrying the native `slot="label"` attribute, matching the shipped `FabElement.d.ts` worked example) and the host `aria-label`.
3. Kept the icon slot projected directly to the renderer's default (unnamed) slot, conditionally present rather than required. Added a DEV-only `onMounted` check that warns only when icon content is present but is not exactly one direct `SVGSVGElement` root — and does not warn when the icon slot is empty, since omission is valid official anatomy. The check specifically excludes the `label` span (identified by its `slot="label"` attribute) from the "icon content" set it inspects, which `floatingActionButton`'s identical check does not need to do (that family has no label slot).
4. Did not render `m3e-icon`, create an `MDIcon`/`MDSymbol` dependency, wrap the SVG or label text, set a renderer CSS variable publicly, or inspect shadow DOM.
5. Authored `MDExtendedFab.test.ts` (20 tests): fixed private `size`/`variant`/`extended` values; `label` renders as visible text in the named slot and as `aria-label`; icon slot renders when present and is absent (no warning) when omitted; DEV warning for non-SVG/bare-text/multi-element icon content; click forwarding; and full host allow-list/rejection coverage (static, merge, reactive, forbidden-attribute, undeclared-listener, and add/remove/re-add cases), mirroring `MDFab.test.ts`'s established coverage shape.
6. Authored `MDExtendedFab.browser.spec.ts` (owner-local, colocated): accessible role/name ("Add" fixture), native click via the icon, Enter/Space keyboard activation, rejected dynamic renderer-state fallthrough, and public numeric geometry — 56px container height, 24px icon box, 16px leading space (icon left edge to container left edge), 8px icon-label gap, and 16px trailing space (container right edge to label right edge) — measured against the icon+label default fixture at the project's pinned `deviceScaleFactor: 1`. Container width is intentionally not asserted (DESIGN.md documents no fixed/minimum width for small/medium/large Extended FAB — see architecture Risks).
7. Authored `MDExtendedFab.visual.spec.ts` (owner-local, colocated): a single resting-state screenshot covering both the icon+label and label-only appearances in one fixture ("visual completeness" per architecture pass 7), plus three real-interaction screenshots (hover, focus, pressed) against the icon+label configuration, mirroring `MDFab.visual.spec.ts`'s real-interaction-feedback pattern. No browser-behavior assertions in this file.
8. Authored `MDExtendedFab.stories.ts` with `Default` (icon+label "Add"), `LabelOnly` (no-icon anatomy), `VisualStates`, `BehaviorContracts`, `HostAttributeBoundary`, `GeometryContract`, and `RealInteractionFeedback` fixtures, following `MDFab.stories.ts`'s fixture-per-contract convention and its canonical filled "add" SVG glyph. `docs/roadmap.md` was left unchanged (explicitly out of scope for this stage per architecture).
9. Exported `MDExtendedFab` from the family `index.ts` and added it to the root `@shared/ui/material` barrel (alphabetically between `MDCheckbox` and `MDFab`), mirroring `floatingActionButton`'s export shape.
10. No selected-default divergence was found during exact-version inspection or browser proof (see "Tokens and renderer mappings" below); no `M3E-*` record was needed and no workaround was added.

One mechanical typing fix outside the family's own files was required to make pass 1/2 type-check, and is recorded here rather than silently folded into "implemented passes":

- `src/shared/ui/material/m3eFab.d.ts` (shared Vue template-type shim for the `m3e-fab` custom element, already used by `floatingActionButton`): extended `RendererFabProps` from `Pick<M3eFabElement, 'variant' | 'size'>` to `Pick<M3eFabElement, 'extended' | 'size' | 'variant'>` so `:extended="rendererExtended"` type-checks. `extended` is a real, shipped `M3eFabElement` property (`FabElement.d.ts`) that `floatingActionButton` never needed to bind (its own `extended` is always the renderer's `false` default); this is a minimal, exact-version-backed addition to the shared shim, not a new mapping surface or generic adapter framework.
- `MDExtendedFab.vue`'s label `<span>` uses `v-bind="labelSlotAttrs"` (a local `{ slot: 'label' }` record) instead of a literal `slot="label"` template attribute, because Vue's `HTMLAttributes` type does not declare the native HTML `slot` global attribute as bindable on plain elements (it is reserved for Vue's own `v-slot` component API). This reuses the same untyped-`v-bind`-escape-hatch pattern the file already uses for `getForwardedAttrs()` on the host element; it changes no runtime behavior (the DOM still receives a real `slot="label"` attribute).

## Public API implemented

`MDExtendedFab` exposes exactly what ARCHITECTURE.md's "Public Vue API" selects: required `label: string` (visible text + `aria-label`), optional `#icon` slot (one direct inline SVG contract, identical to `floatingActionButton`), `@click` (native `MouseEvent` passthrough), and the generic `class`/`style`/`id`/`title`/`data-*` host allow-list. No default slot, no additional emit, no `v-model`, no component-ref/expose contract. The single raw `m3e-fab` host uses `inheritAttrs: false` and pins `small`/`primary-container`/`extended: true`, rejecting every other fallthrough attribute and listener (including `aria-label`, `disabled`, `disabled-interactive`, `lowered`, `size`, `variant`, and link/form attributes).

## Tokens and renderer mappings

No `--md-comp-extended-fab-*` public token was added, matching architecture's "no confirmed contextual customization scenario" decision; `docs/token-api.md` needed no entry (confirmed no existing FAB-family entry there either). The private mapping uses `size="small"`, `variant="primary-container"`, `extended="true"` on `m3e-fab`, consuming renderer defaults backed by existing foundation roles only. The browser spec's numeric geometry assertions (56/24/16/8/16) passed against the real rendered output, confirming architecture's exact-match claim (density scale 0 → all `calc(-3)` adjustments resolve to 0px) with no divergence found; no `docs/m3e-defects.md` record was needed.

## Dependencies

None. `extendedFab` independently imports `@m3e/web/fab` and types against `M3eFabElement`/`FabSize`/`FabVariant` — the same public renderer package `floatingActionButton` imports, with no composition through `floatingActionButton`'s public `MDFab` component and no shared token namespace. The architecture dependency queue is `none`.

## Component-owned proof

- `MDExtendedFab.test.ts` (20 tests, colocated): renderer mapping constants, label→text/aria-label mapping, icon-present/icon-omitted paths, DEV warnings (empty = no warning, bare text = warning, multi-element = warning), click forwarding, and full host-attribute boundary (allow-list, merge, reactivity, rejection, undeclared listeners, add/remove/re-add).
- `MDExtendedFab.browser.spec.ts` (4 tests, owner-local Storybook browser spec): accessible name + pointer click, Enter/Space keyboard activation, rejected dynamic renderer-state fallthrough (including across repeated toggles), and the 56/24/16/8/16 numeric geometry contract.
- `MDExtendedFab.visual.spec.ts` (4 tests, owner-local, snapshots not yet captured — see Stage verification) + `MDExtendedFab.visual.spec.ts-snapshots/` (directory not yet created in this session): resting (icon+label and label-only), hover, focus, pressed appearances.
- `MDExtendedFab.stories.ts`: shared fixtures consumed by the above two Playwright lanes plus Storybook's own build/docs.

## Stage verification

- `pnpm verify --only type-check` — passed.
- `pnpm verify --only unit-tests --files src/shared/ui/material/components/extendedFab/MDExtendedFab.test.ts` — passed (20/20).
- `pnpm verify --only format --files <all 8 new/changed extendedFab + shared-shim files>` — passed (after one `--fix-only` pass on `MDExtendedFab.stories.ts`, inspected before continuing).
- `pnpm verify --only oxlint --files <same 8 files>` — passed.
- `pnpm verify --files <same 8 files> --profile local --only eslint` — passed.
- `pnpm verify --only storybook-build --files src/shared/ui/material/components/extendedFab/MDExtendedFab.stories.ts` — passed.
- `pnpm verify --only storybook-behavior --files src/shared/ui/material/components/extendedFab/MDExtendedFab.browser.spec.ts` — passed (4/4, including the 56/24/16/8/16 numeric geometry contract measured in a real browser).
- `pnpm verify --files src/shared/ui/material/components/extendedFab/MDExtendedFab.visual.spec.ts --profile local --only visual` — **could not execute**: the visual lane runs Playwright inside a Podman container (`playwright.visual.config.ts`), and this implementation session runs inside a sandbox that cannot start Podman-backed containers. The command failed at the container-launch level (`Playwright container command failed... operation: Playwright tests in a Podman container`) before any per-test screenshot comparison ran; this is an environment/tooling limitation of this session, not a rendering or contract defect — the identical composition already passed real-browser numeric geometry proof in `storybook-behavior` above. No `MDExtendedFab.visual.spec.ts-snapshots/` baseline directory could be generated in this session. **This must be run outside the sandbox (e.g. via the operator) before merge**: `pnpm verify --files src/shared/ui/material/components/extendedFab/MDExtendedFab.visual.spec.ts --profile local --only visual`, inspecting the four newly generated baselines before accepting them.

This stage did not run migration, independent review, or a broad final gate.

## Architecture deviations

None.

## Remaining blockers

None. The unexecuted visual lane is a sandbox tooling limitation of this session, not an implementation defect, open architecture question, or content problem — the story fixtures, selectors, and expected states are complete and ready to run in any Podman-capable environment.

## Migration readiness

Ready. No consumers were migrated; `RepoExplorerPane`'s adoption of canonical `MDExtendedFab` and legacy `MDExtendedFab` removal remain the migration stage's responsibility per ARCHITECTURE.md's "Migration plan". The migration worker (or the operator, outside this sandbox) should capture the `MDExtendedFab.visual.spec.ts-snapshots/` baselines before or during that stage if not done earlier.
