# /src

Inherits the rules from the root `AGENTS.md`. Applies to all application source code under `src`.

## Material 3 guideline checks

For user-visible UI or UX changes, use the `material3-guidelines` skill before planning component choice, layout, interaction behavior, visual states, accessibility semantics, tokens, public UI API names, or verification.

For shared UI primitives, Material-style wrappers, Material tokens, Material authoring units, Storybook UI documentation, or Material visual verification surfaces, also follow the relevant policies under `docs/material-3/` before editing production code.

Use the `material3` MCP server from https://github.com/Vyachean/m3-docs-mcp as the primary source of official Material 3 guidance. If MCP is unavailable or incomplete for the needed page, use `Vyachean/m3-docs-cache` as the fallback snapshot of official `m3.material.io` content.

Do not claim Material 3 alignment unless the relevant guidance was checked through MCP or the documented fallback cache. If that check is unavailable or incomplete, report it as an unresolved Material 3 verification risk.

## Service and worker source of truth

Service and worker code own heavy data operations, storage/protocol interpretation, indexing, lifecycle, cache invalidation, and canonical existence or initialization facts.

UI layers must stay light. They may request actions and render facts from public APIs, but must not infer service-owned state by inspecting implementation details such as marker files, storage file names, raw directory entries, cache keys, adapter artifacts, or protocol internals.

When a widget, page, feature, or entity UI needs a fact that belongs to storage, repository lifecycle, document discovery, synchronization, permissions, or cache state, expose that fact through the service and entity public API instead of re-deriving it in the UI thread.

Avoid these patterns in source code:

- widget/page determines whether a repository, storage, document set, or permission state exists by parsing service implementation details;
- UI code duplicates service or worker scans, indexing, parsing, repository discovery, lifecycle checks, or cache decisions;
- an entity is introduced only to re-label a service-owned concept while still deriving its canonical state outside the service;
- feature actions compensate for missing service invariants with UI checks instead of enforcing those invariants at the service owner.

The preferred flow is: service or worker determines canonical facts, entity exposes them in a typed reactive API, widget/page composes and renders them declaratively.

## Declarative FSD composition

Vue UI should make data dependencies visible through named computed values, props, emits, slots, and template branches. Do not hide simple UI branch order behind broad screen state objects only to make a template shorter.

Keep responsibilities split by FSD owner:

- `entities/*/model` owns stable entity facts, domain read models, typed access patterns, and small derived entity state.
- `entities/*/ui` may render the entity and emit semantic selection events, but must not import feature actions. Use slots for action surfaces when entity UI needs trailing buttons or menus.
- `features` own user-triggered actions such as create, import, rename, remove, dialogs, sheets, and action menus.
- `widgets` and `pages` compose entity UI, features, and shared UI. They may choose recovery, error, loading, and content branch order, but should express that order declaratively with explicit computed dependencies.

Avoid these patterns in source code:

- entity model exports screen-specific `ViewState`, `ReadyState`, `Presentation`, `Classification`, or similar combined objects for a widget/page;
- entity model combines loading, error, user-facing message, and content readiness for a specific screen;
- widget/page bypasses an existing entity public API and wires shared services or observable queries directly for entity reads;
- widget/page hides recovery, error, loading, and content precedence inside a helper when named computed values and template branches are enough;
- feature actions are imported into entity UI instead of being passed from widget/page composition through slots.

Prefer small, named derived facts such as `has*`, `is*`, `get*State`, and `get*Entries`. If a combined state object is still necessary, keep it in the layer that owns that composition and document why explicit dependencies are insufficient.

## User action preservation

For UI refactors that replace, remove, merge, or move action surfaces, preserve the user scenario and the interaction tier, not only raw reachability.

Before editing such a UI flow, list each old user action with its old entry point and interaction tier: primary, secondary, menu, overflow, fallback, or hidden. Define the new entry point, new tier, and verification path for each action.

Primary actions must not be silently demoted to a menu, overflow, fallback, secondary surface, or longer path. A demotion is allowed only when the task explicitly requests it or the reviewer confirms the trade-off.

When Material 3 action hierarchy requires reducing multiple primary actions to one FAB or one primary button, consolidate the domain actions behind a single explicit Add/action entry point instead of deleting or demoting them.

When old primary actions are consolidated into a sheet, menu, or action picker, the entry point label must be generic enough to honestly cover every action behind it. For example, do not use a document-specific label for an action picker that also creates folders.

Tests must cover the new primary user path. Stubbed component text, fallback menu assertions, or implementation-detail checks do not prove that a primary scenario was preserved.

## Diagnostics and privacy

This section refines the root `Privacy-safe errors` rules for source code under `src`.

The goal is not to hide all unexpected errors from diagnostics. Sentry must still receive actionable internal failures so real bugs can be fixed.

Distinguish error sources before reporting:

- External or user-data boundary errors must be privacy-safe before they reach `reportHandledError`. This includes browser APIs, File API, File System Access API, IndexedDB, Google APIs, storage adapters, Automerge/repo internals, Zod parsing of user-controlled payloads, network responses, and any library error that may include paths, names, ids, file contents, document contents, URLs, or raw user data.
- Internal programmer errors and project-controlled invariant failures may be reported as raw `Error` objects when their messages are stable and do not include user-controlled values. Do not wrap these only to satisfy privacy wording, because losing the original message/stack makes Sentry less useful.
- Expected user outcomes such as cancelled file picking, invalid user input, unsupported file format, permission denial handled by a recovery UI, or validation errors that are already part of normal UX should usually be handled without diagnostics reporting unless there is a product reason to track them.

When wrapping boundary errors:

- Use a project-controlled user-facing `DomainError.message`.
- Use `createSafeErrorCause` or another project-controlled safe technical cause before diagnostics can see the cause.
- Keep machine-readable codes stable and free of user data.
- Do not attach local paths, virtual paths, file names, folder names, document names, document ids, file ids, Google Drive ids, URLs, record values, document contents, or raw external error text to `reportHandledError` options, Sentry tags, Sentry extra, error messages, or causes.

`reportHandledError` and Sentry `beforeSend` limit metadata, but they do not make arbitrary exception messages and stacks privacy-safe. Treat the boundary where the error is created or converted as the place to decide whether the original error is safe to report.