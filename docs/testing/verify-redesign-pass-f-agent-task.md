# Verify redesign — Pass F coding-agent task

## Problem and cause

The verify redesign is complete through architect-accepted Pass E. Pass F is the final bounded migration cleanup.

The canonical public verification contract is already implemented: exactly eight public verification types and literal `pnpm verify --full` for complete release-grade verification. Transitional public compatibility is still exposed in a few active consumers and current instructions:

- `package.json` still exposes `verify:release` as an alias for `node scripts/verify.ts --full`;
- `.github/workflows/release.yml` still calls that alias;
- `scripts/verify.ts --help` still advertises it;
- active current docs/comments still contain `verify:release`, private low-level `--only` examples, invalid `--full --only ...` examples, and an obsolete claim that mutation is outside full verification.

The architecture and consumer inventory are resolved in `docs/testing/verify-redesign-pass-f-implementation.md`. Do not redesign them.

## Expected final state

The repository exposes one canonical full verification entry point:

```text
pnpm verify --full
```

The public `--only` surface remains exactly:

```text
static
unit
behavior
visual
browser-integration
performance
mutation
e2e
```

Required resulting state:

1. `.github/workflows/release.yml` runs literal `pnpm verify --full --verbose` for the full `main` release gate.
2. `package.json` no longer defines `verify:release`.
3. `scripts/verify.ts --help` no longer mentions or advertises `verify:release`.
4. `.github/workflows/release-tag.yml` retains identical behavior; only stale alias commentary is corrected.
5. Active current instructions no longer tell users/agents to run `pnpm verify:release`.
6. Active current instructions no longer present `--full --only ...` as valid.
7. Active current instructions no longer present private leaf labels such as `managed-updates`, `artifact`, or `publisher-node-import` as public `--only` values.
8. Current release documentation states that `pnpm verify --full` runs the complete current verification inventory, including all registered mutation targets.
9. Internal release/artifact execution boundaries and all accepted Pass A-E behavior remain unchanged.

## Architecture decision and ownership

The public source of truth is `docs/testing/architecture.md` and the canonical CLI implemented by `scripts/verify.ts`.

Pass F removes only obsolete **public compatibility**. It does not rename or remove internal release-oriented execution that still owns real constraints.

Preserve internal mechanisms such as:

- `e2e:release`;
- release artifact build/validation scripts;
- artifact and release-smoke private verifier leaves;
- managed-update static/browser-integration/E2E proof runners;
- publisher Node import proof;
- fresh Playwright container and cross-engine execution.

These are implementation details owned by concrete runtime/build constraints, not public verification types.

## Implementation scope

Apply the minimum complete direct migration to these confirmed active-current owners:

- `.github/workflows/release.yml`;
- `.github/workflows/release-tag.yml`;
- `package.json`;
- `scripts/verify.ts`;
- `scripts/release/buildArtifact.mjs`;
- `AGENTS.md`;
- `.agents/skills/verification/SKILL.md`;
- `DEVELOPMENT.md`;
- `docs/release.md`;
- `docs/release-checklist.md`;
- `docs/managed-pinned-updates.md`.

Use repository search after editing to confirm that remaining occurrences are either historical records or intentional Pass F/migration documentation describing the removed compatibility. Do not mechanically rewrite historical release notes or architecture history.

If `scripts/verify.test.ts` or another existing test has an assertion that directly depends on removed help text, update only that assertion/proof. Do not add a new compatibility test layer.

Do not edit architect-owned Pass F control records:

- `docs/testing/verify-redesign-pass-f-implementation.md`;
- `docs/testing/verify-redesign-pass-f-agent-task.md`;
- `docs/testing/verify-redesign-current-handoff.md`;
- `docs/testing/migration-plan.md`.

## Constraints

- Keep the change behavior-preserving except for removal of the obsolete public alias/help/documentation surface.
- Do not modify verifier planning, affected selection, type ownership, full-mode semantics, fallback behavior, or command execution order.
- Do not modify Playwright project applicability, E2E ownership, mutation targets, or performance semantics.
- Do not change lock ownership, container boundaries, timeouts, logging, status/resume, profile/base handling, or fix semantics.
- Do not rename internal files/commands merely to eliminate the word `release`.
- Keep `.github/workflows/verify.yml` topology and commands unchanged unless current repository evidence shows an actual removed public compatibility consumer; private leaf names in explanatory comments are not such a consumer.
- Do not change product code or product behavior.
- Do not change test meaning.

## Acceptance criteria

All of the following must hold:

- release workflow uses `pnpm verify --full --verbose`;
- no `verify:release` package script remains;
- verifier help exposes only the canonical public contract;
- no repository workflow invokes a private/removed low-level `--only` label;
- no active current instruction advertises `verify:release`;
- no active current instruction advertises `--full --only ...`;
- no active current instruction treats private leaf labels as public verification types;
- current release docs accurately include mutation in full verification;
- retained internal release/artifact runners still have the same execution responsibilities;
- no Pass A-E accepted behavior is changed;
- no unrelated cleanup is included.

## Verification

Use only focused feedback that materially helps the implementation. Do not run a broad local completion gate that GitHub CI will repeat.

At minimum, inspect the resulting repository searches for:

- `verify:release`;
- `--full --only`;
- public command examples using private labels such as `managed-updates`, `artifact`, or `publisher-node-import`;
- workflow `pnpm verify` invocations.

Distinguish active-current instructions from historical records; historical occurrences are allowed when they clearly describe a past state or this migration itself.

For changed executable/tooling code, use the smallest relevant verifier-managed checks, for example:

```bash
pnpm verify --only unit --files scripts/verify.ts scripts/verify.test.ts
pnpm verify --only static --files scripts/verify.ts package.json scripts/release/buildArtifact.mjs
```

Run `pnpm verify --help` if useful to inspect the changed public help output. Do not run `pnpm verify --full`, old `pnpm verify:release`, or a repository-wide `pnpm verify` merely as a handoff gate.

GitHub exact-head CI is architect-owned.

## Forbidden

- Do not preserve or replace `verify:release` with another alias/deprecation wrapper.
- Do not add a ninth public verification type.
- Do not reintroduce public low-level leaf labels.
- Do not make `--full --only` or `--full --files` valid.
- Do not remove `e2e:release` or other real internal release/artifact execution boundaries.
- Do not rename private labels/runners/files for aesthetics.
- Do not alter mutation registry contents or remove mutation from full verification.
- Do not change E2E ownership, Playwright/container behavior, release runtime semantics, product behavior, or test meaning.
- Do not rewrite historical release notes/design records solely to remove old strings.
- Do not edit the architect-owned Pass F control records listed above.
- Do not run broad local final verification solely to duplicate CI.

## Stop condition

If repository inspection discovers a genuinely required executable consumer outside the confirmed inventory that cannot migrate directly from `verify:release` to `pnpm verify --full`, stop and report that concrete consumer. Do not invent compatibility plumbing.

## Report

Return exactly this shape:

```text
TASK RESULT
status: complete | partial | blocked
remaining: none | <remaining implementation/proof/blocker>

LOCAL FEEDBACK
commands: none | <focused verifier-managed commands actually useful during implementation/diagnosis>
status: not run | passed | failed | partial
reason if failed/partial: <exact reason>

CI GATE
status: architect-owned
```
