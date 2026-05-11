# /

Applies to the whole repository unless a deeper `AGENTS.md` overrides it.

## Mandatory verification

Use the `verification` skill when choosing targeted checks, using fix mode, interpreting failures, or preparing the final verification report.

During implementation, use this command only when automatic formatting or lint fixes are useful:

```bash
pnpm verify --fix
```

Before reporting completion after edits, always run the read-only check:

```bash
pnpm verify
```

Do not replace the final read-only check with manually selected checks. The final verification must not use `--fix`.

If `pnpm verify` fails, fix failures caused by the change. Otherwise report the exact failing command and output, and do not claim the task is complete.

Before the final response after non-trivial implementation, use the `byterover` skill end-of-task capture gate to decide whether durable project knowledge should be curated.

Final response must include:

```text
VERIFY RESULT
command: pnpm verify
status: passed | failed | not run
reason if not run:

BRV RESULT
status: curated | skipped | failed | not available
reason:
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
- Keep files small enough for agents to reason about locally. Prefer 100-300 lines for new production implementation files, treat 300-500 lines as acceptable only when the file is cohesive, and avoid growing ordinary implementation files beyond 500 lines without a clear reason.
- Treat 500+ line implementation files as an extraction review trigger, not an automatic rewrite trigger. Before adding logic to such a file, identify its current responsibilities and extract the smallest stable unit that matches the change.
- Avoid keeping 700+ line implementation files unless they are linear, generated-like, schema-heavy, registry-like, or mostly repetitive config/test data.
- When extracting from a large or mixed-responsibility file, extract by FSD ownership first: pure logic to `shared/lib`, infrastructure to `shared/service`, domain reads to `entities`, user actions to `features`, and composition to `widgets` or `pages`.
- Do not split files by line count alone. Keep one cohesive module intact when splitting would hide invariants, create noisy pass-through modules, or make imports harder to trace.
- For Vue components, keep templates focused on declarative layout and explicit component contracts. Extract complex browser interaction state, data mapping, derived state, and persistence orchestration into named composables or pure helpers before adding more template and script complexity.
- Keep composables, helpers, and services focused on one capability. Split lifecycle setup, pure derivation, boundary validation, and storage or network side effects when they start changing for different reasons.
- Test files may be larger than production files when scenarios are uniform. Split tests by behavior when setup becomes conditional, fixtures become hard to localize, or failures no longer point to one behavior.
- For large refactors, keep behavior-preserving extraction separate from behavior changes. Verify the extraction first, then make functional changes in a smaller diff.
- Preserve FSD boundaries: `pages` compose screens, `widgets` compose larger sections, `features` own user actions, `entities` own domain reads and derived state, and `shared` stays upper-layer-free.
- When existing code already owns a non-trivial matching, parsing, filtering, or storage algorithm, reuse that implementation or extract a shared helper first; do not reimplement the same algorithm in another layer and let it drift.
- Keep ByteRover usage details in the `byterover` skill. Use `AGENTS.md` for stable repo policy, not step-by-step `brv` runbooks.
- Use the `test-first` skill for behavior changes, bug fixes, migrations, data transformations, storage semantics, and UI flows when the expected outcome can be reproduced by a focused test or smoke check.
- Do not use test-first for refactors, type-only changes, formatting, comments, renames, documentation, or internal cleanup with no observable behavior change.
- Use the `component-contract-testing` skill before adding or reviewing Vue component unit tests for small render, props, emits, slots, or child-component wiring contracts.
- Do not use component contract tests for browser behavior; use Playwright/e2e or a reproducible browser smoke check instead.
- Use the `mutation-testing` skill for high-risk changes to pure logic, schemas, migrations, storage helpers, CRDT write helpers, validation, normalization, filtering, sorting, matching, service logic, or data transformations when focused unit/integration tests were added or changed.
- Do not use mutation testing for UI component behavior, Playwright/e2e-only flows, refactors, type-only changes, formatting, comments, renames, or documentation.
- Use the `ui-browser-behavior` skill for UI changes involving real DOM layout, focus, keyboard navigation, pointer or touch input, teleport, overlays, scrolling, responsive styling, browser APIs, Material state visuals, or mobile behavior.
- Use the `crdt-storage` skill for Automerge/CRDT changes, repo or document handle lifecycle, storage helpers, VFS behavior, subscriptions, listeners, workers, timers, caches, file handles, or blob URLs.
- Verify third-party semantics from official docs or installed source before relying on ambiguous helpers, options, or return values. If the behavior is still unverified, say so.
- Keep the UI aligned with Material 3 expectations and optimize for mobile browsers first. Assume large datasets and low-end devices, and keep main-thread work bounded.
- Keep component and composable contracts narrow. Prefer IDs, primitive values, small display records, and explicit emits or slots over service bags, deeply nested configs, or mixed read/write models.
- Keep TSDoc on every public API accurate and complete. If you touch a public export that is missing TSDoc or has stale TSDoc, update it as part of the same change.
- Prefer explicit component props and named handlers over object-literal `v-bind` bags and inline template callbacks. Keep template contracts readable and mechanically checkable.
- Emitted component events should describe the user action or selection owned by that component, not a parent command. Prefer domain names such as `select*` for list or menu choices, and avoid `open*` unless the component itself opens the pane, dialog, or route.
- Keep validation, parsing, and extraction close to the contract or boundary that defines them.
- Prefer typed collection helpers over raw `Object.keys`, `Object.values`, and `Object.entries` when iterating typed records. Do not add local type assertions just to paper over iteration typing outside rare boundary adapters.
- When progress is knowable, surface progress instead of falling back to an indeterminate spinner.
- Keep unit tests colocated with the source file they verify, using sibling `*.test.ts` files. Do not introduce `__tests__` directories.

## Testing UI and Components

- Do not use unit tests as the default verification method for Vue UI components.
- Component behavior that depends on real DOM layout, focus, keyboard navigation, pointer or touch input, teleport, overlays, scrolling, responsive styling, browser APIs, or Material state visuals must be verified with Playwright/e2e or a reproducible browser smoke check.
- Use `@vue/test-utils` only for component contract tests: conditional rendering, props, emits, slots, simple child-component wiring, and connecting extracted composable or helper state to template output.
- Do not hand-roll component mounting with repeated `createApp`, manual `document.body` cleanup, ad hoc inline stubs, and `querySelector`-driven assertions.
- Prefer assertions against emitted events, props passed to stubs, slot content, and stable accessible text or labels when they are part of the component contract.
- Avoid adding `data-testid` only for unit tests unless there is no stable user-visible or component-level contract to assert.
- Move reusable UI state transitions and business rules into composables or pure helpers, and cover those with focused unit tests.
- Unit tests remain the preferred verification method for composables, pure helpers, schemas, migrations, services, storage helpers, CRDT write helpers, state transitions, validation, normalization, and pure transformations.
- The absence or removal of a Vue component unit test is not a regression by itself when the behavior is covered by Playwright/e2e, a reproducible browser smoke check, or focused tests for extracted composable or helper logic.

## CRDT and lifecycle invariants

- For CRDT-backed state, mutate live nested objects inside the owning change callback, never assign a live document object back into the same document, and prefer shared helpers such as `put`, `patch`, `deepPutJsonObject`, and `deepPatchJsonObject` when they match the write shape.
- Treat subscriptions, listeners, workers, timers, caches, file handles, and blob URLs as lifecycle-managed resources.

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
