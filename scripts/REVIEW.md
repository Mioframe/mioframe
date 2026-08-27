# Review

Verdict: blocked

## Scope reviewed

- Complete scripts-owned architecture-revision implementation on PR #218 from architect handoff `f91d01fc1f3813def4709d4590b5e4e52ef0c516` through coding-agent implementation `ccd2bc0842428b3fde973afa9caf2f1a44b2aa53`.
- Canonical contract: [`../docs/testing/architecture.md`](../docs/testing/architecture.md), root [`../AGENTS.md`](../AGENTS.md), [`../.agents/skills/verification/SKILL.md`](../.agents/skills/verification/SKILL.md), and the implemented [`../docs/testing/verify-redesign-final-review-architecture-revision.md`](../docs/testing/verify-redesign-final-review-architecture-revision.md).
- Rechecked the real `buildCommands()` execution graph, release/static runners, Storybook runner/build configuration, generic and exceptional browser-integration, ordinary/special E2E, package impact, and the new E2E relevance gate.
- `ccd2bc...` correctly implements the previous handoff, including the E2E relevance gate. Deeper consumer inspection invalidated that handoff's shared-boundary assumptions. The replacement ready architecture is [`../docs/testing/verify-redesign-final-review-architecture-revision-02.md`](../docs/testing/verify-redesign-final-review-architecture-revision-02.md).

## Blockers

### B1 — Common local-command execution infrastructure is still modeled as Playwright-only

Owner: `scripts`

Problem: `playwrightExecutionRisk.ts` now centralizes the command/lock/result/signal paths for browser-backed types, but those paths are not Playwright-specific. The release build/artifact proof and Storybook static build execute through the same `localCommandGuard` / `runLocalCommand` / `processResult` boundary. A change to that low-level execution layer therefore widens behavior/visual/browser-integration/E2E but can still leave the dependent `static` build/artifact leaves skipped.

Evidence:

- [`lib/playwrightExecutionRisk.ts`](lib/playwrightExecutionRisk.ts) — owns `localCommandGuard.ts`, `commandLock.ts`, `runLocalCommand.ts`, `processResult.ts`, and `signalForward.ts` only as shared Playwright infrastructure.
- [`release/buildArtifact.mjs`](release/buildArtifact.mjs) — directly uses `runGuardedExpensiveLocalCommand`, `runLocalCommand`, and `applyProcessResult` for the production build.
- [`release/productionArtifactStaticProof.ts`](release/productionArtifactStaticProof.ts) — executes the production build through `runLocalCommand` before validating the artifact.
- [`release/managedUpdatesControllerArtifactIdentityProof.ts`](release/managedUpdatesControllerArtifactIdentityProof.ts) — uses the same local command/result boundary for managed controller artifact proof.
- [`storybook.mjs`](storybook.mjs) — Storybook build uses `runGuardedExpensiveLocalCommand`, `runLocalCommand`, and `applyProcessResult`.
- [`lib/releaseStaticRisk.ts`](lib/releaseStaticRisk.ts) and [`lib/storybookBuildRisk.ts`](lib/storybookBuildRisk.ts) — do not currently classify the shared command/lock/result/signal paths as owning those static leaves.

Basis:

- [`../docs/testing/architecture.md`](../docs/testing/architecture.md) — skipping a complete type requires deterministic evidence of irrelevance; shared support with unresolved consumer impact widens the owning type rather than silently skipping.
- [`../.agents/skills/verification/SKILL.md`](../.agents/skills/verification/SKILL.md) — shared helpers use full owning-type fallback unless the complete consumer set is explicit, small, stable, and validated.

Risk: a regression in command start, locking, signal forwarding, or result propagation can break or falsely report the release/Storybook static proof while affected `static` verification omits the proof path that actually uses the changed infrastructure.

Required final state: implement the neutral local-command execution ownership from [`../docs/testing/verify-redesign-final-review-architecture-revision-02.md`](../docs/testing/verify-redesign-final-review-architecture-revision-02.md). Playwright-specific ownership composes that shared fact; release static and Storybook static consume it directly. Do not widen unit/mutation merely because optional standalone wrappers reuse the same helpers when `buildCommands()` invokes those types directly.

Verification: representative changes to each shared local-command path must select the dependent release-static leaves, Storybook static build, and browser-backed owning types, while unit/mutation remain governed by their existing real verify execution paths.

### B2 — Vite-backed build/harness inputs still have fragmented ownership across public types

Owner: `scripts`

Problem: the latest release-static capability is broader than before, but Vite inputs are still modeled independently in release static, Storybook, browser-integration, and E2E. The real runners share root/config/static build inputs that current planners omit in different combinations. In particular, root `postcss.config.js` is a real Vite CSS build input but is absent from the latest release-static capability; generic browser-integration and ordinary E2E build the application through Vite but can skip ownerless application inputs such as `index.html`, `public/**`, and shared Vite configuration; Storybook's Vite builder also consumes the root Vite configuration but its build/behavior/visual planners carry only partial copies of that input set.

Evidence:

