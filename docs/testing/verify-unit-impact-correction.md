# Verify unit-impact correction

Status: accepted final architecture amendment for the verifier-modernization finish branch.

This document narrows and clarifies the unit-impact contract in `verify-target-architecture.md`. It exists because repeated correction rounds exposed the same ownership error in `scripts/lib/unitRisk.ts`. The correction is acceptance-driven: ownership mechanisms are resolved first, then planner implementation follows. It does not introduce a second dependency graph or a general repository dependency system.

## Problem

The original implementation used test-location prefixes to decide which changed source/support paths could be handed to `vitest related`. That conflated two different concepts:

- **Vitest test discovery** — where Vitest-owned test files are allowed to live;
- **Vitest dependency inputs** — repository files discovered tests may import through the module graph.

Repository-wide ordinary related inputs fix that class of miss, but they do not cover every real unit owner. Current Vitest tests also consume repository state outside the module graph through:

- exact file reads;
- tool/runtime config discovery;
- bounded directory/file-set scans;
- existence/absence assertions.

Those are external ownership relations. Treating only literal `readFileSync` calls as external ownership is incomplete.

## Decision

### 1. Test discovery and dependency-input eligibility are separate

Vitest-owned **test files** continue to be recognized from the actual repository `vitest.config.ts` include contract:

- `src/**/*.test.ts`;
- `config/**/*.test.ts`;
- `scripts/**/*.test.ts`;
- `scripts/**/*.test.mjs`;
- `tests/e2e/**/*.test.mjs`;
- root `playwright.*.test.ts`;
- root `eslint.config.test.ts`.

Playwright `*.spec.ts` proof is not a Vitest test merely because it is TypeScript.

These discovery roots must not be reused as the universe of source/support dependency inputs.

### 2. Ordinary current-tree module/support inputs are repository-wide

For an added or modified existing current-tree file that is a plausible ordinary module/style/support input, pass the file itself to Vitest's supported `related` resolution regardless of whether it is under `src/`, `config/`, `scripts/`, `tests/e2e/`, or repository root.

Use the narrow source/support shapes actually supported by the current repository. Known Playwright-only proof files and repository documentation are not made ordinary unit inputs by this rule.

A valid ordinary input with zero Vitest owners is allowed to produce zero related tests. Do not force full unit proof simply because the module graph has no unit owner.

### 3. Vitest owns the import graph

The verifier must not calculate, persist, or reproduce the Vitest/Vite module graph.

For ordinary inputs the verifier supplies the changed source/support path to:

```text
vitest related <inputs...>
```

Vitest determines import-reachable tests.

Do not duplicate an owner in external metadata when a real static/dynamic module relation already lets `vitest related <source>` select it.

### 4. Exact external ownership is additive

An exact external relation is justified only when a current Vitest test consumes that exact repository input outside the import graph, for example:

- direct source-text/file read;
- stable runtime/tool config discovery;
- exact existence/absence assertion.

Exact external ownership adds the owning test path to the focused related inputs. If the same source also has ordinary import consumers, the source itself is still passed to Vitest related. External ownership never suppresses the ordinary relation.

A mapping is not valid merely because a test creates or reads a temporary fixture with the same basename. Do not modify an otherwise unrelated test solely to manufacture an ownership relation that justifies planner metadata.

Current boundary examples that must be represented truthfully:

- `eslint.config.mjs -> eslint.config.test.ts` is runtime-discovered through `new ESLint({ cwd })`, not import-reachable from that test;
- `vite.config.ts -> config/viteConfigFixtureImport.test.ts` is an external direct-read owner;
- `scripts/release/viteBuildDate.test.mjs` imports `vite.config.ts` normally and therefore must remain implicit through Vitest related rather than be duplicated in the external mapping;
- root `.gitignore -> scripts/agentEnvironment.test.mjs` is valid only because the existing test genuinely reads the real repository `.gitignore`;
- an exact absent-path contract such as `src/shared/lib/md/tokens.css` being forbidden is external ownership when a test explicitly asserts that repository path does not exist.

### 5. Bounded repository scans are external set ownership

