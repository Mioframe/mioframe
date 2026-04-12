# Project Memory Workflow

Use this workflow whenever the task touches shared infrastructure, helper semantics, CRDT or VFS flows, schema or migration behavior, service boundaries, `.project-memory/`, or another scope that already has relevant memory.

## Official Lifecycle

1. Run `pnpm memory:task:start --scope <path> --term <keyword>`.
2. Read the matched memory before behavior changes.
   The default retrieval is a compact digest: rule, avoid/mistake, use-instead/correction, trigger, and entry or stronger-artifact ref. Expanded detail is for explicit lookup or truly riskier phases.
3. Make the code or documentation change.
4. Decide what to do with any confirmed lesson:
   - update an existing memory entry;
   - create a new draft or verified entry;
   - promote the lesson into a stronger artifact and leave a breadcrumb;
   - or explicitly decide that a stronger artifact already expresses the lesson well enough.
5. Run `pnpm memory:task:finish`.

`memory:task:finish` is the official exit step. It is the place where lifecycle review and learning capture become explicit and durable.

## Task Start

Start every risky or memory-relevant task with:

```sh
pnpm memory:task:start --scope src/shared/service/fileSystem --term reread --term handle
pnpm memory:task:start --scope scripts/project-memory --term lifecycle --term learning
```

The entrypoint:

- requires the touched scope;
- derives parent scopes automatically;
- searches by exact scope, parent scope, related risky boundaries, and task terms through the same lookup model used by hooks and `memory:lookup`;
- writes `.project-memory/.task-state/current-task.json`.
- caches which compact digests were already shown so the same task does not keep paying for duplicate context.

Repo-local Codex hooks may preload similar context before you run the command, but the task-state file created by `memory:task:start` is still the canonical discovery record.

## Hook Behavior

The hook layer is intentionally assistive and early:

- `SessionStart`: loads the local project-memory workflow and active task-state context.
- `UserPromptSubmit`: infers risky scopes and terms, then preloads matching entries.
- `PreToolUse` for `Bash`: can block the first narrow class of risky Bash writes until discovery has happened.
- `Stop`: reminds the agent to run `pnpm memory:task:finish` when lifecycle or learning capture still looks open.

What changed:

- `git commit` and `git push` are no longer treated as the main enforcement point;
- `Stop` is no longer the main working mechanism for enforcement;
- the preferred path is to finish the task explicitly, not to discover missing lifecycle work at the last second.

## Finish

Finish every risky or memory-relevant task with:

```sh
pnpm memory:task:finish
```

Optional explicit resolutions:

```sh
pnpm memory:task:finish --memory-resolution keep:verified/2026-04-12-helper-rule.md
pnpm memory:task:finish --learning-resolution covered-by:src/shared/lib/changeObject/deepPatchJsonObject.test.ts
```

The exitpoint runs strict diff-aware review and then `pnpm memory:validate`. On success it writes a completion snapshot to `.project-memory/.task-state/last-finish.json` and removes `.project-memory/.task-state/current-task.json`, so only an actually active task can satisfy later lifecycle checks.

Finish also maintains the service feedback index in `.project-memory/.task-state/usage-stats.json`. That index tracks which entries were shown, which ones correlated with useful handling, which ones were noisy, and when repeated misses should raise promotion pressure.

## Learning Decision Rules

When the diff indicates a confirmed, reusable lesson, finish must end with one of these outcomes:

- a real entry under `.project-memory/drafts/`, `verified/`, `promoted/`, or `archive/` changed because you updated, created, promoted, or archived a record;
- `--learning-resolution covered-by:<artifact-path>` was supplied because a stronger artifact already carries the lesson and prose memory would duplicate it.

There is intentionally no `--learning-resolution record:<memory-path>` mode. Pointing at an unchanged older record does not count as capture; the lesson must appear as a real entry diff or be closed with `covered-by`.

Documentation or template edits alone do not count. Changing `.project-memory/README.md`, `.project-memory/WORKFLOW.md`, `.project-memory/templates/entry.md`, `.project-memory/AGENTS.md`, or task-state files must still be paired with a real entry change or an explicit learning resolution when the task produced a reusable lesson.

Typical signals that trigger this requirement:

- a test, guard, adapter, migration, schema, or `AGENTS.md` changed to fix or enforce behavior;
- a correction-style memory record matched the touched scope again;
- a trigger-based warning fired from path/helper/diff signals;
- risky code changed in a scope that has no existing breadcrumb and the diff now proves a reusable rule.

`--memory-resolution keep:<memory-path>` is only for an already-related entry that was reviewed and intentionally left unchanged. It is not enough when the task produced a new confirmed lesson.

## Correction Entries

Use `kind: correction` when future sessions need both sides of the lesson:

- what the wrong inference or action was;
- what the correct behavior is;
- where it applies;
- what evidence confirmed it;
- whether it should be promoted.

This keeps retrieval useful for “do not repeat this mistake” cases instead of only storing abstract rules.

## Promotion Rule

Promotion is expected when a lesson stops being one-off prose:

- repeated correction-style lessons should move into stronger artifacts;
- verified rules that are now enforceable should move into tests, guards, adapters, migrations, runtime checks, or `AGENTS.md`;
- promoted records should stay only as short breadcrumbs while they still help retrieval.

If the same lesson reappears and still lives only in prose, `memory:task:finish` should push the task toward promotion rather than accepting endless `keep:` decisions. After the second or third confirmed repeat, `keep:` should no longer be the default outcome unless the diff also lands the stronger artifact or archives the prose record with an explicit replacement.

## Pre-commit And Validation

Repo-local checks remain:

- `.husky/pre-commit` runs `pnpm memory:task:review --staged`;
- `.husky/pre-commit` also runs `pnpm memory:validate` for memory-system changes;
- `pnpm memory:validate` remains the structural validator for entries, workflow docs, and hook wiring.

These checks are backup review, not the primary place where the agent should first discover unfinished lifecycle work.
