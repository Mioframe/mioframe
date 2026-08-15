# Floating action button architecture

Status: ready
DESIGN.md reference: `src/shared/ui/material/components/floatingActionButton/DESIGN.md`
Renderer revision: @m3e/web@2.7.4
Revision summary: Select the standalone medium primary-container FAB with one decorative inline SVG icon and resolve its exact renderer composition contract.
Remaining blockers: none
Required return family: none
Required return stage: none
Implementation readiness: ready
Dependency families: none
Dependency queue: none

## Goal

Provide `MDFab` as the canonical, library-only Material FAB default: an icon-only medium FAB in the primary-container color, with a required accessible action label and normal native activation. Its public icon role has one valid representation: one decorative inline SVG that is the direct light-DOM child of the adapter's icon slot.

## Non-goals

- Product placement, scroll persistence, action availability, tooltip composition, routing, or action state.
- Extended FAB, FAB menu, label content, multiple actions, tab-transition motion, or container transforms.
- Size, color, lowered-elevation, disabled, link, form, or public token configuration.
- A canonical icon family, raw renderer icon element, generic adapter, CSS compatibility layer, or renderer workaround.

## Current scenarios

There is no current product consumer of canonical `MDFab`. The approved no-consumer scenario is its official standalone default: a host supplies an action label, one decorative SVG icon, and a click handler.

When the product action is unavailable, its owner omits the FAB before rendering; it never passes a disabled state. `RepoExplorerPane` uses the separate legacy `MDExtendedFab` through `FabContainer`, which remains outside this family.

An empty or non-conforming icon slot is invalid caller input. In development the adapter warns for a missing or non-SVG direct icon root; it does not synthesize a glyph, wrap text, or fall back to another component. Production keeps the supplied slot unchanged, so callers must meet the documented slot contract.

## Selected and deferred Material surface

| Material contract                                              | DESIGN.md evidence                                                                          | Decision                      | Observable result                                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------- |
| Medium size, primary-container color, icon-only anatomy        | Identity and purpose; Anatomy and content; Variants and configurations; Geometry and layout | implement-now                 | One 80dp square FAB with a 28dp icon and no visible label.                               |
| Required accessible action label and native activation         | Accessibility                                                                               | implement-now                 | `label` supplies the button's accessible name; click, Enter, and Space activate it.      |
| Hover, focus, pressed elevation/state-layer feedback           | States and behavior                                                                         | implement-now, renderer-owned | The fixed default retains renderer-owned interaction feedback with no public state prop. |
| Small, regular, large sizes; non-default colors; surface color | Variants and configurations                                                                 | defer                         | No current scenario needs an alternative visual configuration.                           |
| Disabled state                                                 | States and behavior; Accessibility                                                          | defer                         | The product omits an unavailable action rather than rendering a disabled FAB.            |
| Lowered elevation                                              | States and behavior; Source conflicts and unknowns                                          | defer                         | Official applicability is unresolved and no scenario selects it.                         |
| Extended FAB, FAB menu, tooltip, morph/scroll behavior         | Related official contracts; Usage guidance                                                  | defer / separate family       | No adjacent component or product behavior is absorbed here.                              |
| Link and form behavior exposed by the renderer                 | Not part of the selected official standalone default                                        | defer                         | The adapter remains an action surface, not a navigation or submission control.           |

## Dependency closure

Dependency families: none. The selected icon is a caller-owned inline SVG, not a Material component dependency. Exact `@m3e/web@2.7.4` documentation describes the default FAB slot as the icon role, and the installed public artifact explicitly sizes a direct slotted SVG; a canonical icon wrapper is therefore unnecessary.

The foundation remains the existing owner of system color, elevation, shape, focus, and theme-mode values. It is established shared infrastructure, not a family dependency or queue entry. The active path is `floatingActionButton`, so no dependency cycle exists.

## Ownership

| Concern                                                                                                           | Owner                         | Decision                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------- |
| Public Vue contract, icon validation, host-attribute filtering, private renderer typing, family stories and proof | `floatingActionButton` family | implement-now                                                   |
| Action availability, placement, click effect, product state, and whether to mount the FAB                         | Product consumer              | retained outside Material                                       |
| SVG glyph artwork                                                                                                 | Caller                        | supplies one decorative inline SVG through the public icon role |
| System theme roles and supported foundation tokens                                                                | Material foundation           | consume existing defaults only                                  |
| Layout, focus ring, state layer, ripple, elevation, keyboard behavior, and transient motion                       | `@m3e/web`                    | consume; do not recreate or inspect private DOM                 |

