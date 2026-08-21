# Review

Verdict: blocked

## Scope reviewed

- Directory-state architecture/preflight documentation against the current `develop` repository workflow rules.

## Blockers

None.

## Major issues

### M1 — New handoff/preflight docs retain the superseded mandatory local verification gate

Owner: `docs`

Problem: `develop` advanced after this branch was created and now makes exact-head GitHub CI the architect-owned final automatic repository gate. Coding agents may run focused verifier-managed proof when useful or specifically required, but must not be required to run a broad final `pnpm verify` solely for handoff. Both new directory-state documents still require a final coding-agent `pnpm verify`, so merging them unchanged would introduce canonical documentation that contradicts the current root workflow.

Evidence:

- [directory-state-reactivity.md](./directory-state-reactivity.md) — its acceptance section says the final coding handoff uses normal `pnpm verify`.
- [directory-state-reactivity-implementation-preflight.md](./directory-state-reactivity-implementation-preflight.md) — its verification section declares canonical `pnpm verify` the final coding-agent gate.
- [Current `develop` AGENTS.md](https://github.com/Mioframe/mioframe/blob/develop/AGENTS.md#verification-ownership) — current repository rules explicitly assign the final automatic gate to exact-head GitHub CI and prohibit mandatory broad local handoff verification.

Basis:

- [Current `develop` AGENTS.md](https://github.com/Mioframe/mioframe/blob/develop/AGENTS.md#verification-ownership) — repository instructions are the source of truth and stage-specific workflows must not reintroduce a mandatory final automatic local gate.

Risk: Future coding tasks following these new documents would receive contradictory verification ownership, duplicate CI work, and use an obsolete completion/reporting contract.

Required final state: After synchronizing the branch with current `develop`, update both directory-state documents to the current verification model: required focused/risk-specific proof remains mandatory, broad automatic local verification is not a coding-agent handoff gate, and exact-head GitHub CI is the final automatic repository gate. Do not otherwise reopen the approved architecture.

Verification: Confirm the branch is based on current `develop`, search the two documents for superseded final-`pnpm verify` wording, and let normal instruction-compatibility/exact-head CI validate the resulting repository state.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
