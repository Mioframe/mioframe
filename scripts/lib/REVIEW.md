# Review

Verdict: blocked

## Scope reviewed

- PR #216 release-impact planning and execution ownership against the current production build pipeline, Vite/PWA configuration, release-spec execution inventory, and accepted verifier target architecture.
- Current `releaseRisk.ts`, `vite.config.ts`, `buildArtifact.mjs`, Vite/PostCSS/Browserslist runtime discovery, PWA asset generation inputs, release runners, and planner proof.

## Blockers

### B1 — Release-impact still omits real production-build inputs outside the static config-module boundary

Owner: `scripts/lib/releaseRisk.ts` / release-impact architecture

Problem: the latest correction closes release-spec execution ownership and the statically imported `config/plugins/**` surface, but its production-build ownership population is still incomplete. The real release build consumes repository inputs through tool/runtime discovery and file-as-data in addition to TypeScript imports. At least four current production-build inputs are outside every release-impact mapping/fallback and therefore resolve to `skip`: `.browserslistrc`, `postcss.config.js`, `pwa-assets.config.ts`, and `public/favicon.svg`.

Evidence:

- [`../../scripts/release/buildArtifact.mjs`](../release/buildArtifact.mjs) runs the real local `vite build` for the production release artifact.
- [`../../vite.config.ts`](../../vite.config.ts) derives `build.target` with `browserslistToEsbuild(undefined, { path: process.cwd() })`. With no explicit query, `browserslist-to-esbuild` searches the project Browserslist configuration; the repository owns that input at [`.browserslistrc`](../../.browserslistrc).
- Vite 7's documented default PostCSS behavior searches the project root for a supported PostCSS config when no inline `css.postcss` is supplied. The repository's [`postcss.config.js`](../../postcss.config.js) therefore changes production CSS transformation for the release build.
- [`../../config/plugins/pwa.ts`](../../config/plugins/pwa.ts) passes `pwaAssets: { config: true, overrideManifestIcons: true }` to `VitePWA` for production PWA builds. vite-plugin-pwa documents that `config: true` searches the project root for `pwa-assets.config.*`; the repository owns [`pwa-assets.config.ts`](../../pwa-assets.config.ts), which in turn names [`public/favicon.svg`](../../public/favicon.svg) as the PWA asset source.
- [`releaseRisk.ts`](./releaseRisk.ts) currently treats only `config/alias.ts`, `config/vueCustomElements.ts`, and `config/plugins/**` as the bounded production Vite-config surface; its full exact set/prefixes and narrow mappings do not include any of the four inputs above. They therefore reach the final `skip` result.
- [`../../docs/testing/verify-release-impact-static-cleanup.md`](../../docs/testing/verify-release-impact-static-cleanup.md) declares Pass E implemented/accepted, but this real build-input population was not part of the correction proof.

Authoritative tool evidence:

- Browserslist documents that a missing query loads project config and that `.browserslistrc` is a config source: https://github.com/browserslist/browserslist/blob/main/README.md
- `browserslist-to-esbuild` documents that no explicit config causes it to search `package.json` / `.browserslistrc`: https://github.com/marcofugaro/browserslist-to-esbuild
- Vite 7 documents that `css.postcss` defaults to searching the project root for PostCSS config: https://v7.vite.dev/config/shared-options#css-postcss
- vite-plugin-pwa documents that `pwaAssets.config: true` searches root `pwa-assets.config.*`: https://vite-pwa-org.netlify.app/assets-generator/integrations

Basis:

- [`../../docs/testing/verify-target-architecture.md`](../../docs/testing/verify-target-architecture.md) requires actual production/release build configuration and production assets that affect artifact semantics to select their truthful release checks, and requires unknown significant release inputs to fail closed rather than silently skip.
- [`../../AGENTS.md`](../../AGENTS.md) requires the minimum complete design, explicit source-of-truth ownership, and correction of the underlying design rather than symptom patches.
- [`../../.agents/skills/implementation-preflight/SKILL.md`](../../.agents/skills/implementation-preflight/SKILL.md) now explicitly requires impact-planner audits to cover ownership mechanisms such as runtime/tool discovery and file-as-data, with a closed audit population rather than a hand-written example list.

Risk: a change to the canonical browser support baseline, PostCSS production transforms, PWA asset-generator configuration, or the actual PWA source icon can pass ordinary PR verification without any source-impact release check. This defeats the PR's fail-closed contract at the production artifact boundary. Adding only these four paths would repeat the same failure mode: the previous correction already missed an ownership mechanism by defining the population from known examples/static imports rather than the complete current build-input mechanisms.

Required final state: stop patching individual missed paths and redo the release-impact production-build ownership decision. Define a bounded, reviewable current population that covers every mechanism by which the production release build consumes repository-owned configuration/artifact inputs: static config imports, tool-discovered configuration, and exact file-as-data/artifact sources. Then choose the minimum release-local representation that keeps ownership explicit and fail-closed without introducing a generic dependency graph or broad `config/**` taxonomy. The resulting planner must not classify a real production-build input as irrelevant merely because it is not imported by `vite.config.ts`.

Verification: the revised architecture/preflight must state the closed production-build input population and completion criterion. Independent proof must include representative real resolver/tool evidence for each ownership mechanism, plus planner cases proving `.browserslistrc`, `postcss.config.js`, `pwa-assets.config.ts`, and `public/favicon.svg` cannot resolve `skip`; a nearby genuinely unrelated root/tooling path must remain negative. Preserve the corrected release-spec execution inventory, unknown-check validation, artifact timeout contract, and CI topology. After implementation/re-review, require exact-head `verification-release` and aggregate `verify` CI success.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- A generic dependency graph, universal config registry, or broad `config/**` release fallback is not required by this finding.

## Unresolved questions

None.
