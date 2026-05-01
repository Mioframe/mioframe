# /

Applies to the whole repository unless a deeper `AGENTS.md` overrides it.

## Mandatory verification

During implementation, use this command when automatic formatting or lint fixes are useful:

```bash
pnpm verify --fix
```

Before reporting completion, always run the read-only check:

```bash
pnpm verify
```

Do not replace this command with manually selected checks.

The final verification must not use `--fix`.

If `pnpm verify` fails:

- fix the failure if it is caused by the change;
- otherwise report the exact failing command and output;
- do not claim the task is complete.

Final response must include:

```text
VERIFY RESULT
command: pnpm verify
status: passed | failed | not run
reason if not run:
```

## Contains

- `src/app`: bootstrap, routing, global shells, and global styles.
- `src/pages`: route-level and pane-level composition plus navigation state.
- `src/widgets`: screen-scale compositions built from lower layers.
- `src/features`: user-triggered flows such as dialogs, forms, menus, and destructive actions.
- `src/entities`: domain read models, typed access patterns, and small reusable UI.
- `src/shared`: cross-layer infrastructure, background services, schemas, utilities, and shared UI.

## Patterns

- Prefer plan-first implementation over broad discovery.
- Before broad repository exploration, use ByteRover local search to recall prior project decisions; use synthesized queries only when search results are insufficient.
- Before editing, identify the smallest affected FSD owner layer and read only task-relevant files plus direct imports unless the task proves wider impact.
- Split cross-layer work into separate schema/service, entity, feature, widget, and verification passes.
- Keep changes in the layer that owns the behavior, and import through `index.ts` when a public entry point exists.
- Preserve FSD boundaries: `pages` compose screens, `widgets` compose larger sections, `features` own user actions, `entities` own domain reads and derived state, and `shared` stays upper-layer-free.
- When existing code already owns a non-trivial matching, parsing, filtering, or storage algorithm, reuse that implementation or extract a shared helper first; do not reimplement the same algorithm in another layer and let it drift.
- Keep ByteRover usage details in the `byterover` skill. Use `AGENTS.md` for stable repo policy, not step-by-step `brv` runbooks.
- Use the `test-first` skill for behavior changes, bug fixes, migrations, data transformations, storage semantics, and UI flows when the expected outcome can be reproduced by a focused test or smoke check.
- Do not use test-first for refactors, type-only changes, formatting, comments, renames, documentation, or internal cleanup with no observable behavior change.
- Use the `mutation-testing` skill for high-risk changes to pure logic, schemas, migrations, storage helpers, CRDT write helpers, validation, normalization, filtering, sorting, matching, service logic, or data transformations when focused unit/integration tests were added or changed.
- Do not use mutation testing for UI component behavior, Playwright/e2e-only flows, refactors, type-only changes, formatting, comments, renames, or documentation.
- Verify third-party semantics from official docs or installed source before relying on ambiguous helpers, options, or return values. If the behavior is still unverified, say so.
- Treat DOM parentage, scroll ownership, focus, teleport, and overlay wiring as concrete runtime contracts. Check the rendered hierarchy before moving wrappers or composition boundaries.
- Keep the UI aligned with Material 3 expectations and optimize for mobile browsers first. Assume large datasets and low-end devices, and keep main-thread work bounded.
- Keep component and composable contracts narrow. Prefer IDs, primitive values, small display records, and explicit emits or slots over service bags, deeply nested configs, or mixed read/write models.
- Keep TSDoc on every public API accurate and complete. If you touch a public export that is missing TSDoc or has stale TSDoc, update it as part of the same change.
- Prefer explicit component props and named handlers over object-literal `v-bind` bags and inline template callbacks. Keep template contracts readable and mechanically checkable.
- Keep validation, parsing, and extraction close to the contract or boundary that defines them.
- Treat subscriptions, listeners, workers, timers, caches, file handles, and blob URLs as lifecycle-managed resources.
- Prefer typed collection helpers over raw `Object.keys`, `Object.values`, and `Object.entries` when iterating typed records. Do not add local type assertions just to paper over iteration typing outside rare boundary adapters.
- For CRDT-backed state, mutate live nested objects inside the owning change callback, never assign a live document object back into the same document, and prefer shared helpers such as `put`, `patch`, `deepPutJsonObject`, and `deepPatchJsonObject` when they match the write shape.
- When progress is knowable, surface progress instead of falling back to an indeterminate spinner.
- Keep unit tests colocated with the source file they verify, using sibling `*.test.ts` files. Do not introduce `__tests__` directories.