A Vitest test that scans a deterministic repository file population owns that scanned population even though there is no import edge and no single exact source mapping.

Do **not** solve this by:

- mapping every scanned file individually;
- running the full unit suite for every file under a broad root;
- creating a generated dependency graph;
- pretending the scan does not participate in impact ownership.

Represent each confirmed current scan with the smallest local rule that mirrors the test's actual bounded scan predicate and adds that exact owning test. A simple local helper/conditions in `unitRisk.ts` is sufficient; do not generalize this into a cross-lane registry framework.

Confirmed current scan owners that must be audited and represented:

1. `src/readRecoveryImportBoundary.test.ts`
   - scans production `src/**/*.{ts,vue}` excluding test files;
2. `src/features/fileSystemAccessImportBoundary.test.ts`
   - scans production `src/features/**/*.{ts,vue}` excluding test files;
3. `src/shared/ui/material/rendererBoundary.test.ts`
   - scans `src/**/*.{css,vue,ts,mts,tsx}` outside `src/shared/ui/material/**`;
4. `src/shared/ui/material/foundation/tokens.test.ts`
   - scans existing `src/shared/ui/material/components/*/tokens.css` in addition to its fixed-path inputs;
5. root `playwright.lanes.test.ts`
   - scans the current Playwright spec populations it enumerates: root application specs under `tests/e2e`, Storybook/visual/release spec subtrees, and colocated `src/**/*.browser.spec.ts` / `src/**/*.visual.spec.ts`.

These rules are additive to ordinary related resolution. If an input is both import-reachable and scanned by a boundary test, keep both owners.

For added/deleted/renamed paths, apply the scan relation when the test's own path predicate can determine ownership from the changed path. Do not require the removed file to exist in the current tree merely to recognize a deterministic scan owner.

### 6. External-ownership audit population is semantic, not syntax-specific

The final bounded audit population is all current Vitest-owned tests that can observe repository inputs **outside the Vitest module/import graph**.

Audit at least these mechanisms across the complete Vitest test population:

- `node:fs` / `node:fs/promises` reads and existence/stat/access checks against repository paths;
- `readdir*` or equivalent deterministic repository scans;
- child/tool/runtime config discovery where the test invokes a tool that loads repository configuration without importing it;
- other current external repository lookups evidenced by code.

Classify every candidate as exactly one of:

- ordinary import ownership — leave implicit to Vitest related;
- exact external ownership — add exact owner;
- bounded scan ownership — add the owning scan test through its real scan predicate;
- temporary/test-owned data — no repository ownership;
- global unit infrastructure — full-unit trigger;
- unrelated/non-unit — no unit ownership.

The audit is complete only when the declared Vitest population has been exhausted under these semantic mechanisms. Search expressions are discovery aids, not the audit boundary.

### 7. Full-unit fallback remains status/infrastructure safety

Keep full-unit triggers for actual Vitest-global infrastructure and unsafe historical relations, including:

- `vitest.config.ts`;
- `src/setupVitest.ts`;
- actual Vitest config imports that affect global execution;
- `pnpm-lock.yaml`;
- runtime-relevant/unknown `package.json`;
- deleted unit-relevant tests or ordinary dependencies whose previous relation cannot be represented safely;
- unsafe moves/renames where surviving ownership cannot be established.

Do not turn arbitrary root config files or broad scanned directories into full-unit triggers merely because an earlier planner could not represent them.

## Final ownership acceptance matrix

The final Pass C implementation must satisfy every mechanism below before it is review-ready.

