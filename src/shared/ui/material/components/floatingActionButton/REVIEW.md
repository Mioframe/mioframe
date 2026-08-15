# Floating action button review

Verdict: compliant
Required return family: none
Required return stage: none
Completion status: complete
Final workflow verification readiness: ready
Operator visual status: no-reported-defect
Blockers: none
Major issues: none
Minor issues: none
Accepted risks: none

## Goal and scenarios reviewed

Reviewed the complete selected canonical `MDFab` family: a no-consumer, icon-only medium FAB in the primary-container style, with a required accessible action label and ordinary native activation. The separately owned `MDExtendedFab`/`FabContainer` product scenario was reviewed only to confirm it is not a canonical FAB consumer.

## Official design compliance

`DESIGN.md` is current and complete for the selected scope. The implementation retains the official medium geometry (80dp square with a 28dp icon), icon-only anatomy, primary-container default, named action, and enabled-only availability policy. Deferred sizes, colors, lowered elevation, Extended FAB, FAB menu, placement, and transform behavior remain outside the confirmed scenario.

## Architecture compliance

The minimum library-only API remains `label`, the named `icon` slot, and `click`, with a narrow generic host-attribute allow-list and no public FAB token surface. Exact lockfile-resolved `@m3e/web@2.7.4` evidence confirms the `m3e-fab` default icon slot, `click`, `medium`/`primary-container` defaults, and the available deferred renderer inputs. Its installed public artifact styles a direct default-slot SVG at `1em`; the family browser proof independently confirms the selected 80px host and 28px SVG result. This makes the direct decorative SVG mapping compliant for the selected observable contract without a renderer-icon dependency or private DOM access.

## Implementation compliance

`MDFab.vue` is one typed `m3e-fab` host with explicit medium/primary-container values, `inheritAttrs: false`, label-owned `aria-label`, native click forwarding, direct icon projection, and local allow-list filtering. Renderer imports, element typing, custom-element registration, and private terminology remain inside the Material boundary. The implementation introduces no wrapper, workaround, public renderer input, controlled state, or duplicated renderer interaction behavior.

## Migration and legacy removal

Current source inventory finds no canonical `MDFab`, raw `m3e-fab`, or FAB renderer-token use in product layers. The root Material export is the only external family reference. The former plain `src/shared/ui/Button/MDFab.*` owner is absent. `RepoExplorerPane` continues to use the separate legacy `MDExtendedFab` through `FabContainer`; it is not a migration target for this family.

## Proof and stage verification

The colocated component contract, owner-local Storybook behavior, and owner-local visual proof match the current executable migration policy. Independent focused verification passed:

- `pnpm verify --only unit-tests --files src/shared/ui/material/components/floatingActionButton/MDFab.test.ts`
- `pnpm verify --only type-check`
- `pnpm verify --files src/shared/ui/material/components/floatingActionButton/MDFab.stories.ts --profile local --only storybook-build`
- `pnpm verify --only storybook-behavior --files src/shared/ui/material/components/floatingActionButton/MDFab.browser.spec.ts`
- `pnpm verify --files src/shared/ui/material/components/floatingActionButton/MDFab.visual.spec.ts --profile local --only visual`

The browser lane covers visible-SVG pointer pass-through, Enter/Space activation, numeric geometry, and dynamic rejected renderer inputs. The visual baselines are bounded to the selected resting, hover, focus, and pressed appearances; they were inspected as appearance evidence only. No operator visual or motion defect was reported.

## Blockers

None.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

No product consumer, compatibility alias, public token, alternate size/color, disabled path, Extended FAB/FAB menu surface, form/link behavior, or renderer workaround is required for the accepted no-consumer scenario.

## Routing evidence

The exact installed renderer public documentation, manifest, declarations, and artifact behavior agree with the selected adapter mapping and its real-browser proof. No Material family defect or stale migration fact remains; no correction route is required.
