# Verify change-classification precision

Status: architecture resolved; implementation ready.

`docs/testing/architecture.md` remains canonical for proof ownership and fail-closed planning. `docs/testing/verify-modernization.md` defines the modernization finish line. `docs/testing/verify-target-architecture.md` defines the complete target state for the remaining verifier work. This document is the implementation contract for the change-classification precision PR only.

## Goal

Eliminate confirmed browser-lane false positives caused by repository metadata living inside runtime directories, without skipping real runtime assets or introducing a generic planner.

Required result:

```text
confirmed non-runtime repository metadata
→ browser lanes ignore it

known runtime / product impact
→ existing focused ownership

unknown relevant runtime impact
→ existing full-lane fallback / invalid
```

## Confirmed current behavior and evidence

- `scripts/lib/e2eRisk.ts` treats every non-story/non-test path under broad `src/app/` and `src/shared/**` runtime domains as application-E2E relevant, protecting CSS/assets but making `src/shared/ui/material/AGENTS.md` trigger full app E2E.
- `scripts/lib/visualRisk.ts` currently excludes all `.md` files by suffix. That is too broad as a repository rule.
- `scripts/lib/storybookBehaviorRisk.ts` resolves owner-local browser specs by directory prefix, so metadata inside an owner directory can inherit browser proof unless filtered before owner-local resolution.
- `scripts/lib/storybookBuildRisk.ts` does **not** use broad owner-directory matching: it selects only explicit Storybook/build infrastructure, `.storybook/**`, story files, and runtime-relevant `package.json`. The metadata false-positive defect therefore does not apply to this lane.
- Markdown is not globally non-runtime: `PRIVACY.md` is imported with `?raw`; `docs/user/**/*.md` is imported with `import.meta.glob(..., { query: '?raw' })`.
- Current repository search found those two Markdown runtime-input mechanisms; the architecture still fails closed for unknown paths rather than assuming that this inventory is permanent.
- `tests/e2e/helpNavigation.spec.ts` exercises the real Help application surface backed by `docs/user/**`.
- `src/pages/DataStoragePrivacyPane/DataStoragePrivacyPane.test.ts` directly proves the runtime `PRIVACY.md` content/structure contract; automatic unit ownership for that external asset is intentionally deferred to the unit-impact completion PR.

## Non-goals

- Do not redesign `skip | focused | full | invalid` lane semantics.
- Do not build a generic dependency graph, generic planner, cross-lane registry, or universal path taxonomy.
- Do not change product behavior, UI, proof ownership, Playwright projects, CI topology, workers, sharding, or retries.
- Do not implement durable unit-related resolution, mutation ownership, or release-impact planning in this PR.
- Do not use a global `*.md = irrelevant` rule.
- Do not modify `storybookBuildRisk.ts` merely for symmetry: it has been audited and does not have this defect.

## Affected scenarios

1. Instruction/design metadata inside `src/shared/ui/**` must not cause app E2E, Storybook behavior, or visual execution solely because of directory location.
2. Runtime CSS/assets inside the same broad directories must retain current fail-closed browser protection.
3. `docs/user/**` changes must remain recognized as application runtime content and select the existing Help product E2E owner.
4. Unknown runtime source remains conservative; only positively identified metadata is excluded.
5. Storybook static-build selection must remain unchanged because its existing relevance model is already explicit rather than owner-directory broad.

## Boundaries and ownership

- `scripts/lib/repositoryMetadata.ts`: one pure, narrow source-of-truth predicate for repository paths proven to be non-runtime metadata.
- `scripts/lib/e2eRisk.ts`: application-E2E relevance and explicit Help runtime-content mapping.
- `scripts/lib/storybookBehaviorRisk.ts`: apply metadata exclusion before owner-local/source mapping.
- `scripts/lib/visualRisk.ts`: replace extension-wide Markdown exclusion with metadata exclusion while preserving existing test/browser-spec exclusions.
- `scripts/lib/storybookBuildRisk.ts`: audited existing owner; no implementation change required.
- Existing resolver tests own representative path-classification proof.

No product layer owns this behavior. This is verifier infrastructure only.

## State shape and public API

No persisted state and no product public API changes.

Add only a narrow verifier helper:

```ts
isNonRuntimeRepositoryMetadataPath(filePath: string): boolean
```

The predicate means only: this repository path is positively known not to participate in application/browser runtime. It must not imply that the file is irrelevant to static verification, instruction compatibility, formatting, or other lanes.

## Minimum sufficient design

The helper uses explicit repository conventions, not file-extension inference.

Initial positive metadata classes:

- any `AGENTS.md`;
- `.agents/**`;
- known repository-design basenames used as source-adjacent contracts: `ARCHITECTURE.md`, `DESIGN.md`, `REVIEW.md`;
- ordinary `README.md` outside explicitly runtime-content roots;
- `docs/testing/**`;
- `src/shared/ui/material/docs/**`.

Runtime-content exclusions have precedence over metadata conventions:

- `docs/user/**` is runtime Help content, including `docs/user/README.md`;
- `PRIVACY.md` is runtime privacy content.

Anything not positively matched as metadata continues through the current lane resolver. This keeps CSS, JSON, other runtime assets, and unknown files fail-closed where they are already relevant.

Application E2E adds `docs/user/` to the existing Help scenario ownership so Help-content changes select `tests/e2e/helpNavigation.spec.ts` rather than being globally ignored.

Visual keeps its existing explicit proof-file exclusions (`*.test.ts`, `*.browser.spec.ts`) but removes the blanket `.md` exclusion. Repository metadata is excluded through the shared predicate instead.

