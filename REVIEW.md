# Review

Verdict: blocked

## Scope reviewed

- Verify Redesign Pass B implementation at `e4e23f46de60c8cf3fa24b2935df66c9363138af`.
- Public invocation schema/version, type selection, literal full composition, mutation transition, Storybook GitHub fallback, rerun/status behavior, help/summary output, and `.github/workflows/verify.yml` consumer migration.
- Active repository operating instructions affected by the public `--only` contract.

## Blockers

### B1 — Active repository instructions still require removed low-level `--only` values

Owner: repository workflow/instructions (`AGENTS.md` + `.agents/skills`).

Problem: Pass B correctly makes `--only` accept only the eight verification types, but active agent instructions still tell coding agents to run now-invalid low-level commands. This is not historical documentation: root rules require nested `AGENTS.md` and applicable skills to be followed as operating instructions.

Evidence:

- [`src/app/AGENTS.md`](src/app/AGENTS.md) still requires `pnpm verify --only type-check` as minimum verification.
- [`src/shared/service/AGENTS.md`](src/shared/service/AGENTS.md) still requires `pnpm verify --only type-check` and, for public service exports, `pnpm verify --only oxlint`.
- Repository search for `Minimum verification` / `type-check` finds the same removed public command pattern across many nested `src/**/AGENTS.md` files; the implementation author reported 35 such files.
- [`.agents/skills/unit-testing/SKILL.md`](.agents/skills/unit-testing/SKILL.md) still prescribes `pnpm verify --only unit-tests ...`.
- [`.agents/skills/component-contract-testing/SKILL.md`](.agents/skills/component-contract-testing/SKILL.md) still prescribes `pnpm verify --only unit-tests ...`.
- [`.agents/skills/mutation-testing/SKILL.md`](.agents/skills/mutation-testing/SKILL.md) still prescribes `pnpm verify --only unit-tests ...` before `mutation`.
- [`.agents/skills/test-first/SKILL.md`](.agents/skills/test-first/SKILL.md) still prescribes both `--only unit-tests` and `--only storybook-behavior`.
- [`scripts/verify.ts`](scripts/verify.ts) has one stale public-contract comment describing `--repeat` as resolved for `--only storybook-behavior --files ...`; the executable contract now requires `--only behavior`.

Basis:

- [`docs/testing/verify-redesign-pass-b-implementation.md`](docs/testing/verify-redesign-pass-b-implementation.md) — public `--only` accepts exactly the eight canonical types and rejects legacy low-level labels.
- [`docs/testing/migration-plan.md`](docs/testing/migration-plan.md) — verification-facing skills and repository rules must use verification types rather than durable low-level labels.
- [`AGENTS.md`](AGENTS.md) — current root/nested `AGENTS.md` and project skills are source-of-truth operating instructions and applicable rules are cumulative.

Risk: an agent following the repository's mandatory/local workflow instructions now receives commands that deterministically fail at CLI parsing. The repository therefore has two contradictory public verification contracts: executable code says type-only while active instructions tell agents to use removed labels. Pass C work would inherit broken operating instructions.

Required final state:

- Mechanically migrate every active `AGENTS.md` verification command that uses removed low-level `--only` values to the corresponding canonical type, preserving each local rule's behavioral intent. Existing `type-check`/`oxlint` minimum-verification commands belong under `--only static`.
- Update active `.agents/skills/*/SKILL.md` command examples and lane wording where it describes the public API: `unit-tests` -> `unit`, `storybook-behavior` -> `behavior`; `mutation`, `visual`, and `e2e` already match canonical type names where used as public types.
- Fix the stale `scripts/verify.ts` `--repeat` public-command comment to `--only behavior`.
- Inventory active repository instructions for `pnpm verify --only <value>` and ensure every public value is one of: `static`, `unit`, `behavior`, `visual`, `browser-integration`, `performance`, `mutation`, `e2e`.
- Do not rewrite historical migration/implementation records merely because they mention legacy labels as historical/internal identifiers.
- Do not restore legacy label parsing or add a compatibility CLI to make stale instructions work.

Verification:

- No browser/release proof is required for this correction.
- Use focused static/unit feedback only if needed for touched tooling comments/instruction compatibility.
- Final inspection/search must prove active `AGENTS.md` and `.agents/skills/*/SKILL.md` no longer prescribe removed public `--only` values.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Historical architecture/migration records may continue to mention old leaf labels where they explicitly describe past/current-internal implementation details rather than runnable public commands.
- Pass C/D/E/F implementation remains out of scope.

## Unresolved questions

None.
