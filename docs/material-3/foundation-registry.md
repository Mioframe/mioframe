# Material foundations and styles registry

This registry is a compact migration index for shared Material domains. It does not duplicate detailed implementation contracts or audits.

## Fact ownership

- Current legacy ownership and target navigation live here.
- An implemented or actively migrated shared domain owns its detailed state in a colocated `README.md`.
- Its latest independent review lives in a colocated `AUDIT.md`.
- Component-specific findings remain in the affected family README/AUDIT.
- Historical foundation audits are evidence only, not current authority.

## Status values

- `missing` — no accepted implementation exists.
- `legacy` — implementation exists outside the canonical Material library.
- `active` — migration or correction is in progress; read the local README/AUDIT.
- `verified` — canonical shared owner, truthful documentation, independent review, and applicable verification are complete.
- `deviated` — Mioframe intentionally differs from current official guidance and documents the reason.
- `blocked` — a named evidence or ownership issue prevents progress.

## Foundations

| Official domain                   | Current owner                                                            | Canonical owner                                                                                       | Status   | Known program-level gap                                                   |
| --------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| Accessibility                     | policy and component-local behavior                                      | `material/foundations/accessibility` only when a shared runtime owner is required                     | `legacy` | consolidate only proven cross-family contracts                            |
| Adaptive design / layout          | project layout infrastructure and policy                                 | `material/foundations/adaptive-design` when migrated                                                  | `legacy` | exact official slug and shared runtime scope resolved during focused work |
| Interaction                       | `src/shared/ui/State`, state/ripple/focus utilities, system state tokens | `material/foundations/interaction`                                                                    | `legacy` | ownership, reduced-motion interaction, and representative family coverage |
| Units                             | `postcss.config.js` and shared unit variables                            | retain generic tooling; document Material-facing contract under the applicable foundation/style owner | `legacy` | future `sp` scaling and legacy `pt` removal                               |
| Target area / density policy      | component and accessibility policy                                       | local family or official shared foundation when proven                                                | `legacy` | do not create a runtime manager without current consumers                 |
| Overlay-related Material behavior | `src/shared/ui/Overlay` plus generic infrastructure                      | official foundation owner only for genuinely shared Material behavior                                 | `legacy` | keep generic overlay mechanics outside Material                           |

## Styles

| Official domain            | Current owner                                                        | Canonical owner                                                            | Status   | Known program-level gap                                                                              |
| -------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| Color                      | `src/shared/lib/md/tokens.css` and theme roles                       | `material/styles/color`                                                    | `legacy` | complete role/source documentation and app-controlled theme contract                                 |
| Elevation                  | `src/shared/lib/md/tokens.css`                                       | `material/styles/elevation`                                                | `legacy` | Button audit currently questions the universal-selector implementation's cross-family cascade impact |
| Icons                      | `src/shared/ui/Icon` and `MDSymbol`                                  | `material/styles/icons`                                                    | `legacy` | public contract and family-specific icon verification                                                |
| Motion                     | `src/shared/lib/md/tokens.css` and private Web adaptations           | `material/styles/motion`                                                   | `legacy` | validate honest official-to-Web adaptation, reduced-motion policy, and per-family consumption        |
| Shape                      | system shape tokens and component-local routes                       | `material/styles/shape`                                                    | `legacy` | exact role parity and unit consistency                                                               |
| Typography                 | `src/shared/lib/md`, `MD_TYPESCALE`, and global type-scale utilities | `material/styles/typography`                                               | `legacy` | exact source parity and future `sp` policy                                                           |
| Reference tokens / palette | `src/shared/lib/md/tokens.css`                                       | applicable `material/styles/color` and `material/styles/typography` owners | `legacy` | do not create a generic token bucket disconnected from official style ownership                      |

## Source evidence

Official source hierarchy remains policy under `source-of-truth.md`; it is not a runtime foundation directory.

Every local shared-domain README records the exact official pages and source snapshot used for its current contract.

## Update rule

When shared-domain migration starts:

1. resolve whether the official navigation places it under Foundations or Styles;
2. create the canonical official-slug directory only when implementation work begins;
3. add a truthful local README with implemented, not implemented, known issues, consumers, and verification;
4. set this registry row to `active` and link the local documentation;
5. run an independent review to create the colocated AUDIT;
6. set `verified` only after the local completion gates pass.

Do not use this registry as proof that a shared implementation is correct. Do not duplicate component-family findings here.
