# Material 3 shared UI API

## Principle

Public `MD*` component APIs must use official Material 3 vocabulary wherever possible.

A developer should be able to read the official Material 3 documentation and predict the relevant project prop names and allowed values.

## Naming rules

- Use Material component names for shared Material components.
- Use Material configuration names for props.
- Use Material value names for prop values.
- Avoid generic local names when Material has a specific term.
- Avoid names that conflict with native HTML meanings unless the prop actually controls the native HTML behavior.
- Document every deliberate mismatch in [Deviations](./deviations.md) or the component Storybook page.

## Preferred prop vocabulary

| Material concept | Preferred prop name | Notes |
| --- | --- | --- |
| Variant | `variant` | Example: `default`, `toggle` when the docs describe variants. |
| Color style | `colorStyle` | Example: `elevated`, `filled`, `tonal`, `outlined`, `text`. |
| Size | `size` | Use Material size names. |
| Shape | `shape` | Use Material shape names. |
| Selection state | `selected` | For toggle/selection-capable components. |
| Disabled state | `disabled` | Native disabled semantics where supported. |
| Loading/progress state | `loading` or `progress` | Prefer progress when numeric progress is the main contract. |
| Native button type | `nativeType` or `htmlType` | Do not call this `variant` or `formAction`. |

## Invalid combinations

Components should prevent impossible Material combinations through TypeScript types, runtime validation, documentation, or a combination of these.

Examples:

- If official docs say a color style has no toggle variant, the API should not silently accept that combination.
- If a slot is required for an accessible name or icon, the component should enforce or clearly document it.
- If a component only supports a subset of official Material variants, the unsupported variants must not appear as accepted public API values.

## Project-specific components

Project-specific components may use project vocabulary, but they must not be documented under official Material component headings unless they are a deliberate adaptation of a Material pattern.

When a project-specific component uses Material tokens or states, document the Material foundations it uses and the project-specific behavior it adds.

## API migrations

Do not keep old shared UI APIs only for compatibility with previous internal usage. When a Material-aligned API rename is needed, update all in-repository consumers in the same focused migration.

Compatibility aliases are allowed only when an immediate full migration is technically unsafe or would make the change too broad to review. Such aliases must be documented as temporary deviations with a removal target.

Preferred migration flow:

1. identify the Material-compatible API;
2. update the component implementation;
3. update all project consumers;
4. update Storybook and visual surfaces;
5. remove obsolete props, emits, slots, and token names;
6. document any remaining temporary compatibility surface as a deviation.