Storybook behavior ignores repository metadata before owner-local matching, so a colocated `AGENTS.md`, `README.md`, `ARCHITECTURE.md`, `DESIGN.md`, or `REVIEW.md` cannot select a browser spec merely by directory containment.

Storybook build stays unchanged. Its existing explicit relevance set already means repository metadata does not select a static build merely because it is inside a Storybook/UI owner.

## Browser-related lane audit

| Lane | Current metadata defect | Required action |
| --- | --- | --- |
| application E2E | yes — broad runtime-domain relevance | apply metadata exclusion; add explicit `docs/user/**` Help mapping |
| Storybook behavior | yes — owner-directory containment can inherit metadata | apply metadata exclusion before owner-local resolution |
| visual | yes — blanket `.md` exclusion is both over-broad and inconsistent | remove blanket Markdown exclusion; apply metadata predicate |
| Storybook build | no — explicit infrastructure/story relevance only | no change; preserve existing planner |

This audit is the boundary of PR 1. A browser-related planner is not modified merely to make APIs uniform.

## Simplest alternative considered

Lane-local lists in all three affected browser resolvers are simpler per file but duplicate one repository fact and can drift, which is already visible in the current mismatch between E2E, visual, and Storybook behavior. A single pure metadata predicate reduces total concepts and keeps lane semantics independent.

## Rejected approaches

- `filePath.endsWith('.md')` exclusion: rejects real runtime Markdown.
- treating all `docs/**` as metadata: `docs/user/**` is application runtime content.
- treating every file outside `src/**` as irrelevant: `PRIVACY.md` and `docs/user/**` are runtime inputs.
- introducing a general path classifier returning many semantic categories: not required for this defect.
- moving browser-lane planning into one shared resolver: would blur independent proof ownership.
- changing Storybook build relevance for symmetry: no concrete defect exists there.

## Shared UI blast radius

No shared UI production code changes. The relevant blast radius is verifier selection for files under shared UI owners. Only positively known metadata becomes browser-irrelevant; runtime source/assets keep existing ownership/fallback behavior.

## Acceptance matrix

| Changed path | Required browser impact |
| --- | --- |
| `src/shared/ui/material/AGENTS.md` | no app E2E / Storybook behavior / visual solely from this path |
| `.agents/skills/verification/SKILL.md` | no browser lane solely from this path |
| `src/shared/ui/material/components/switch/ARCHITECTURE.md` | no browser lane solely from this path |
| source-adjacent `README.md` | no browser lane solely from this path unless under a runtime-content root |
| `docs/testing/architecture.md` | no browser lane solely from this path |
| `src/shared/ui/material/docs/component-contract.md` | no browser lane solely from this path |
| `docs/user/README.md` or `docs/user/**/*.md` | focused Help application E2E |
| `PRIVACY.md` | not metadata; no artificial browser mapping added in this PR |
| `src/shared/ui/**.css` | preserve existing browser relevance/fallback |
| unknown non-test runtime asset in a broad E2E domain | preserve full app-E2E fallback |
| stories/tests/browser specs/visual specs | preserve current lane-specific ownership |
| Storybook-build explicit config/story path | preserve existing static-build selection |

## Risk matrix

- False negative from over-broad metadata rule: highest risk; prevented by positive conventions plus explicit runtime-content precedence.
- False positive remaining for an unclassified design document: acceptable until positively classified; fail-closed is preferred over guessing.
- Cross-lane drift: prevented by one narrow metadata predicate, while resolver decisions remain lane-local.
- Help runtime-content over-selection: bounded to one existing product E2E spec; no full-lane fallback is introduced.
- Unnecessary Storybook-build change: prevented by the explicit no-change audit decision.

## Required test proof

Verifier unit tests must cover:

- metadata predicate positives and runtime-content precedence;
- `AGENTS.md` no longer causing full app E2E;
- CSS/runtime assets still causing existing app-E2E fallback;
- `docs/user/**` selecting exactly `tests/e2e/helpNavigation.spec.ts`;
- visual metadata exclusion without blanket `.md` semantics;
- Storybook owner-local metadata not selecting colocated browser proof;
- combinations where a metadata file plus a real runtime change still select the runtime-owned lane normally.

Existing Storybook-build planner tests remain the proof for that unchanged lane; no new production/browser test is required solely to restate its explicit relevance model.

No new product test, browser test, visual baseline, mutation target, or performance benchmark is required for this infrastructure correction.

## Required verification

Coding work may use the smallest focused verifier tests needed for the changed resolver/helper contracts. Repository-wide verification is not a coding-agent handoff requirement; exact-head GitHub CI remains the final automatic gate.

After implementation, architect review must inspect the complete branch diff and representative planner behavior before merge readiness.

## Forbidden

- No global Markdown/doc extension skip.
- No generic planner/path-classification framework.
- No weakening of unknown-runtime full fallback.
- No duplicate per-lane metadata registries.
- No unrelated unit/mutation/release modernization.
- No retries, timeout inflation, or CI-topology changes.
- No Storybook-build refactor without a concrete planner defect.

## Implementation readiness

- goal and non-goals resolved: yes;
- ownership/source of truth resolved: yes;
- runtime Markdown exceptions confirmed against current repository imports: yes;
- Help E2E owner confirmed: yes;
- all browser-related planners audited: yes;
- Storybook-build no-change decision resolved: yes;
- unit ownership gap for `PRIVACY.md` explicitly deferred to the next impact-planning PR: yes;
- unresolved blockers: none;
- verdict: **ready**.