No confirmed renderer divergence applies to the selected default. `docs/m3e-defects.md` needs no FAB record and no workaround is authorized.

## Public Vue API

`MDFab` exposes exactly:

| Surface         | Contract                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label: string` | Required. The full action name; mapped explicitly to the actual action host's `aria-label`. It is not visible label content.                                                                                                                                                                                                                                                                                |
| `#icon` slot    | Required. Renders exactly one direct inline `<svg>` root with a `viewBox`, no `slot` attribute, decorative accessibility (`aria-hidden="true"` and no focusable/interactable descendant), and paint based on `currentColor`. The SVG may be supplied inline or by a Vue helper whose rendered root is that SVG. Text nodes, wrappers, renderer custom elements, images, and visible labels are unsupported. |
| `@click`        | Forwards the native `MouseEvent` unchanged after ordinary renderer activation.                                                                                                                                                                                                                                                                                                                              |
| Host attributes | Only `class`, `style`, `id`, `title`, and `data-*` are forwarded. `class`/`style` merge with the family-owned host values. They are generic HTML forwarding, not a supported Material size, color, or renderer-token API.                                                                                                                                                                                   |

The single raw renderer host uses `inheritAttrs: false`. It pins private `medium` and `primary-container` values and rejects every other fallthrough attribute and listener, including `aria-label`, disabled/interactivity, extended/lowered, size/variant, link, form, and arbitrary renderer inputs. The explicit `label` binding wins over all caller input. There is no default slot, additional emit, `v-model`, or component-ref/expose contract.

## Public token contract

No `--md-comp-fab-*` token is selected. There is no confirmed contextual customization scenario, so no family `tokens.css` or `docs/token-api.md` entry is introduced.

The selected default consumes renderer defaults backed by existing foundation roles only:

| DESIGN.md official path                                                 | Public Mioframe token | Renderer input and fallback                                                                            | Expected result                                                 | Proof owner                   |
| ----------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ----------------------------- |
| `md.comp.fab.medium.container.height`, `.width`, `.icon.size`, `.shape` | none                  | private fixed `medium` mapping; installed fallback is 80px container, 28px icon, large-increased shape | 80dp square and 28dp SVG icon                                   | family browser + visual proof |
| `md.comp.fab.primary-container.container.color`, `.icon.color`          | none                  | private fixed `primary-container` mapping and renderer system-role fallback                            | primary-container resting surface and on-primary-container icon | family visual proof           |
| `md.comp.fab.primary-container.hovered.*`, `.focused.*`, `.pressed.*`   | none                  | renderer-owned state-layer, elevation, and color fallbacks                                             | official transient feedback for the fixed default               | family visual proof           |

All other official FAB tokens remain complete in `DESIGN.md` and are deferred rather than mirrored as public CSS.

## Renderer mapping and gaps

| Material/public role                                                      | Exact-version evidence and private mapping                                                                                                                                                                                                                                                                                                                         | Status | Owner and proof                                                           |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------- |
| FAB action host                                                           | Shipped `FabElement.d.ts`/custom-elements manifest documents `m3e-fab`, `size`, `variant`, native `click`, and button semantics. The adapter imports `@m3e/web/fab` and constrains its private mapping with exported FAB types.                                                                                                                                    | direct | family contract and browser proof                                         |
| Medium primary-container default                                          | `@m3e/web@2.7.4` defaults and the installed `fab.js` size/variant tables give `medium` an 80px fallback container and 28px icon sizing, and `primary-container` the matching system-role fallback. The adapter sets both private values explicitly.                                                                                                                | direct | family browser geometry and visual proof                                  |
| Icon content                                                              | The shipped API documents the default slot as the icon role and shows icon-only usage. Its installed public stylesheet applies the icon font size to that slot and gives `::slotted(svg:not([slot]))` `width`/`height: 1em`. A direct SVG using `currentColor` therefore receives the 28px size and renderer-owned color handoff without a renderer child element. | direct | family contract proof, browser numeric geometry, canonical visual stories |
| Accessible action name                                                    | The adapter explicitly writes `label` to host `aria-label`; the renderer keeps the icon slot decorative.                                                                                                                                                                                                                                                           | direct | browser role/name proof                                                   |
| Click, keyboard activation, focus, state layer, ripple, elevation, motion | The renderer owns native interaction and transient rendering. The adapter only forwards the resulting `click`; it adds no state, listeners, timers, or shadow access.                                                                                                                                                                                              | direct | browser activation proof and visual state proof                           |

