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
- Write stable directory guidance in `AGENTS.md`, not temporary project snapshots.

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
