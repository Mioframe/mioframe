# Review

Verdict: blocked

## Scope reviewed

- Complete Pass E result from `75277c067cca6aba30f2e0698056e4f84f48fb69` through correction HEAD `b633937801e78f45bf8fa6d577530dc1c26f025a`.
- Re-reviewed the original unit/mutation/performance implementation plus the correction for the three previous `scripts/REVIEW.md` blockers.
- The previous Vitest zero-match, Git snapshot/tsconfig unit classification, and full-mode mutation-validation findings are resolved in the current implementation.
- Remaining scope is the Pass E Stryker configuration proof and its repository type-check ownership.

## Blockers

### B1 — Pass E Stryker config proof breaks TypeScript project boundaries

Owner: `config/strykerConfig.test.ts`

Problem: Pass E added `config/strykerConfig.test.ts` to prove that `stryker.config.mjs` derives `mutate` from the explicit TypeScript registry. The test is collected as a `config/**/*.test.ts` unit test, but it imports both the root JavaScript Stryker config and `scripts/lib/mutationTargets.ts`. `config/**/*.ts` is part of both `tsconfig.node.json` and `tsconfig.storybook.json`, while the scripts registry is owned by `tsconfig.scripts.json` and the root `.mjs` config has no TypeScript declaration in those projects. The required focused static/type-check therefore fails with the reported missing-declaration/project-file-list errors. This file was introduced by Pass E at `82395eebe75484157e30cb92dc8165c368a92496`; it is not a pre-existing repository failure relative to the Pass E baseline.

Evidence:

- [strykerConfig.test.ts](strykerConfig.test.ts) — imports `../stryker.config.mjs` and `../scripts/lib/mutationTargets.ts` from a test physically owned by `config/`.
- [tsconfig.node.json](../tsconfig.node.json) — includes `config/**/*.ts` in a composite Node tooling project but does not own `scripts/lib/mutationTargets.ts`.
- [tsconfig.storybook.json](../tsconfig.storybook.json) — also includes `config/**/*.ts`, while the mutation registry remains outside that project.
- [tsconfig.scripts.json](../tsconfig.scripts.json) — owns `scripts/**/*.ts`, including the mutation registry.
- [typeCheck.mjs](../scripts/typeCheck.mjs) — repository type-check is `vue-tsc --build`, so project-reference consistency is part of the static verification contract.
- [Pass E baseline diff](https://github.com/Mioframe/mioframe/compare/75277c067cca6aba30f2e0698056e4f84f48fb69...82395eebe75484157e30cb92dc8165c368a92496) — the failing config test was added by the Pass E implementation.

Basis:

- [AGENTS.md](../AGENTS.md) — keep unit tests/helpers truthfully colocated, keep ownership explicit, prefer the minimum complete design, and do not leave required verification unresolved.
- [Pass E implementation contract](../docs/testing/verify-redesign-pass-e-implementation.md) — Stryker must consume the single TypeScript mutation registry, and touched tooling requires focused static/type-check proof plus real config-load evidence.
- [Verification skill](../.agents/skills/verification/SKILL.md) — verifier-tooling changes require the smallest faithful risk-specific proof; a failing required check is not acceptance evidence.

Risk: The Pass E branch cannot satisfy the repository static/type-check contract, so exact-head CI would remain non-green even though the three correction blockers are fixed. Widening unrelated TypeScript project file lists merely to accommodate a misplaced proof would also create unnecessary cross-project ownership.

Required final state: Keep one explicit mutation registry and keep the real Stryker native-TypeScript config-load contract, but make its durable proof compatible with existing TypeScript project ownership. Do not duplicate the registry, add a loader/transpilation layer, or broaden unrelated Node/Storybook TypeScript projects solely to host this test. Prefer the minimum complete proof surface: if the added config unit test is redundant with the registry unit tests plus the required real Stryker config-load proof, remove it; otherwise place/shape the proof under a truthful TypeScript owner so `pnpm type-check` is green without project-boundary workarounds.

Verification: Run focused unit proof for the mutation registry/config contract that remains after the correction, one smallest real Stryker/config-load proof showing the four-source inventory still loads from the TypeScript registry, and focused `static` verification over the affected proof/tooling files with `type-check` passing. No broad local `pnpm verify --full` is required.

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
