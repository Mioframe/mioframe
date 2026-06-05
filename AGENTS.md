# /

Applies to the whole repository unless a deeper `AGENTS.md` overrides it.

## Mandatory verification

Use the `verification` skill when choosing targeted checks, using fix mode, interpreting failures, or preparing the final verification report.

During implementation, use this command only when automatic formatting or lint fixes are useful:

```bash
pnpm verify --fix
```

For same-repository pull requests, CI may auto-commit safe mechanical fixer output produced by `pnpm ci:autofix` before the final read-only gate, but only when `BEAVER_CI_AUTOFIX_TOKEN` is configured. `pnpm ci:autofix` is limited to changed-file `oxfmt`, `oxlint --fix`, and `eslint --fix`; it must not run expensive verification gates or auto-update visual snapshots. Without that secret, CI may still run read-only verification but must not push autofix commits. Agents should still run `pnpm verify --fix` locally when useful before the final local `pnpm verify`.

Before reporting completion after edits, always run the read-only check:

```bash
pnpm verify
```

Do not replace the final read-only check with manually selected checks. The final verification must not use `--fix`.

If `pnpm verify` fails, fix failures caused by the change. Otherwise report the exact failing command and output, and do not claim the task is complete.

For local verification safety, agents may run focused checks for limited files, but must not start multiple expensive checks in parallel. Use `pnpm verify --only <label> --files ...` for focused local feedback, keep full `pnpm verify` as the completion gate, and if an expensive command is already running, inspect its logs or wait instead of starting another heavy command.

If `pnpm verify` exits because another local verification or a standalone expensive command is already active, do not rerun `pnpm verify` immediately. Run `pnpm verify:status`, inspect `.verify/logs`, and report `VERIFY RESULT: blocked by active local verification` when the final read-only gate could not start. `pnpm verify:status` reports both the verify lock and the expensive-command lock so agents can distinguish which lock is blocking.

Do not start manual e2e, visual, mutation, full lint, or full type-check commands while the local verify lock is active. `CI=true` in a local shell or container does not bypass local verification safety; only `GITHUB_ACTIONS=true` counts as GitHub Actions.

Before the final response after non-trivial implementation, use the `byterover` skill end-of-task capture gate to decide whether durable project knowledge should be curated. For trivial or documentation-only changes that create no reusable project knowledge, report `BRV RESULT: skipped` without running `brv`.

Final response must include:

