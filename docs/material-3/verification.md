# Material 3 verification

## Principle

Verify each contract at its owning layer.

Visual screenshots alone are insufficient. Verification covers source evidence, library/foundation/component ownership, tokens, units, public API, native semantics, state and lifecycle behavior, accessibility, layout, Storybook documentation, distinct visual output, and affected consumers.

New, migrated, and materially changed public Material components follow `component-testing.md`.

## Static architecture validation

```bash
pnpm verify --only material-static
```

This runs a minimal, deterministic filesystem validator (`scripts/materialStaticValidation.mjs`) over `src/shared/ui/material`. It is a filesystem-only baseline, not a complete architecture framework: new official Material components must be created under the exact canonical `components/<family>/MD*.vue` path (diff-aware, grandfathers pre-existing legacy files, and stays disabled when no comparison base ref is available), and empty canonical directories, empty placeholder files, and an empty root barrel are rejected. It does not parse imports, exports, CSS, or Vue/TypeScript source.

Dependency-direction rules (Material must not import product layers, by alias or by relative path; generic `shared/lib` must not depend on Material; external consumers, including product-layer files, must use the Material public API instead of a deep import) are enforced through ESLint/oxlint `no-restricted-imports` overrides in `.oxlintrc.json`, as part of the existing `oxlint`/`eslint` verify steps, not this validator, and are proven by tests that execute the real lint path against fixtures.

It is a cheap, blocking check that runs in every `pnpm verify` invocation — focused and full/release — right after formatting and linting, before type-checking and any browser/visual/mutation check. It never claims to verify semantic Material correctness, visual equivalence, blueprint meaning, source interpretation, architecture profiles, production-file completeness, CSS layer order, test-artifact/story identity, or migration-residue completeness; see `token-validation.md` for the complete rule catalogue, validation-class model, and which checks remain review-driven until real migrations justify automating them.

## Standard component verification profile

| Layer                 | Verification                                                                                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture          | Static and structured checks for location, dependency direction, profile files, tokens, exports, blueprint sections, registry/map references, and test artifacts. |
| Component contract    | Colocated Vue Test Utils tests for public API, native owner, ARIA, slots, emits, defaults, controlled state, and invalid combinations.                            |
| State matrix          | One canonical Storybook `StateMatrix` containing every distinct supported component-owned visual route.                                                           |
| Visual regression     | Playwright screenshots of the bounded matrix or labelled sections.                                                                                                |
| Browser behavior      | Storybook Playwright tests for real keyboard, focus, pointer/touch, hit testing, overlays, responsive behavior, lifecycle, and other browser-owned contracts.     |
| Pure behavior         | Vitest tests for extracted helpers, composables, transitions, timing, cancellation, and cleanup when applicable.                                                  |
| Consumer preservation | Focused checks for changed existing consumers.                                                                                                                    |
| Review                | Architecture/Material review and human visual comparison when required.                                                                                           |

A layer may be `not applicable` only with an ownership-based reason. The canonical matrix and its visual regression are mandatory for every new or migrated public Material component.

Non-visual states remain in contract or browser tests rather than creating meaningless matrix cells.

## Verification matrix

| Changed layer                     | Expected verification                                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Source policy/docs                | Check links, source authority, snapshot metadata, and Design Kit references when applicable.                      |
| Library boundary/relocation       | Static location/dependency checks, complete consumer migration, public exports, and obsolete-path removal.        |
| Unit conversion                   | Focused PostCSS transform checks or generated CSS inspection.                                                     |
| Reference/system tokens           | Token diff review and representative rendered consumers when output changes.                                      |
| Component tokens/state routing    | Static/structured validation, affected distinct matrix routes, and visual baseline.                               |
| Public API/native semantics       | TypeScript, component-contract tests, browser behavior where constrained, consumer migration, and Storybook docs. |
| Interaction behavior              | Real browser actions; forced visual state is not behavior proof.                                                  |
| Interaction appearance            | Deterministic matrix routes and visual regression.                                                                |
| Accessibility                     | Native/ARIA contract tests plus real keyboard/focus/browser checks where behavior applies.                        |
| Adaptive layout                   | Responsive browser checks and representative visual contexts.                                                     |
| Foundation addition               | Owner checks plus affected component proof.                                                                       |
| Foundation correction/replacement | Complete direct consumers and representative proof for every distinct affected contract path.                     |
| Visual appearance                 | Matrix screenshot diff plus human comparison with named official sources.                                         |

## Source evidence

Use the hierarchy in `source-of-truth.md`:

1. `material3` MCP;
2. `m3-docs-cache` fallback;
3. official Material Design Kit for exact visual decisions unresolved by published docs.

If required evidence is unavailable or incomplete, narrow the supported surface or report `partial`/`blocked`. Do not claim full alignment from an existing baseline.

## Validation classes

### Static blocking

Automation proves deterministic repository facts such as:

- paths, imports, exports, and file sets;
- token syntax and canonical ownership;
- required blueprint sections and enum values;
- story identity and required test artifacts;
- migration-map, registry, and path references.

### Structured consistency

Automation may verify that records exist and point to real artifacts. It must not infer whether free-form architectural reasoning is correct.

### Review blocking

Architecture/Material review confirms:

- family and foundation ownership;
- supported-surface sufficiency;
- source interpretation and deviations;
- state/property route correctness;
- matrix route completeness and grouping equivalence;
- matrix readability;
- visual correctness against official evidence.

Automation must not claim these conclusions from Markdown or screenshots alone.

## Storybook and visual tests

Use Storybook as the preferred isolated harness for Material documentation, browser behavior fixtures, and visual verification.

Use Playwright screenshots for appearance and layout. Do not use Vue Test Utils, happy-dom, or Vitest for visual proof.

Every new or migrated component exposes one canonical `StateMatrix`. It is exhaustive by distinct supported component-owned visible output, not by every state name or equivalent size/content/configuration combination.

Automated screenshots detect regression against an accepted baseline. They do not establish that the baseline is correct.

## Manual visual review

Human Material visual review is a merge requirement when a change:

- creates a component;
- introduces its first complete matrix;
- intentionally changes visible output;
- updates a matrix baseline;
- changes an applicable foundation contract with rendered impact.

Report:

```text
State matrix story: <story id>
State coverage: complete | incomplete (<gap>)
Automated visual baseline: passed | updated and inspected | not applicable (<reason>)
Human Material visual review: required | passed | blocked (<reason>)
```

An automated coding agent reports `required`, never `passed`.

After acceptance, persist the review PR/date and source snapshot in the family blueprint.

## Final verification

After implementation, follow the repository verification policy in `AGENTS.md`.

Documentation-only architecture changes may not require focused browser changes, but the final PR must state what was and was not run. Green CI is necessary but does not replace architecture or visual review.

## Review questions

Reviewers should be able to answer:

1. Which official pages, snapshots, and Design Kit references were checked?
2. Which library, foundation, component, and product owners changed?
3. Which tokens, APIs, native semantics, property routes, or lifecycle contracts changed?
4. Which state contracts are non-visual and which distinct visual routes changed?
5. Does the canonical matrix cover every distinct supported component-owned visual route?
6. Which contract, browser, visual, pure, and consumer checks prove the change?
7. Which results are static automation and which require review judgment?
8. Was every required visual change inspected by a human?
9. Are unsupported capabilities, deviations, and remaining gaps explicit?
