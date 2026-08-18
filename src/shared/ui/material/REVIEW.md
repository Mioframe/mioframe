# Review

Verdict: blocked

## Scope reviewed

- Full PR #203 Material workflow architecture and current repository integration.
- Resume/routing behavior for new families and existing legacy-staged families.
- Mechanical compatibility resolver, semantic correction marker, active review-state handling, and current Button/Loading Indicator repository state.

## Blockers

### B1 — Legacy family artifacts are indistinguishable from completed current-workflow artifacts

Owner: `material-component` workflow / compatibility routing

Problem: The new resume-first workflow treats repository artifact presence plus mechanical compatibility as durable completion, but existing legacy-staged families already contain files with the same names as new current-workflow artifacts without having been semantically derived under the new contract rules. In particular, Button and Loading Indicator have no current `contract.ts`/`BEHAVIOR.md`, while their existing `tokens.css` files come from the previous demand-scoped workflow. After API creation, the resolver can accept that legacy `tokens.css` structurally and skip the required current token-contract derivation. Existing legacy `REVIEW.md` files also use `Verdict: compliant`, while the new orchestrator treats owner-local `REVIEW.md` as active review state and only defines `ready`, `ready-with-listed-risks`, and `blocked` handling.

Evidence:
- [`.agents/skills/material-component/SKILL.md`](../../../.agents/skills/material-component/SKILL.md) — resume chooses owners from the mechanical resolver/semantic marker and does not rerun an existing compatible contract; step 10 interprets any owner-local `REVIEW.md` only through the new verdict set.
- [`components/button/tokens.css`](components/button/tokens.css) — the existing file contains only the seven previously selected contextual text-Button token defaults, yet it is structurally valid under the new root/default guard.
- [`components/button/REVIEW.md`](components/button/REVIEW.md) — legacy staged review uses `Verdict: compliant`, not the current `project-review` verdict contract.
- [`components/loadingIndicator/REVIEW.md`](components/loadingIndicator/REVIEW.md), [`components/switch/REVIEW.md`](components/switch/REVIEW.md), [`components/checkbox/REVIEW.md`](components/checkbox/REVIEW.md), and [`components/floatingActionButton/REVIEW.md`](components/floatingActionButton/REVIEW.md) — the same legacy review format remains across the implemented pre-workflow families.
- `components/button/contract.ts`, `components/button/BEHAVIOR.md`, `components/loadingIndicator/contract.ts`, and `components/loadingIndicator/BEHAVIOR.md` are absent on the current PR head, so these families are not yet converted to the three-contract workflow.

Basis:
- [`docs/architecture.md`](docs/architecture.md) — the current public family contract is not demand-scoped and completed compatible artifacts are the durable resume source of truth.
- [`docs/component-contract.md`](docs/component-contract.md) — current families are defined by `contract.ts`, complete current `tokens.css`, and `BEHAVIOR.md`; repeated runs must route only genuinely incomplete/invalid owners.
- [`docs/component-workflow.md`](docs/component-workflow.md) — the operator must not carry stage history; repository state must make resume deterministic.
- [`.agents/skills/project-review/SKILL.md`](../../../.agents/skills/project-review/SKILL.md) — active review state uses only `blocked | ready-with-listed-risks | ready` and is not legacy workflow history.

Risk: Running `material-component <legacy-family>` can skip semantic token derivation because an old demand-scoped `tokens.css` happens to satisfy the new mechanical shape, then later encounter a legacy `REVIEW.md` whose verdict has no defined transition. The result is not deterministic from repository state and can falsely treat a partially converted family as current-contract-ready.

Required final state: Repository state must mechanically distinguish legacy staged artifacts from artifacts completed under the current three-contract workflow, without operator memory or chat history. For a legacy family, `material-component <name>` must deterministically route every required current contract exactly once before implementation/migration, survive interruption between owners, and must not treat legacy `REVIEW.md` as active current `project-review` state. Current-workflow families must continue to resume without unnecessary semantic reruns.

Verification: Add resolver/orchestrator proof using a representative legacy-family fixture that starts with legacy staged artifacts plus an existing demand-scoped `tokens.css`. Prove fresh-session routing across interruption points reaches API, current token contract, behavior, implementation/migration as required without skipping or looping. Prove legacy `Verdict: compliant` review evidence is not interpreted as active current review state, while a new-format blocked `REVIEW.md` still blocks coding completion.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Do not bulk rederive all existing Material families merely to make PR #203 mergeable unless architecture proves that is the simplest complete migration strategy.
- Do not reintroduce the old staged workflow or a general workflow-history database.

## Unresolved questions

- The minimum durable discriminator between legacy `tokens.css` and a current token-contract artifact is an architecture decision. It must preserve resume determinism without turning the workflow into a status database.
