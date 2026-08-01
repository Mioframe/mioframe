---
name: commit-message-generator
description: 'Generate one strict, high-quality Conventional Commit message from the provided staged changes, diff, or change summary.'
---

# Commit Message Generator

Generate exactly ONE Git commit message.

The message must describe the primary intent and production effect of the change. Do not choose the type by file names alone.

## Output

Return raw commit message text only.

Do not include:

- markdown fences
- quotes around the message
- explanations
- alternatives
- analysis
- reasoning text
- chain-of-thought markers such as `<think>` or `</think>`

If the changes cannot be represented as one coherent commit, output exactly:

```text
split commit required
```

## Format

```text
<type>[optional scope]: <subject>

[optional body]
```

Use exactly one subject line.

## Allowed types

Use only these types:

- `feat` — a new user-visible feature or new production capability
- `fix` — a production bug fix or behavior correction
- `docs` — documentation-only change
- `style` — formatting-only change with no behavior impact
- `refactor` — production code restructuring with no intended behavior change
- `perf` — performance improvement
- `test` — test-only change
- `build` — dependency, package, build tooling, or lockfile change
- `ci` — CI workflow or CI configuration change
- `chore` — repository maintenance with no production behavior change

Never invent new types.

Invalid examples:

- `chose`
- `doc`
- `tests`
- `misc`
- `update`
- `change`

## Type selection

Classify by the primary intent of the change, not by the files present.

Tests do not determine the commit type when production code also changed. In this project, tests are expected for most production changes.

Use `test` only when the commit changes tests, mocks, fixtures, or test helpers and does not change production behavior.

Use `fix` when the change corrects broken, unsafe, stale, flaky, missing, or unintended production behavior.

Use `fix` even when the correction is implemented through:

- error handling
- lifecycle handling
- cleanup
- persistence behavior
- subscription behavior
- cache invalidation
- validation
- recovery behavior
- race-condition prevention
- stale state prevention
- missing file, directory, record, or value handling

Use `feat` only when the change adds a genuinely new user-visible capability or a new production capability that did not exist before.

Do not use `feat` for a correction, stabilization, cleanup, missing edge case, or behavior restoration.

Use `refactor` only when production code changes but intended behavior stays the same.

Use `docs` only when documentation changes and no production, test, build, or CI logic changes.

Use `build` for dependency changes, package manager changes, build tooling, or lockfile changes.

Use `ci` for CI workflow or CI configuration changes.

Use `chore` for repository maintenance that does not affect production behavior, tests, build behavior, or CI behavior.

If production code and tests changed together, choose the type from the production change. Mention tests in the body only if useful.

## Treat as `fix`

Prefer `fix` when the change:

- prevents stale state
- restores expected behavior
- fixes a broken UI state
- keeps a subscription alive after a recoverable error
- returns an error as a legitimate state instead of breaking a flow
- clears or invalidates a cache
- removes leaked or orphaned data
- removes storage files that should no longer exist
- fixes persistence after reload
- fixes delete, rename, create, or update behavior
- handles missing files, directories, records, properties, or values
- handles invalid or partial data safely
- makes recovery after an error work correctly
- fixes flaky tests by correcting application behavior

## Scope

Use a short lowercase scope when it clarifies ownership.

Prefer concrete domain scopes:

- `database`
- `repository`
- `storage`
- `google`
- `drive`
- `vfs`
- `ui`
- `e2e`
- `lint`
- `agents`
- `docs`

Omit scope if no clear single scope exists.

Do not use vague scopes:

- `misc`
- `common`
- `changes`
- `update`
- `stuff`

## Subject

Subject rules:

- use imperative mood: `add`, `fix`, `remove`, `extract`, not `added`, `fixed`, `updates`
- start lowercase after the colon
- do not end with a period
- keep the full first line under 72 characters
- prefer concrete result over implementation process
- describe what changed, not that something was changed
- avoid generic wording

Avoid vague verbs as the main information:

- `enhance`
- `improve`
- `update`
- `adjust`
- `change`
- `modify`
- `tweak`

Prefer specific verbs:

- `add`
- `fix`
- `remove`
- `rename`
- `extract`
- `split`
- `replace`
- `persist`
- `validate`
- `cache`
- `clear`
- `return`
- `preserve`
- `restore`
- `prevent`
- `dedupe`
- `normalize`

Bad subjects:

```text
feat: enhance storage adapter functionality
fix: update example document creation logic
test: enhance getRepo$ subscription behavior
docs: Add knowledge base documentation
chose: update button components and improve event handling
```

Good subjects:

```text
fix(storage): remove automerge files on document delete
fix(examples): preserve busy state during document creation
fix(repository): keep repo subscription alive after fs errors
docs(agents): add FSD ownership guidance
chore(ui): normalize button emit declarations
```

## Body

Add a body when the subject alone does not explain the change clearly.

Body rules:

- use bullet points
- wrap lines at 72 characters
- explain what changed and why it matters
- mention tests only when they clarify coverage or regression prevention
- do not repeat the subject
- do not include implementation noise unless it clarifies the behavior
- do not include agent reasoning or internal notes

Good body:

```text
fix(repository): keep repo subscription alive after fs errors

- return a recoverable empty stream instead of terminating getRepo$
- emit a repo when documents appear after the filesystem recovers
- cover the recovery path with repository service tests
```

## Multiple changes

When multiple files changed, identify the single primary goal.

Use one commit message only when all changes support that goal.

If changes are unrelated, output exactly:

```text
split commit required
```

Examples of unrelated changes:

- production bug fix plus unrelated README rewrite
- UI refactor plus unrelated dependency upgrade
- database migration plus unrelated lint rule change
- test helper rewrite plus unrelated feature implementation

## Examples

Production fix with tests:

```text
fix(repository): clear repo cache after unsubscribe

- remove cached repo observable during finalization
- allow a new repo instance to be created after idle cleanup
- cover reuse and recreation behavior in service tests
```

Production feature with tests:

```text
feat(database): add relation property descriptors

- register relation property creation through descriptors
- keep relation-specific draft validation near the descriptor
- cover relation draft creation and validation behavior
```

Test-only change:

```text
test(repository): cover repo cleanup after unsubscribe

- verify cached repo instances are released after idle timeout
- assert that a later subscription creates a fresh repo
```

Refactor with unchanged behavior:

```text
refactor(storage): extract automerge key prefix helper

- reuse the same prefix parsing in filesystem and VFS adapters
- avoid duplicating storage filename matching logic
```

Docs-only change:

```text
docs(agents): document typed record iteration rules
```

Build change:

```text
build(lint): add eslint comments plugin

- install eslint-plugin-eslint-comments
- require descriptions for disable comments
- update the lockfile for the new dependency
```

## Final validation checklist

Before output, verify:

- exactly one commit message is returned
- type is one of the allowed types
- type is based on intent, not file names
- `test` is used only for test-only changes
- `feat` is not used for a fix or stabilization
- subject is lowercase after the colon
- subject is imperative
- first line is under 72 characters
- subject has no period at the end
- wording is concrete, not generic
- body contains no reasoning, hidden notes, or agent artifacts
- no `<think>` or `</think>` appears anywhere