| Mechanism | Representative repository case | Planner ownership | Required real-mechanism evidence |
| --- | --- | --- | --- |
| Direct changed Vitest test | `scripts/lib/unitRisk.test.ts` | select the test itself | focused unit invocation runs that test |
| Ordinary import dependency | `postcss.config.js -> config/postcss.config.test.ts` | pass source to `vitest related` | real `vitest related` selects owner |
| Cross-root ordinary import | `vite.config.ts -> scripts/release/viteBuildDate.test.mjs` | source only; no external duplicate | real `vitest related` selects owner |
| `tests/e2e/**` ordinary helper | `managedReleaseFixture.mjs -> managedReleaseFixture.test.mjs` | pass helper to `vitest related` | real `vitest related` selects owner |
| Exact direct repository read | `.github/workflows/verify.yml -> workflow tests` | add exact owning test(s) | planner + focused invocation select owners |
| Runtime/tool discovery | `eslint.config.mjs -> eslint.config.test.ts` | add exact owning test | source alone is insufficient; planner-added owner executes |
| Exact absence/existence contract | forbidden legacy repository path asserted by a test | add exact owning test when that changed path is relevant | focused invocation executes owner |
| Bounded source scan | `src/**` import-boundary tests | add exact scan-owner test according to the scan predicate | representative scanned-file change executes boundary test |
| Bounded Material token scan | `components/*/tokens.css -> foundation/tokens.test.ts` | add token scan owner | representative component token change executes owner |
| Playwright spec inventory scan | spec path -> `playwright.lanes.test.ts` | Playwright spec is not an ordinary unit input, but scan owner is selected | representative spec add/change/delete executes lane test |
| Unit-global infrastructure | `vitest.config.ts`, setup/config-global inputs | full unit | planner proof |
| Version-only `package.json` | version field only | no full unit | package-impact proof |
| Runtime/unknown `package.json` | scripts/dependencies/runtime change | full unit | package-impact proof |
| Unknown ordinary module with no unit owner | representative `.ts/.css` source | focused related input may resolve zero tests | real resolver returns zero without forcing full |
| Deleted/moved unsafe ordinary dependency | removed/renamed unit-capable source | full unless a safe external/scanned owner is deterministically representable | status-aware planner proof |
| Playwright-only proof without unit scan ownership | unrelated `*.spec.ts` | no ordinary Vitest ownership | planner proof |

## Real resolver probes are mandatory for delegated ownership

Pure `resolveUnitPlan()` assertions prove the planner's own output, but they do not prove what Vitest or another delegated tool actually resolves.

For each materially distinct ownership mechanism changed in this correction, the test-author/implementer must establish at least one representative executable probe using the real repository mechanism. In particular:

- prove ordinary import cases with actual `vitest related` selection, not only expected `relatedInputs`;
- prove an external exact owner through the final focused verifier invocation that includes the mapped owner;
- prove a bounded scan owner through a representative changed path and the final focused unit invocation;
- prove that removing an external duplicate does not remove an import-reachable owner.

Do not build permanent probe infrastructure solely for this correction. Focused commands and deterministic planner tests are sufficient when together they prove both planner output and delegated resolver behavior.

## Simplest viable alternative

The rejected approach is to keep expanding directory prefixes and exact mappings until every observed miss is patched. It duplicates facts already owned by Vitest, cannot represent set-scanning tests faithfully, and repeatedly creates new false-negative boundaries.

The chosen design remains small:

```text
Vitest include contract
→ identifies test files only

ordinary source/support change anywhere in repository
→ pass source path to Vitest related

confirmed exact non-import external input
→ add exact owner test(s)

confirmed bounded repository scan
→ add exact scan-owner test from its narrow real predicate

unsafe deleted/moved/global infrastructure relation
→ full
```

There is no second module graph and no cross-lane dependency framework.

## Required independent proof

Fresh test-author proof must reject at least:

- a root-level imported config/module being skipped;
- an import-reachable owner being redundantly required through external metadata;
- a runtime-discovered config owner being omitted;
- a `tests/e2e/**/*.test.mjs` helper dependency being skipped;
- a mapped source suppressing its normal import consumers;
- a temporary fixture being mistaken for ownership of the real repository file;
- a repository-scan boundary test being omitted for a file in its scanned population;
- a Playwright spec inventory change omitting `playwright.lanes.test.ts`;
- an exact absence/existence contract being invisible to impact planning;
- Playwright-only proof entering ordinary Vitest ownership;
- an unrelated ordinary source with zero unit owners forcing full unit proof.

The implementation must preserve direct changed-test selection, additive external owners, deletion/rename fail-closed behavior, and existing full-unit infrastructure triggers.