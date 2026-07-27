# Material token architecture

This document defines runtime ownership, public API selection, renderer mapping, and migration rules for Material tokens used by the Mioframe Material library.

## Decision

`src/shared/ui/material` owns the Material token contract consumed by the application and by canonical `MD*` adapters.

```text
application theme selection and overrides
  → Material foundation and theme tokens
  → selected component-family tokens
  → private m3e renderer mappings
```

The physical owner must match the semantic owner:

| Contract                                                | Canonical runtime owner                                 | Public status                                      |
| ------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------- |
| Material reference and system foundations               | `src/shared/ui/material/foundation/tokens.css`          | public when declared and catalogued                |
| Default palette and light/dark system color assignments | `src/shared/ui/material/foundation/theme.css`           | public theme contract when declared and catalogued |
| Selected official component tokens                      | `src/shared/ui/material/components/<family>/tokens.css` | public for that family                             |
| Private renderer mappings and owner-local bridges       | the owning foundation or component family               | private                                            |
| Approved application tokens (`--app-*`)                 | outside `src/shared/ui/material`                        | application API, not Material API                  |
| Public token catalogue                                  | `src/shared/ui/material/docs/token-api.md`              | consumer-facing documentation                      |

`--m3e-*` variables are private renderer inputs. `--md-private-*` variables are owner-local implementation details. Neither namespace is part of the public token catalogue.

## Public availability states

An official Material token is classified as one of:

- `supported` — declared by its canonical runtime owner, listed in `token-api.md`, mapped where required, and verified;
- `deferred` — official Material token not required or not implemented now; recorded only in the relevant family matrix;
- `private` — renderer or implementation detail that is not a public Material contract;
- `not-material` — project customization with no official Material source; requires an application or extension owner.

Existence in Material documentation or m3e does not by itself make a token part of the Mioframe public API.

## Foundation ownership

`foundation/tokens.css` owns renderer-independent Material reference and system roles intentionally supported by Mioframe, including applicable shape, typography, motion, elevation, state, and other shared foundations.

`foundation/theme.css` owns the standard Mioframe Material theme:

- reference palette values used by the theme;
- light system color-role assignments;
- dark system color-role assignments.

The application may select or override a theme through the same public `--md-ref-*` and `--md-sys-*` contract. Product-specific theme state or persistence remains outside the Material library.

Do not place feature, domain, storage, or product tokens in Material foundation.

## Component-family ownership

Each component family owns only the official `--md-comp-*` subset intentionally supported by that family.

```text
src/shared/ui/material/components/button/tokens.css
  → selected --md-comp-button-* declarations
  → private mapping to documented --m3e-button-* inputs
```

A family must not:

- define another family's component tokens;
- mirror the complete Material component-token catalogue;
- mirror all m3e variables;
- rely on a global component-token file as a second owner;
- expose an m3e token name to consumers.

A parent component uses a dependency's public props, slots, inherited color, or supported official `--md-comp-*` tokens. It must not set dependency-private renderer inputs.

## Effect of using m3e

Using m3e removes the need for Mioframe to reproduce every Material component default in CSS.

Mioframe still owns:

1. the supported Material foundation and theme contract;
2. the selected public component-token API;
3. explicit Material-to-m3e mappings where m3e does not already consume the correct system role;
4. documented, removable workarounds for confirmed renderer divergences.

m3e owns its private defaults and internal rendering. Do not copy those defaults merely to make Mioframe appear to expose a complete token surface.

## Selecting a public component token

A public `--md-comp-*` token must satisfy all conditions:

1. its path and semantics are verified against official Material documentation;
2. it is required by a current consumer, theme, selected component scenario, or intentional current library contract;
3. it has one family owner and a meaningful runtime default or fallback;
4. its mapping to the rendered result is implemented and verified;
5. it is listed in `token-api.md`.

Current need selects an official token; it does not invent a Material token contract.

If no official Material token exists, choose one explicit outcome:

- use an existing supported `--md-sys-*` role;
- keep renderer-only configuration private;
- use an approved `--app-*` token outside the Material library;
- assign a confirmed renderer gap to m3e;
- leave the customization unsupported.

## Mapping

```text
supported official Material token
  → canonical --md-ref-* / --md-sys-* / --md-comp-* declaration
  → documented semantically equivalent m3e input when mapping is required
```

For each selected token:

- preserve official component, variant/state, part, property, and value semantics;
- keep one canonical declaration owner and meaningful default;
- prefer direct `--md-sys-*` consumption when m3e already uses the correct Material role;
- map component tokens only inside the owning family;
- use documented m3e inputs by default;
- treat an undocumented effective input as an exact-version workaround only under the accepted workaround gate;
- do not expose m3e names through props, exports, documentation examples, or consumer CSS.

## CSS value grammar

Semantic equality is not enough when CSS consumers accept different grammars.

For every supported token:

- verify that the chosen representation is accepted by every selected current consumer grammar;
- do not assume a unitless number and a percentage are interchangeable in every CSS function, property, or registered custom property;
- prefer one canonical foundation representation when it preserves Material meaning and works for all selected consumers;
- when no shared representation is compatible, keep conversion private to the owning adapter and record it as a renderer mapping or exact-version workaround;
- require rendered browser proof when value grammar changes visible behavior.

## Public token catalogue

`docs/token-api.md` is the complete human-facing index of tokens supported for application use.

Each supported token entry records at least:

- exact token name;
- namespace and semantic purpose;
- CSS grammar;
- canonical default or fallback source;
- scope and owner;
- official Material source;
- renderer mapping when applicable;
- representative verification.

The executable CSS declaration remains the source of the runtime value. The catalogue and declaration must change in the same commit.

After the ownership migration, absence from `token-api.md` means the token is not a supported Mioframe public API, even if m3e or official Material defines a similarly named token.

Do not create a TypeScript token enum, token DSL, or duplicate runtime registry. CSS custom properties are the executable API.

## Legacy migration

`src/shared/lib/md/tokens.css` is a legacy mixed-owner file, not the accepted final source of truth.

During the migration:

1. inventory every retained declaration and current import;
2. move Material reference/system foundations to `material/foundation`;
3. move selected component tokens to their owning families;
4. move `--app-*` tokens to an application/shared owner outside Material;
5. co-locate each retained `--md-private-*` bridge with its actual owner;
6. update the single global import path;
7. populate `token-api.md` for every retained public token;
8. remove `src/shared/lib/md/tokens.css` after all consumers have migrated.

Do not add new public tokens to the legacy file. Do not retain it as a compatibility alias or second declaration owner after migration.

## Verification

Verify only supported public Material tokens:

- exact official source and semantic path are recorded;
- canonical runtime owner and declaration exist;
- `token-api.md` matches the runtime surface;
- CSS grammar is valid for every selected current consumer;
- family mappings target documented semantic m3e inputs or a fully gated exact-version workaround;
- a representative non-default override changes the intended result when observable;
- rendered browser proof exists when representation or mapping affects visible behavior;
- no `--m3e-*` usage leaks outside `src/shared/ui/material`;
- no duplicate public declaration owner remains.

Do not require one test per renderer variable, copy the full Material token catalogue, test m3e defaults, or create automated infrastructure solely to enumerate third-party internals.
