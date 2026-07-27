# Mioframe Material token API

Status: `migration-required`

This document is the complete consumer-facing catalogue of Material CSS custom properties supported by Mioframe.

The catalogue describes the public contract. Canonical CSS files provide the executable declarations and runtime values. Both must be updated together.

## Inclusion rule

A token appears here only when it is:

1. verified against an official Material token or role;
2. intentionally supported by Mioframe now;
3. declared by its canonical runtime owner;
4. mapped to the rendered result where required;
5. covered by representative verification.

Official Material tokens not yet supported remain `deferred` in the relevant component-family matrix. m3e variables and owner-local private bridges are never listed here.

## Runtime owners

| Namespace     | Runtime owner                                                            | Meaning                                           |
| ------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| `--md-ref-*`  | `src/shared/ui/material/foundation/tokens.css` or `foundation/theme.css` | supported Material reference values               |
| `--md-sys-*`  | `src/shared/ui/material/foundation/tokens.css` or `foundation/theme.css` | supported Material system and theme roles         |
| `--md-comp-*` | `src/shared/ui/material/components/<family>/tokens.css`                  | supported official component-family customization |
| `--app-*`     | outside `src/shared/ui/material`                                         | application extension, not Material API           |

Private namespaces:

- `--m3e-*` — private renderer input;
- `--md-private-*` — owner-local implementation bridge.

Private namespaces are excluded from this catalogue.

## Entry format

Every supported token must have an entry with:

| Field            | Required content                                           |
| ---------------- | ---------------------------------------------------------- |
| Token            | exact CSS custom-property name                             |
| Grammar          | accepted CSS value grammar                                 |
| Purpose          | Material semantic role                                     |
| Default          | canonical default or fallback source                       |
| Scope            | foundation, theme, or component family                     |
| Owner            | canonical declaration file                                 |
| Material source  | official token/role source                                 |
| Renderer mapping | direct system consumption, documented m3e mapping, or none |
| Verification     | representative contract/browser/visual proof               |

## Foundation catalogue

The foundation catalogue must be populated during the token-ownership migration before `src/shared/lib/md/tokens.css` is removed.

Required groups include every retained public declaration in:

- reference palette and typeface;
- system color roles and standard light/dark assignments;
- shape;
- typography;
- elevation;
- state;
- motion;
- other intentionally retained Material foundation roles.

A declaration is not retained merely because it exists in the legacy file. Invalid, obsolete, duplicate, private, application-owned, or unused declarations must be classified and moved, corrected, or removed by the migration.

## Component catalogue

Each migrated component family adds only its supported official `--md-comp-*` subset.

Example entry shape:

| Token                                            | Grammar   | Purpose                          | Default                       | Scope            | Owner                            | Material source               | Renderer mapping                  | Verification                  |
| ------------------------------------------------ | --------- | -------------------------------- | ----------------------------- | ---------------- | -------------------------------- | ----------------------------- | --------------------------------- | ----------------------------- |
| `--md-comp-<family>-<variant>-<part>-<property>` | `<color>` | selected official component role | a supported `--md-sys-*` role | component family | `components/<family>/tokens.css` | official component token path | documented family-local m3e input | representative override proof |

Do not add placeholder entries for the complete Material component-token catalogue. Unsupported official tokens remain visible only as `deferred` rows in the family matrix.

## Migration state

The current runtime declarations still reside in the mixed-owner legacy file:

```text
src/shared/lib/md/tokens.css
```

Until migration completes:

- this file does not claim that every legacy declaration is a supported public API;
- no new public token may be added to the legacy owner;
- the migration must inventory and classify every retained declaration;
- this catalogue must be populated in the same change that establishes the new runtime owners;
- M0 remains incomplete.

After migration completes, a token absent from this catalogue is not a supported Mioframe public token API.