- [`../vite.config.ts`](../vite.config.ts) — imports `config/alias`, `config/plugins`, and `config/tooling.json`, derives build targets from the repository Browserslist configuration, and configures application/worker Vite plugins.
- [`../postcss.config.js`](../postcss.config.js) — repository PostCSS transformation configuration; Vite automatically loads project-root PostCSS configuration for CSS processing.
- [`../.storybook/main.ts`](../.storybook/main.ts) — uses `@storybook/vue3-vite` and directly consumes shared Vite aliases/tooling configuration; Storybook's Vite builder also loads/merges the root Vite configuration.
- [`../playwright.browserIntegration.config.ts`](../playwright.browserIntegration.config.ts) — generic browser-integration starts `vite build` + `vite preview` against the real application build.
- [`../playwright.config.ts`](../playwright.config.ts) — ordinary E2E also starts `vite build` + `vite preview`.
- [`lib/e2eRisk.ts`](lib/e2eRisk.ts) — relevance currently recognizes `src/**`, E2E paths, and its explicit infrastructure set, so ownerless `index.html` / `public/**` / missing shared Vite inputs can still be classified irrelevant.
- [`lib/browserIntegrationRisk.ts`](lib/browserIntegrationRisk.ts) — generic browser-integration similarly owns `src/**` colocated paths plus explicit infrastructure, not the full application Vite harness.
- [`../config/plugins/pwa.ts`](../config/plugins/pwa.ts) and [`../pwa-assets.config.ts`](../pwa-assets.config.ts) — the production PWA plugin enables external PWA-assets configuration, making that root file a real production artifact input.

Basis:

- [`../docs/testing/architecture.md`](../docs/testing/architecture.md) — global/shared configuration with broad unresolved impact must widen the truthful owning type; unknown relevant impact uses `full`, never `skip`.
- [`../AGENTS.md`](../AGENTS.md) — prefer a broader safe capability over repeated fragile mappings and return to architecture when ownership drift persists.

Risk: Vite/PostCSS/static-entry/configuration changes can alter the production or browser test harness while one or more Vite-backed public types report a deterministic skip. The same repository fact remains duplicated across several planners, so future build-config additions can drift again.

Required final state: implement one neutral Vite build/harness capability from [`../docs/testing/verify-redesign-final-review-architecture-revision-02.md`](../docs/testing/verify-redesign-final-review-architecture-revision-02.md). Existing type-specific planners consume that capability and widen only their truthful public type; ordinary production `src/**` stays with current colocated/dependency ownership rather than being routed through a new global mapping.

Verification: focused planner/integration tests must cover `config/**`, `postcss.config.js`, `.browserslistrc`, root tsconfigs, `public/**`, `index.html`, and `pwa-assets.config.ts`, including deterministic proof/test exclusions, and prove the correct static/Storybook/browser-integration/E2E widening.

### B3 — Runtime-relevant package.json does not widen the complete browser-integration type

Owner: `scripts`

Problem: exceptional browser-integration correctly treats runtime-relevant `package.json` as full, but `resolveGenericBrowserIntegrationPlan()` has no package impact refinement. The public `browser-integration` type therefore has inconsistent package ownership between its exceptional and generic execution paths.

Evidence:

- [`lib/browserIntegrationRisk.ts`](lib/browserIntegrationRisk.ts) — `resolveBrowserIntegrationPlan()` calls `isPackageJsonRuntimeRelevantChange`, while `resolveGenericBrowserIntegrationPlan()` does not accept `packageJsonOldRef` or classify `package.json`.
- [`../package.json`](../package.json) — owns the `test:browser-integration` execution script and browser/Vite/Playwright runtime dependencies; a non-version package change can alter generic browser-integration execution without a lockfile change (for example a script change).
- [`../src/entities/browserStoragePersistence/browserStoragePersistence.browser-integration.spec.ts`](../src/entities/browserStoragePersistence/browserStoragePersistence.browser-integration.spec.ts) — the generic browser-integration inventory is non-empty, so the omitted path is a real current proof owner rather than hypothetical future infrastructure.

Basis:

- [`../docs/testing/architecture.md`](../docs/testing/architecture.md) — `--only browser-integration` represents one public verification type and may narrow only when irrelevance is proven safely.
- [`../.agents/skills/verification/SKILL.md`](../.agents/skills/verification/SKILL.md) — browser-integration affected ownership must widen safely for shared runtime/config impact.

Risk: a runtime package/script change can run only the exceptional browser-integration proof while silently omitting the generic corpus, despite both belonging to the same public type.

Required final state: reuse the existing `isPackageJsonRuntimeRelevantChange` decision for both browser-integration execution paths. Runtime-relevant package changes select the complete public type; a positively confirmed top-level version-only change retains the existing narrow behavior. Do not introduce another package parser.

Verification: tests must prove runtime-relevant `package.json` selects generic + exceptional browser-integration and confirmed version-only does not widen browser proof solely because of package.json.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- The E2E relevance gate from `ccd2bc...` is accepted: target-tree/applicability validation now follows the same relevance decision as inventory/graph acquisition.
- The central exceptional release-proof inventory and focused/full/direct validation remain accepted.
- `--fix-only` early return, status-preserving mutation infrastructure handling, TypeScript-first proof entry points, generic/appUpdate browser-runner separation, ordinary structural E2E ownership, mutation registry, performance inventory, public taxonomy, and container-only Playwright remain accepted.
- Do not start `.github/workflows/REVIEW.md` correction until this scripts review is clean.

## Unresolved questions

None.