## Testing UI and Components

- Do not use unit tests as the default verification method for Vue UI components.
- Component behavior that depends on real DOM layout, focus, keyboard navigation, pointer or touch input, teleport, overlays, scrolling, responsive styling, browser APIs, or Material state visuals must be verified with Playwright/e2e or a reproducible browser smoke check.
- Move reusable UI state transitions and business rules into composables or pure helpers, and cover those with focused unit tests.
- Unit tests remain the preferred verification method for composables, pure helpers, schemas, migrations, services, storage helpers, CRDT write helpers, state transitions, validation, normalization, and pure transformations.
- Component unit tests are allowed for small render or wiring contracts that do not depend on browser layout or interaction semantics.
- The absence or removal of a Vue component unit test is not a regression by itself when the behavior is covered by Playwright/e2e, a reproducible browser smoke check, or focused tests for extracted composable or helper logic.

## Anti-patterns

- Do not pull dependencies upward against the intended layer direction.
- Do not bypass entity or service APIs with direct storage access or ad hoc document mutation.
- Do not duplicate schemas, type aliases, or constants across layers.
- Do not push orchestration complexity into component props.
- Do not treat desktop performance, hover, or precise pointer input as the default interaction model.
- Do not use `AGENTS.md` as an architecture essay, a file dump, or a place for temporary notes.

## Constraints

- `shared` must not import upper layers.
- `entities` may import only `shared`.
- `features` build on `entities` and `shared`.
- `widgets` may compose `features`, `entities`, and `shared`, but should not own domain rules.
- UI-facing layers may cross into background logic only through explicit proxy clients. Do not directly import `*Service` modules into `pages`, `widgets`, `features`, `entities`, or shared UI.
- Use `pnpm` for package management and project commands.
- After edits, run the narrowest relevant verification for the touched scope. For TypeScript or other logic changes, run at least `pnpm type-check`; add the corresponding focused test or smoke check for changed tests, UI/e2e behavior, or schema, service, and storage behavior.
- Run lint and format only for the touched scope with targeted `oxlint`, `eslint --fix`, and/or `oxfmt` as relevant. Use full e2e, full lint, or broad mutation checks only when explicitly requested or as final verification before a wide merge.
- Use Conventional Commits.
- `pages` and `widgets` directories use PascalCase. Other submodules use lower camel case.
- Vue components and class-centric files use PascalCase. Other TypeScript files use lower camel case or lowercase.
- Feature modules are named for user actions such as `<domain><Action>`. Entity modules are named for stable domain concepts.
- Visual components are named for the rendered surface, using concrete suffixes such as `Dialog`, `Sheet`, `Pane`, `ListItem`, `Button`, or `State`, not vague roles such as `Manager` or `Helper`.
- Use the `MD*` prefix only for shared Material-style primitives.
- `use*` exposes reactive or lifecycle-managed capabilities. `setup*` wires dependencies and cleanup. `define*` stays side-effect-light and declarative. `create*` returns a fresh owned instance. `get*` is pure lookup or derivation. `is*` is boolean. `zod*` exports schemas. `*Service` is reserved for background-side infrastructure.
- Use `on*` for component event handlers and callback bindings.
- Reserve the `$` suffix for raw RxJS observables.
- Add a child `AGENTS.md` only when a directory has local invariants, blast-radius rules, or reproducible verification guidance that the parent cannot express cleanly.
- Child `AGENTS.md` files should refine the parent rather than repeat it, and their `Contains` sections should describe stable responsibilities instead of the current file list.
- Update the `AGENTS.md` tree together with ownership, public API, dependency, or verification-boundary changes.
