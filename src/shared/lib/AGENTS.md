# src/shared/lib

Inherits the rules from `src/shared/AGENTS.md`. Applies to `src/shared/lib` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Reusable non-UI helpers, storage and filesystem abstractions, schema helpers, contract wrappers, migrations, and composables.

## Patterns

- Prefer small modules with one clear responsibility.
- Wrap browser APIs, storage APIs, and third-party SDKs behind typed contracts.
- Keep runtime validation, parsing, and extraction close to the boundary code that needs them.
- Keep workaround code for awkward platform typings at the boundary rather than spreading extra runtime allocations through callers.
- Design lifecycle behavior explicitly for composables and adapters: cleanup, cancellation, resubscribe behavior, and memory profile are part of the contract.
- For CRDT helpers, treat nested objects as live document objects and update them in place rather than reassigning those same live objects back into the document.

## Anti-patterns

- Do not import upper layers.
- Do not add vague utility modules without a clear invariant, caller set, or testable responsibility.
- Do not mix generic helpers with project-specific policy unless the contract is intentionally shared.

## Constraints

- Changes in `shared/lib` often have a broad blast radius.
- Minimum verification: `pnpm type-check`, plus focused unit tests or reproducible checks for the touched helper semantics.
