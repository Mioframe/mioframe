# Material 3 verification

## Principle

Material alignment must be verified at the layer where the contract exists.

Visual screenshots alone are not enough. Verification covers the relevant source lookup, library ownership, foundation dependencies, tokens, units, public APIs, native semantics, interaction states, accessibility, layout behavior, Storybook documentation, visual output, and affected consumers.

New, migrated, and materially changed public Material components follow [Component testing architecture](./component-testing.md).

## Standard component verification profile

| Layer                 | Verification                                                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture          | Verify-managed location, dependency, profile, layer, token, registry, README, and state-matrix coverage checks.                                    |
| Component contract    | Colocated Vue Test Utils tests for public API, native owner, ARIA, slots, emits, defaults, and invalid combinations.                               |
| State matrix          | One canonical Storybook `StateMatrix` containing every supported visual state and distinct state-rendering route.                                  |
| Visual regression     | Playwright screenshot assertions against the bounded state matrix or its labelled sections.                                                        |
| Browser behavior      | Storybook Playwright tests for real keyboard, focus, pointer/touch, hit testing, overlays, responsive behavior, and other browser-owned contracts. |
| Pure behavior         | Vitest tests for extracted helpers, composables, transitions, timing decisions, and cleanup when applicable.                                       |
| Consumer preservation | Focused checks for every changed existing consumer.                                                                                                |

A test layer may be `not applicable` only with an ownership-based reason in the family README. The state matrix and its visual regression are mandatory for every new or migrated public Material component.

## Verification matrix

| Changed layer                     | Expected verification                                                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Source policy or docs             | Read affected docs and check links, paths, and source authority.                                                            |
| Library boundary or relocation    | Location/dependency validation, complete consumer import migration, public export review, and removal of obsolete paths.    |
| Unit conversion                   | Focused PostCSS transform check or generated CSS inspection.                                                                |
| Reference/system tokens           | Token diff review and representative rendered surfaces when values affect UI.                                               |
| Component tokens or state routing | Contract/static validation plus affected state-matrix cells and visual baseline.                                            |
| Public component API              | TypeScript checks, contract tests, consumer migration review, and Storybook docs/controls.                                  |
| Interaction behavior              | Real browser checks through isolated Storybook fixtures. Forced visual state is not behavior proof.                         |
| Interaction appearance            | Deterministic state-matrix cells and Playwright visual regression.                                                          |
| Accessibility behavior            | Native semantics assertions plus keyboard/focus/ARIA checks in a real browser when behavior is involved.                    |
| Adaptive layout                   | Responsive browser checks and representative visual surfaces at affected contexts.                                          |
| Foundation correction/replacement | Owner tests, complete direct-consumer inventory, and representative verification for every distinct affected contract path. |
| Visual appearance                 | State-matrix screenshot diff plus human comparison with checked official Material sources.                                  |

## Required Material lookup

Before implementation, identify the relevant official Material guidance checked through:

1. `material3` MCP; or
2. `Vyachean/m3-docs-cache` fallback.

If required guidance is unavailable or incomplete, document the risk and do not claim full Material alignment.

## Storybook and visual tests

Use Storybook as the preferred harness for shared Material component documentation, browser behavior fixtures, and visual verification.

Use Playwright screenshots for visual appearance, rendered layout, and Material state regressions. Do not use Vue unit tests, happy-dom, or Vitest for visual appearance.

Every new or migrated component exposes one canonical `StateMatrix` story. The matrix is exhaustive by supported visual state and distinct rendered route, but does not duplicate equivalent size/content/configuration combinations.

Automated screenshots detect regression against an accepted baseline. They do not establish that the baseline is correct. Initial baselines and intentional baseline updates require human review against the official sources named by the component blueprint.

## Manual visual review

Human Material visual review is a merge requirement when a change creates a component, introduces its first complete state matrix, intentionally changes visual output, updates a matrix baseline, or changes an applicable foundation contract with rendered impact.

The verification report records:

```text
State matrix story: <story id>
State coverage: complete | incomplete (<gap>)
Automated visual baseline: passed | updated and inspected | not applicable (<reason>)
Human Material visual review: required | passed | blocked (<reason>)
```

An automated coding agent must report `required`, not `passed`, until a human reviewer has actually inspected and accepted the matrix or diff.

## Final verification

After implementation changes, follow the repository verification policy in `AGENTS.md`. Documentation-only policy changes may be reviewed without broad browser verification, but the final PR must state what was and was not run.

## Review checklist

For each Material UI PR, reviewers should be able to answer:

1. Which Material pages and snapshots were checked?
2. Which library, foundation, component, and product owners changed?
3. Which tokens, APIs, native semantics, or property routes changed?
4. Which supported states and accessibility behaviors are affected?
5. Does the canonical state matrix visibly cover every distinct supported visual state route?
6. Which contract, browser, visual, pure, and consumer checks prove the change?
7. Was every intentional state-matrix baseline change inspected by a human against the named official sources?
8. Are unsupported capabilities, deviations, and remaining verification gaps explicit?
