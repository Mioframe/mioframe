# Loading indicator implementation

Artifact revision: 2026-08-01T10:40:52.428Z
Status: complete
ARCHITECTURE.md reference: `src/shared/ui/material/components/loadingIndicator/ARCHITECTURE.md`
ARCHITECTURE.md revision: 2026-08-01T10:28:43.915Z
Revision summary: Revalidated the complete canonical implementation and focused proof against the corrected architecture contract.
Remaining blockers: none
Required return family: none
Required return stage: none
Architecture deviations: none
Migration readiness: ready

## Implemented passes

1. Audited `MDLoadingIndicator.vue`, package-derived renderer declaration, selected custom-element registration, family/root exports, and the selected public token; the runtime implementation already matched the accepted architecture.
2. Revalidated the explicit host boundary: `inheritAttrs: false`; render-time projection of only `class`, `style`, `id`, `title`, `data-*`, `aria-hidden`, and `aria-describedby`; merged family/consumer class and style; and adapter-owned geometry precedence.
3. Revalidated M3E-001 and M3E-002 against the installed `@m3e/web@2.6.3` exported type and built artifact. The documented active-size input remains unread, the effective private input remains `--m3e-loading-indicator-size`, and the uncontained host remains coupled to active size.
4. Audited component-contract, Storybook behavior/accessibility, token, visual, renderer-boundary, and persistent impact proof. Added focused coverage for valid-size restoration after non-finite input, protected private-size precedence, and rejected `tabindex`; changed the browser listener check to ordinary pointer input.
5. Audited `MDButton` read-only. It continues to supply the required label, size 24, `aria-hidden="true"`, and `currentColor` through the public family token without changing Button interaction or disabled ownership.
6. Recorded the current architecture revision and focused implementation-stage verification in this artifact.

## Public API implemented

- Root-exported `MDLoadingIndicator` with required `label: string` and optional `size?: number` defaulting to 48.
- Finite size values clamp to 24-240; non-finite values normalize to 48 with a development warning; later valid updates restore their exact normalized geometry.
- One uncontained renderer host, no slots, emits, exposed methods, variants, values, disabled/loading state, or operation-state ownership.
- `label` is the sole `aria-label` source. Undeclared attributes and listeners are dropped; only the architecture-selected positive allow-list is projected.

## Tokens and renderer mappings

- `--md-comp-loading-indicator-active-indicator-color` is family-owned, defaults to `var(--md-sys-color-primary)`, and maps privately to `--m3e-loading-indicator-active-indicator-color`.
- Public overall size owns explicit host width and height. The private effective active-size input receives the normalized size at the official 38/48 ratio.
- Consumer style may override the public color token, but cannot override adapter-owned width, height, or `--m3e-loading-indicator-size`.
- M3E-001 and M3E-002 remain exact-version-gated, family-local, removable workarounds for 2.6.3; no private renderer DOM or animation ownership is acquired.

## Dependencies

- Official component-family dependencies: none.
- Material foundation supplies the primary-color fallback.
- `@m3e/web/loading-indicator` remains the private renderer integration and package-derived type source.
- Button is a read-only parent composition consumer, not a Loading indicator dependency.

## Component-owned proof

- `MDLoadingIndicator.test.ts` proves required labeling, default/valid/bounded/non-finite sizing, 38/48 mapping, valid restoration, development warnings, exact allow-list projection and lifecycle, class/style union, protected geometry precedence, public-token pass-through, label precedence, and rejection of raw variant/contained/role/value-ARIA/tabindex/unknown/listener inputs.
- Button component proof confirms the hidden redundant child semantic node, 24 px geometry, busy parent semantics, icon restoration, and separate disabled ownership.
- Storybook behavior proves the named progressbar, public host boxes, standalone/default/contextual token results, legacy-surface isolation, and dynamic forbidden-input/listener rejection in Chromium using public browser interaction.
- Package-derived type-check, token catalogue tests, renderer-boundary ownership, and exact installed artifact inspection cover renderer integration and M3E-001/M3E-002.
- The visual lane passed all 219 current baselines, including the three Loading indicator references and Button composition. The expected Loading indicator size, color, and legacy-surface images were inspected; a passing run emitted no actual/diff artifacts and no baseline was updated.
- Canonical visual stories: `material-3-components-loading-indicator-mdloadingindicator--size-matrix`, `material-3-components-loading-indicator-mdloadingindicator--color-contract`, and the Button-owned legacy/loading composition stories. Current scenarios covered: standalone sizes, primary/contextual colors, legacy isolation, and Button composition. Automated visual baseline: passed. Material/renderer differences requiring review: M3E-001/M3E-002 remain active. Operator visual status: no-reported-defect.

## Stage verification

- `pnpm verify --only unit-tests --files src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.vue src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.test.ts src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.test.ts src/shared/ui/material/foundation/tokens.test.ts` — passed (Loading indicator, Button composition, and token catalogue tests).
- `pnpm verify --only eslint --files src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.test.ts tests/e2e/storybook/md-loading-indicator.spec.ts` — passed.
- `pnpm verify --only format --files src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.test.ts tests/e2e/storybook/md-loading-indicator.spec.ts` — passed.
- `pnpm verify --only format --files src/shared/ui/material/components/loadingIndicator/IMPLEMENTATION.md` — passed.
- `pnpm verify --only type-check` — passed.
- `pnpm verify --only storybook-behavior --files src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.vue src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.stories.ts tests/e2e/storybook/md-loading-indicator.spec.ts` — passed, 5/5.
- `pnpm verify --only visual --files src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.vue src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.stories.ts tests/e2e/visual/shared-ui/md-loading-indicator.spec.ts src/shared/ui/material/components/button/MDButton.vue tests/e2e/visual/shared-ui/md-button.spec.ts` — passed, 219/219 through the current full-lane fallback.
- Final workflow verification was not run; it belongs to the outer Material orchestrator after migration and independent review.

## Architecture deviations

None.

## Remaining blockers

None.

## Migration readiness

Ready. The canonical family implementation and component-owned proof match architecture revision `2026-08-01T10:28:43.915Z`; Button composition crosses only the accepted public boundary, and no implementation-stage blocker or concrete visual/motion defect remains.
