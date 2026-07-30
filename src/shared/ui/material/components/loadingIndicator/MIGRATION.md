# Loading indicator migration

Status: complete  
DESIGN.md reference: `./DESIGN.md` (`Status: current`, design document date 2026-07-30)  
ARCHITECTURE.md reference: `./ARCHITECTURE.md` (`Status: ready`, architecture date 2026-07-30)  
IMPLEMENTATION.md reference: `./IMPLEMENTATION.md` (`Status: complete`)  
Migration workspace state: current Loading Indicator consumers, composition boundary, legacy ownership, proof, and project verification evidence inspected.

## Consumer inventory

| Consumer path                                           | Previous/canonical owner                                       | Contract and preserved behavior                                                                                                                                                                                                                                              | Proof owner                                                        | Result                                                  |
| ------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------- |
| `src/shared/ui/material/components/button/MDButton.vue` | Already canonical `MDLoadingIndicator` family-local public API | A 24 px decorative indicator replaces the leading icon while Button is loading; Button retains action label, `aria-busy`, native behavior, click emission, and icon restoration; public color token resolves to `currentColor`; consumers retain disabled/re-entry ownership | Button component contract, Storybook behavior, and visual baseline | confirmed current; no migration edit required           |
| Standalone Storybook family stories                     | Canonical `MDLoadingIndicator`                                 | Named progressbar, 24-48 size examples, primary default, explicit public override                                                                                                                                                                                            | Loading Indicator browser and visual specs                         | confirmed current; library proof, not product migration |
| Legacy Material surface composition story               | Canonical `MDLoadingIndicator`                                 | Standalone primary remains isolated from legacy surface descendant color                                                                                                                                                                                                     | Loading Indicator browser and visual specs                         | confirmed current; library proof, not product migration |

Workspace inspection found no direct product import of `MDLoadingIndicator`, no raw renderer Loading Indicator outside permitted Material/config/test owners, and no private Loading Indicator renderer token outside the family. Settings test stubs using `data-testid="loading-indicator"` are unrelated generic fixtures and remain unchanged.

## Migrated consumers

- No product source required editing.
- `MDButton` already used the canonical family API and was revalidated as the sole current parent composition consumer.
- Existing external-recovery and provider-wait flows remain on feature-owned pending text, disabled guards, re-entry protection, and status semantics. They are intentionally not migrated because their duration and lifecycle do not establish the selected bounded short-wait contract.

## Preserved scenarios and failure paths

- Standalone accessible purpose labeling and progressbar semantics.
- Default, explicit, clamped, and non-finite overall sizing.
- Material-primary standalone color, contextual public override, and legacy-surface isolation.
- Button decorative child semantics, 24 px geometry, `currentColor`, `aria-busy`, leading-icon replacement/restoration, native interaction, and consumer-owned disabling.
- Provider/browser wait failure, cancellation, and retry behavior remains feature-owned and unchanged because those flows are not Loading Indicator consumers.

## Legacy ownership removed

None. The inventory found no Loading Indicator legacy adapter, duplicate export, public renderer alias, consumer-owned private renderer token, or replaced product UI requiring removal.

## Proof completed

- Focused component-contract verification passed for Loading Indicator and Button.
- Type-check passed against the installed package-derived renderer declaration.
- Focused Storybook behavior verification passed for accessibility, host geometry, public color, and legacy-surface isolation.
- The managed visual lane passed all selected checks with existing Loading Indicator and Button baselines unchanged.
- Workspace inspection confirmed renderer imports, tags, types, and private tokens remain within permitted Material/config/test owners.

## Final verification

The required project verification passed for the resulting Loading Indicator workspace state on 2026-07-30.

## Remaining migration blockers

None. Operator visual/motion acceptance remains an independent review gate and does not require further consumer migration.

## Review readiness

Ready. Consumer inventory, no-op migration result, preserved scenarios, legacy-removal audit, proof, and final project verification are complete.
