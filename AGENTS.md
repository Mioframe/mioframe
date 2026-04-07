# AGENTS.md

The rules in this file apply to the whole repository. A deeper `AGENTS.md` overrides them only inside its own directory subtree.

## Project Shape

This is a local-first personal data manager built around:
- Vue 3 and TypeScript for UI;
- OPFS and filesystem abstractions for local storage;
- CRDT-style documents, schema validation, and migrations;
- FSD-style layering: `app -> pages -> widgets -> features -> entities -> shared`.

## Contains

- `src/app`: bootstrap, routing, global styles, app-level wiring.
- `src/pages`: screen-level composition and navigation.
- `src/widgets`: large UI compositions built from lower layers.
- `src/features`: user actions, dialogs, forms, and mutation flows.
- `src/entities`: domain-facing composables, small entity UI blocks, and typed access patterns.
- `src/shared`: infrastructure, reusable UI, services, utilities, adapters, schemas.

## Patterns

- Keep changes as close as possible to the directory and layer that owns them.
- Prefer an existing public module API through `index.ts` when one exists.
- Prefer functions, factory helpers, and composables over classes unless an external API requires a class or class-based state materially clarifies the invariant.
- Update schema, migrations, service contracts, and callers together for persistent-data changes.
- Treat subscriptions, listeners, workers, timers, caches, and file handles as lifecycle-managed resources.
- Use the `$` suffix only for raw RxJS observables; adapted project-level reactive sources and other wrappers should use names without `$`.
- Write stable directory guidance in `AGENTS.md`, not temporary project snapshots.
- Follow FSD boundaries strictly: derived domain state belongs in `entities`, user actions and orchestration belong in `features`, and `pages` should compose them rather than absorb either responsibility.
- Name non-component, non-class TypeScript files in lower camel case or lowercase; reserve PascalCase filenames for Vue components and class-centric modules.
- Keep contract parsing, validation, and extraction close to the module that defines that contract instead of scattering that logic across unrelated layers.
- In component code, name event handlers and callback-style bindings with the `on*` prefix for consistent, recognizable intent.

## Naming

