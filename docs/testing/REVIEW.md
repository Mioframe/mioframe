# Review

Verdict: blocked

## Scope reviewed

- PR #213 full head: V3C-A Lists proof ownership, testing workflow documentation, verification ownership rules, Material workflow integration, version materialization, and affected Lists component/browser/visual proof.

## Blockers

### B1 — V3C-A acceptance still assigns the final repository gate to the coding workflow

Owner: `docs/testing`

Problem: `docs/testing/migration-plan.md` still requires V3C-A focused proof to be "followed by final automatic `pnpm verify`". The current repository verification ownership explicitly removed that coding-agent handoff gate: coding agents own code-focused feedback and narrow risk-specific proof, while exact-head GitHub CI is the architect-owned automatic repository gate.

Evidence:

- [migration-plan.md](./migration-plan.md) — V3C-A `Acceptance` still requires `final automatic pnpm verify` after focused proof.
- [v3c-visual-proof-ownership.md](./v3c-visual-proof-ownership.md) — the current V3C-A completion boundary explicitly says not to send the coding agent back for repository-wide verification and assigns the automatic gate to exact-head CI.

Basis:

- [Testing architecture](./architecture.md) — local verification is implementation feedback/contract proof; exact-head PR CI is the authoritative repository gate and coding agents do not duplicate the broad gate merely for completion.
- [Verification skill](../../.agents/skills/verification/SKILL.md) — coding agents do not own a mandatory final `pnpm verify`; exact-head GitHub CI is the architect-owned final automatic repository verification gate.
- [Root agent rules](../../AGENTS.md) — stage-specific workflows must not reintroduce a mandatory final automatic local verification run for coding-agent completion.

Risk: the executable migration plan contradicts the canonical ownership model and can route future V3C work back to the coding agent solely to duplicate CI, recreating the workflow failure this PR is intended to remove.

Required final state: V3C-A acceptance requires its explicit focused/risk-specific proof and measurements, while the final automatic repository gate is exact-head GitHub CI. No coding-agent-wide final `pnpm verify` requirement remains.

Verification: re-read `migration-plan.md`, `architecture.md`, root `AGENTS.md`, and the verification skill together and confirm they assign the same owners; CI then validates the published head mechanically.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None beyond the bounded legacy Lists exception already recorded in `v3c-visual-proof-ownership.md`.

## Items not required

- Further cleanup of legacy `MDList.browser.spec.ts` implementation-specific proof before the canonical Material List migration.

## Unresolved questions

None.
