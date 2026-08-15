# Material token architecture

## Decision

Official Material component tokens are part of the canonical family contract, not a demand-scoped customization layer.

```text
official Material token paths
        ↓
family tokens.css
        ↓
private renderer mapping
        ↓
rendered observable result
```

`@m3e/web` token names and current application overrides do not define the public token API.

## Owners

| Contract | Owner |
| --- | --- |
| Material reference/system foundations | `foundation/tokens.css` |
| Default light/dark system assignments | `foundation/theme.css` |
| Family public component tokens | `components/<family>/tokens.css` |
| Private renderer bridges/workarounds | owning component implementation/private stylesheet |
| Supported runtime token catalogue | `docs/token-api.md` |
| Application tokens | outside Material as `--app-*` |

`--m3e-*` and `--md-private-*` are never public Material API.

## Family `tokens.css`

The contract worker derives public component tokens from official Material paths for the supported official family surface.

- Preserve official family/variant/state/part/property semantics.
- Use canonical `--md-comp-*` names derived from Material rather than legacy or renderer vocabulary.
- Preserve official system/reference aliases and defaults when defined.
- Include official tokens for supported variants, parts and states even when Mioframe does not currently override them.
- Do not expose renderer variables, copy renderer defaults, or add convenience aliases.
- Do not create a TypeScript token enum, registry, DSL, JSON mirror, or second catalogue.

A source conflict or missing official value belongs in family `SOURCES.md`; do not guess.

## Foundation and theme

Foundation owns intentionally supported `--md-ref-*` and `--md-sys-*` roles. `theme.css` owns canonical light/dark assignments.

A family token may reference those foundation roles but must not duplicate their ownership.

Product theme selection/persistence and `--app-*` customization remain outside Material.

## Private renderer mapping

Implementation maps each public token through documented exact-version renderer inputs/fallbacks while keeping those details private.

For every mapping that affects a selected rendered part or state, the implementation must be able to trace:

```text
official Material token
  → public --md-comp-* token
  → private m3e input/fallback
  → rendered part/state
  → observable result
```

If the renderer fallback produces the correct result, do not duplicate it merely to create more CSS. If a public token override cannot reach the correct rendered result, that is an implementation/renderer gap rather than a reason to remove the token from the canonical contract.

## Runtime catalogue

`docs/token-api.md` lists public tokens that are actually implemented and proven at runtime.

Update catalogue entries atomically with successful implementation. The family `tokens.css` remains the executable public contract; the catalogue is the consumer-facing index.

Existing families that have not yet moved to the contract-first workflow may keep their current token records temporarily. Do not bulk-convert them in unrelated PRs.

## Verification

Token verification proves observable behavior, not merely declaration presence.

Depending on the token, use faithful browser/visual proof for:

- computed/rendered colors;
- typography values;
- shapes/radii;
- elevation where observable;
- dimensions/spacing when token-controlled;
- state-specific values for hover/focus/pressed/disabled/selected states;
- light/dark theme resolution when the token delegates to system roles.

A custom-property value on the host, source inspection, renderer mapping line, story, or screenshot alone is insufficient when the public contract concerns a different rendered part or fixed numeric result.

Do not require one test per token when several tokens share one faithfully proven mapping path. Proof should be proportional while still covering materially distinct parts, states, grammars, fallbacks, and renderer gaps.

## Renderer upgrades

Every consumed `@m3e/web` update must revalidate affected private token mappings and known renderer defects. Public Material token names do not change merely because m3e renames or reorganizes its private inputs.
