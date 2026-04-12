# Project Memory

`.project-memory/` is a small, repo-local memory layer for evidence-backed lessons that are useful across sessions but are not yet best enforced as code, tests, guards, adapters, migrations, schemas, or stable `AGENTS.md` rules.

This system is intentionally local. It does not depend on GitHub Actions or any server-side workflow. The operating loop is:

- start risky work with `pnpm memory:task:start`;
- let repo-local Codex hooks preload relevant context and nudge discovery before risky edits;
- make the change;
- finish with `pnpm memory:task:finish`;
- let pre-commit and `pnpm memory:validate` recheck repo-local consistency.

The important change is that `memory:task:finish` is now the explicit learning checkpoint. It is where the task must either capture new confirmed experience or say why no new prose memory is needed.

## Layout

- `templates/entry.md`: the write template.
- `drafts/`: fresh, evidence-backed lessons that are still narrow.
- `verified/`: confirmed lessons that future sessions should retrieve.
- `promoted/`: short breadcrumbs for lessons that now live in a stronger artifact.
- `archive/`: obsolete, merged, contradicted, redundant, or superseded records.

Directory and `status` must match:

- `drafts/` -> `status: draft`
- `verified/` -> `status: verified`
- `promoted/` -> `status: promoted`
- `archive/` -> `status: archived`

## What Belongs Here

- Project-local helper or library semantics whose real runtime behavior is easy to misread from types alone.
- Confirmed bug-fix lessons, review findings, and agent corrections that are likely to help the next session.
- Narrow invariants that matter, but are still too volatile or local for stable `AGENTS.md`.
- Breadcrumbs that help retrieval after a rule has already been promoted into a stronger artifact.

## What Does Not

- Guesses, hunches, or notes without evidence.
- Generic advice that is not Beaver-specific.
- Debugging scraps that are not likely to matter again.
- Duplicates of knowledge that is already clearer in code, tests, guards, adapters, migrations, schemas, or `AGENTS.md`.

## Entry Contract

Every record is one Markdown file with YAML frontmatter.

Required fields:

- `scope`
- `kind`
- `rule`
- `why`
- `evidence`
- `status`
- `confidence`
- `promotion-target`
- `review-trigger`
- `last-verified-at`

Optional but formalized fields:

- `mistake`: the wrong conclusion or action that happened.
- `correction`: the correct behavior or conclusion.
- `applies-when`: contexts, helpers, boundaries, or failure shapes where the lesson matters.
- `supersedes`
- `superseded-by`
- `archive-reason`

Use `kind: correction` when the record should preserve the original wrong inference as well as the fix. `correction` entries must include `mistake`, `correction`, and `applies-when`.

## Learning Capture

The system is not meant to log everything. It only captures confirmed, reusable lessons.

At task finish, a risky task must make one explicit learning decision when the diff indicates reusable experience:

- update or create a `.project-memory` entry;
- promote the lesson by editing the stronger artifact and leaving a promoted breadcrumb;
- explicitly finish with `--learning-resolution covered-by:<artifact-path>` when the lesson is already better expressed in a stronger artifact and new prose memory would be duplication.

Existing memory scopes still require lifecycle handling:

- refresh the touched entry;
- promote or archive it;
- or explicitly keep it with `--memory-resolution keep:<memory-path>` if the entry remains correct and no stronger action is justified.

`keep:` is for lifecycle review of an already-related entry. It does not replace learning capture when the task produced a new confirmed lesson.

## Promotion Rules

Keep one-off local lessons in `.project-memory/` only while prose is the best place for them.

Promote when one of these becomes true:

- the lesson is repeated;
- the lesson can now be enforced in a test, guard, adapter, migration, schema, runtime check, or `AGENTS.md`;
- future agents are safer discovering the rule from code than from prose memory.

After promotion:

1. Land the stronger artifact in the same change.
2. Move or update the memory record to `promoted/`.
3. Keep the promoted body short and breadcrumb-like.
4. Archive or delete the breadcrumb later when the stronger artifact is obviously discoverable on its own.

Repeated correction-style lessons should not stay indefinitely as prose-only memory.

## Retrieval

Retrieval is optimized for not repeating mistakes across sessions:

- exact scope and parent scope matches still rank highest;
- term matches now search `mistake`, `correction`, `applies-when`, evidence text, and the body;
- correction-style records get a ranking boost so past wrong inferences surface early;
- prompt-time lookup expands to boundary-linked scopes from existing memory.

This means a past bug fix or review finding in the same helper, boundary, or subsystem should show up before new behavior changes begin.

## Repo-Local Automation

Repo-local Codex hooks live in `.codex/` and call the scripts in `scripts/project-memory/`.

What they do:

- preload task-relevant memory on session start and prompt submit;
- block the first narrow class of risky Bash writes when discovery has not happened yet;
- remind the agent at stop-time to run `pnpm memory:task:finish` if lifecycle or learning capture is still unresolved.

What they do not do:

- they do not replace `memory:task:start` or `memory:task:finish`;
- they do not rely on GitHub Actions;
- they do not treat `git commit` or `git push` as the main enforcement point;
- they do not auto-write memory.

The goal is guidance before risky edits and one clear exit step, not surprise punishment at the end.

## Commands

Start:

```sh
pnpm memory:task:start --scope src/shared/service/fileSystem --term reread --term handle
```

Review:

```sh
pnpm memory:task:review
pnpm memory:task:review --staged
```

Finish:

```sh
pnpm memory:task:finish
pnpm memory:task:finish --memory-resolution keep:promoted/2026-04-12-vfs-directory-reread-after-create.md
pnpm memory:task:finish --learning-resolution covered-by:src/shared/lib/typeGuards/isDirectoryHandle.ts
```

Validate:

```sh
pnpm memory:validate
```