- Prefer clear domain words over ad hoc abbreviations. Keep an acronym only when it is already established project vocabulary or an external contract term, such as `FS`, `MD`, `CFR`, `OPFS`, `OAuth`, or `GAPI`.
- Treat existing `UI*` component names as legacy compatibility names. Do not introduce new `UI*` symbols in component or module names.
- Name page and widget directories in PascalCase because they are screen or composition modules.
- Name `features`, `entities`, and `shared` submodules in lower camel case by domain concept or action.
- Name non-component TypeScript files in lower camel case or lowercase. Reserve PascalCase filenames for Vue components and class-centric modules.
- If a non-component module exports multiple functions, do not name the file after a single exported function. Use a filename that describes the module's overall responsibility.
- Name feature directories and public feature APIs by the user action they own, usually as `<domain><Action>` such as `documentRename` or `databasePropertyCreate`.
- Name entity directories and public entity APIs by the stable domain concept they expose, such as `databaseProperty`, `repository`, or `googleUserInfo`.
- Name components by the external visual and interaction contract they present in markup. The name should tell a reader what the user sees and how the component behaves, not what internal role it plays.
- Use component suffixes to describe visible form and interaction model. Prefer concrete surface words such as `Dialog`, `Sheet`, `Pane`, `Widget`, `Layout`, `Form`, `Field`, `List`, `ListItem`, `Table`, `Button`, `MenuItem`, `Chip`, `Bar`, `Rail`, `Container`, `State`, or `Section`.
- Choose the smallest suffix that still explains the rendered surface. Good: `DocumentRemoveDialog`, `DatabasePropertyListItem`. Bad: `DocumentRemoveManager`, `DatabasePropertyRow` when the component is actually a list item.
- Use `Dialog` for modal surfaces with apply or cancel semantics. Use `Sheet` for bottom-sheet or panel-sheet surfaces. Use `Pane` for route or split-view panes. Use `Widget` only for large reusable composition blocks in the widget layer.
- Use `Layout` for structure-only components that primarily arrange children. Use `Container` only for an explicit slot, portal, scrolling, or positioning shell. Do not use `Container` for hidden data or orchestration logic.
- Use `State` for a visible empty, loading, error, recovery, or status surface. Use `Section` only for a stable subsection of a larger surface, not as a generic wrapper name.
- Do not name a visual component with vague implementation nouns such as `Manager`, `Helper`, `Renderer`, `Handler`, or `Provider` unless the module is not actually a visual component.
- Use the `MD*` prefix only for shared UI components that intentionally follow Material Design visual and interaction patterns. Use a plain domain name without `MD` for entity, feature, widget, and page components, and for shared UI that is not presented as a Material Design primitive.
- Name composables and access hooks with `use*`. A `use*` function should expose a reactive capability, reactive state, derived state, lifecycle-managed subscriptions, or actions consumed as a capability by callers.
- Use `use*` when the caller should consume a capability rather than think about construction. It is acceptable for `use*` to be backed by `createGlobalState`, a scope pool, dependency injection, or direct local composition.
- Good `use*`: `useDatabaseProperty`, `useSnackbar`, `useOverlayNavigation`. Bad `use*`: a pure one-shot parser or a fresh-instance factory with no reactive or lifecycle contract.
- Name assembly and wiring functions with `setup*`. Use `setup*` when the function connects dependencies, listeners, services, worker contracts, context, or lifecycle-managed state and ownership is primarily about initialization and cleanup.
- A `setup*` function may allocate resources, subscribe, register cleanup, or bind infrastructure contracts. Pair `setup*` with a public `use*` accessor when the wiring result is later consumed as shared state or capability.
- Good `setup*`: `setupMainService`, `setupGoogleSessionService`, `setupPaneContext`. Bad `setup*`: a pure typed config helper or a function whose main job is returning a new independent value object.
- Name declarative definition helpers with `define*`. Use `define*` for functions that preserve type inference, register a contract, constrain literals, or describe a protocol shape without owning a long-lived runtime instance.
- A `define*` function must stay side-effect-light. It must not hide I/O, background work, subscriptions, or ownership of live resources.
- Good `define*`: `defineMenuButtonList`, `defineObservableQuery`, `defineScopePool`. Bad `define*`: a function that starts watchers, opens connections, or allocates a runtime client with external lifecycle.
- Name factories with `create*`. Use `create*` when each call intentionally returns a new independent instance, adapter, client, service object, or domain value and the caller becomes the owner of that result.
- Prefer `create*` over `setup*` when repeated calls are expected to produce separate usable instances. Prefer `setup*` over `create*` when the point is wiring and lifecycle, not per-call instance ownership.
- Good `create*`: `createFSStorageAdapter`, `createVFSAdapter`, `createNumberProperty`. Bad `create*`: a singleton wiring entry point or a function whose meaning is mostly registration and cleanup.
- Reserve the `*Service` suffix for infrastructural background services that belong to the worker-side or background-side execution model of the app.
- A `*Service` module or exported symbol should represent a service contract, service implementation, or service accessor that is valid without DOM access and without main-thread-only assumptions.
- Do not use the `*Service` suffix for view-model helpers, component-local orchestration, or browser-main-thread UI adapters. If a module needs DOM, focus, layout, or direct component interaction, it is not a `*Service`.
- Name pure lookup, extraction, and derivation helpers with `get*`. A `get*` function should read from its arguments or an already available structure and return a value without establishing long-lived ownership.
- Keep `get*` side-effect-light and predictable. Do not use `get*` for initialization, subscriptions, global mutation, or instance creation.
- Good `get*`: `getGoogleDrivePathEmail`, `getGoogleDriveAccessRecoveryError`. Bad `get*`: a function that creates shared state, opens a worker bridge, or attaches listeners.
- Name predicates and type guards with `is*`, and keep them boolean-returning.
- Good `is*`: `isGoogleAuthPopupBlocked`, `isFileFSEntry`. Bad `is*`: a coercion helper that returns a transformed value.
- Name schema values with `zod*`. Export the schema itself with the `zod` prefix and derive the TypeScript type from it nearby when useful.
- Keep `zod*` exports close to the boundary or contract they validate. Good: `zodQuery`, `zodDatabaseView`, `zodGoogleErrorResponse`.
- Name local component event handlers and callback bindings with `on*`, such as `onClickCreateDocument`, `onSubmit`, `onCancel`, `onApply`, or `onRetryAuthorization`.
- Reserve the `$` suffix for raw RxJS observables only. Do not use `$` for Vue refs, computed values, wrapped query results, or service accessors.
- When a directory exposes an `index.ts`, keep exported symbol names aligned with the directory name and import through that entry point unless a deeper path is intentionally part of the local module contract.

