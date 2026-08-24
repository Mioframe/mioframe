# Review

Verdict: blocked

## Scope reviewed

- Verify Redesign Pass B implementation at `e4e23f46de60c8cf3fa24b2935df66c9363138af`.
- Public invocation schema/version, type selection, literal full composition, mutation transition, Storybook GitHub fallback, rerun/status behavior, help/summary output, and `.github/workflows/verify.yml` consumer migration.
- Architect-owned repository instruction synchronization after the public `--only` contract changed.

## Blockers

None.

## Major issues

### M1 — `scripts/verify.ts` retains stale public type-CLI wording

Owner: `scripts/verify.ts`.

Problem: executable Pass B behavior is correct, but two code comments still describe the previous public label contract:

- the `--repeat` comment says it is resolved for `--only storybook-behavior --files ...`; the public command is now `--only behavior --files ...`;
- `getVerifyRerunCommand()` documents its overrides as "profile and label overrides" even though the public override is `onlyType`.

Risk: these comments sit directly next to the new type-based implementation and can mislead later verifier maintenance back toward the removed label API.

Required final state:

- update the `--repeat` comment to the canonical `behavior` public type;
- update rerun-command JSDoc to say type, not label;
- inspect code/test comments in the Pass B verifier scope for other runnable public `pnpm verify --only <legacy-label>` examples and remove any remaining stale examples;
- keep internal leaf-label terminology where it truthfully describes private labels for logs, weights, locks, planner entries, or result mapping;
- no executable behavior or assertion changes.

Verification:

- focused unit/static feedback only if useful for touched code comments;
- no browser, artifact, managed-updates, mutation, or full run is required for comment-only correction.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Historical migration/implementation records may continue to mention old leaf labels where they explicitly describe past or internal implementation details rather than runnable public commands.
- Pass C/D/E/F implementation remains out of scope.

## Resolved during architect-owned repository preparation

- All 35 active nested `src/**/AGENTS.md` minimum-verification commands were migrated from removed `type-check`/`oxlint` public labels to the canonical `static` type while preserving local intent.
- Active testing skills now use canonical public type commands (`unit`, `behavior`, `mutation`, `e2e`) rather than removed low-level labels.

## Unresolved questions

None.
