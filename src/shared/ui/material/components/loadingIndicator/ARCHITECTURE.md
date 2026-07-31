# Loading indicator architecture

Status: ready  
DESIGN.md reference: `./DESIGN.md` (`Status: current`, design document date 2026-07-30)  
Design snapshot/revision: Material MCP capture `2026-07-20T16:16:49.323Z`; token artifact `dsdb-resource:raw/dsdb/2026-07-01_06-10-02/designSystems_20543ce18892f7d9_components_68895be451a51c31.json`  
Architecture date: 2026-07-31 (host-attribute boundary correction; see [Host-attribute boundary](#host-attribute-boundary))

## Goal

Provide the canonical Mioframe Vue adapter for the official Material Loading indicator as an independently usable, uncontained, indeterminate presentation for short ongoing work. Preserve its standalone semantics and geometry when a parent such as Button composes it.

The minimum complete design is a thin adapter over the installed renderer with one required accessible-purpose prop, one bounded overall-size prop, and one public active-indicator color token. The simpler alternative of exporting the raw renderer is rejected because it leaks renderer vocabulary, does not express Material overall sizing, and exposes confirmed renderer defects. Adding contained, pull-to-refresh, or progress-indicator behavior would exceed current demand.

Design basis: [Identity and purpose](./DESIGN.md#identity-and-purpose), [Variants and configurations](./DESIGN.md#variants-and-configurations), [Geometry and responsive layout](./DESIGN.md#geometry-and-responsive-layout), and [Accessibility](./DESIGN.md#accessibility).

## Non-goals

- Contained presentation, its container tokens, or overlay placement.
- Pull-to-refresh gesture, threshold, cancellation, or lifecycle ownership.
- Determinate progress, progress values, transition to determinate progress, or waits outside the official 200 ms through 5 s guidance.
- A rendered label, live-region policy, focus behavior, activation, disabled state, or operation-state ownership.
- Public renderer variants, tags, types, events, CSS variables, motion controls, shape internals, or compatibility aliases.
- Migration of Button or any product feature to use Loading indicator for provider- or browser-controlled waits.

Design basis: [Variants and configurations](./DESIGN.md#variants-and-configurations), [Behavior and motion](./DESIGN.md#behavior-and-motion), [Usage guidance](./DESIGN.md#usage-guidance), and [Accessibility](./DESIGN.md#accessibility).

## Current scenarios

1. **Standalone library presentation.** A caller renders an indeterminate Loading indicator for a real short-running process, supplies a purpose-specific accessible label, optionally selects an overall size from 24 through 240, and may contextually override the active-indicator color while preserving 3:1 contrast.
2. **Button composition.** `MDButton` renders a 24 px Loading indicator in its leading-icon position while `loading` is true, hides the redundant indicator semantics from assistive technology, preserves the accessible action label and Button-owned `aria-busy`, and overrides the public active-indicator token to `currentColor`. Button loading remains presentation-only; consumers own `disabled` and re-entry guards.
3. **Legacy-surface isolation.** A standalone Loading indicator inside a legacy Material surface retains its Material primary default instead of inheriting unrelated descendant content color.

There are no current direct product consumers of `MDLoadingIndicator`. Existing settings-test elements named `loading-indicator` are unrelated test stubs, not Material consumers.

Design basis: [Placement and composition](./DESIGN.md#placement-and-composition), [Color](./DESIGN.md#color), and [Accessibility](./DESIGN.md#accessibility).

## Selected and deferred Material surface

| Official surface                                                           | Decision        | Reason                                                                                   |
| -------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------- |
| Uncontained indeterminate Loading indicator                                | `implement-now` | Required by standalone and Button scenarios; official default configuration.             |
| Required active indicator and seven-shape renderer motion                  | `implement-now` | Core official anatomy and ongoing-process presentation; renderer owns private animation. |
| Accessible progressbar purpose label                                       | `implement-now` | Required official semantic contract for standalone use.                                  |
| Default 48 overall size, 38 active size, proportional 24-240 overall range | `implement-now` | Required by standalone sizing and Button composition.                                    |
| Uncontained active-indicator color and contextual override                 | `implement-now` | Required for standalone primary and Button `currentColor` handoff.                       |
| Contained configuration and its color, shape, and container tokens         | `defer`         | Official but no confirmed Mioframe scenario requires overlay containment.                |
| Pull-to-refresh behavior                                                   | `defer`         | Official Compose-only guidance; no current owner or scenario.                            |
| Progress indicator and indeterminate-to-determinate transition             | `defer`         | Different official family and no selected Loading indicator scenario.                    |

Design references: [Anatomy](./DESIGN.md#anatomy), [Geometry and responsive layout](./DESIGN.md#geometry-and-responsive-layout), [Complete official component-token catalogue](./DESIGN.md#complete-official-component-token-catalogue), and [Related official contracts](./DESIGN.md#related-official-contracts).

## Dependency closure

- Material foundation supplies `--md-sys-color-primary`; it is already canonical and implemented.
- `@m3e/web/loading-indicator` is a private renderer dependency, lockfile-resolved to `2.6.3`; it is not a Material family dependency.
- Button is a parent composition consumer, not a dependency of Loading indicator. Loading indicator must remain independently complete before Button composition proof is accepted.
- Progress indicator, Material shape library, tabs, and pull-to-refresh are related or composing contracts but are not required implementation dependencies for the selected surface.

Dependency queue: empty. No official component family blocks implementation.

## Ownership

- `loadingIndicator` owns the canonical Vue API, standalone semantics, overall geometry, selected public token, private renderer mapping, exact-version workarounds, exports, and standalone proof.
- `MDButton` owns whether and where Loading indicator is composed, decorative semantic suppression, Button `aria-busy`, leading-icon replacement/restoration, the `currentColor` contextual handoff, and Button interaction behavior.
- Product features own operation duration applicability, pending state, disabled and re-entry guards, status copy, errors, and completion.
- m3e owns the custom element's progressbar role, private shadow anatomy, seven-shape morph/rotation sequence, reconnect lifecycle, internal styling, and private animation implementation.
- Material foundation owns the primary system color used by the standalone default.

## Public Vue API

Canonical export:

```ts
import { MDLoadingIndicator } from '@shared/ui/material';
```

Props:

| Prop    | Type     | Required/default       | Contract                                                                                                                                                                                                                 |
| ------- | -------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `label` | `string` | required               | Accessible purpose of the ongoing process. Forward to the semantic renderer host as `aria-label`. Callers composing a decorative instance still supply the process/action label and explicitly set `aria-hidden="true"`. |
| `size`  | `number` | optional, default `48` | Overall square component size in Material dp mapped 1:1 to CSS px. Finite values clamp to 24-240. Non-finite values normalize to 48. Development builds warn when normalization occurs.                                  |

- Slots: none.
- Emits: none.
- Exposed refs or methods: none.
- Attribute fallthrough: only the accepted host-attribute allow-list forwards to the single renderer host (see [Host-attribute boundary](#host-attribute-boundary)); there is no unrestricted global-attribute or listener fallthrough. `aria-hidden` and public-token inline styles remain reachable through the allow-list; other undeclared attributes and listeners are not.
- Native semantic mapping: the installed renderer supplies `role="progressbar"`; the wrapper supplies the required accessible label.
- The API intentionally has no `variant`, `contained`, `value`, `loading`, `active`, `disabled`, or motion prop.

Design references: [Geometry and responsive layout](./DESIGN.md#geometry-and-responsive-layout) and [Accessibility](./DESIGN.md#accessibility).

## Host-attribute boundary

`MDLoadingIndicator`'s single root is the raw `m3e-loading-indicator` custom element with no wrapping element. The current adapter relies on Vue's default automatic `$attrs`/listener fallthrough (no `inheritAttrs: false`, no explicit forwarding). Per `docs/component-adapter.md`'s "Host-attribute boundary" section, that default is not compatible with the accepted [Public Vue API](#public-vue-api): today, any undeclared consumer attribute or listener (for example raw renderer `variant`, a `contained` state attribute, `role`, `aria-valuenow`/`aria-valuemin`/`aria-valuemax`, or an arbitrary DOM listener) reaches `m3e-loading-indicator` unfiltered, exposing private renderer vocabulary and letting a consumer override the `label`-owned accessible name. This section closes that gap for the `loadingIndicator` family.

Owner decision: `wrapper-correction`. This tightens ownership already recorded in [Public Vue API](#public-vue-api) (`label` as the sole `aria-label`/accessible-name source) and in the `style` computed property and its M3E-002/M3E-001 workaround comments in `MDLoadingIndicator.vue` (overall width/height and the private `--m3e-loading-indicator-size` geometry contract); it selects no new demand and changes no public prop, emit, or slot.

Mechanism: `MDLoadingIndicator.vue` must set `inheritAttrs: false` and explicitly forward only the allow-list below onto `m3e-loading-indicator`. No `v-bind="$attrs"` spread is used anywhere. The single `m3e-loading-indicator` root is unchanged — `inheritAttrs: false` plus explicit forwarding is the mechanism, not a wrapping element.

### Allowed forwarded host attributes

| Host attribute     | Forwarding rule                                                                                                                                                                                                                                                                                                                                                                                                                                             | Reason                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `class`            | forward, merged with the internal `md-loading-indicator` class, never replacing it                                                                                                                                                                                                                                                                                                                                                                          | Common host customization; consumer classes must not drop the adapter-owned styling hook.                                                                                                                                                                                                                                                                                                                      |
| `style`            | forward, merged with the internal `width`/`height`/`--m3e-loading-indicator-size` style object; internal geometry values always win over a conflicting consumer `width`, `height`, or `--m3e-loading-indicator-size` key so the M3E-001/M3E-002 workaround cannot be silently overridden; a consumer's public Material token overrides (for example `--md-comp-loading-indicator-active-indicator-color`) are on different keys and must still pass through | Same merge requirement as `class`, plus the geometry contract in [State precedence and restoration](#state-precedence-and-restoration); Button composition already relies on `--md-comp-loading-indicator-active-indicator-color: currentColor` passing through (`.md-button__loading-indicator` in `MDButton.vue`).                                                                                           |
| `id`               | forward as-is                                                                                                                                                                                                                                                                                                                                                                                                                                               | Common host identity attribute.                                                                                                                                                                                                                                                                                                                                                                                |
| `title`            | forward as-is                                                                                                                                                                                                                                                                                                                                                                                                                                               | Common host attribute.                                                                                                                                                                                                                                                                                                                                                                                         |
| `data-*`           | forward as-is (wildcard prefix)                                                                                                                                                                                                                                                                                                                                                                                                                             | Common host attribute family used for test IDs and non-visual hooks.                                                                                                                                                                                                                                                                                                                                           |
| `aria-hidden`      | forward as-is                                                                                                                                                                                                                                                                                                                                                                                                                                               | Required by [Current scenarios](#current-scenarios), item 2 and [State precedence and restoration](#state-precedence-and-restoration): Button composition sets `aria-hidden="true"` on the nested `MDLoadingIndicator` to suppress its standalone progressbar semantics while Button owns the accessible action label and `aria-busy`. This attribute must remain in the allowed list for exactly that reason. |
| `aria-describedby` | forward as-is                                                                                                                                                                                                                                                                                                                                                                                                                                               | Loading-Indicator-specific ARIA composition attribute for consumer-supplied supplementary description, consistent with the common ARIA-composition allowance used elsewhere in the Material library (for example Button's `aria-describedby`).                                                                                                                                                                 |

No other host attribute or listener is forwarded. This is the complete allow-list; it is not extended for symmetry with HTML globals or with `m3e-loading-indicator`'s exposed surface. Extending it requires confirmed consumer demand and an explicit `ARCHITECTURE.md` update, per `docs/component-adapter.md`.

### Explicitly adapter/renderer-owned — must not be forwarded via `$attrs`

| Attribute/listener                                             | Owner                                                     | Reason                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aria-label`                                                   | `label` prop                                              | `label` is the required accessible-purpose source (see [Public Vue API](#public-vue-api) props table; [Accessibility](./DESIGN.md#accessibility)). An `$attrs`-forwarded `aria-label` could silently override the accessible name the component guarantees.                                             |
| `role`                                                         | renderer (m3e progressbar role mixin)                     | Native role ownership belongs to the renderer's internal accessibility implementation, per [Accessibility and native behavior](../../docs/component-adapter.md#accessibility-and-native-behavior) and [Renderer mapping and gaps](#renderer-mapping-and-gaps).                                          |
| `aria-valuenow`, `aria-valuemin`, `aria-valuemax`              | not applicable; not exposed                               | Loading indicator is indeterminate only; value ARIA belongs to the deferred, different progress-indicator family (see [Non-goals](#non-goals) and [Selected and deferred Material surface](#selected-and-deferred-material-surface)). Must never be reachable via `$attrs`.                             |
| `tabindex`                                                     | renderer (native, not independently owned by the wrapper) | The component has no wrapper-owned focus/interaction contract; an independent `tabindex` could desynchronize from the renderer's own native behavior.                                                                                                                                                   |
| arbitrary renderer state (raw renderer `variant`, `contained`) | renderer-private; not exposed                             | `variant="uncontained"` is a private renderer default (see [Renderer mapping and gaps](#renderer-mapping-and-gaps)); the contained configuration is explicitly deferred (see [Selected and deferred Material surface](#selected-and-deferred-material-surface)). Neither may be reachable via `$attrs`. |
| arbitrary DOM listeners                                        | not exposed                                               | This component declares no public events (see [Public Vue API](#public-vue-api) Emits: none). An undeclared listener must not attach to the renderer host.                                                                                                                                              |

### Ownership decisions

- `label` remains the sole owner of `aria-label`/accessible name — no change.
- Consumer `class`/`style` must merge with (not replace) the adapter's internal `md-loading-indicator` class and the internal `width`/`height`/`--m3e-loading-indicator-size` style object already computed in `MDLoadingIndicator.vue`; internal geometry styles always win over conflicting consumer style keys for those same properties, while consumer public Material token overrides (for example `--md-comp-loading-indicator-active-indicator-color`) must still pass through, since Button composition already relies on this for `.md-button__loading-indicator { --md-comp-loading-indicator-active-indicator-color: currentColor; }`.
- Button composition may continue to set `aria-hidden="true"` on the nested `<MDLoadingIndicator>` — `aria-hidden` remains in the allowed list for exactly that reason.
- The public Vue API (`label`, `size` props) is unchanged by this correction — no new functionality is added; this is a boundary-tightening correction only.
- The single `m3e-loading-indicator` custom element remains the sole component root; `inheritAttrs: false` plus explicit allow-list forwarding is the mechanism, not a wrapping element.

### Proof ownership

Component contract tests (`components/loadingIndicator/MDLoadingIndicator.test.ts`) prove: allowed `class`/`style`/`id`/`title`/`data-*`/`aria-hidden`/`aria-describedby` reach `m3e-loading-indicator`; `aria-hidden` specifically works for Button composition; consumer styles merge with the internal width/height/`--m3e-loading-indicator-size` styles without breaking the M3E-001/M3E-002 workaround; a consumer public Material token override (`--md-comp-loading-indicator-active-indicator-color`) still reaches the host; raw renderer `variant`, a `contained` state attribute, `role` overrides, value ARIA (`aria-valuenow`/`aria-valuemin`/`aria-valuemax`), unknown attributes, and an arbitrary listener do not reach or modify the renderer; `label` remains the effective accessible-purpose source.

Browser proof (the lowest faithful Storybook behavior spec) additionally demonstrates that undeclared dynamic inputs cannot change actual rendered custom-element state, consistent with the equivalent proof selected for the button family's undeclared-input rejection. This proof inspects the observable rendered result, not private shadow DOM.

Design basis: [Accessibility](./DESIGN.md#accessibility), [Geometry and responsive layout](./DESIGN.md#geometry-and-responsive-layout), and `docs/component-adapter.md` "Host-attribute boundary".

## Public token contract

Selected token:

| Official path                                      | Public Mioframe token                                | Direct renderer input                                    | Renderer fallback                                                                                                 | Expected result                                                                                                                                                    | Proof owner                                                                                         |
| -------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `md.comp.loading-indicator.active-indicator.color` | `--md-comp-loading-indicator-active-indicator-color` | private `--m3e-loading-indicator-active-indicator-color` | `var(--md-sys-color-primary)` at the family owner; installed renderer also falls back to its primary design token | Standalone active shape resolves to Material primary; a valid contextual override changes the rendered active shape; Button composition resolves to `currentColor` | family token contract, Storybook browser color proof, visual baseline, and Button composition proof |

No size token is public: current demand needs an instance prop, and the renderer's sizing inputs are divergent. Contained color, container shape, and container size tokens remain deferred with the contained configuration.

Design references: [Color](./DESIGN.md#color) and [Complete official component-token catalogue](./DESIGN.md#complete-official-component-token-catalogue).

## Renderer mapping and gaps

Installed renderer: `@m3e/web@2.6.3`, entry point `@m3e/web/loading-indicator`, exported `M3eLoadingIndicatorElement`.

| Selected contract                                    | Coverage         | Mapping or gap owner                                                                                                                                                                                                                                |
| ---------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Uncontained indicator and seven-shape looping motion | `direct`         | Default renderer `variant="uncontained"`; do not expose the renderer variant publicly.                                                                                                                                                              |
| Progressbar role                                     | `direct`         | Renderer role mixin; browser accessibility proof required.                                                                                                                                                                                          |
| Accessible purpose label                             | `direct`         | Wrapper forwards `label` as host `aria-label`.                                                                                                                                                                                                      |
| Active-indicator color                               | `direct`         | Family public token maps privately to renderer active-indicator color input.                                                                                                                                                                        |
| Overall 48 size and 24-240 range                     | `divergent`      | `temporary-renderer-workaround`, M3E-002: wrapper sets explicit host width/height.                                                                                                                                                                  |
| Proportional 38/48 active size                       | `divergent`      | `temporary-renderer-workaround`, M3E-001 and M3E-002: wrapper computes `overall × 38 / 48` and writes the effective private `--m3e-loading-indicator-size`; the documented `--m3e-loading-indicator-active-indicator-size` is ineffective in 2.6.3. |
| Contained configuration                              | `not-applicable` | Deferred. The renderer exposes it, but renderer availability does not select public surface.                                                                                                                                                        |

The M3E-001/M3E-002 workarounds are family-local, exact-version revalidated, host-level, and removable. They do not inspect shadow DOM or recreate animation, accessibility, or private shape geometry. Revalidate both records on every renderer update.

## State precedence and restoration

- `size` normalization is deterministic: non-finite → 48; otherwise clamp to `[24, 240]`; valid values pass through.
- Overall host width and height always derive from normalized `size`; private active size always derives from normalized size at the official `38 / 48` ratio.
- A caller's public active-color token overrides the family default. Without an override, standalone color restores to `--md-sys-color-primary`.
- `aria-hidden="true"` supplied by a composing parent suppresses the child's standalone semantics; the parent remains responsible for an accessible status/action contract. This attribute reaches the host through the [Host-attribute boundary](#host-attribute-boundary) allow-list, not through unrestricted `$attrs` fallthrough.
- Mount, prop updates, disconnect, and reconnect do not create wrapper-owned animation state. The renderer owns starting, stopping, and restoring motion.

## Implementation passes

1. Audit the existing Vue adapter, renderer declaration, selected custom-element registration, exports, family token, and token catalogue against this handoff; correct only mismatches.
2. Set `inheritAttrs: false` on `MDLoadingIndicator.vue` and replace default fallthrough with explicit forwarding of exactly the [Host-attribute boundary](#host-attribute-boundary) allow-list (`class`, `style`, `id`, `title`, `data-*`, `aria-hidden`, `aria-describedby`), merging `class`/`style` with the existing internal class and `width`/`height`/`--m3e-loading-indicator-size` style object so internal geometry always wins over a conflicting consumer key.
3. Revalidate M3E-001 and M3E-002 against the installed `2.6.3` public types and artifact; update defect stage references and retain only the accepted mappings.
4. Audit component contract, Storybook behavior, visual stories/baselines, renderer-boundary checks, and impact metadata against `TEST IMPACT`, including the new host-attribute allow-list/rejection proof; add or correct proof only where missing.
5. Audit Button composition strictly as the dependency handoff consumer, confirming `aria-hidden="true"` still reaches the renderer through the allow-list and the `currentColor` token override still passes through the merged `style`; do not redesign Button or migrate product consumers.
6. Write `IMPLEMENTATION.md` with exact proof and focused verification results. Architecture deviations must be `none`.

Expected implementation-stage files are limited to the family runtime/proof files, `m3eLoadingIndicator.d.ts`, Material exports/custom-element selection if mismatched, `docs/token-api.md`, `docs/m3e-defects.md`, relevant proof/impact mappings, and `IMPLEMENTATION.md`.

## TEST IMPACT

- Contract/scenario: public label and overall-size normalization/mapping.
  - Primary proof owner: `MDLoadingIndicator.test.ts` component contract tests.
  - Additional proof: Storybook browser accessibility-tree and host bounding-box checks.
  - Existing proof: current component tests and `tests/e2e/storybook/md-loading-indicator.spec.ts`.
  - New/updated proof: only if the audit finds a missing public-state or property-update case.
  - Risk or platform matrix: real Chromium browser for custom-element semantics and geometry.
  - Persistent impact metadata: Storybook behavior mapping must include family production/story/token sources and owned support.
- Contract/scenario: [Host-attribute boundary](#host-attribute-boundary) — `inheritAttrs: false` plus explicit allow-list forwarding, unknown-attribute/listener rejection, and style merge.
  - Primary proof owner: `MDLoadingIndicator.test.ts` component contract tests.
  - Required assertions: allowed `class`/`style`/`id`/`title`/`data-*`/`aria-hidden`/`aria-describedby` reach `m3e-loading-indicator`; `aria-hidden` specifically works for the Button composition scenario; consumer styles merge with the internal width/height/`--m3e-loading-indicator-size` styles without breaking the M3E-001/M3E-002 workaround (internal geometry keys win on conflict); a consumer public Material token override (`--md-comp-loading-indicator-active-indicator-color`) still reaches the host; raw renderer `variant`, a `contained` state attribute, `role` overrides, value ARIA (`aria-valuenow`/`aria-valuemin`/`aria-valuemax`), unknown attributes, and an arbitrary listener do not reach or modify the renderer; `label` remains the effective accessible-purpose source.
  - Additional proof: the lowest faithful Storybook behavior spec (`tests/e2e/storybook/md-loading-indicator.spec.ts`) demonstrating undeclared dynamic inputs cannot change actual rendered custom-element state, consistent with the equivalent proof selected for the button family's undeclared-input rejection; this proof must not inspect private shadow DOM.
  - Existing proof: none — this is a new boundary; the current adapter has no `inheritAttrs: false` or allow-list.
  - New/updated proof: full new coverage for allow-list forwarding, style-merge precedence, and unknown attribute/listener rejection is required before implementation can be marked complete.
  - Risk or platform matrix: real Chromium browser for observable rendered custom-element state (not just host attribute snapshot).
  - Persistent impact metadata: `MDLoadingIndicator.test.ts` and the Storybook behavior mapping must both own this contract.
- Contract/scenario: standalone primary color, public override, and legacy-surface isolation.
  - Primary proof owner: Storybook browser computed-style checks at the custom-element host plus visual screenshots of the rendered active anatomy.
  - Additional proof: token declaration/catalogue agreement tests.
  - Existing proof: Loading indicator browser and visual specs, foundation token tests.
  - New/updated proof: none unless mapping or baseline drift is found; inspect expected, actual, and diff before any baseline update.
  - Risk or platform matrix: light theme and legacy Material surface; manual visual/motion acceptance remains separate.
  - Persistent impact metadata: visual and Storybook behavior mappings must own the family and relevant Button composition story.
- Contract/scenario: Button composition uses decorative semantics via the `aria-hidden` allow-list entry, 24 px geometry, `currentColor` passed through the merged `style`, and leaves activation blocking to consumers.
  - Primary proof owner: Button component contract and Storybook behavior tests.
  - Additional proof: Button visual baseline for composed appearance.
  - Existing proof: `MDButton.test.ts`, `md-button-family.spec.ts`, and `md-button.spec.ts`.
  - New/updated proof: confirm `aria-hidden="true"` and the `--md-comp-loading-indicator-active-indicator-color: currentColor` override still reach the renderer host after `inheritAttrs: false` is introduced; otherwise none unless the audit finds a handoff gap.
  - Risk or platform matrix: mouse/keyboard/native Button behavior remains Button-owned; Loading indicator motion requires operator acceptance.
  - Persistent impact metadata: Button-owned mappings remain authoritative for the parent scenario.
- Contract/scenario: renderer boundary and exact-version workaround containment.
  - Primary proof owner: renderer-boundary/type-check tests plus defect record inspection.
  - Additional proof: component mapping assertions and browser host geometry.
  - Existing proof: renderer boundary tests, package-derived declaration, M3E-001/M3E-002.
  - New/updated proof: defect artifact references must point to current stage artifacts.
  - Risk or platform matrix: installed `@m3e/web@2.6.3`; revalidate on dependency update.
  - Persistent impact metadata: no new Playwright spec is expected; preserve existing owning mappings.

Focused implementation feedback uses verify-managed unit, type-check, Storybook behavior, and visual lanes for changed files. Migration owns the single final current-head gate, expected to be `pnpm verify --base origin/develop` because this family work does not change release-sensitive configuration.

## Migration plan

1. Inventory all direct and indirect imports, raw renderer usage, tokens, and similarly named non-Material test stubs.
2. Audit every current Loading Indicator consumer, including `MDButton`'s internal composition, against the exact [Host-attribute boundary](#host-attribute-boundary) allow-list (`class`, `style`, `id`, `title`, `data-*`, `aria-hidden`, `aria-describedby`). Confirm each consumer's actual usage fits inside the allow-list before the family can be marked migrated/complete; no consumer should be changed merely to preserve unsupported renderer access (raw `variant`, `contained`, `role`, value ARIA, or arbitrary listeners) that the boundary now removes.
3. Confirm `MDButton` consumes the canonical family-local public API and public token only; record its decorative semantic and color/geometry handoff, including that its `aria-hidden="true"` and `currentColor` override continue to reach the renderer solely through the allow-list.
4. Confirm no product consumer directly uses Loading indicator and that provider/browser waits continue to use feature-owned pending text, disabled guards, and live status rather than misleading short-wait Loading indicator presentation.
5. Confirm no raw `m3e-loading-indicator`, renderer type, or private renderer token exists outside `src/shared/ui/material`.
6. Remove only obsolete Loading-indicator-specific legacy ownership if found; leave unrelated generic loading UI and test stubs unchanged.
7. Run the one final read-only current-head verification gate and write `MIGRATION.md`. Record operator visual/motion acceptance as required rather than fabricating it.

## Acceptance criteria

- Standalone `MDLoadingIndicator` exposes only the accepted Vue API and root export.
- `MDLoadingIndicator.vue` sets `inheritAttrs: false`; no unrestricted `v-bind="$attrs"` spread exists anywhere in the component.
- Exactly the [Host-attribute boundary](#host-attribute-boundary) allow-list (`class`, `style`, `id`, `title`, `data-*`, `aria-hidden`, `aria-describedby`) is forwarded to `m3e-loading-indicator`; no other attribute or listener can reach the renderer host.
- An unknown attribute or listener cannot activate private m3e capabilities (raw `variant`, `contained` state, `role`, value ARIA, or arbitrary events).
- Browser semantics resolve to a named progressbar unless a composing parent explicitly hides the child via the allowed `aria-hidden`.
- Overall geometry is 48 by default, clamps to 24-240, and retains the 38/48 active-size relationship without renderer vocabulary leaking publicly.
- Standalone color resolves to Material primary, a public override is effective, and Button composition resolves the same token to `currentColor` through the merged `style`.
- The renderer owns internal anatomy and motion; M3E-001/M3E-002 remain exact, local, and removable, and the merged consumer `style` cannot override their internal geometry keys.
- Button composition preserves its own semantics, interaction, disabled/re-entry ownership, and icon restoration; its `aria-hidden="true"` handoff continues to work through the allow-list.
- No current consumer or failure path is lost, no raw renderer detail leaks, proof and impact metadata agree, and final verification passes.
- Public API is unchanged by this correction; no visual or motion behavior intentionally changes.
- Standalone and Button-composed appearance/motion receive explicit operator acceptance before the family is review-complete.

## Risks

- The installed renderer documents a size input it does not consume and couples uncontained host size to active size; an upgrade may invalidate either workaround.
- Material publishes no exact motion parameters, while m3e supplies its own implementation; automated tests can prove lifecycle/presence and stable pixels, not subjective Material motion quality.
- Composing parents can create inadequate contrast with `currentColor`; the parent owns the contextual 3:1 contrast check.
- A Loading indicator misapplied to long or externally suspended activity would communicate the wrong official duration semantics; feature owners must select it only for bounded short work.

## Forbidden

- Expose m3e variants, element types, tags, attributes, events, CSS variables, or private animation state.
- Use unrestricted `v-bind="$attrs"` fallthrough, a generic wrapper/adapter framework, or a broader allow-list than the one selected above without confirmed consumer demand and an explicit `ARCHITECTURE.md` update.
- Let a consumer-supplied `class` or `style` replace (rather than merge with) the internal `md-loading-indicator` class or the internal width/height/`--m3e-loading-indicator-size` style object.
- Inspect or style renderer shadow DOM, recreate its shapes/motion, or add timing hacks.
- Add contained, pull-to-refresh, determinate, disabled, or operation-state API without a new architecture revision.
- Treat `loading` as activation blocking or move feature pending/error state into this family.
- Cascade descendant color rules, add `!important`, or publish private renderer aliases.
- Change Button architecture, migrate unrelated consumers, or treat snapshots/green verification as operator motion acceptance.

## Implementation readiness

Ready. The current design is complete and current; selected demand, dependencies, public API, token, renderer mappings, gap owners, the [Host-attribute boundary](#host-attribute-boundary) allow-list and its Button-composition handoff, implementation passes, migration inventory, proof ownership, acceptance criteria, and forbidden approaches are resolved. No coding decision remains open.
