---
name: byterover
description: 'Use this skill before broad repository exploration to recall project knowledge with brv search, and before the final response after non-trivial implementation to decide whether durable knowledge must be captured with brv curate. Prefer brv search before brv query. Curate reusable lessons, pitfalls, decisions, and corrected mistakes, not transient task details.'
---

# ByteRover knowledge workflow

Use `brv` to retrieve and maintain project knowledge in `.brv/context-tree`.

`brv search` is local BM25 search and does not require an LLM provider. `brv query` and `brv curate` require a configured provider and may require authentication.

In Codex, run `brv` outside the default sandbox. `brv` starts a local daemon and uses global state directories, so sandboxed runs can hang or fail even when the project `.brv` tree is present.

## Activation

Use this skill in two places:

1. **Before broad exploration** when project decisions, prior pitfalls, architecture rules, or implementation patterns may already exist.
2. **Before the final response after non-trivial implementation** to decide whether new durable knowledge should be saved.

Do not use this skill for trivial edits when all needed context is already present and no reusable knowledge was created.

## Start-of-task retrieval

Before broad repository exploration, run local search first:

```bash
brv search "<topic>" --limit 5
```

Use focused queries that include the domain, behavior, or component being changed.

Use `brv query` only when search results are insufficient and a synthesized answer is needed:

```bash
brv query "<specific project question>"
```

Prefer reading the matched `.brv/context-tree` files directly when `brv search` returns enough context.

## End-of-task capture gate

Before the final response after non-trivial implementation, explicitly decide whether the task produced durable project knowledge.

Run `brv curate` when the task produced any of these:

- a confirmed project pitfall;
- a reusable implementation rule;
- a decision that should guide future agents;
- a repeated user correction;
- a mistake the agent made or nearly made, plus the corrected approach;
- a verified third-party or tool behavior that was previously uncertain;
- a non-obvious testing, verification, CRDT, storage, UI, FSD, or performance lesson.

Do not run `brv curate` for:

- transient task progress;
- task summaries or commit summaries;
- obvious facts already documented;
- one-off implementation details unlikely to repeat;
- general knowledge unrelated to this project;
- information that is already present and unchanged in `.brv/context-tree`.

When unsure, run `brv search` first to avoid duplicate memory:

```bash
brv search "<candidate memory topic>" --limit 5
```

Then curate only if the knowledge is new or meaningfully updated.

## Lesson format

Curate experience as lessons, not as task history.

Use this structure when saving a corrected mistake, pitfall, or reusable workflow:

```md
# Lesson: <short name>

## Trigger

When this lesson applies.

## Mistake to avoid

What the agent did wrong, nearly did wrong, or might incorrectly assume.

## Correct approach

What future agents should do instead in this project.

## Verification

How to check the correct behavior or avoid regression.

## Applies to

Relevant paths, layers, commands, skills, or task types.
```

Example lesson content:

```md
# Lesson: Prefer browser checks for DOM-dependent Vue behavior

## Trigger

Changing Vue UI behavior involving focus, teleport, scroll, overlays, pointer/touch input, responsive layout, or Material visual states.

## Mistake to avoid

Do not add Vue component unit tests for behavior that depends on real browser layout or interaction semantics.

## Correct approach

Use the ui-browser-behavior skill and verify with Playwright/e2e or a reproducible browser smoke check. Extract pure state transitions to composables/helpers only when they can be tested without browser semantics.

## Verification

Run the focused Playwright spec or document the browser smoke check, then run final pnpm verify.

## Applies to

Vue components in pages, widgets, features, entities UI, and shared UI.
```

Curate the lesson content, optionally with source files when they add important context. Include at most five project-scoped files:

```bash
brv curate "<lesson content>" -f src/example/file.ts
```

## Capture quality

Curated knowledge must be short, reusable, and project-specific.

Good entries include:

- the trigger that makes the lesson relevant;
- the mistake, pitfall, or wrong assumption to avoid;
- the correct project-specific approach;
- the verification method;
- where it applies;
- source files when needed.

Bad entries include:

- task summaries;
- commit summaries;
- vague statements such as "fixed tests";
- duplicated rules already present in `AGENTS.md` or skills;
- implementation details without a reusable lesson.

## Final response requirement

After implementation work, include a BRV result in the final response:

```text
BRV RESULT
status: curated | skipped | failed | not available
reason:
```

Use:

- `curated` when `brv curate` saved or proposed durable knowledge;
- `skipped` when you intentionally decided no durable knowledge was produced;
- `failed` when `brv` should have been used but failed;
- `not available` when `brv` is not installed, not authenticated, unavailable in the environment, or cannot run outside the sandbox.

## Review pending changes

If `brv curate` reports pending review operations, inspect them before final response:

```bash
brv review pending
```

Do not approve or reject critical pending memory changes without user approval.

## Version control and sync

The project may sync `.brv/context-tree` through Codex hooks. Do not manually run `brv vc push`, `brv vc pull`, or remote sync commands unless the user explicitly asks or a BRV sync task requires it.

## Error handling

If `brv` fails:

- `Not authenticated` or `Token has expired`: report that authentication is required.
- `No provider connected`: run `brv providers` if available and report the missing provider.
- `Connection failed` or daemon crash: report that the user should stop the stale `brv` process.
- Missing arguments: run `brv <command> --help` and retry with corrected arguments.
- File errors: use project-relative paths and include no more than five files.

Do not block task completion solely because optional curation failed, but report the failure in `BRV RESULT`.
