# src/widgets

Inherits the rules from `src/AGENTS.md`. Applies to `src/widgets` and its descendants until a deeper `AGENTS.md` refines it.

## Contains

- Screen-scale compositions that combine multiple features, entities, and shared UI into reusable page sections.

## Patterns

- Keep widgets thin: layout, composition, slot wiring, and cross-feature orchestration are appropriate here.
- Delegate user mutations to `features` and domain reads or derivations to `entities`.
- A widget may own one screen section's branch order for loading, recovery, error, empty, and content states, but should not own the low-level domain rule behind those states.
- Keep one source for each read model inside a widget. If a widget owns a read, pass its state down instead of making a parent page read the same state again.
- Compose provider-specific recovery through entity or feature contracts. Do not reach into provider/service internals from a widget.
- If part of a widget becomes reusable outside one screen composition, move it to a lower layer.

## Anti-patterns

- Do not turn widgets into a hidden domain, provider, service, or schema layer.
- Do not hide low-level API, storage, provider, or validation work inside widgets.
- Do not duplicate the same observable query or entity read that another owner in the same screen already performs.
- Do not keep one-off feature UI here when it is not a reusable composition unit.
- Do not pass broad service objects, provider objects, or mixed read/write models through widget props.

## Constraints

- Widgets may depend on `features`, `entities`, and `shared`, but should remain composition-only.
- Minimum verification: run `pnpm verify --only type-check`, then exercise the affected widget in its host page and confirm the touched action or read state still updates in place. Use focused verify-managed browser coverage when the observable behavior depends on the DOM. Final completion still requires `pnpm verify`.
