# src/shared/lib

Inherits the rules from `src/shared/AGENTS.md`. Applies to `src/shared/lib` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- document and CRDT modules such as `automerge`, `automergeAdapter`, `databaseDocument`, `cfrDocument`.
- filesystem modules such as `virtualFileSystem`, `fileSystem`, and provider adapters.
- API and cache helpers such as `googleApi`, `googleDrive`, `cache`, `dedupe`.
- infrastructure utilities such as `migrations`, `changeObject`, `typeGuards`, `proxyService`, `wrapWorker`, `subscriptions`.
- generic composables and helpers such as `use*`, `debounce`, `throttle`, `dayjs`, and similar modules.

## Patterns

- Prefer small modules with a single clear responsibility.
- Prefer closure-based factories and composables for adapters, providers, and helpers; use classes only when they are required by an external contract or make lifecycle/state invariants materially clearer.
- Wrap browser APIs, storage APIs, and third-party SDKs behind typed contracts.
- Keep runtime validation near the boundary code that needs it.
- Keep contract parsing and extraction helpers near the provider, adapter, or boundary module that defines the path, payload, or transport contract.
- For composables, design lifecycle behavior explicitly: cleanup, cancellation, re-subscribe, and memory profile.
- For Automerge and other CRDT helpers, treat nested map/list objects as live document objects and update them in place rather than reassigning those same live objects back into the document.
- Prefer shared deep write helpers such as `deepPutJsonObject` and `deepPatchJsonObject` for CRDT-safe nested writes when the helper semantics match the operation.

## Anti-patterns

- Do not import upper layers.
- Do not mix generic helpers with project-specific policy unless the contract is intentionally shared.
- Do not add vague utility modules without a clear invariant, caller set, or testable responsibility.
- Do not store temporary project observations in this directory's `AGENTS.md`.
- Do not assign a live Automerge proxy object into another document location or back into the same property.
- Do not replace large CRDT subtrees by default when a path-level put, patch, or field-level mutation is sufficient.

## Constraints

- Changes in `shared/lib` often have a broad blast radius.
- Cache, migration, filesystem, and subscription changes need focused tests and compatibility checks.
- Use `index.ts` as the public entry point when present.
- Minimum verification: `pnpm type-check` and focused unit tests for the touched invariant.
