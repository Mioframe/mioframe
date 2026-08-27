# Review

Verdict: blocked

## Scope reviewed

- Complete resulting PR #218 after the scripts-owned redesign was accepted through `c42cc1a09bdfee2c07f88412ee4c87951dfb3a43` and the workflow correction landed at `32af5521b271de1fca4f94740572afa70b4900ec`.
- Canonical verification contract, public CLI/type taxonomy, current migration state, Storybook discovery, generic/exceptional browser-integration, ordinary/special E2E, mutation ownership, application type/Vitest collection boundaries, develop CI, main release CI, and current developer-facing verification documentation.
- `scripts/REVIEW.md` and `.github/workflows/REVIEW.md` are resolved/removed. The final implementation topology itself has no newly discovered blocker or major issue; the remaining issue is documentation closeout of the now-executable target model.

## Blockers

None.

## Major issues

### M1 — Current developer guidance still describes removed migration/private proof concepts

Owner: `docs/testing`

Problem: the implementation and migration plan now say the target verification model is executable and legacy Storybook behavior/visual discovery is removed, but current-facing documentation still describes that compatibility as potentially executable and still summarizes proof ownership using private verifier leaf names / a generic `release verification` category. The accepted ADR also still labels the implementation as pending. This leaves contradictory repository instructions after the migration itself is complete.

Evidence:

- [`storybook.md`](storybook.md) — **Current executable compatibility** says legacy `src/**/*.browser.spec.ts`, central `tests/e2e/storybook/**/*.spec.ts`, and central legacy visual discovery may still execute, while the current Playwright configs are target-only.
- [`../../playwright.storybook.config.ts`](../../playwright.storybook.config.ts) — discovers only `src/**/*.behavior.spec.ts` and `.storybook/**/*.behavior.spec.ts` and explicitly states the legacy `*.browser.spec.ts` and central Storybook location have no remaining consumer.
- [`../../playwright.visual.config.ts`](../../playwright.visual.config.ts) — discovers only owner-local `src/**/*.visual.spec.ts` and explicitly states the central visual-spec location has no remaining consumer.
- [`migration-plan.md`](migration-plan.md) — records legacy ordinary `*.browser.spec.ts` discovery and central behavior/visual assertion ownership as compatibility already removed and not to be restored.
- [`../../DEVELOPMENT.md`](../../DEVELOPMENT.md) — its proof summary still names private leaves such as `unit-tests` / `storybook-behavior` and routes `release behavior` to `release verification` instead of the public contract-based types.
- [`verify-redesign-architecture.md`](verify-redesign-architecture.md) — front matter still says `Status: Accepted; implementation pending` even though the executable migration state is now implemented and scripts/workflow reviews are closed.

Basis:

- [`architecture.md`](architecture.md) — the public verification taxonomy is exactly `static`, `unit`, `behavior`, `visual`, `browser-integration`, `performance`, `mutation`, and `e2e`; release-sensitive proof is classified by the contract it verifies, and legacy compatibility is executable only where the migration plan records it.
- [`../../AGENTS.md`](../../AGENTS.md) — current repository documentation and rules are source of truth; obsolete/replaced paths and comments must be removed when their replacement is introduced, and repository guidance must not preserve a second architecture after migration.

Risk: future contributors or coding agents can follow a current project document and reintroduce `*.browser.spec.ts` / central Storybook proof, reason in terms of private leaf labels, or route release-sensitive browser/runtime work to a non-existent generic release proof category. That recreates the architectural drift this PR is intended to remove.

Required final state: synchronize current-facing verification documentation with the implemented target. `docs/testing/storybook.md` must state the target behavior/visual discovery is now executable and that the removed legacy discovery has no current compatibility consumer; `DEVELOPMENT.md` must summarize proof using the eight public contract types (classifying release-sensitive work by contract rather than a `release verification` category); and the accepted verify-redesign ADR status must no longer claim implementation is pending. Historical implementation/task records may remain historical and need not be rewritten.

Verification: inspect the corrected current-facing docs against `docs/testing/architecture.md`, `docs/testing/migration-plan.md`, and the current Playwright configs. References to legacy names are acceptable only when explicitly historical/forbidden, never as current executable guidance. No code, planner, runner, workflow, or public CLI change is required.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Historical `verify-redesign-pass-*`, correction, architecture-revision, and coding-agent task records do not need retroactive wording cleanup; they remain implementation history rather than current executable guidance.
- No further scripts or workflow architecture correction is required without new repository evidence.

## Unresolved questions

None.
