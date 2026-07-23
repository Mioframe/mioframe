# /src

Inherits the rules from the root `AGENTS.md`. Applies to all application source code under `src`.

## Material 3 guideline checks

For user-visible UI or UX changes, verify current official Material guidance before planning component choice, layout, interaction behavior, visual states, accessibility semantics, tokens, public UI API names, or verification.

For shared UI primitives, Material-style wrappers, Material tokens, Storybook UI documentation, or Material visual verification surfaces, also follow the relevant policies under `src/shared/ui/material/docs/` before editing production code.

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

UI changes must preserve the intent, discoverability, and relative priority of existing user actions unless the task explicitly changes them.

Before replacing, removing, merging, renaming, or moving an action surface, build an action preservation matrix with: old action, old entry point, old interaction tier, new entry point, new interaction tier, and verification path. Interaction tiers include primary, secondary, contextual, menu, overflow, fallback, and hidden.

Do not treat raw reachability as scenario preservation. A path that is technically still available may still be a regression when it becomes less discoverable, takes more steps, moves to a different context, loses its affordance, or no longer matches the user's mental model.

When a design-system rule or layout constraint conflicts with existing action topology, redesign the action model instead of deleting or hiding actions mechanically. Prefer a coherent composition that preserves user intent and priority. Escalate when preserving both the design rule and the existing interaction tier requires a product decision.

New labels, icons, grouping, and containers must honestly describe the full set of actions or state behind them. Do not place a broader action set behind a narrow label, icon, or component name.

Verification must exercise the resulting user path at the same level as the changed behavior. Component stubs can verify wiring contracts, but primary product flows require browser or e2e coverage when layout, discovery, focus, overlays, menus, sheets, or action hierarchy changes.

## Vue, styling, stories, and copy

For Vue and user-visible UI work, follow the applicable Vue, Material, browser, and visual rules and preserve these project conventions:

- The root class of a Vue component matches the component name in kebab-case. Components keep one stable meaningful root; parent composition owns whether the component renders.
- Use classic BEM syntax: `block`, `block__element`, `block_modifier`, and explicit key-value modifiers such as `block_size_medium`. Do not introduce `block--modifier`, loose unowned classes, or ambiguous modifier names.
- Keep component implementation styles scoped. Global CSS belongs only in app-level style modules or documented token/theme files.
- Use project Material tokens and preserve project authoring units such as `dp` and `sp` where the token pipeline expects them; do not rewrite them to `px` only because a generic reviewer suggests it.
- When visually resetting a native interactive element, restore the enabled clickable cursor and visible focus/state-layer behavior. Disabled or non-action states must not appear clickable.
- Colocate CSF stories as `<Component>.stories.ts`. Add the `visual` tag only to stories intentionally used for screenshot coverage.
- Keep user-facing copy in the application's established UI language. After user-visible changes, scan touched surfaces for mixed-language strings, stale task wording, and unnecessary technical terms.

## Diagnostics and privacy

This section defines source-code error and diagnostics invariants under `src`.

The goal is not to hide all unexpected errors from diagnostics. Sentry must still receive actionable internal failures so real bugs can be fixed.

**Two concerns are distinct:**

1. **Trusted in-app runtime and proxy transfer**: `DomainError.cause` may hold raw runtime errors inside the app and across trusted proxy boundaries. This does not require sanitization.
2. **External diagnostics export**: The `beforeSend` sanitizer enforces privacy at the outgoing Sentry event boundary. It scrubs exception value messages, linked cause messages, tags, extras, contexts, breadcrumbs, and user fields using denylist-based filtering.

**Error construction rules for `src` code:**

- Wrap boundary failures in a `DomainError` with a project-controlled user-facing `message`, a stable `code` enum value, and the raw runtime error as `cause`.
- Any `DomainError` crossing a worker or service boundary must use the project service-transfer-safe constructor or transformer pattern. Do not put clients, adapters, providers, callbacks, capabilities, credentials, or service objects in `message`, `cause`, serialization, or user-facing payloads.
- Do not create feature-local classifiers or manual VFS-to-feature error mappings. Use enum codes and raw cause instead.
- Keep `DomainError.message` free of paths, names, ids, URLs, and raw external text.
- `DomainError.cause` may hold the original raw error — the Sentry sanitizer handles scrubbing at the outgoing event boundary.
- Internal programmer errors and project-controlled invariant failures may be reported as raw `Error` objects when their messages are stable and do not include user-controlled values.
- Expected user outcomes (cancelled picker, invalid input, permission denied with recovery UI) should not be reported unless there is a specific product reason.

**Error code rules:**

- Define each string enum close to the boundary where the error originates (e.g., `RepositoryErrorCode` in the repository layer, `ExampleDocumentsCreateErrorCode` in that feature).
- Do not create a global error-code registry.

Do not attach local paths, virtual paths, file names, document names, document ids, file ids, Google Drive ids, URLs, record values, document contents, or raw external error text to `captureDiagnosticException` context, Sentry tags, or Sentry extra.
