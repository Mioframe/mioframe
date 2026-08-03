# Loading indicator migration

Artifact revision: 2026-08-01T10:45:24.478Z
Status: complete
IMPLEMENTATION.md reference: `src/shared/ui/material/components/loadingIndicator/IMPLEMENTATION.md`
IMPLEMENTATION.md revision: 2026-08-01T10:40:52.428Z
Revision summary: Revalidated the complete audit-only consumer migration and focused proof against the corrected implementation revision.
Remaining blockers: none
Required return family: none
Required return stage: none
Review readiness: ready

## Consumer inventory

The migration preflight used ready architecture revision `2026-08-01T10:28:43.915Z` and complete implementation revision `2026-08-01T10:40:52.428Z` as its deterministic authoring source. Its goal was to audit approved consumers, preserve their product and accessibility ownership, remove replaced Loading-indicator-specific ownership if present, and prove the materially distinct consumer path. Component redesign, new product adoption, unrelated loading UI, independent review, and final workflow verification were non-goals.

The minimum migration is an audit-only adoption pass; creating a product consumer or compatibility layer would add ownership without satisfying another current scenario.

| Path                                                                                                                | Role and current API                                                                                                                                                                                            | Migration result                            |
| ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `src/shared/ui/material/components/button/MDButton.vue`                                                             | Sole parent composition consumer. Imports the public family entry, passes required `label`, size 24, `aria-hidden="true"`, and a class whose scoped style sets the public active-color token to `currentColor`. | Already canonical; no source edit required. |
| `src/shared/ui/material/components/button/MDButton.stories.ts`                                                      | Button loading behavior and contextual appearance fixtures; also contains a standalone library comparison.                                                                                                      | Proof fixture only; no migration required.  |
| `src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.stories.ts` and `MDLoadingIndicator.test.ts` | Family-owned positive and negative contract proof, including intentionally rejected attributes/listeners.                                                                                                       | Not consumers; unchanged.                   |
| `src/widgets/SettingsSections/SettingsSections.test.ts` and `SettingsCheckboxListItem.test.ts`                      | Plain HTML test stubs named `loading-indicator`.                                                                                                                                                                | Unrelated non-Material test UI; unchanged.  |

Repository-wide symbol and renderer-vocabulary searches found no direct product consumer under `src/app`, `src/pages`, `src/widgets` production code, `src/features`, or `src/entities`. Outside the canonical Material boundary there is no raw `m3e-loading-indicator`, renderer type/import, or private `--m3e-loading-indicator-*` token consumer. Configuration and proof references to the selected custom element remain Material integration infrastructure, not application consumers.

## Migrated consumers

No consumer source required editing. `MDButton` already crosses only the accepted public family boundary:

- Button owns loading selection, placement, the named interactive control, `aria-busy`, icon replacement/restoration, activation, `disabled`, and consumer re-entry behavior.
- Loading indicator receives only its required accessible-purpose `label`, the architecture-selected 24 px size, explicit redundant-node suppression, and the public contextual color token.
- The child visual continues to represent real ongoing short indeterminate activity even though its redundant accessibility node is hidden by the composing parent.

No product feature was migrated to Loading indicator, and no unsupported renderer input was preserved through an alias or fallthrough path.

## Preserved scenarios and failure paths

- Standalone library presentation remains available through the root-exported `MDLoadingIndicator` API with required labeling, bounded sizing, Material-primary default color, and supported contextual color override.
- Button loading remains presentation-only. The Button stays named and busy, the child progressbar is absent from the accessibility tree, the indicator remains 24 px, the leading icon restores after loading, and loading alone does not block activation.
- Explicit Button `disabled` continues to own activation blocking independently of loading.
- Legacy-surface isolation and Button `currentColor` composition remain family/Button visual contracts already covered by their canonical stories and baselines.
- Provider- or browser-controlled waits retain feature-owned pending text, live-status semantics, errors, cancellation/retry behavior, disabled conflict guards, and re-entry protection because none of those flows consumes this family.
- Work below 200 ms, beyond 5 s, or becoming determinate remains outside this family and must use the product-selected status/progress owner.

## Legacy ownership removed

Not applicable. The inventory found no Loading-indicator-specific legacy adapter, duplicate public export, product-owned renderer token, raw renderer consumer, or replaced product UI. Unrelated generic loading test stubs remain in place. No compatibility alias was added.

## Consumer and blast-radius proof

TEST IMPACT

- Contract/scenario: Button composition handoff and independent loading/disabled ownership.
  - Primary proof owner: `src/shared/ui/material/components/button/MDButton.test.ts`.
  - Additional proof: `tests/e2e/storybook/md-button-family.spec.ts` in the reusable Storybook behavior lane; existing Button visual baselines own composed pixels.
  - Existing proof: child semantic suppression, 24 px geometry, parent `aria-busy`, icon restoration, activation while loading, explicit disabled blocking, and contextual active color.
  - New/updated proof: none; the existing proof fully covers this audit-only migration.
  - Risk or platform matrix: real Chromium is required for accessibility-tree, actionability, and computed contextual-color outcomes; no product routing, persistence, provider, overlay, or mobile-specific behavior changed.
  - Persistent impact metadata: existing Button source/story-to-Storybook behavior and visual mappings remain accurate; no mapping changed.
- Contract/scenario: absence of renderer leakage and obsolete Loading-indicator ownership.
  - Primary proof owner: `src/shared/ui/material/rendererBoundary.test.ts` plus workspace inventory.
  - Additional proof: package-derived type-check remains implementation-owned; no new migration type surface was introduced.
  - Existing proof: renderer boundary rules and the Loading indicator component contract reject unsupported raw inputs.
  - New/updated proof: none.
  - Risk or platform matrix: static boundary and component-contract proof are faithful; private renderer motion remains outside consumer ownership.
  - Persistent impact metadata: static imports already select the owning unit tests; no metadata changed.

Focused proof completed:

- `pnpm verify --only unit-tests --files src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.test.ts src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.vue src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.test.ts src/shared/ui/material/rendererBoundary.test.ts` — passed.
- `pnpm verify --only storybook-behavior --files src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.stories.ts tests/e2e/storybook/md-button-family.spec.ts` — passed, including the selected Storybook infrastructure smoke scenario.

Canonical visual stories: `material-3-components-buttons-mdbutton--loading-indicator-presentation`, `material-3-components-buttons-mdbutton--legacy-surface-color-ownership`, `material-3-components-loading-indicator-mdloadingindicator--size-matrix`, and `material-3-components-loading-indicator-mdloadingindicator--color-contract`.
Current scenarios covered: standalone size/color/legacy isolation and Button loading composition.
Automated visual baseline: passed in the referenced implementation-stage proof; no baseline changed in migration.
Material/renderer differences requiring review: exact-version M3E-001 and M3E-002 remain active and family-local.
Operator visual status: no-reported-defect.

## Stage verification

Migration-scoped unit and Storybook browser checks passed with the exact commands recorded above. `pnpm verify --only format --files src/shared/ui/material/components/loadingIndicator/MIGRATION.md` also passed after formatting this artifact. No production, story, test, baseline, or impact-metadata file required migration changes. The final workflow verification was not run because it belongs to the outer orchestrator after independent review.

## Remaining blockers

None.

## Review readiness

Ready. The sole approved composition consumer uses the canonical public family contract, product and Button ownership remain intact, no renderer detail leaks into application consumers, no legacy Loading-indicator owner requires removal, focused consumer proof passes, and no concrete visual or motion defect has been reported.
