# src/widgets

Inherits the rules from the root `AGENTS.md`. Applies to `src/widgets` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Screen-scale compositions that combine multiple features, entities, and shared UI into reusable page sections.

## Patterns

- Keep widgets thin: layout, composition, slot wiring, and cross-feature orchestration are appropriate here.
- Delegate user mutations to `features` and domain reads or derivations to `entities`.
- If part of a widget becomes reusable outside one screen composition, move it to a lower layer.

## Anti-patterns

- Do not turn widgets into a hidden domain, service, or schema layer.
- Do not hide low-level API, storage, or validation work inside widgets.
- Do not keep one-off feature UI here when it is not a reusable composition unit.

## Constraints

- Widgets may depend on `features`, `entities`, and `shared`, but should remain composition-only.
- Minimum verification: `pnpm type-check`, then exercise the affected widget in its host page and confirm the touched action or read state still updates in place.
