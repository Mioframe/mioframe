# Review

Verdict: blocked

## Scope reviewed

- Pass F public-command / compatibility cleanup from `436e25b6e05b993ae5d86e1b316472af3fc83b97` through `df36809f7f02f4d6e03c2fd9b221e81ada91dd81`.
- Current release/public verification guidance against `docs/testing/architecture.md`, `.github/workflows/verify.yml`, and `scripts/verify.ts`.
- Full resulting PR boundaries relevant to Pass F; Pass A-E frozen accepted semantics were checked for Pass F regressions.

## Blockers

### B1 — Active release guidance still exposes stale/private verification commands and incomplete type ownership

Owner: `docs/release.md`

Problem: Pass F did not fully migrate the active release source of truth to the canonical public verification contract. The current CI description still tells readers that `verification-static` invokes `pnpm verify --verbose --only storybook-build --storybook-build-ci-fallback`, even though `storybook-build` is a private `static` leaf, the fallback is planner-internal, and current `verify.yml` invokes only public `--only static`. The full-release inventory also omits current `behavior` and generic `browser-integration` proof while claiming to describe what `pnpm verify --full` always runs, and the managed-update focused guidance mentions only `browser-integration`/`e2e` rather than its accepted `static`/`browser-integration`/`e2e` ownership.

Evidence:

- [docs/release.md](release.md) — “What CI verifies automatically” publishes the private `storybook-build` invocation and stale fallback behavior; “Full release verification” and managed-update guidance are incomplete.
- [.github/workflows/verify.yml](../.github/workflows/verify.yml) — focused CI invokes `pnpm verify --verbose --only static`; Storybook fallback is explicitly planner-internal with no public flag.
- [scripts/verify.ts](../scripts/verify.ts) — `storybook-build` maps internally to `static`; `storybook-behavior` maps to `behavior`; generic `browser-integration-local` maps to `browser-integration` and full mode runs its complete inventory.

Basis:

- [Testing architecture](testing/architecture.md) — `--only` exposes only verification types; low-level check labels remain internal; `pnpm verify --full` runs every verification type.
- [Pass F agent task](testing/verify-redesign-pass-f-agent-task.md) — active current instructions must not advertise private `--only` values or `--full --only`; release docs must describe canonical type ownership and the complete full inventory.

Risk: The canonical release source of truth still teaches an invalid command and contradicts the executable workflow, so Pass F’s public compatibility migration is incomplete. Future release or agent work can follow a command the verifier intentionally rejects or omit required proof types.

Required final state: `docs/release.md` describes current CI using only public type-level commands, explains Storybook build fallback as internal behavior without an executable private-label command, accurately describes `pnpm verify --full` as including the current `behavior` and `browser-integration` inventories, and uses `static` + `browser-integration` + `e2e` for managed-update focused ownership where that guidance is retained.

Verification: inspect `docs/release.md` against current `.github/workflows/verify.yml` and `scripts/verify.ts`; confirm no active current private `--only` command remains and the documented full/managed-update type ownership matches the canonical eight-type contract.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