Bare text was previously used in fixtures but is not equivalent to the selected SVG content contract: it receives font sizing but not the SVG width/height handoff. It is unsupported, not a fallback. There are no `partial`, `divergent`, or `missing` selected mappings.

## State precedence and restoration

There is no public controlled renderer-backed state and no `v-model`; accepted/rejected controlled-intent timelines are therefore not applicable.

| Situation                                        | Precedence and outcome                                                                                                                                    | Restoration                                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Initial render and every parent update           | Family constants win: medium, primary-container, icon-only, enabled, ordinary action behavior. Rejected attributes/listeners cannot alter renderer state. | Constants are written on every render.                                                               |
| Accessible name                                  | Required `label` wins. The icon is decorative and cannot contribute a competing name.                                                                     | Updating `label` updates only the host accessible name.                                              |
| Pointer hover/press or keyboard focus/activation | Renderer owns transient feedback and native event delivery. On native click, Vue emits the same event; neither owner stores an optimistic state.          | Renderer restores its own transient state on release/blur; the adapter does not reassert or time it. |
| Action unavailable                               | Product omits `MDFab`; the family exposes no disabled or disabled-interactive path.                                                                       | A later product render may mount a new enabled instance.                                             |

## Implementation passes

1. Keep `MDFab.vue` as one `m3e-fab` host with package-derived private typing, explicit medium/primary-container constants, `inheritAttrs: false`, explicit `label`/`click`, and local allow-list filtering. Do not add a wrapper or a generic adapter helper.
2. Tighten the icon-slot TSDoc and development validation to require one rendered SVG root. Warn for missing, text, wrapped, custom-element, or otherwise non-SVG slot content; do not transform invalid content or create an icon fallback.
3. Keep the icon slot projected directly to the renderer default slot. Do not render `m3e-icon`, create an `MDIcon` dependency, wrap the SVG, set a renderer CSS variable publicly, or inspect shadow DOM.
4. Update every selected Storybook fixture (`Default`, `VisualStates`, `BehaviorContracts`, `HostAttributeBoundary`, `GeometryContract`, and `RealInteractionFeedback`) to use the same decorative direct-SVG add glyph. A story-local SVG-root helper is allowed; its rendered root must be the slotted SVG. Refresh only the FAB-owned visual baselines after inspecting the expected icon-composition diff.
5. Update `MDFab.test.ts` to prove the SVG slot contract and development warnings, while retaining label mapping, click forwarding, fixed private values, and host allow-list/rejection coverage.
6. Keep `MDFab.browser.spec.ts` owner-local. Against the same direct-SVG fixture, prove accessible role/name, native click, Enter/Space activation, rejected dynamic fallthrough, a public 80px by 80px host box, and a 28px by 28px SVG box at the configured 1:1 CSS-pixel environment. Do not query private renderer parts. The rounded base has no independent public numeric box; canonical visual proof owns its rendered shape.
7. Keep `MDFab.visual.spec.ts` owner-local and screenshot only the SVG-backed resting, hover, focus, and pressed appearance. It must not carry keyboard, geometry, or computed-style success criteria.
8. Keep tokens private/default-backed. If exact-version inspection or browser proof finds a real selected-default divergence, stop implementation, add the required `M3E-*` record, and return to architecture rather than adding an unrecorded workaround.

## TEST IMPACT

