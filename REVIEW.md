# Review

Verdict: blocked

## Scope reviewed

- PR #217 root dependency manifest and lockfile changes.

## Blockers

None.

## Major issues

None.

## Minor issues

### m1 — Lockfile contains unrelated Google Drive type dependency drift

Owner: repository dependency manifest/lockfile

Problem: PR #217 intentionally adds `@tanstack/vue-virtual`, but the lockfile also advances the unrelated transitive `@maxim_mazurok/gapi.client.drive-v3` resolution from `0.3.20260809` to `0.3.20260819` while the corresponding direct `@types/gapi.client.drive-v3` manifest dependency is unchanged.

Evidence:

- [package.json](./package.json) — the relevant dependency intent is the new `@tanstack/vue-virtual` dependency; the Google Drive type dependency declaration is unchanged.
- [pnpm-lock.yaml](./pnpm-lock.yaml) — contains the unrelated `@maxim_mazurok/gapi.client.drive-v3` transitive resolution update in addition to TanStack entries.

Basis:

- [root repository rules](./AGENTS.md) — work only in task-relevant scope and prefer the minimum complete design for confirmed requirements.

Risk: unrelated dependency resolution drift increases PR blast radius and makes dependency provenance/review less precise, even though it is currently dev/type-only and exact-head static verification passes.

Required final state: the PR lockfile contains only dependency changes required by the intended manifest change and release/version mechanics; unrelated Google Drive type resolution drift is removed unless a current requirement explicitly needs it.

Verification: regenerate or minimally restore the lockfile consistently with `package.json`, then run the normal dependency/static feedback and cumulative branch gate.

## Accepted risks

None.

## Items not required

- Any Google Drive runtime or type upgrade as part of PR #217.

## Unresolved questions

None.
