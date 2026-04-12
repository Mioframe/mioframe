# Project Memory Workflow

Use this workflow whenever the task touches shared infrastructure, helper semantics, CRDT or VFS flows, schema or migration behavior, or `.project-memory/` itself.

## Task Entrypoint

Start every risky or memory-relevant task with the mandatory entrypoint:

```sh
pnpm memory:task:start --scope src/shared/service/fileSystem --term reread --term handle
pnpm memory:task:start --scope scripts/project-memory --term workflow --term diff
```

The entrypoint:

- requires the exact touched `--scope`;
- derives the parent subsystem automatically;
- searches memory by exact scope, parent subsystem, and task terms;
- prints the best matches in a task-friendly summary;
- stores `.project-memory/.task-state/current-task.json` so the exit review can verify that discovery happened.
- is complemented by repo-local Codex hooks that preload prompt-matched memory and continue the turn when risky lifecycle work is still open.

Use raw `pnpm memory:lookup` only as a follow-up search once the task has already started.

## Procedure

1. Determine the touched scope before editing.
2. Run `pnpm memory:task:start --scope <path> --term <keyword>`.
3. Read the best matches before making behavior changes.
4. Decide whether the existing entry should be refreshed, merged, promoted, archived, or intentionally kept unchanged.
5. Finish through `pnpm memory:task:finish`.

## Codex Hook Layer

When the repo is opened in a trusted Codex project, `.codex/config.toml` enables `codex_hooks` and `.codex/hooks.json` wires four documented events:

- `SessionStart`: loads the repo memory workflow and any active task-state matches into developer context.
- `UserPromptSubmit`: infers risky scopes and task terms from the prompt, expands to boundary scopes from existing entries, and preloads matching memory into developer context.
- `PreToolUse` for `Bash`: blocks a narrow set of risky write-like shell commands or `git commit` / `git push` when memory lifecycle handling is still missing.
- `Stop`: runs diff-aware memory review and continues the turn once when risky lifecycle handling is still unresolved.

These hooks are assistive, not absolute enforcement. Current Codex only documents `PreToolUse` / `PostToolUse` Bash interception, and the docs explicitly note that non-shell tools can bypass it. The authoritative lifecycle still lives in `memory:task:start`, `memory:task:finish`, pre-commit, and CI.

## Commands

Start with the task entrypoint:

```sh
pnpm memory:task:start --scope src/shared/service/fileSystem --term reread --term handle
pnpm memory:task:start --scope src/shared/lib/changeObject --term deepPatchJsonObject
```

Review the current diff at any point:

```sh
pnpm memory:task:review
pnpm memory:task:review --staged
```

Finish the task through the exitpoint:

```sh
pnpm memory:task:finish
pnpm memory:task:finish --memory-resolution keep:promoted/2026-04-12-vfs-directory-reread-after-create.md
```

## Decision Rules

- A new `draft` is justified only when the diff proves a concrete rule through a test, bug fix, review finding, reproducible runtime behavior, or another evidence item that will still help the next agent.
- If an existing record already covers the rule and scope, merge evidence into it instead of creating a duplicate.
- If the diff confirms or sharpens an existing rule, refresh that record instead of creating a sibling note.
- Move a record to `verified` only after focused tests, multiple independent evidence items, or code plus authoritative source support the rule.
- Move a record to `promoted` only in the same change that lands the stronger artifact and keeps the promoted file as a short breadcrumb.
- Move a record to `archived` when it is obsolete, contradicted, merged into another entry, or superseded by a better record. Add `archive-reason` and reciprocal `supersedes` or `superseded-by` links when replacement is involved.
- If the knowledge is already clearly captured in code, tests, guards, migrations, schemas, or `AGENTS.md`, do not create a new prose record.

## Promotion Bias

Prefer stronger artifacts over prose when the rule can live in:

- `AGENTS.md`
- focused tests
- guards or adapters
- migrations or schemas
- runtime boundary checks

Keep promoted entries as breadcrumbs only. Delete them later when the stronger artifact is directly discoverable without memory.

## Task Exitpoint

Finish every risky or memory-relevant task with:

```sh
pnpm memory:task:finish
```

The exitpoint:

- inspects the diff for touched scopes and risky zones;
- finds related memory entries by scope overlap;
- checks whether those entries were refreshed, promoted, archived, or explicitly kept during the local task review;
- warns when a risky diff may justify a new draft but the evidence still needs human judgment;
- runs `pnpm memory:validate`;
- fails loudly when risky work skipped discovery, when touched existing memory scopes were not lifecycle-reviewed, or when updated live records did not refresh `last-verified-at`.
- is mirrored by the Codex `Stop` hook, which can continue the task loop once with a concrete remediation prompt instead of ending silently.
