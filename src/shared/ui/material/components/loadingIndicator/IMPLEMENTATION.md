# Loading indicator implementation

Artifact revision: 2026-08-18
Status: complete
ARCHITECTURE.md reference: `src/shared/ui/material/components/loadingIndicator/ARCHITECTURE.md`
ARCHITECTURE.md revision: 2026-08-14T11:46:35.000Z
Revision summary: Revalidated the installed 2.7.4 renderer baseline. M3E-001 and M3E-002 remain active. The selected public active-indicator token semantics are unchanged; the repository-wide component-token cascade correction now places its family default on `:root` in `tokens.css` and keeps the private renderer bridge in `MDLoadingIndicator.vue` CSS.
Remaining blockers: none
Required return family: none
Required return stage: none
Architecture deviations: none
Migration readiness: ready

## Implemented passes

1. Audited `MDLoadingIndicator.vue`, package-derived renderer declaration, selected custom-element registration, family/root exports, and the selected public token.
2. Revalidated the explicit host boundary: `inheritAttrs: false`; render-time projection of only `class`, `style`, `id`, `title`, `data-*`, `aria-hidden`, and `aria-describedby`; merged family/consumer class and style; and adapter-owned geometry precedence.
3. Revalidated M3E-001 and M3E-002 against the installed `@m3e/web@2.7.4` exported type and built artifact. The documented active-size input remains unread, the effective private input remains `--m3e-loading-indicator-size`, and the uncontained host remains coupled to active size.
4. Audited component-contract, Storybook behavior/accessibility, token, visual, renderer-boundary, and persistent impact proof. Added focused coverage for valid-size restoration after non-finite input, protected private-size precedence, and rejected `tabindex`; changed the browser listener check to ordinary pointer input.
5. Audited `MDButton` read-only. It continues to supply the required label, size 24, `aria-hidden="true"`, and `currentColor` through the public family token without changing Button interaction or disabled ownership.
6. Applied the repository component-token cascade correction: the public family default is declared once on `:root` in `tokens.css`, the private renderer bridge remains in scoped family implementation CSS, and `tokens.css` is loaded unscoped so contextual ancestor overrides can inherit normally.

## Public API implemented

- Root-exported `MDLoadingIndicator` with required `label: string` and optional `size?: number` defaulting to 48.
- Finite size values clamp to 24-240; non-finite values normalize to 48 with a development warning; later valid updates restore their exact normalized geometry.
- One uncontained renderer host, no slots, emits, exposed methods, variants, values, disabled/loading state, or operation-state ownership.
- `label` is the sole `aria-label` source. Undeclared attributes and listeners are dropped; only the architecture-selected positive allow-list is projected.

## Tokens and renderer mappings

- `components/loadingIndicator/tokens.css` owns `--md-comp-loading-indicator-active-indicator-color` and declares its Material default `var(--md-sys-color-primary)` on `:root`.
- `MDLoadingIndicator.vue` owns the private `--m3e-loading-indicator-active-indicator-color` bridge and consumes the public token without repeating its default.
- Public overall size owns explicit host width and height. The private effective active-size input receives the normalized size at the official 38/48 ratio.
- Consumer or composing-component CSS may contextually override the public color token. Removing that contextual declaration restores the family `:root` default. Consumers cannot override adapter-owned width, height, or `--m3e-loading-indicator-size`.
- M3E-001 and M3E-002 remain exact-version-gated, family-local, removable workarounds for 2.7.4; no private renderer DOM or animation ownership is acquired.

## Dependencies

- Official component-family dependencies: none.
- Material foundation supplies `--md-sys-color-primary`, which is referenced by the family-owned public default.
- `@m3e/web/loading-indicator` remains the private renderer integration and package-derived type source.
- Button is a read-only parent composition consumer, not a Loading indicator dependency.

## Component-owned proof

- `MDLoadingIndicator.test.ts` proves required labeling, default/valid/bounded/non-finite sizing, 38/48 mapping, valid restoration, development warnings, exact allow-list projection and lifecycle, class/style union, protected geometry precedence, public-token pass-through, label precedence, rejection of raw variant/contained/role/value-ARIA/tabindex/unknown/listener inputs, family `:root` default ownership, unscoped token-contract loading, and private renderer-bridge placement.
- Button component/browser proof confirms the hidden redundant child semantic node, 24 px geometry, busy parent semantics, icon restoration, separate disabled ownership, and the contextual `currentColor` token handoff without specificity escalation.
- Storybook behavior proves the named progressbar, public host boxes, standalone/default/contextual token results, legacy-surface isolation, and dynamic forbidden-input/listener rejection in Chromium using public browser interaction.
- Package-derived type-check, token catalogue tests, renderer-boundary ownership, and exact installed artifact inspection cover renderer integration and M3E-001/M3E-002.
- Loading Indicator visual proof and Button loading composition visual proof cover the rendered result; no baseline is changed by the cascade correction.
- Canonical visual stories: `material-3-components-loading-indicator-mdloadingindicator--size-matrix`, `material-3-components-loading-indicator-mdloadingindicator--color-contract`, and the Button-owned loading composition story. Current scenarios covered: standalone sizes, primary/contextual colors, legacy isolation, and Button composition. Automated visual baseline: passed. Material/renderer differences requiring review: M3E-001/M3E-002 remain active. Operator visual status: no-reported-defect.

## @m3e/web 2.7.4 compatibility revalidation

The installed loading-indicator artifact still reads `--m3e-loading-indicator-size` rather than its documented active-indicator input and still derives the uncontained host width from active-indicator size. The existing host geometry plus 38/48 active-size mapping remains the only required workaround. The public `label` and `size` contract, renderer ownership of animation, and Button composition boundary are unchanged. The private active-color bridge now consumes the family public token whose Material default is owned independently on `:root`; this placement change does not alter renderer semantics.

## Stage verification

- `pnpm verify --only unit-tests --files src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.vue src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.test.ts src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.test.ts src/shared/ui/material/foundation/tokens.test.ts` — passed (Loading indicator, Button composition, and token catalogue tests).
- `pnpm verify --only eslint --files src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.test.ts tests/e2e/storybook/md-loading-indicator.spec.ts` — passed.
- `pnpm verify --only format --files src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.test.ts tests/e2e/storybook/md-loading-indicator.spec.ts` — passed.
- `pnpm verify --only format --files src/shared/ui/material/components/loadingIndicator/IMPLEMENTATION.md` — passed.
- `pnpm verify --only type-check` — passed.
- `pnpm verify --only storybook-behavior --files src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.vue src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.stories.ts tests/e2e/storybook/md-loading-indicator.spec.ts` — passed, 5/5.
- `pnpm verify --only visual --files src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.vue src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.stories.ts tests/e2e/visual/shared-ui/md-loading-indicator.spec.ts src/shared/ui/material/components/button/MDButton.vue tests/e2e/visual/shared-ui/md-button.spec.ts` — passed, 219/219 through the then-current full-lane fallback.

The later cascade correction was verified through the current PR's normal `pnpm verify` handoff and exact-head CI gate; the stage commands above remain the historical implementation-stage record.

## Architecture deviations

None. Public-default/private-bridge placement follows the repository-wide cascade contract in `../../docs/component-tokens.md` and does not change the selected public token semantics.

## Remaining blockers

None.

## Migration readiness

Ready. The canonical family implementation and component-owned proof remain aligned with the selected architecture semantics; cascade/default placement additionally follows the repository-wide `docs/component-tokens.md` contract. Button composition crosses only the accepted public boundary, and no implementation-stage blocker or concrete visual/motion defect remains.
