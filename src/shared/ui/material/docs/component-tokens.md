# Material token architecture

## Decision

`src/shared/ui/material` owns the Material token contract consumed by the application and canonical `MD*` adapters.

```text
application theme selection and overrides
  → Material foundation and theme tokens
  → selected component-family tokens
  → private m3e renderer mappings
```

The physical declaration owner must match the semantic owner.

| Contract                                                | Canonical runtime owner          | Public status                                      |
| ------------------------------------------------------- | -------------------------------- | -------------------------------------------------- |
| Material reference/system foundations                   | `foundation/tokens.css`          | public when declared and catalogued                |
| Default palette and light/dark system-color assignments | `foundation/theme.css`           | public theme contract when declared and catalogued |
| Selected official component tokens                      | `components/<family>/tokens.css` | public for that family                             |
| Owner-local renderer mappings and bridges               | owning foundation/family         | private                                            |
| Approved application tokens (`--app-*`)                 | outside `src/shared/ui/material` | application API, not Material API                  |
| Public token catalogue                                  | `docs/token-api.md`              | consumer-facing documentation                      |

`--m3e-*` variables are private renderer inputs. `--md-private-*` variables are owner-local implementation details. Neither namespace belongs in the public catalogue.

## Availability states

An official Material token is:

- `supported` — declared by its canonical owner, catalogued, mapped where required, and verified;
- `deferred` — official but not selected now; recorded only in the relevant family matrix;
- `private` — renderer or implementation detail;
- `not-material` — project customization requiring an application or explicitly approved extension owner.

Existence in Material documentation or m3e does not make a token part of Mioframe public API.

## Foundation and theme ownership

`foundation/tokens.css` owns intentionally supported renderer-independent reference/system roles, including applicable shape, typography, motion, elevation, state, and other shared foundations.

`foundation/theme.css` owns the standard theme:

- reference palette values used by that theme;
- default light system-color assignments;
- dark system-color assignments.

A public token has one semantic declaration owner. Theme-specific values may override a theme-owned role inside `theme.css`; do not duplicate a foundation-owned role in theme merely to reorder equivalent CSS or preserve a no-op legacy declaration.

Application theme selection, persistence, and product-specific tokens remain outside Material.

## Component-family ownership

Each family owns only the selected official `--md-comp-<family>-*` subset required by current scenarios.

```text
components/button/tokens.css
  → selected --md-comp-button-* declarations
  → private mapping to documented --m3e-button-* inputs
```

A family must not:

- define another family’s tokens;
- mirror the complete Material component-token catalogue;
- mirror all renderer variables;
- use a global component-token file as a second owner;
- expose renderer token names to consumers.

A parent uses a dependency’s public props, slots, inherited color, or supported official component tokens. It must not set dependency-private renderer inputs.

## Effect of using m3e

Using m3e removes the need to reproduce every Material component default in Mioframe CSS.

Mioframe still owns:

1. supported foundation and theme contracts;
2. selected public component-token API;
3. explicit Material-to-m3e mappings where the renderer does not already consume the correct role;
4. removable, documented workarounds for confirmed renderer divergences.

Do not copy m3e defaults merely to present a complete-looking public API.

## Selecting a public component token

A public `--md-comp-*` token must satisfy all conditions:

1. official path and semantics are verified;
2. a current consumer, theme, or selected component scenario requires it;
3. it has one family owner and meaningful runtime default/fallback;
4. its mapping to rendered behavior is implemented and verified;
5. it is listed in `token-api.md`.

Current need selects an official token; it does not invent one.

When no official token exists, choose one explicit result:

- use a supported system role;
- keep renderer configuration private;
- use an approved application token outside Material;
- assign a confirmed renderer defect to m3e;
- leave the customization unsupported.

## Mapping and CSS grammar

```text
supported official Material token
  → canonical --md-ref-* / --md-sys-* / --md-comp-* declaration
  → documented semantically equivalent renderer input when required
```

For every selected token:

- preserve official family/variant/state/part/property semantics;
- keep one canonical declaration owner;
- prefer direct system-role consumption when m3e already uses the correct role;
- keep component mappings inside the owning family;
- prefer documented renderer inputs;
- treat an undocumented effective input as an exact-version workaround under `component-adapter.md`;
- do not expose m3e names through props, exports, examples, or consumer CSS.

Semantic equality is not sufficient when consumers accept different CSS grammars. Verify the chosen representation against every selected current consumer. Prefer one shared foundation representation when it preserves meaning and works everywhere; otherwise keep conversion private to the owning adapter. Visible grammar changes require browser proof.

## Public catalogue

`docs/token-api.md` is the complete human-facing index of supported tokens. Each entry records:

- exact name and semantic purpose;
- CSS grammar;
- canonical default or source;
- scope and owner;
- official Material source;
- renderer mapping when applicable;
- representative verification.

Executable CSS remains the runtime source. Catalogue and declaration change together. Absence from `token-api.md` means the token is not a supported Mioframe public API.

Do not create a TypeScript token enum, token DSL, or duplicate runtime registry.

## Legacy migration invariant

The former mixed-owner token file must not be recreated. Any legacy migration must inventory declarations and consumers, move retained tokens to semantic owners, remove invalid/unused/application-owned entries from Material, update the single global import, populate `token-api.md`, delete the legacy source without an alias, and leave no duplicate public declaration owner.

## Verification

Verify only the selected supported public surface:

- official source and semantic path are recorded;
- canonical declaration exists;
- `token-api.md` matches runtime declarations;
- CSS grammar works for every selected consumer;
- family mappings use documented semantic inputs or a fully gated workaround;
- representative overrides affect the intended rendered result where observable;
- no `--m3e-*` leaks outside the Material boundary;
- no duplicate public owner or no-op exception remains.

Do not require one test per renderer variable, copy complete third-party catalogues, or create infrastructure solely to enumerate renderer internals.
