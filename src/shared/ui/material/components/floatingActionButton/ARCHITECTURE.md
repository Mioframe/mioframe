# Floating action button architecture

Status: ready
DESIGN.md reference: `src/shared/ui/material/components/floatingActionButton/DESIGN.md`
Renderer revision: @m3e/web@2.6.3
Revision summary: Initial architecture for the canonical `MDFab` family, selecting the single unambiguous official standalone default (medium size, primary container color, icon-only, required accessible label) because no confirmed product consumer of the plain FAB currently exists.
Remaining blockers: none
Required return family: none
Required return stage: none
Implementation readiness: ready
Dependency families: none
Dependency queue: none

## Goal

Provide one canonical, demand-scoped `MDFab` Vue adapter over the official Material Floating action button (FAB) — the icon-only, size-differentiated family distinct from Extended FAB and FAB menu. No current product code renders the plain FAB; the only current FAB-shaped product usage renders the Extended FAB instead (see [Current scenarios](#current-scenarios)). Per the workflow's no-consumer default-scenario rule, this architecture selects the one unambiguous official standalone default — a medium, primary-container FAB rendering a single required icon with a required accessible action label and native click — as the sole approved library scenario, and defers every other official size/color/anatomy/interaction surface.

The simplest viable design is a thin single-host adapter over `m3e-fab` with two private renderer-facing constants (`variant="primary-container"`, `size="medium"`) and no configurable props beyond the required accessible label and the icon slot. No adapter framework, size/color prop matrix, disabled contract, loading composition, or token file is required for this minimum default.

Design basis: [Identity and purpose](./DESIGN.md#identity-and-purpose), [Anatomy and content](./DESIGN.md#anatomy-and-content), [Variants and configurations](./DESIGN.md#variants-and-configurations), [States and behavior](./DESIGN.md#states-and-behavior), and [Accessibility](./DESIGN.md#accessibility).

## Non-goals

- Do not expose FAB (regular) or large size, or any color other than primary container (primary, secondary, tertiary, secondary container, tertiary container, surface). No confirmed current scenario requires configurability; DESIGN.md's medium-size/primary-container defaults are the selected single scenario. See [Variants and configurations](./DESIGN.md#variants-and-configurations).
- Do not expose the deprecated small size or the deprecated surface color. Both are explicitly "no longer recommended" in the current official snapshot. See [Variants and configurations](./DESIGN.md#variants-and-configurations) and [Complete official token catalogue](./DESIGN.md#complete-official-token-catalogue).
- Do not expose a `disabled` (or `disabled-interactive`) prop. Official accessibility guidance is explicit: "don't disable the FAB — if the action it represents is unavailable, the FAB should not appear," and no disabled token set exists in the official catalogue. This is a deliberate omission of official-guidance-forbidden state, not a deferred-for-lack-of-demand omission. See [States and behavior](./DESIGN.md#states-and-behavior) and [Accessibility](./DESIGN.md#accessibility).
- Do not implement the Extended FAB (label anatomy, `extended` renderer attribute, `label` renderer slot) or FAB menu. Both are explicitly separate official component families with their own DESIGN.md scope, out of this family's contract. The current product Extended FAB usage (`RepoExplorerPane.vue`) is unaffected by this architecture. See [Identity and purpose](./DESIGN.md#identity-and-purpose) and [Related official contracts](./DESIGN.md#related-official-contracts).
- Do not implement link/download/target/rel or form name/value/submit-type behavior. The installed renderer supports both (`LinkButtonMixin`, `FormSubmitterMixin`) but no current or official-default scenario selects them. See [Renderer mapping and gaps](#renderer-mapping-and-gaps).
- Do not implement `lowered` elevation. DESIGN.md records every current color set publishing a parallel "lowered" elevation token subset with no accompanying guideline text explaining when it applies; this is an unresolved official-source distinction, not a deferrable configuration choice with a known meaning. See [Source conflicts and unknowns](./DESIGN.md#source-conflicts-and-unknowns).
- Do not implement the web hover/focus tooltip guidance ("hovering over a FAB should display a tooltip with an accompanying icon text label"). This is documented official "should" behavior, but no canonical Material Tooltip family currently exists under `src/shared/ui/material/components` to compose as a dependency, and the required accessible label already satisfies the accessibility contract without it. Revisit only when a canonical Tooltip family exists and a scenario requires it. See [Anatomy and content](./DESIGN.md#anatomy-and-content) and [Accessibility](./DESIGN.md#accessibility).
- Do not select any public `--md-comp-fab-*` token. No current or contextual consumer overrides any FAB color, geometry, or state value.
- Do not recreate renderer-owned private DOM, state layer, ripple-equivalent hover/press geometry, elevation, shape, motion, or accessibility internals.

## Current scenarios

1. **No confirmed product consumer of the plain FAB (confirmed).** No product code under `src/pages`, `src/widgets`, `src/features`, or `src/entities` renders a plain icon-only FAB. The only current FAB-shaped product usage is `RepoExplorerPane.vue` (`src/pages/RepoExplorer/RepoExplorerPane.vue`), which renders `<FabContainer auto-hide><MDExtendedFab label="Add" md-symbol="add" @click="onClickAdd" /></FabContainer>` — the legacy Extended FAB, an explicitly separate official family out of this DESIGN.md's scope (see [Identity and purpose](./DESIGN.md#identity-and-purpose)). The legacy plain `MDFab` (`src/shared/ui/Button/MDFab.vue`) has zero product consumers; only its own `MDFab.stories.ts`/`MDFab.test.ts` reference it.
2. **Selected no-consumer default (approved library scenario).** Per the workflow's no-consumer default-scenario rule, architecture selects the unambiguous official standalone default: a medium-size FAB using DESIGN.md's documented default color (primary container & on-primary container), rendering one required icon, exposing a required accessible action label (not rendered as visible text — the FAB anatomy carries no label text; see [Anatomy and content](./DESIGN.md#anatomy-and-content)), and forwarding native click. Medium is both DESIGN.md's recommended general-use size ("Medium FAB is the most recommended size for general use") and the installed renderer's own default (`FabElement.size` defaults to `"medium"`); primary container is both DESIGN.md's documented default color and the renderer's own default (`FabElement.variant` defaults to `"primary-container"`). No size/color selection contract is exposed because nothing in the selected default requires one.

Design basis: [Identity and purpose](./DESIGN.md#identity-and-purpose), [Anatomy and content](./DESIGN.md#anatomy-and-content), [Variants and configurations](./DESIGN.md#variants-and-configurations), [Usage guidance](./DESIGN.md#usage-guidance), and [Accessibility](./DESIGN.md#accessibility).

## Selected and deferred Material surface

| Material contract                                                                        | DESIGN.md evidence                                                                                                                                                                     | Demand and scenario                                                                                    | Public Vue/token representation                                                                          | Renderer status and mapping                                                                                                                                     | Owner and decision                                      | Proof                                                |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| Medium size, primary container color, rounded-square container, single icon              | [Variants and configurations](./DESIGN.md#variants-and-configurations), [Geometry and layout](./DESIGN.md#geometry-and-layout), [Anatomy and content](./DESIGN.md#anatomy-and-content) | The selected no-consumer default scenario renders exactly this configuration                           | no public size/color prop; adapter-owned private constants `variant="primary-container"` `size="medium"` | `direct`: renderer's own documented defaults already match; explicit constants keep the mapping self-documenting and immune to a future renderer default change | family; `implement-now`                                 | component contract; browser/visual proof             |
| FAB (regular) and large sizes                                                            | [Variants and configurations](./DESIGN.md#variants-and-configurations), [Geometry and layout](./DESIGN.md#geometry-and-layout)                                                         | No confirmed scenario requires a non-medium size                                                       | none                                                                                                     | `direct` in renderer (`FabSize` includes `"small"` = FAB regular per renderer naming, and `"large"`) but not selected                                           | family; `defer`                                         | absence from API                                     |
| Small size (deprecated baseline)                                                         | [Variants and configurations](./DESIGN.md#variants-and-configurations)                                                                                                                 | Explicitly "no longer recommended"                                                                     | none                                                                                                     | `direct` in renderer, not selected                                                                                                                              | family; `defer`                                         | absence from API                                     |
| Primary, secondary, tertiary, secondary container, tertiary container colors             | [Variants and configurations](./DESIGN.md#variants-and-configurations)                                                                                                                 | No confirmed scenario requires a non-default color                                                     | none                                                                                                     | `direct` in renderer, not selected                                                                                                                              | family; `defer`                                         | absence from API                                     |
| Surface color (deprecated baseline)                                                      | [Variants and configurations](./DESIGN.md#variants-and-configurations)                                                                                                                 | Explicitly "no longer recommended"                                                                     | none                                                                                                     | `direct` in renderer, not selected                                                                                                                              | family; `defer`                                         | absence from API                                     |
| Required icon anatomy                                                                    | [Anatomy and content](./DESIGN.md#anatomy-and-content)                                                                                                                                 | Every FAB instance requires exactly one icon                                                           | `icon` slot, adapter-owned, mapped to the renderer's default (unnamed) slot                              | `direct`: renderer's default slot documented as "Renders the icon of the button"                                                                                | family; `implement-now`                                 | component contract; browser/visual proof             |
| Required accessible action label                                                         | [Anatomy and content](./DESIGN.md#anatomy-and-content), [Accessibility](./DESIGN.md#accessibility)                                                                                     | Every FAB instance requires an accessible name describing its action; FAB has no visible label anatomy | required `label` prop, mapped directly to the host `aria-label` attribute                                | `direct`: global ARIA attribute reflection                                                                                                                      | family; `implement-now`                                 | component contract; browser accessibility-tree proof |
| Native click and keyboard (Space/Enter) activation                                       | [States and behavior](./DESIGN.md#states-and-behavior), [Accessibility](./DESIGN.md#accessibility)                                                                                     | Required operability for the selected default                                                          | `click(event: MouseEvent)` emit, forwarded unchanged                                                     | `direct`: renderer's internal native button semantics                                                                                                           | m3e; `implement-now`                                    | browser keyboard/pointer proof                       |
| Disabled state                                                                           | [States and behavior](./DESIGN.md#states-and-behavior), [Accessibility](./DESIGN.md#accessibility)                                                                                     | Official guidance forbids disabling a FAB; no disabled token set is published                          | none — no `disabled` prop                                                                                | `direct` in renderer (`disabled`/`disabled-interactive` exist) but never exposed                                                                                | family; `blocked` by official guidance, not implemented | absence from API; host-attribute rejection proof     |
| Extended anatomy (`extended`, label slot)                                                | [Identity and purpose](./DESIGN.md#identity-and-purpose)                                                                                                                               | Belongs to the separate Extended FAB family                                                            | none                                                                                                     | `direct` in renderer, deliberately not exposed                                                                                                                  | family; `not-applicable` (out of family scope)          | absence from API                                     |
| Lowered elevation                                                                        | [States and behavior](./DESIGN.md#states-and-behavior), [Source conflicts and unknowns](./DESIGN.md#source-conflicts-and-unknowns)                                                     | Official source does not resolve when it applies                                                       | none                                                                                                     | `direct` in renderer (`lowered` attribute exists), not selected                                                                                                 | family; `source-conflict`                               | absence from API                                     |
| Link (`href`/`download`/`target`/`rel`) and form (`name`/`value`/`type=submit`) behavior | not part of FAB's documented anatomy/states                                                                                                                                            | No confirmed scenario                                                                                  | none                                                                                                     | `direct` in renderer (`LinkButtonMixin`/`FormSubmitterMixin`), not selected                                                                                     | family; `defer`                                         | absence from API                                     |
| Web hover/focus tooltip                                                                  | [Anatomy and content](./DESIGN.md#anatomy-and-content)                                                                                                                                 | Documented "should" guidance; no ready Tooltip Material dependency exists                              | none                                                                                                     | `not-applicable`: no current family composes it                                                                                                                 | product/future architecture; `defer`                    | absence from API                                     |
| Hover/focus/press state layer, elevation transitions, shape, motion                      | [States and behavior](./DESIGN.md#states-and-behavior), [Geometry and layout](./DESIGN.md#geometry-and-layout)                                                                         | Required observable behavior of the selected default                                                   | none; renderer-owned                                                                                     | `direct`                                                                                                                                                        | m3e; `implement-now`                                    | browser/visual proof                                 |

All classifications derive from [Variants and configurations](./DESIGN.md#variants-and-configurations), [Anatomy and content](./DESIGN.md#anatomy-and-content), [Geometry and layout](./DESIGN.md#geometry-and-layout), [States and behavior](./DESIGN.md#states-and-behavior), [Accessibility](./DESIGN.md#accessibility), and [Source conflicts and unknowns](./DESIGN.md#source-conflicts-and-unknowns).

## Dependency closure

Dependency families: `none`.

- Material foundation supplies `--md-sys-color-*`/`--md-sys-shape-*`/`--md-sys-elevation-*`/`--md-sys-state-*`, which the installed renderer is expected to consume directly for its default FAB coloring, shape, elevation, and state-layer opacity (to be confirmed against the installed renderer's core token bundle during implementation, following the same verification method already used for Switch); foundation is not an official component-family dependency.
- `@m3e/web/fab` (exported `M3eFabElement`, `FabVariant`, `FabSize`) is the exact installed private renderer, not a Material family dependency.
- No canonical Material family (Button, Loading Indicator, Checkbox, Switch) is composed by or required by the selected FAB default. The selected default has no loading/busy composition (unlike Button, which had a confirmed Loading Indicator demand); no current scenario requires one here.
- `FabContainer.vue` (`src/shared/ui/Button/FabContainer.vue`) is a generic shared-UI floating-placement/auto-hide wrapper, not part of the official FAB anatomy/states/behavior contract in DESIGN.md, and not a Material family. It remains outside this family's ownership; it is migration-stage inventory, not an architecture dependency.
- No canonical Material Tooltip family exists yet, so the DESIGN.md-documented hover/focus tooltip guidance cannot be composed as a dependency now (see [Non-goals](#non-goals)). This produces no dependency-queue entry because the selected default does not require it — the required `label`/`aria-label` already satisfies the accessible-name contract on its own.

The dependency queue is `none`. No dependency cycle exists.

## Ownership

- `floatingActionButton` owns the public Vue API, the required accessible-label mapping, the icon-slot passthrough, the private renderer-facing size/color constants, the host-attribute allow-list that reaches `m3e-fab` (see [Host-attribute boundary](#host-attribute-boundary)), exports, and family-owned proof.
- Product features/pages own where a FAB is placed, its click action, and any future contextual/product decision to adopt a plain FAB (none currently do). `FabContainer`-style floating placement, auto-hide, and overlay positioning remain outside this family regardless of which consumer eventually adopts `MDFab`.
- Material foundation owns the renderer-independent reference/system tokens the renderer is expected to consume for its default coloring, shape, elevation, and state-layer opacity.
- m3e owns native button behavior, private DOM/layout, state layer, ripple-equivalent press/hover geometry, elevation transitions, shape, motion, keyboard/pointer activation, and internal accessibility implementation for the parts this architecture selects.

## Public Vue API

Canonical export:

```ts
import { MDFab } from '@shared/ui/material';
```

Props:

| Prop    | Type     | Required/default | Contract                                                                                                                                                                                                                                                                                                                   |
| ------- | -------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label` | `string` | required         | The FAB's required accessible action label, for example `"Compose a new message"`, per [Accessibility](./DESIGN.md#accessibility). Maps directly to the host `aria-label`. It is **not** rendered as visible text — the FAB anatomy carries no label content; a visible label belongs to the separate Extended FAB family. |

Slots:

- `icon`: required one icon rendered as the FAB's only content. Mapped to the renderer's own default (unnamed) slot. No fallback/default content is rendered when the slot is empty; DEV-mode omission warnings follow the existing Button/legacy-FAB convention of warning rather than silently rendering an empty container.

Emits:

- `click(event: MouseEvent)`: forwards the renderer host's native click unchanged.

Refs, fallthrough, and native mapping:

- The component exposes no methods or custom `defineExpose` contract. A Vue component ref resolves through the single custom-element root; no current scenario needs it.
- Only the accepted host-attribute allow-list forwards to the single `m3e-fab` host (see [Host-attribute boundary](#host-attribute-boundary)); there is no unrestricted global-attribute or listener fallthrough.
- `label` maps to renderer `aria-label`; `variant` and `size` are adapter-owned private constants (`"primary-container"`, `"medium"`), never settable by a consumer.
- The renderer host is the semantic interactive owner. Do not add a nested native button or wrapper event synthesis.

Design basis: [Anatomy and content](./DESIGN.md#anatomy-and-content), [Variants and configurations](./DESIGN.md#variants-and-configurations), and [Accessibility](./DESIGN.md#accessibility).

## Host-attribute boundary

`MDFab`'s single root is the raw `m3e-fab` custom element with no wrapping element (required for native click/keyboard semantics and for the accessible label to reach the actual interactive element). Per `docs/component-adapter.md`'s "Host-attribute boundary" section, Vue's default automatic `$attrs`/listener fallthrough is not compatible with the accepted [Public Vue API](#public-vue-api).

Mechanism: `MDFab.vue` sets `inheritAttrs: false` and explicitly forwards only the allow-list below onto `m3e-fab`. No `v-bind="$attrs"` spread is used anywhere.

### Allowed forwarded host attributes

| Host attribute | Forwarding rule                                                      | Reason                                                                                 |
| -------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `class`        | forward, merged with the internal `md-fab` class, never replacing it | Common host customization; consumer classes must not drop adapter-owned styling hooks. |
| `style`        | forward, merged with internal styles, never replacing them           | Same merge requirement as `class`.                                                     |
| `id`           | forward as-is                                                        | Common host identity attribute.                                                        |
| `title`        | forward as-is                                                        | Common host attribute.                                                                 |
| `data-*`       | forward as-is (wildcard prefix)                                      | Common host attribute family used for test IDs and non-visual hooks.                   |

No other host attribute or listener is forwarded. This is the minimum common allow-list from `docs/component-adapter.md`; extending it (for example a future `aria-describedby`) requires confirmed consumer demand and an explicit `ARCHITECTURE.md` update.

### Explicitly adapter/renderer-owned — must not be forwarded via `$attrs`

| Attribute/listener                                           | Owner                                                  | Reason                                                                                                                                       |
| ------------------------------------------------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `aria-label`                                                 | `label` prop                                           | `label` is the required accessible-name source (see [Public Vue API](#public-vue-api)). A forwarded `aria-label` could silently override it. |
| `role`                                                       | renderer (internal native button semantics)            | Native role ownership belongs to the renderer's own accessibility implementation.                                                            |
| `tabindex`                                                   | renderer (native focus order)                          | Focus order is a native/renderer concern; no independent public control is selected.                                                         |
| `disabled`, `disabled-interactive`                           | not exposed; forbidden by official guidance            | See [Non-goals](#non-goals) — DESIGN.md's accessibility guidance forbids disabling a FAB. Must never be reachable via `$attrs`.              |
| `variant`                                                    | adapter-owned private constant (`"primary-container"`) | See [Selected and deferred Material surface](#selected-and-deferred-material-surface); no public color selection is exposed.                 |
| `size`                                                       | adapter-owned private constant (`"medium"`)            | Same rationale as `variant`.                                                                                                                 |
| `lowered`                                                    | not exposed; unresolved official source                | See [Non-goals](#non-goals) — `source-conflict`.                                                                                             |
| `extended`                                                   | not exposed; separate Extended FAB family              | See [Non-goals](#non-goals).                                                                                                                 |
| `href`, `download`, `target`, `rel`, `name`, `value`, `type` | deferred; not exposed                                  | See [Selected and deferred Material surface](#selected-and-deferred-material-surface) — link/form surface `defer`.                           |
| arbitrary DOM listeners other than `click`                   | adapter (`click` emit only)                            | Only the declared `click(event: MouseEvent)` emit/listener is honored.                                                                       |

### Proof ownership

Component contract tests (`components/floatingActionButton/MDFab.test.ts`) prove: allowed `class`/`style`/`id`/`title`/`data-*` reach `m3e-fab`; consumer `class`/`style` merge with (not replace) internal `md-fab` class/styles; `disabled`, `disabled-interactive`, `variant`, `size`, `lowered`, `extended`, link/form attributes, an unrecognized attribute, and an undeclared listener do not reach or modify the renderer; the required `label` prop maps to `aria-label`; the private `variant`/`size` constants are always `"primary-container"`/`"medium"` regardless of any attempted override; the `click` emit is unchanged.

Browser proof (the lowest faithful owner-local Storybook behavior spec) additionally demonstrates: the rendered element resolves an accessible name from `label`; native click and Space/Enter keyboard activation each dispatch exactly one `click`; undeclared dynamic inputs cannot change actual rendered custom-element state, at minimum for `disabled` and `variant`. This proof inspects the observable rendered result, not private shadow DOM.

Design basis: [Anatomy and content](./DESIGN.md#anatomy-and-content), [Accessibility](./DESIGN.md#accessibility), and `docs/component-adapter.md` "Host-attribute boundary".

## Public token contract

No component-specific `--md-comp-fab-*` token is selected. No current consumer overrides any FAB color, geometry, or state value; the selected default renders the plain medium/primary-container appearance. Per `docs/component-tokens.md`'s "Selecting a public component token" criteria, a token is added only when a confirmed current scenario requires the rendered part/state (criterion 3) — no such scenario exists today.

Implementation must confirm (installed-artifact inspection, following the same method already used for Switch) that the renderer's default medium/primary-container FAB coloring, shape, elevation, and state-layer opacity resolve from Mioframe's already-public `--md-sys-color-*`/`--md-sys-shape-*`/`--md-sys-elevation-*`/`--md-sys-state-*` foundation tokens without requiring a family-owned mapping file for correct default rendering. If that confirmation instead reveals a resolution gap for the selected default (for example an unmapped resting color), architecture must be revised before implementation proceeds, per `docs/component-tokens.md`.

If a future contextual override scenario is confirmed, it requires a new architecture revision and a `docs/component-tokens.md`-compliant state/part/fallback trace, following the Button Snackbar-token and Switch precedents.

No `components/floatingActionButton/tokens.css` file is created by this architecture.

## Renderer mapping and gaps

Installed renderer: `@m3e/web@2.6.3`, package entry point `@m3e/web/fab`, exported `M3eFabElement`, `FabVariant`, `FabSize`.

| Selected contract                                                           | Coverage         | Mapping or gap owner                                                                                                                                                                             |
| --------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Medium size, primary container color                                        | `direct`         | Adapter-owned private constants `size="medium"` `variant="primary-container"`, constrained by exported `FabSize`/`FabVariant` types; these already match the renderer's own documented defaults. |
| Required icon                                                               | `direct`         | Renderer's own default (unnamed) slot, documented as "Renders the icon of the button"; wrapper exposes it as a named `icon` slot for Vue-side clarity.                                           |
| Required accessible label                                                   | `direct`         | Global `aria-label` attribute reflection, set from the `label` prop.                                                                                                                             |
| Native click, keyboard (Space/Enter) activation                             | `direct`         | Renderer's internal native `<button>`-equivalent semantics (`@fires click`); no wrapper-owned keyboard handling.                                                                                 |
| Disabled state                                                              | `not-applicable` | Renderer exposes `disabled`/`disabled-interactive`, but official guidance forbids disabling a FAB; deliberately never mapped or forwarded.                                                       |
| Extended anatomy, lowered elevation, link/form fields, other sizes/colors   | `not-applicable` | Deferred/out-of-scope public surface even though the renderer exposes it (see [Selected and deferred Material surface](#selected-and-deferred-material-surface)).                                |
| Hover/focus/press state layer, elevation transitions, shape, reduced motion | `direct`         | Renderer-owned; browser/visual proof confirms observable selected behavior for the medium/primary-container default only.                                                                        |

No confirmed FAB renderer defect requires a new `M3E-*` record at this stage. Implementation must revalidate this during its own renderer-boundary and browser-proof passes, consistent with `docs/m3e-defects.md` lifecycle rules.

## State precedence and restoration

The selected default has no controlled renderer-backed mutable state. There is exactly one supported interaction posture (enabled); no `disabled`, `loading`, or `selected`-style prop exists to define precedence over. `label` and the `icon` slot are static composition inputs: every reactive update to `label` updates the rendered `aria-label`, and the `icon` slot's content is whatever the consumer currently provides. Hover, focus, and press are entirely renderer-owned and require no wrapper-owned precedence, restoration, or state duplication.

## Implementation passes

1. Create `components/floatingActionButton/MDFab.vue`, import `M3eFabElement` from `@m3e/web/fab` for private typed mapping, register `m3e-fab` in `config/vueCustomElements.ts`, and add `components/floatingActionButton/index.ts` plus the root `@shared/ui/material` barrel export. Keep one semantic renderer host and package-derived types, following the Button/Switch pattern.
2. Implement the host-attribute boundary: `inheritAttrs: false`, explicit forwarding of exactly the allow-list in [Host-attribute boundary](#host-attribute-boundary), merged `class`/`style`, and complete rejection of every undeclared attribute/listener (including `disabled`, `disabled-interactive`, `variant`, `size`, `lowered`, `extended`, and link/form attributes).
3. Map the required `label` prop to the renderer's `aria-label`; set the private constants `variant="primary-container"` and `size="medium"`; render the `icon` slot into the renderer's default slot; forward the renderer's `click` event unchanged. Add a DEV-mode warning when the `icon` slot is empty, mirroring the legacy `MDFab`'s existing warning convention.
4. Confirm (installed-artifact inspection) that the renderer's medium/primary-container default coloring, shape, elevation, and state-layer opacity resolve from Mioframe's public foundation tokens without requiring a family token file; if a gap is found, return `Required return stage: architecture` per `docs/component-adapter.md`'s implementation contract rather than adding an undocumented mapping.
5. Write component-contract proof (`MDFab.test.ts`) for props/defaults, required `label`, icon-slot rendering and DEV warning, host-attribute allow-list/rejection matrix, private-constant immutability, and `click` forwarding.
6. Write owner-local browser proof (`MDFab.browser.spec.ts`, per `docs/testing/migration-plan.md`'s current owner-local authorization for a new Material family) for accessible-name resolution, native click and Space/Enter activation each producing exactly one `click`, and host-attribute-boundary rejection at the actual rendered element.
7. Add `MDFab.stories.ts` covering exactly the selected single default (label + icon), following `docs/testing/storybook.md` conventions; no size/color Controls matrix, since none is exposed.
8. Add owner-local visual proof (`MDFab.visual.spec.ts`, per `docs/testing/migration-plan.md`'s current owner-local authorization) for the stable medium/primary-container appearance across resting/hover/focus/pressed and light/dark, if a canonical light/dark story seam is available; otherwise document the gap for a follow-up rather than fabricating unsupported coverage.
9. Write `IMPLEMENTATION.md` with exact files, proof, focused verify results, and architecture deviations. Deviations must be `none` before migration.

Expected implementation-stage files are limited to FAB runtime/types/exports, FAB component/story/browser/visual proof and mappings at the owner-local location, `config/vueCustomElements.ts` registration, renderer-boundary tests when mismatched, and `IMPLEMENTATION.md`. No `tokens.css` or `docs/token-api.md` change is expected unless the token-resolution confirmation in pass 4 finds a gap. No product consumer migration occurs in this stage — there is no current consumer to migrate.

## TEST IMPACT

- Contract/scenario: public props/defaults, required `label` mapped to `aria-label`, icon-slot rendering and empty-slot DEV warning, private `variant`/`size` constant immutability, host-attribute boundary allow-list/rejection (including `disabled`/`disabled-interactive`/`lowered`/`extended`/link/form attributes), `click` forwarding, and renderer privacy.
  - Primary proof owner: `components/floatingActionButton/MDFab.test.ts` component contract tests.
  - Additional proof: type-check and renderer-boundary tests.
  - Existing proof: none for the canonical family; the legacy `src/shared/ui/Button/MDFab.test.ts` is unrelated legacy-component proof and is not authority for the canonical contract.
  - New/updated proof: complete new coverage per the contract list above.
  - Risk/platform matrix: Vue custom-element property versus attribute behavior under Chromium for `aria-label`/`variant`/`size`.
  - Persistent impact metadata: unit/component lane owns family source, types, and exports.
- Contract/scenario: native click and keyboard (Space/Enter) activation each producing exactly one `click`; accessible name resolution from `label`; host-attribute-boundary rejection at the actual rendered element.
  - Primary proof owner: owner-local `components/floatingActionButton/MDFab.browser.spec.ts`, per `docs/testing/storybook.md`/`docs/testing/migration-plan.md`'s current owner-local authorization for ordinary component/family-owned browser contracts on a new Material family.
  - Additional proof: none currently required; no product/form scenario exists to require app E2E.
  - Existing proof: none for the canonical family.
  - New/updated proof: complete new coverage.
  - Risk/platform matrix: Desktop Chromium and Mobile Chrome; keyboard and pointer paths remain distinct.
  - Persistent impact metadata: owner-local colocated selection under `src/shared/ui/material/components/floatingActionButton/`; no central registry mapping.
- Contract/scenario: stable appearance for the single medium/primary-container default across resting/hover/focus/pressed and light/dark.
  - Primary proof owner: owner-local `components/floatingActionButton/MDFab.visual.spec.ts`, per `docs/testing/migration-plan.md`'s current owner-local authorization for a new Material family.
  - Additional proof: manual visual/motion acceptance (external defect-reporting channel).
  - Existing proof: none for the canonical family.
  - New/updated proof: complete new baseline(s) after inspecting expected/actual/diff.
  - Risk/platform matrix: configured desktop/mobile/theme projects; animation disabled only where the visual lane requires deterministic pixels.
  - Persistent impact metadata: mappings must include every changed family/story source and no spec paths as source prefixes.
- Contract/scenario: no-consumer explicit proof — the selected default is a library-only scenario with no current product consumer.
  - Primary proof owner: migration-stage explicit no-consumer record in `MIGRATION.md`, per the proof-ownership rule that migration owns "product scenarios or explicit no-consumer proof."
  - Additional proof: none.
  - Existing proof: none.
  - New/updated proof: an explicit statement (not a fabricated product integration) that no current consumer exists and why the library-only default remains complete and correct.
  - Risk/platform matrix: none.
  - Persistent impact metadata: none.

Implementation runs only verifier-managed focused checks for its owned files and scenarios. Review independently evaluates the complete refreshed chain without running the final gate. After a current successful independent review, the outer `material-component` orchestrator exclusively selects and runs the one final read-only workflow verification gate; no stage artifact may require that gate as a prerequisite to review completion.

## Migration plan

1. Confirm (repeat the architecture-stage grep across `src/pages`, `src/widgets`, `src/features`, `src/entities`) that no product consumer of the plain FAB exists at migration time. If one has appeared since architecture, return `Required return stage: architecture` rather than silently expanding scope.
2. Inventory the legacy plain `MDFab` (`src/shared/ui/Button/MDFab.vue`, `MDFab.test.ts`, `MDFab.stories.ts`) and confirm it still has zero product consumers (only its own test/story reference it, per [Current scenarios](#current-scenarios)). Because nothing consumes it, it is dead legacy ownership, not a component with scenarios to preserve; remove it and its test/story once the canonical `MDFab` exists, rather than leaving two parallel unused FAB implementations.
3. Audit `docs/testing/migration-plan.md`'s Stage S2-D historical record, which describes `MDFab`-only browser contracts having moved to `src/shared/ui/Button/LegacyButton.browser.spec.ts`. Remove the now-obsolete legacy `MDFab` assertions from that spec when the legacy component is removed in step 2; do not leave stale assertions referencing a deleted component.
4. Leave `FabContainer.vue`, `MDExtendedFab`, and `RepoExplorerPane.vue`'s current Extended FAB usage untouched — none of them are in this family's scope (see [Dependency closure](#dependency-closure) and [Non-goals](#non-goals)).
5. Since no product consumer adopts the canonical `MDFab`, write `MIGRATION.md` with the explicit no-consumer record required by [TEST IMPACT](#test-impact), the legacy-removal inventory and result, and confirmation that `RepoExplorerPane`'s Extended FAB scenario is unaffected. Do not fabricate a product integration merely to have a "migrated consumer."

## Acceptance criteria

- `MDFab` exposes exactly the accepted Vue API (`label` prop, `icon` slot, `click` emit), always renders as medium/primary-container, and leaks no m3e vocabulary.
- The rendered FAB has an accessible name sourced from `label`, renders the consumer's icon, and responds to native click and Space/Enter keyboard activation.
- No `disabled` affordance exists or is reachable through any input; `variant`/`size` cannot be overridden by a consumer.
- No public `--md-comp-fab-*` token exists; default coloring/shape/elevation/state-layer resolve entirely from Mioframe's public foundation tokens, confirmed by installed-artifact inspection.
- `MDFab.vue` sets `inheritAttrs: false` and contains no unrestricted `v-bind="$attrs"`; exactly the accepted host-attribute allow-list (see [Host-attribute boundary](#host-attribute-boundary)) is forwarded to `m3e-fab`, with `class`/`style` merged rather than replaced.
- The legacy plain `MDFab` and its test/story no longer exist after migration, and no stale legacy-`MDFab` assertion remains in `LegacyButton.browser.spec.ts` or the testing migration-plan record.
- `RepoExplorerPane.vue`'s current Extended FAB scenario is unchanged.
- Component, real-browser, and visual proofs agree for the single selected default; `MIGRATION.md` records an explicit, honest no-consumer statement rather than a fabricated integration; no concrete operator-reported visual/motion defect remains unresolved before review completion. Final workflow verification is a post-review outer-orchestrator gate and is not an architecture, implementation, migration, or review acceptance prerequisite.

## Risks

- Zero current product demand means the entire family is proof-and-library-only; future product adoption may reveal a real scenario needing a size/color/link/form surface this architecture explicitly deferred, requiring a fresh architecture revision rather than an implementation-stage workaround.
- The `lowered` elevation subset's applicability is an unresolved official-source gap; if a future scenario appears to need it, DESIGN.md and this architecture must be revisited rather than guessed.
- The installed renderer's token resolution for the selected default is asserted by analogy to Switch's confirmed pattern but not yet independently confirmed for FAB; implementation pass 4 must verify this before proceeding.
- Removing the legacy plain `MDFab` touches a historical Stage S2-D testing-migration-plan record; migration must update that record accurately rather than leaving a dangling reference to a deleted component.
- Official Web Expressive availability is listed as "Unavailable" for this family in the platform table, while the installed renderer is nonetheless the general (non-Expressive) Web `@m3e/web` package already used by every other current family; browser/visual proof must validate observable parity for the selected subset, consistent with the same accepted risk already recorded in Button's and Switch's architectures.

## Forbidden

- Expose `disabled`, `disabled-interactive`, `lowered`, `extended`, link/form renderer vocabulary, or any non-default size/color, or add renderer capability for symmetry.
- Add a component token without a confirmed contextual override scenario.
- Add host pseudo-class timing/shape overrides, wrapper press state, ripple/state-layer clones, shadow-DOM access, descendant cascades, `!important`, or timing hacks.
- Fabricate a product consumer or contextual scenario merely to avoid recording an explicit no-consumer migration result.
- Implement the Extended FAB or FAB menu contract inside this family, or migrate `MDExtendedFab`/`FabContainer` as part of this workflow.
- Implement the hover/focus tooltip guidance without a ready canonical Tooltip Material dependency and a revised architecture.
- Use unrestricted `v-bind="$attrs"` fallthrough, omit `inheritAttrs: false` on the single `m3e-fab` root, or forward any attribute or listener outside the accepted [Host-attribute boundary](#host-attribute-boundary) allow-list.
- Introduce a generic wrapper, adapter base class, registry, schema, directive, or composable framework to implement host-attribute filtering; keep it local to `MDFab.vue`, per `src/shared/ui/material/AGENTS.md`.
- Treat unit tests, stories, host custom properties, snapshots, green verification, or implementation evidence as substitutes for rendered-anatomy proof or as proof of subjective visual/motion quality.

## Implementation readiness

Ready. The FAB design is current and complete; the confirmed no-consumer state, the selected single official default, deferred surface, dependency closure (none), public API, host-attribute boundary, token contract (none selected), renderer mapping, gap ownership, deterministic passes, proof ownership, migration inventory (including legacy `MDFab` removal), acceptance criteria, risks, and forbidden approaches are resolved. No coding decision remains open.
