---
title: src/shared/lib AGENTS Guidelines
summary: 'Guidelines for src/shared/lib: small single-responsibility helpers, typed wrappers around third-party/browser APIs, concise TSDoc on exports, and minimum verification steps.'
tags: []
keywords: []
createdAt: '2026-04-22T06:38:04.099Z'
updatedAt: '2026-04-22T06:38:04.099Z'
---
## Reason
Capture the module-level guidance in src/shared/lib/AGENTS.md (patterns, anti-patterns, constraints) including the new requirement for concise TSDoc on exported functions.

## Raw Concept
**Task:**
Document src/shared/lib/AGENTS.md module rules

**Changes:**
- Requires concise TSDoc on exported functions in src/shared/lib

**Files:**
- src/shared/lib/AGENTS.md

**Flow:**
When working under src/shared/lib/, follow patterns -> avoid anti-patterns -> run minimum verification

**Timestamp:** 2026-04-22

## Narrative
### Structure
AGENTS.md defines what src/shared/lib contains, preferred patterns for helpers/adapters/contracts, anti-patterns to avoid, and constraints/minimum verification due to broad blast radius.

### Highlights
Key emphasis: typed contracts around third-party/browser APIs, boundary-local validation/parsing, explicit lifecycle behavior for composables/adapters, and CRDT nested-object update-in-place behavior.

### Rules
- Prefer small modules with one clear responsibility.
- Wrap browser APIs, storage APIs, and third-party SDKs behind typed contracts.
- Add concise TSDoc to exported functions so shared contracts stay readable at the call site and during refactors.
- Keep runtime validation, parsing, and extraction close to the boundary code that needs them.
- Keep workaround code for awkward platform typings at the boundary rather than spreading extra runtime allocations through callers.
- Design lifecycle behavior explicitly for composables and adapters: cleanup, cancellation, resubscribe behavior, and memory profile are part of the contract.
- For CRDT helpers, treat nested objects as live document objects and update them in place rather than reassigning those same live objects back into the document.
- Do not import upper layers.
- Do not add vague utility modules without a clear invariant, caller set, or testable responsibility.
- Do not mix generic helpers with project-specific policy unless the contract is intentionally shared.
- Changes in shared/lib often have a broad blast radius.
- Minimum verification: pnpm type-check, plus focused unit tests or reproducible checks for the touched helper semantics.

## Facts
- **agents_inheritance**: src/shared/lib inherits rules from src/shared/AGENTS.md and applies to descendants unless overridden by a deeper AGENTS.md. [convention]
- **shared_lib_scope**: src/shared/lib should contain reusable non-UI helpers, storage/filesystem abstractions, schema helpers, contract wrappers, migrations, and composables. [convention]
- **tsdoc_requirement**: Exported functions in shared/lib should have concise TSDoc for readability and refactors. [convention]
- **shared_lib_min_verification**: Minimum verification for changes in shared/lib: pnpm type-check plus focused unit tests or reproducible checks for touched semantics. [convention]
