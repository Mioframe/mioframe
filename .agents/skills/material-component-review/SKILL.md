---
name: material-component-review
description: 'Use after canonical Material implementation and migration to independently review official contract extraction, exact-version renderer mapping, proof, consumers, and legacy removal.'
---

# Material component review

Perform a fresh independent semantic review of one complete Material family.

## Authority

Read applicable `AGENTS.md`, the family canonical contract, `component-adapter.md`, `component-tokens.md`, current testing ownership, current code/proof/consumers, and exact-version renderer documentation/public artifacts.

The reviewer does not implement fixes and does not write a persistent `REVIEW.md`.

## Independence

Run in a fresh context independent from the worker that authored the contract or implementation/migration.

Review the complete current family and all applicable consumers, not only the latest edit.

Do not depend on Git history, PR metadata, branch/diff state, or external checks during full review.

## Review order

1. Independently verify current official Material sources against `SOURCES.md`.
2. Compare official Material semantics with `contract.ts`, `tokens.css`, `BEHAVIOR.md`, and `GUIDANCE.md`.
3. Check that the public contract is canonical Material/Vue semantics rather than current-demand, legacy, or m3e vocabulary.
4. Compare the contract with the Vue implementation.
5. Independently inspect exact lockfile-resolved m3e docs/examples/public artifacts for every material renderer mapping, composition, mutable state and token bridge.
6. Verify controlled state has one source of truth and rejected intent cannot drift.
7. Verify public token mappings reach the correct rendered parts/states and `docs/token-api.md` matches proven runtime support.
8. Verify accessibility, keyboard/pointer/focus/native behavior, fixed geometry and motion/visual requirements at faithful observable boundaries.
9. Verify canonical stories/browser/visual fixtures use production-valid semantic content.
10. Verify all applicable consumers use the canonical API correctly and product behavior remains with product owners.
11. Verify replaced legacy implementation/exports/proof and obsolete staged family artifacts are removed.
12. Review shared-UI/test-environment blast radius and repository-rule compliance.

Automated checks prove only their covered contracts. Green verification is not semantic approval.

## Finding ownership

Route each underlying problem once:

- wrong/missing official API, token, behavior, guidance or source normalization → `contract`;
- correct contract implemented/mapped/tested/migrated incorrectly → `implementation`;
- non-deterministic ownership, cross-family composition, public-contract compromise, or workaround-growth problem → `architect`.

Do not create a separate migration route; migration corrections are owned by the implementation worker.

If two correction rounds for the same problem still reveal ownership drift, unstable contract semantics, or growing workaround logic, route to `architect`.

## Verdicts

`compliant` requires no unresolved findings.

`compliant-with-listed-risks` is only for complete work with bounded non-blocking limitations. It cannot represent missing proof, unknown consumers, incomplete migration, contract ambiguity, or deferred required work.

`blocked` must identify one earliest correction owner: `contract`, `implementation`, or `architect`.

## Operator observations

Concrete operator visual/motion/accessibility/interaction observations are evidence. Preserve them losslessly and explicitly determine whether the current result resolves them. Absence of positive operator acknowledgement is not a blocker.

## PR CI routing mode

When the architect supplies exact failed CI evidence, classify whether the failure is owned by this Material family and whether correction belongs to contract, implementation, architect, or an external workspace owner.

Do not fetch GitHub state from this worker and do not persist CI status into family contract files.

## Report

```text
MATERIAL REVIEW RESULT
family: <canonical-family>
blockers: none | <findings>
major issues: none | <findings>
minor issues: none | <findings>
accepted risks: none | <risks>
operator observations: none | <status>
required correction owner: none | contract | implementation | architect
verdict: compliant | compliant-with-listed-risks | blocked
PR/CI readiness: ready | blocked
```

## Forbidden

- Fixing production/contract files during review.
- Writing or updating family REVIEW.md.
- Reviewing only changed files/latest patch.
- Accepting renderer semantics from naming similarity or successful rendering alone.
- Accepting a CSS declaration/mapping without rendered-result proof where required.
- Accepting a screenshot as the sole oracle for fixed Material geometry.
- Accepting a legacy-to-canonical mapping because prop names/types look similar.
- Treating missing proof or unknown consumers as accepted risk.
- Depending on Git/PR/check state during full review.
- Claiming merge readiness; merge readiness belongs to the architect after exact-head CI and full PR review.