```text
VERIFY RESULT
command: pnpm verify
status: passed | failed | not run | blocked by active local verification
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
- Use the `implementation-preflight` skill before non-trivial implementation work to identify owner boundaries, reuse opportunities, acceptance matrix, risk matrix, and focused verification before the first production edit.
- Before editing, identify the smallest affected FSD owner layer and read only task-relevant files plus direct imports unless the task proves wider impact.
- For cross-layer changes, write a compact owner map before production edits: source of truth, runtime owner, user-action owner, UI composition owner, error owner, retry/navigation owner, and verification owner. If any owner is unclear, stop and resolve the architecture before editing.
- Split cross-layer work into separate schema/service, entity, feature, widget, and verification passes.
- Keep changes in the layer that owns the behavior, and import through `index.ts` when a public entry point exists.
- Pages may compose panes and own route navigation state, but must not orchestrate provider/service recovery flows, permission or auth prompts, pending request registries, or duplicate entity data reads. Put provider recovery state and user actions in entities/features/widgets.
- Errors must be defined next to the boundary that owns and detects the failure. Provider failures belong next to the provider; service failures belong next to the service. Do not define a provider error in a service module only because the service supplies surrounding context.
- UI-facing display records must not expose capabilities, credentials, clients, adapters, provider instances, callbacks, or service bags. Expose these only through explicit action or recovery APIs.
- Any `DomainError` crossing a worker or service boundary must use the project service-transfer-safe constructor or transformer pattern and contain only safe serializable metadata. Do not place capabilities, clients, callbacks, provider objects, or raw external errors in `message`, `cause`, `toJSON`, diagnostics, or user-facing payloads.
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
- If CI auto-commits fixer output to a same-repository PR branch, pull or rebase before continuing local work so local diffs and final verification match the branch tip.
- CI autofix is limited to existing safe fixer output from `pnpm ci:autofix`; it requires `BEAVER_CI_AUTOFIX_TOKEN` to push, stops the old workflow run after pushing so a fresh run can validate the updated head, and must not auto-update visual snapshots, rewrite test expectations, change mutation thresholds, or perform GitHub-side review operations.
- Use the `component-contract-testing` skill for adding or reviewing Vue component unit tests for small render, props, emits, slots, or child-component wiring contracts.
- Do not use component contract tests for browser behavior; use Playwright/e2e or a reproducible browser smoke check instead.
- Use the `mutation-testing` skill for high-risk changes to pure logic, schemas, migrations, storage helpers, CRDT write helpers, validation, normalization, filtering, sorting, matching, service logic, or data transformations when focused unit/integration tests were added or changed.
- Do not use mutation testing for UI component behavior, Playwright/e2e-only flows, refactors, type-only changes, formatting, comments, renames, or documentation.
- Use the `ui-browser-behavior` skill for UI changes involving real DOM layout, focus, keyboard navigation, pointer or touch input, teleport, overlays, scrolling, responsive styling, browser APIs, Material state visuals, or mobile behavior.
- Use the `visual-regression-testing` skill for visual appearance checks, screenshot snapshots, Material visual states, responsive layout snapshots, or visual regression coverage.
- Use Storybook as the preferred component playground and visual state harness.
- Do not use Vitest, happy-dom, or Vue Test Utils for visual appearance; use Playwright screenshots against Storybook stories.
- Use the `crdt-storage` skill for Automerge/CRDT changes, repo or document handle lifecycle, storage helpers, VFS behavior, subscriptions, listeners, workers, timers, caches, file handles, or blob URLs.
- Use the `diagnostic-events` skill when adding, reviewing, or testing structured diagnostic events via `reportDiagnosticEvent`, adding enum values to `diagnosticEnums.ts`, using `sanitizeDiagnosticError`, or deciding whether `reportHandledError` or `reportDiagnosticEvent` is the right API. See also `docs/diagnostics.md`.
- Verify third-party semantics from official docs or installed source before relying on ambiguous helpers, options, or return values. If the behavior is still unverified, say so.
- Keep the UI aligned with Material 3 expectations and optimize for mobile browsers first. Assume large datasets and low-end devices, and keep main-thread work bounded.
- Keep provider adapters focused on storage operations and typed access failures. Delayed Automerge save replay belongs to Automerge persistence and repository-service coordination, while `serviceClient` keeps browser user-activation permission prompts on the main thread.
- Keep component and composable contracts narrow. Prefer IDs, primitive values, small display records, and explicit emits or slots over service bags, deeply nested configs, or mixed read/write models.
- Keep TSDoc on every public API accurate and complete. If you touch a public export that is missing TSDoc or has stale TSDoc, update it as part of the same change.
- Prefer explicit component props and named handlers over object-literal `v-bind` bags and inline template callbacks. Keep template contracts readable and mechanically checkable.
- Emitted component events should describe the user action or selection owned by that component, not a parent command. Prefer domain names such as `select*` for list or menu choices, and avoid `open*` unless the component itself opens the pane, dialog, or route.
- Keep validation, parsing, and extraction close to the contract or boundary that defines them.
- Prefer typed collection helpers over raw `Object.keys`, `Object.values`, and `Object.entries` when iterating typed records. Do not add local type assertions just to paper over iteration typing outside rare boundary adapters.
- When progress is knowable, surface progress instead of falling back to an indeterminate spinner.
- Keep unit tests colocated with the source file they verify, using sibling `*.test.ts` files. Do not introduce `__tests__` directories.
- Keep test helpers colocated with the source or tests they support, using sibling `*.testUtils.ts` files. Do not export test helpers from production barrels. Helpers that import `vitest` must stay test-only and must never be imported by production code. Create global shared test utilities only after the same helper is needed by several unrelated modules. Do not introduce ad hoc `testUtils/` folders unless the package already uses that convention or multiple helper files justify a folder.

## Styling

- Use component-scoped styles for Vue component implementation styles. Put global CSS only in app-level style modules or explicitly documented design-token/theme files.
- The root class of a Vue component must match the component name in kebab-case, for example `MDFab` -> `md-fab` and `RepositoryExplorerWidget` -> `repository-explorer-widget`.
- New Vue components must render one stable root DOM element with the component block class. Do not use a child component as the only conditional root, and do not render an empty `<template>` branch as a component root. Parent components own conditional rendering.
- When a component renders a placeholder plus teleported or floating content, keep the root class on the root DOM element and model the teleported/floating surface as a BEM element, for example `md-fab-container` with `md-fab-container__surface`.
- Use classic BEM syntax: block `block`, element `block__element`, boolean modifier `block_modifier`, key-value modifier `block_modifier_value`, element modifier `block__element_modifier`, and element key-value modifier `block__element_modifier_value`.
- Do not introduce `block--modifier` or `block__element--modifier` naming unless a local legacy component already uses that style and the task is only preserving untouched code.
- Avoid loose implementation classes that do not belong to the component block, such as `title`, `content`, or `empty-icon`. Prefer block-owned element classes such as `repository-explorer-section__title` or `md-fab__empty-icon`.
- Prefer explicit key-value modifiers when a component has multiple modifier axes, for example `md-fab_color_primary` and `md-fab_size_medium` instead of ambiguous `md-fab_primary` and `md-fab_medium`.
- Keep styling ownership local. A parent component should not style a child component's internal classes through `:deep()` unless this is an explicit integration boundary with documented blast radius. Prefer child props, slots, CSS custom properties, or parent-owned wrapper elements.
- Use project Material tokens and component custom properties before hard-coded values. Preserve Material authoring units such as `dp` and `sp` where the project token pipeline expects them; do not rewrite them to `px` only because a generic CSS reviewer suggests it.
- When a native interactive element is visually reset, restore required interaction affordances in the owning component, including an appropriate cursor for clickable enabled states and visible focus/state-layer behavior. Do not make disabled or non-action states look clickable.
- Treat shared UI style changes as blast-radius changes: inspect consumers, preserve the public visual contract by default, and update Storybook/visual coverage when appearance, layout, interaction affordance, or Material state rendering changes.

## Implementation quality gates

- Treat implementation preflight as a contract, not a planning note. Before final verification, compare the resulting diff against the preflight owner-layer plan, acceptance matrix, and risk matrix. If the diff violates the plan, either refactor it or explicitly report the remaining risk instead of claiming completion.
- For cross-layer changes, final handoff must include a short architecture check: owner map respected, dependency direction respected, no page-owned domain flow, no capability leak in UI records, errors defined at the detecting boundary, and no duplicate data reads for the same state.
- Preserve existing user scenarios unless the task explicitly removes them. When replacing a menu, navigation control, status indicator, or shared surface, list the old user actions it provided and ensure they are still reachable or intentionally removed by the task.
- Do not treat a green `pnpm verify` as architectural approval. Verification proves that automated checks passed; it does not prove FSD ownership, Material correctness, browser behavior, accessibility, or UX acceptance unless those checks were actually covered.
- Treat a failed final `pnpm verify` as a blocker. Do not present the task as complete, ready for merge, or acceptable when the final read-only verification failed, unless the user explicitly asked for a partial result.
- Treat mutation-test failures in the touched scope as actionable quality failures. Strengthen tests, reduce the mutation scope by reverting unrelated changes, or fix the implementation before final handoff; do not use passing browser or visual checks to override a failing mutation gate.
- Keep verification gates distinct. Browser and visual checks validate rendered behavior and appearance; unit, integration, and mutation checks validate logic robustness. Passing one gate does not excuse skipping or failing another gate that applies to the change.
- Keep user-facing copy in the application's established UI language. Task descriptions, design notes, and review comments may use another language; do not copy their text into product UI unless that language already matches the surrounding UI.
- After user-facing UI changes, perform a final copy-language scan of touched files and newly added UI surfaces. Remove mixed-language strings, stale task wording, and technical terms that are not already part of the surrounding product UI.
- For user-visible UI tasks, verify the primary acceptance scenario in the rendered product or a representative Storybook/browser harness before final completion. Unit or component-contract tests may support this, but they must not replace browser verification for layout, scrolling, focus, overlays, touch, or Material visual states.
- Before changing a shared UI primitive, perform a blast-radius check: inspect existing consumers, define the public API change, preserve existing behavior by default, update or add Storybook/visual/browser coverage when appearance or interaction changes, and avoid one-off props that only serve a single feature.
- Keep high-risk cross-layer work incremental. Prefer committing or verifying pure read-model changes before feature sheets, widget composition, shared UI primitives, and visual behavior changes. Do not bundle unrelated architectural changes only because they are needed by the same screen.
- Before final handoff after a refactor, scan for leftover artifacts from abandoned approaches: unused files, exports, stories, tests, feature modules, comments, and stale imports. Delete them or explain why they remain.
- Treat later user clarifications as higher-priority than earlier task text. When a domain rule in the task conflicts with a later clarification or existing project invariant, stop and align the implementation with the latest confirmed rule instead of silently choosing one.

## Testing UI and Components

- Do not use unit tests as the default verification method for Vue UI components.
- Component behavior that depends on real DOM layout, focus, keyboard navigation, pointer or touch input, teleport, overlays, scrolling, responsive styling, browser APIs, or Material state visuals must be verified with Playwright/e2e or a reproducible browser smoke check.
- Use `@vue/test-utils` only for component contract tests: conditional rendering, props, emits, slots, simple child-component wiring, and connecting extracted composable or helper state to template output.
- Use Storybook for manual component playground work and deterministic visual state coverage.
- Do not hand-roll component mounting with repeated `createApp`, manual `document.body` cleanup, ad hoc inline stubs, and `querySelector`-driven assertions.
- Prefer assertions against emitted events, props passed to stubs, slot content, and stable accessible text or labels when they are part of the component contract.
- Avoid adding `data-testid` only for unit tests unless there is no stable user-visible or component-level contract to assert.
- Move reusable UI state transitions and business rules into composables or pure helpers, and cover those with focused unit tests.
- Colocate test helpers as `*.testUtils.ts` next to the tested module or test files. Do not export test helpers from production barrels. Helpers that import `vitest` must stay test-only and must never be imported by production code. Create global shared test utilities only after the same helper is needed by several unrelated modules. Do not create ad hoc `testUtils/` folders unless the package already uses that convention or multiple helper files justify a folder.
- Unit tests remain the preferred verification method for composables, pure helpers, schemas, migrations, services, storage helpers, CRDT write helpers, state transitions, validation, normalization, and pure transformations.
- The absence or removal of a Vue component unit test is not a regression by itself when the behavior is covered by Playwright/e2e, a reproducible browser smoke check, or focused tests for extracted composable or helper logic.

## Visual regression testing

- Use Playwright screenshot assertions for appearance regressions; do not use Vitest, happy-dom, or Vue Test Utils for visual appearance.
- Use Storybook as the preferred visual harness. Render screenshots through isolated Storybook stories, not through `MainApp.vue` or the product `/playground`.
- The Storybook runtime must not inherit product app effects such as storage permission requests, diagnostics consent/reporting, optional integrations, unload guards, live performance overlays, network initialization, or product router lifecycle behavior.
- Keep stories deterministic and fixture-driven. They must not own business logic, storage orchestration, stores, or network behavior.
- Use colocated CSF stories named `<Component>.stories.ts`, add the `visual` tag to stories that are intended for screenshot coverage, and keep fixtures small and local.
- Existing product/dev playground is legacy manual-only. Do not add new visual regression surfaces there; migrate useful examples to Storybook gradually.
- Place visual specs under `tests/e2e/visual/<surface>.spec.ts` so Playwright and focused verification can discover them.
- Prefer locator screenshots of a single stable surface, component gallery, dialog, sheet, menu, or responsive layout region over full-page screenshots.
- Add visual tests only for shared UI primitives, important Material states, mobile/desktop layout regressions, previously broken visual states, or CSS-heavy components where visual regressions are likely and costly.
- Do not add visual snapshots for every component by default.
- Keep visual tests deterministic: fixed viewport, fixed fixture data, no network, no random IDs, no live dates, no loading spinners, disabled animations/transitions, settled fonts/icons/rendering, and masked dynamic regions when needed.
- Accept and update visual baselines only through the canonical stable Linux/Chromium container flow such as CI or `pnpm test:visual:update`, which runs a pinned Playwright image through Podman; treat local host-rendered diffs from other environments as advisory/debugging only.
- Do not update visual baselines from headed mode, do not hide ordinary text in screenshots, and do not loosen screenshot thresholds only to suppress text anti-aliasing noise.
- If a future test intentionally validates typography or text rendering, keep that coverage explicit and separate from generic component visual baselines.
- Do not use Storybook as an e2e runner.
- Update snapshots only after inspecting the visual diff and confirming the appearance change is intentional.

## CRDT and lifecycle invariants

- For CRDT-backed state, mutate live nested objects inside the owning change callback, never assign a live document object back into the same document, and prefer shared helpers such as `put`, `patch`, `deepPutJsonObject`, and `deepPatchJsonObject` when they match the write shape.
- Treat subscriptions, listeners, workers, timers, caches, file handles, and blob URLs as lifecycle-managed resources.

## Privacy-safe errors

- Any error that can reach `reportHandledError` must be privacy-safe by construction.
- Raw `Error` may be preserved in reportable flows only when its message is project-controlled and does not include user-controlled values.
- Errors from browser APIs, storage, network, Google API, File API, Automerge/repo internals, Zod, or any external library are untrusted by default and must be wrapped with a safe project-controlled cause message before they can reach handled diagnostics.
- Do not include local paths, virtual paths, file names, folder names, document names, document ids, file ids, Google Drive file ids, record values, document contents, or raw external error text in `Error.message`, `DomainError.message`, or `DomainError.cause.message` when the error may be reported.
- Do not add path/name/id-bearing messages to reportable error flows. Avoid messages like `Failed for <path>` or `Could not remove <name>`.
- Do not pass raw browser, filesystem, File API, File System API, Google API, IndexedDB, VFS, Automerge, Zod, or other low-level external errors as `cause` when the error may be reported. Wrap them in a project-controlled safe technical cause message instead.
- Do not pass path, name, id, URL parameters, or other user-controlled values to `reportHandledError` options, Sentry `extra`, or Sentry `tags`.
- Prefer stable domain error codes, safe user-facing messages, safe technical cause messages, and `feature` or `action` metadata.

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

## Agent environment compatibility

`AGENTS.md` files and `.agents/skills/*/SKILL.md` are the canonical source of truth for agent instructions and project skills. Claude Code reads `CLAUDE.md` and `.claude/skills` instead; these are managed compatibility files generated from the canonical sources.

- Do not duplicate project rules into `CLAUDE.md` files. Edit `AGENTS.md` or a skill `SKILL.md` instead.
- Run `pnpm verify --fix` after adding, moving, or removing an `AGENTS.md` file or a skill to regenerate the compatibility layer.
- `pnpm verify` fails when the compatibility layer is missing or stale.
