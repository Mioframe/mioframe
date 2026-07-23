# Material 3 shared UI API

## Principle

Public `MD*` component APIs use official Material 3 vocabulary wherever possible.

A developer should be able to read the official documentation and predict the relevant project prop names and accepted values.

## Naming rules

- Use official component names for shared Material components.
- Use official configuration terms for props and values.
- Avoid generic local names when Material defines a precise term.
- Avoid names that conflict with native HTML meanings unless the prop controls that native behavior.
- Record deliberate mismatches in [Deviations](./deviations.md) or component documentation.

## Common vocabulary

| Material concept       | Preferred prop name        | Notes                                                         |
| ---------------------- | -------------------------- | ------------------------------------------------------------- |
| Variant                | `variant`                  | Use official variant names.                                   |
| Color style            | `colorStyle`               | Use when Material distinguishes color styles from variants.   |
| Size                   | `size`                     | Use official size names.                                      |
| Shape                  | `shape`                    | Use official shape names.                                     |
| Selection state        | `selected`                 | For toggle or selection-capable components.                   |
| Disabled state         | `disabled`                 | Preserve native disabled semantics where supported.           |
| Loading/progress state | `loading` or `progress`    | Prefer `progress` when numeric progress is the main contract. |
| Native button type     | `nativeType` or `htmlType` | Keep distinct from Material variant or action vocabulary.     |

This table is a naming guide, not a universal API. Each component exposes only properties required by its supported contract.

## Invalid combinations

Prevent impossible or unsupported combinations through TypeScript types, runtime validation, documentation, or a combination of these.

Examples:

- a color style without an official toggle variant must not silently accept toggle configuration;
- icon-only controls must require or derive an accessible name;
- unsupported official variants must not appear as accepted public API values;
- mutually exclusive native modes must not be represented as independent compatible props.

## Native platform contract

Prefer native HTML elements and attributes when they provide the required semantics and behavior.

Do not replace native button, link, input, selection, form, focus, or disabled behavior with custom abstractions merely to unify APIs.

## Project-specific components

Project-specific components may use project vocabulary, but must not be documented as official Material components unless they are an explicitly documented Material adaptation.

When a project-specific component uses Material tokens or interaction foundations, document both the reused foundation contract and the product-specific behavior it adds.

## Compatibility

Do not keep old shared UI APIs only for internal convenience.

A temporary compatibility surface is allowed only when immediate migration is technically unsafe. It must name:

- exact current consumers;
- the replacement API;
- prohibition on new usage;
- the removal condition.

Permanent undocumented aliases are forbidden.
