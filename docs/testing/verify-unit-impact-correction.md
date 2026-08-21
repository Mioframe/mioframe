# Verify unit-impact correction

Status: accepted architecture amendment for the verifier-modernization finish branch.

This document narrows and clarifies the existing unit-impact contract in `verify-target-architecture.md`. It exists because repeated correction rounds exposed the same ownership error in `scripts/lib/unitRisk.ts`. It does not introduce a new verifier layer or dependency model.

## Problem

The current implementation uses `UNIT_RELEVANT_PREFIXES = ['src/', 'config/', 'scripts/']` to decide which changed source/support paths may be handed to `vitest related`.

That conflates two different concepts:

- **Vitest test discovery** — where Vitest-owned test files are allowed to live, as defined by `vitest.config.ts` `test.include`;
- **Vitest dependency inputs** — repository files that discovered tests may import through the module graph.

A test under an included root may import a root-level config module or a helper under another repository root. Restricting dependency inputs to the test-discovery roots therefore creates false negatives.

Repeated examples include root-level config modules imported by Vitest tests and `tests/e2e/**/*.test.mjs` importing adjacent fixture/support modules under `tests/e2e/**`.

A second defect came from treating an exact file-as-data mapping as exclusive for mapped CSS. A mapping is an additional external ownership edge; it must not suppress a real ordinary import edge for the same source.

## Decision

### 1. Test ownership and dependency-input eligibility are separate

Vitest-owned **test files** continue to be recognized from the actual repository Vitest include contract:

- `src/**/*.test.ts`;
- `config/**/*.test.ts`;
- `scripts/**/*.test.ts`;
- `scripts/**/*.test.mjs`;
- `tests/e2e/**/*.test.mjs`;
- root `playwright.*.test.ts`;
- root `eslint.config.test.ts`.

Playwright `*.spec.ts` proof remains outside unit-test ownership.

The location rules above must not be reused as the allowed roots for source/support dependency inputs.

### 2. Ordinary current-tree module/support inputs are repository-wide

For an added or modified existing current-tree file that is a plausible ordinary module/style/support input, pass the file itself to Vitest's supported `related` resolution regardless of whether it is under `src/`, `config/`, `scripts/`, `tests/e2e/`, or repository root.

Use a narrow local set of source/support file shapes actually supported by the current repository, rather than directory ownership. The current implementation already recognizes TypeScript/JavaScript/Vue/JSON/CSS-style module inputs; the correction must preserve the needed current formats without introducing a generic repository classifier.

Known Playwright-only proof files remain excluded as unit inputs. Repository documentation/Markdown is not made unit-relevant merely by this rule.

A repository-wide ordinary source input that has no Vitest owner is allowed to produce zero related tests. This is preferable to inventing a directory allow-list or forcing full unit proof.

### 3. Vitest owns the import graph

The verifier must not calculate, persist, or reproduce the Vitest/Vite module graph.

For ordinary inputs the verifier only supplies the changed source/support path to:

```text
vitest related <inputs...>
```

Vitest determines which tests, if any, are related.

### 4. Exact external-input mappings are additive exceptions

`UNIT_FILE_AS_DATA_MAPPINGS` exists only for confirmed repository source → Vitest owner relations that Vitest related cannot discover through the real import graph.

A mapping is valid when the current repository test consumes that exact repository source outside the import relation, for example by direct source-text read or another verified external lookup.

A mapping is **not** valid merely because a test creates or reads a temporary fixture with the same basename. In particular, a synthetic temp-repository `.gitignore` does not establish ownership of the real root `.gitignore`.

When a source is both:

- an ordinary module/style/support input with real import consumers; and
- an externally consumed file-as-data input for another test,

both relations must be preserved. Add the mapped owner test(s) **and** pass the source path itself to Vitest related. Do not make mappings extension-exclusive; mapped CSS must not suppress real CSS import consumers.

### 5. External-input audit boundary

The bounded audit owns current **non-import repository-input relations**, not the whole module graph.

Audit the current Vitest test population for confirmed repository inputs that are consumed outside ordinary imports. Direct fixed-path reads are in scope, as are stable tool/config lookups only when repository evidence shows the test genuinely consumes that exact source outside the import graph.

Do not add mappings for:

- ordinary static/dynamic imports that Vitest related can resolve;
- directory scans whose ownership cannot be represented as one exact source relation;
- temporary fixtures that do not consume the real repository source;
- speculative relations inferred from names or proximity.

### 6. Full-unit fallback remains status/infrastructure safety

Keep full-unit triggers for actual Vitest-global infrastructure and unsafe historical relations, including:

- `vitest.config.ts`;
- `src/setupVitest.ts`;
- actual Vitest config imports that affect global execution;
- `pnpm-lock.yaml`;
- runtime-relevant/unknown `package.json`;
- deleted unit-relevant tests or potential ordinary dependency inputs;
- unsafe old/new sides of moves/renames where surviving ownership cannot be established.

Do not turn arbitrary root config files into full-unit triggers merely because the old directory allow-list could not represent them. If a root config is an ordinary imported test dependency, Vitest related owns it. If it is a verified external input, use the exact external mapping.

## Simplest viable alternative

The rejected approach is to keep expanding directory prefixes and exact mappings until every observed miss is patched.

That is insufficient because it duplicates facts already owned by Vitest's module graph and repeatedly creates new false-negative boundaries when a test imports across those artificial roots.

The chosen design is smaller:

```text
Vitest include contract
→ identifies test files only

existing ordinary source/support change anywhere in repository
→ pass source path to Vitest related

confirmed non-import external repository input
→ add exact owning test(s)
→ also keep ordinary related input when applicable

unsafe deleted/moved/global infrastructure relation
→ full
```

There is no second dependency graph and no cross-lane source classifier.

## Required proof

Independent unit-planner proof must reject at least:

- a root-level imported config/module being skipped because it is outside `src/config/scripts`;
- a `tests/e2e/**/*.test.mjs` source/helper dependency being skipped because the helper is under `tests/e2e/**`;
- a mapped CSS source suppressing a real ordinary import consumer;
- a temporary fixture being mistaken for ownership of the real repository file;
- Playwright-only `*.spec.ts` proof entering Vitest ownership;
- an unrelated ordinary source with zero unit owners forcing full unit proof.

The implementation must preserve direct changed-test selection, exact external-input owners, deletion/rename fail-closed behavior, and the existing full-unit infrastructure triggers.