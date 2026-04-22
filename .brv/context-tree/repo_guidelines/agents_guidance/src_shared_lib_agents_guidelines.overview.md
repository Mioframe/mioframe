## Key points
- `src/shared/lib` is for reusable, **non-UI**, single-responsibility helpers and abstractions with a broad blast radius.
- Prefer **typed wrappers/contracts** around browser APIs, storage/filesystem APIs, and third-party SDKs.
- **Concise TSDoc is required on exported functions** to keep shared contracts readable at call sites and during refactors.
- Keep **runtime validation/parsing/extraction** close to the boundary code that needs it; keep platform-typing workarounds at boundaries too.
- For composables/adapters, **lifecycle behavior is part of the contract** (cleanup, cancellation, resubscribe behavior, memory profile).
- For CRDT helpers, treat nested objects as **live document objects** and **update in place** (don’t reassign live nested objects back into the document).
- Minimum verification for changes: **`pnpm type-check` + focused unit tests or reproducible checks** for affected semantics.

## Structure / sections summary
- **Reason**: Captures module-level guidance from `src/shared/lib/AGENTS.md`, including the new TSDoc requirement.
- **Raw Concept**
  - Task: document module rules
  - Change: require concise TSDoc on exports
  - File: `src/shared/lib/AGENTS.md`
  - Flow: follow patterns → avoid anti-patterns → run minimum verification
  - Timestamp: 2026-04-22
- **Narrative**
  - Structure: what the module contains, preferred patterns, anti-patterns, constraints/verification due to broad impact.
  - Highlights: typed contracts, boundary-local validation, explicit lifecycle behavior, CRDT update-in-place rule.
  - Rules: detailed do/don’t list and verification expectations.
- **Facts**: Explicit conventions (inheritance, scope, TSDoc requirement, minimum verification).

## Notable entities, patterns, or decisions
- **Entities / files**
  - `src/shared/lib/AGENTS.md` (module guidance source)
  - `src/shared/AGENTS.md` (parent rules inherited by descendants unless overridden)
  - Command: `pnpm type-check` (minimum verification)
- **Patterns encouraged**
  - Small, single-responsibility modules.
  - Typed contracts/adapters around external APIs/SDKs.
  - Boundary-local validation/parsing and platform-typing workarounds.
  - Explicit lifecycle semantics for composables/adapters (cleanup/cancellation/resubscription/memory).
  - CRDT nested-object **in-place updates** for live document objects.
- **Anti-patterns / constraints**
  - No imports from upper layers.
  - No vague “utility” grab-bags without clear invariants, defined callers, or testable responsibilities.
  - Avoid mixing generic helpers with project-specific policy unless intentionally shared.
  - Treat changes as high-impact (broad blast radius) and verify accordingly.
- **Key decision**
  - **New requirement**: concise TSDoc on all exported functions in `src/shared/lib`.