| Contract                                                                                                                   | Primary proof owner                                | Required proof and current executable placement                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public props, named icon slot, DEV invalid-content warning, click emit, fixed private values, and host forwarding boundary | `MDFab.test.ts`                                    | Colocated component-contract tests. Include the SVG positive path and bare-text negative warning.                                                                                       |
| Accessible name; pointer, Enter, and Space activation; rejected dynamic renderer attributes; public numeric geometry       | `MDFab.browser.spec.ts`                            | Owner-local Storybook browser spec is executable for this canonical Material family. Use real input and no screenshots; test the 80px host and 28px direct SVG from one valid fixture.  |
| Fixed default appearance and renderer-owned hover/focus/pressed feedback                                                   | `MDFab.visual.spec.ts` and its colocated snapshots | Canonical SVG-backed stories tagged `visual`; screenshot only. Owner-local visual proof is authorized for a canonical Material family migration under the current mixed-discovery plan. |
| Story buildability                                                                                                         | `MDFab.stories.ts`                                 | Verifier-managed `storybook-build` for changed stories.                                                                                                                                 |
| Package-derived private mapping                                                                                            | family type-check and focused component proof      | Verify the exact `@m3e/web/fab` import/types and no renderer vocabulary outside the family.                                                                                             |
| No-consumer scenario, legacy removal, and product blast radius                                                             | `MIGRATION.md`                                     | Fresh migration inventory; no fabricated product E2E or consumer.                                                                                                                       |

Implementation uses the smallest verifier-managed focused checks selected for these files. Browser behavior and visual lanes remain independent; a visual baseline does not replace numeric geometry proof.

## Migration plan

1. Inventory `src/pages`, `src/widgets`, `src/features`, and `src/entities` for canonical `MDFab` imports before migration. The current inventory is none; a new consumer requires a fresh architecture pass before adoption.
2. Reconfirm the legacy plain `src/shared/ui/Button/MDFab.vue`, its test/story, barrel export, and legacy-only FAB proof remain absent. Do not add a compatibility alias.
3. Preserve `FabContainer`, legacy `MDExtendedFab`, `RepoExplorerPane`, and their proof unchanged; they are separate ownership.
4. No legacy-to-canonical semantic translation exists because there is no consumer. Consequently there is no old capability/configuration/current-state fallback to map.
5. Keep the surviving canonical family browser/visual proof at the final owner-local path; do not restore central legacy FAB proof.

## Acceptance criteria

- `MDFab` exposes only `label`, the constrained `icon` slot, `click`, and the explicit generic host allow-list.
- Every selected story and proof fixture uses one decorative direct SVG, never bare text or a renderer element.
- The browser proves the same valid composition is an 80px by 80px medium FAB with a 28px by 28px SVG icon, alongside accessible native activation.
- Visual proof covers the resulting SVG-backed default and renderer-owned transient feedback without replacing browser contracts.
- The fixed default cannot be changed to disabled, extended, lowered, link/form, another size, or another color through public props or rejected attributes/listeners; generic `class`/`style` forwarding remains unsupported as a Material customization API.
- No public FAB component token, renderer workaround, dependency, consumer migration, or legacy alias is introduced.

## Risks

- There is no product demand, so future adoption may need a different size/color/placement/action contract and must restart architecture rather than widen this adapter ad hoc.
- Official Material does not explain when lowered elevation applies; it remains unavailable.
- Web Expressive is unavailable in the official platform record. The selected general Web renderer mapping remains subject to browser and visual proof.
- A future `@m3e/web` revision must revalidate the direct-SVG sizing/color handoff and fixed geometry before retaining the `direct` classification.

## Forbidden

- Bare text, wrapped content, images, a raw `m3e-icon`, or label content in the selected icon slot.
- Disabled, disabled-interactive, extended, lowered, size/color, link, form, tooltip, FAB-menu, or transform API expansion without a fresh architecture.
- Renderer-private attributes, events, types, CSS variables, shadow DOM, state copies, timing repairs, descendant cascades, or `!important` outside the family.
- A public token, compatibility alias, icon framework, adapter framework, product consumer, or migration work invented for completeness.
- Browser assertions in visual specs, screenshots in browser specs, or treating either as a substitute for the other.

## Implementation readiness

Ready. The current design, no-consumer scenario, direct SVG composition, public boundary, renderer mapping, token decision, proof ownership, and migration disposition are fully resolved. Implementation must make the existing code and canonical fixtures conform to this architecture, then independent review decides completion.
