# /

Applies to the whole repository unless a deeper `AGENTS.md` overrides it.

## Contains

- `src/app`: bootstrap, routing, global shells, and global styles.
- `src/pages`: route-level and pane-level composition plus navigation state.
- `src/widgets`: screen-scale compositions built from lower layers.
- `src/features`: user-triggered flows such as dialogs, forms, menus, and destructive actions.
- `src/entities`: domain read models, typed access patterns, and small reusable UI.
- `src/shared`: cross-layer infrastructure, background services, schemas, utilities, and shared UI.

## Patterns

- Keep changes in the layer that owns the behavior, and import through `index.ts` when a public entry point exists.
- Preserve FSD boundaries: `pages` compose screens, `widgets` compose larger sections, `features` own user actions, `entities` own domain reads and derived state, and `shared` stays upper-layer-free.
- Use ByteRover as the primary agent memory workflow in this repo. The repo-local `.project-memory/` system is currently a manual fallback for evidence-backed, project-local lessons or helper semantics that are too volatile, narrow, or implementation-shaped for `AGENTS.md`.
- Before non-trivial changes in `src/shared`, service boundaries, CRDT flows, VFS/filesystem code, schema or migration paths, helper semantics, `.project-memory/`, or any scope that may already have memory, query ByteRover first when it is available. Use `pnpm memory:task:start --scope <path> --term <keyword>` only when you intentionally fall back to the local project-memory workflow.
- Treat project-memory retrieval as token-budgeted fallback guidance, not a prose dump: prefer the compact digest first, rely on trigger-based warnings for dangerous actions, and promote repeated lessons into stronger artifacts instead of growing prose memory indefinitely.
- Repo-local Codex hooks in `.codex/` are intentionally suspended while ByteRover is the primary memory layer. If the local project-memory workflow is re-enabled later, hooks should again preload prompt-matched memory without replacing explicit task start or finish decisions.
- Use `.project-memory/WORKFLOW.md` as the canonical manual fallback procedure when the task intentionally uses `memory:task:start -> read memory -> change -> explicit learning decision -> memory:task:finish`.
- When a bug fix, review finding, stronger artifact, contradiction, or corrected wrong assumption touches an existing memory scope and you are using the local fallback workflow, update the matching `.project-memory/` entry in the same change and finish through `pnpm memory:task:finish`: refresh evidence, merge duplicates, promote to a stronger artifact, archive with explicit replacement links, or make an explicit keep or covered-by decision during task finish.
- Verify third-party semantics from official docs or installed source before relying on ambiguous helpers, options, or return values. If the behavior is still unverified, say so.
- Treat DOM parentage, scroll ownership, focus, teleport, and overlay wiring as concrete runtime contracts. Check the rendered hierarchy before moving wrappers or composition boundaries.
- Keep the UI aligned with Material 3 expectations and optimize for mobile browsers first. Assume large datasets and low-end devices, and keep main-thread work bounded.
- Keep component and composable contracts narrow. Prefer IDs, primitive values, small display records, and explicit emits or slots over service bags, deeply nested configs, or mixed read/write models.
- Keep validation, parsing, and extraction close to the contract or boundary that defines them.
- Treat subscriptions, listeners, workers, timers, caches, file handles, and blob URLs as lifecycle-managed resources.
- Prefer typed collection helpers over raw `Object.keys`, `Object.values`, and `Object.entries` when iterating typed records. Do not add local type assertions just to paper over iteration typing outside rare boundary adapters.
- For CRDT-backed state, mutate live nested objects inside the owning change callback, never assign a live document object back into the same document, and prefer shared helpers such as `put`, `patch`, `deepPutJsonObject`, and `deepPatchJsonObject` when they match the write shape.
- When progress is knowable, surface progress instead of falling back to an indeterminate spinner.

## Anti-patterns

- Do not pull dependencies upward against the intended layer direction.
- Do not bypass entity or service APIs with direct storage access or ad hoc document mutation.
- Do not duplicate schemas, type aliases, or constants across layers.
- Do not put guesses, generic advice, or facts without project evidence into `.project-memory/`.
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
- After edits, run the narrowest relevant verification. For logic changes, run at least `pnpm type-check`; add focused `vitest`, Cypress, or reproducible smoke checks for behavior, schema, service, or storage changes.
- If you intentionally use the local project-memory fallback on risky work, finish it with `pnpm memory:task:finish`. Pre-commit no longer runs `pnpm memory:task:review --staged` automatically while the fallback is suspended from default workflow.
- Run `pnpm memory:validate` after changing `.project-memory/`, project-memory workflow tooling, `.project-memory/WORKFLOW.md`, `.codex/`, or any `AGENTS.md` change that affects memory discovery, lifecycle, promotion rules, or Codex hook automation. In suspended mode it validates entries and any enabled hook wiring without requiring project-memory hooks to be active.
- Prefer targeted `oxlint`, `eslint --fix`, and `oxfmt` runs over repo-wide commands.
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
- Promote repeated `.project-memory/` findings, especially correction and review-finding lessons, into stronger artifacts such as `AGENTS.md`, tests, guards, adapters, migrations, runtime checks, or ADRs when the rule becomes stable enough to enforce there.
- Update the `AGENTS.md` tree together with ownership, public API, dependency, or verification-boundary changes.