## Anti-patterns

- Do not pull dependencies upward against the intended layer direction.
- Do not bypass service/entity/composable APIs with direct mutations.
- Do not duplicate schema contracts, type aliases, or constants across layers.
- Do not turn `pages` or `widgets` into hidden domain or service layers.
- Do not use `AGENTS.md` as a bug audit, backlog, or changelog.

## Constraints

- `shared` must not import upper layers.
- `entities` may import only `shared`.
- `features` build on `entities` and `shared`.
- `widgets` may compose `features`, `entities`, and `shared`, but should not own domain rules.
- Use Conventional Commits for all commit messages.
- After file changes, run the linter only for the touched files or the narrowest affected scope.
- Prefer targeted lint commands such as `pnpm exec eslint --fix <file ...>` for touched files.
- Use `--fix` by default for targeted lint runs, unless the task specifically requires reviewing raw lint output before applying fixes.
- Use `pnpm lint` only when no narrower lint target exists or when a full-repository check is explicitly needed.
- At minimum run `pnpm type-check` for logic changes; add focused tests or smoke checks for infrastructure and schema changes.

## AGENTS.md Best Practices

- Each `AGENTS.md` should describe only its own directory and nearby invariants.
- A child `AGENTS.md` should refine its parent, not repeat it wholesale.
- Add a new `AGENTS.md` only when a directory has its own stable rules, patterns, or constraints.
- If a directory has no unique guidance, rely on the parent file instead of adding a thin duplicate.

## AGENTS.md Structure

- Use a short title that matches the directory path.
- State inheritance from the parent `AGENTS.md` near the top.
- State the scope explicitly: the current directory and its descendants until a deeper `AGENTS.md` takes over.
- Use this default section layout:
- `## Contains`
- `## Patterns`
- `## Anti-patterns`
- `## Constraints`
- Add extra sections only when they materially improve decision-making.

## AGENTS.md Content Rules

- `Contains` should describe stable file groups, entry points, and responsibilities, not a raw file dump.
- `Patterns` should capture expected design and implementation approaches for that directory.
- `Anti-patterns` should capture mistakes that are especially costly in that directory.
- `Constraints` should capture dependency limits, blast radius, verification expectations, and compatibility requirements.
- If a directory is imported from elsewhere, document its public API rule, such as importing through `index.ts` when present.
- Prefer durable guidance over details that go stale after one commit.

## AGENTS.md Lifecycle

- Update `AGENTS.md` in the same change that updates ownership boundaries, public APIs, dependency rules, or required verification.
- Add new guidance when a directory gains a new stable submodule or a new recurring class of changes.
- Remove or rewrite guidance that no longer helps someone make a change safely.

## AGENTS.md Anti-patterns

- Do not use absolute paths.
- Do not include generated dates, commit hashes, branch names, file counts, or line numbers.
- Do not repeat repository-wide rules in every child file.
- Do not describe an ideal architecture if the codebase currently works differently; document the rules that make the current code safe to change.
- Do not list every file unless the list itself is necessary for decisions.

## AGENTS.md Writing Style

- Use English consistently across the AGENTS tree.
- Keep the tone short, directive, and decision-oriented.
- Prefer invariants and boundaries over narration.
- Keep lists easy to scan: one bullet, one idea.
- If guidance applies only to one file or one edge case, consider keeping it next to the code instead.
