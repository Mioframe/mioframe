---
name: material-component-review
description: 'Use after standalone implementation and separate migration complete to independently review the API, token and behavior contracts plus family usage guidance against material3 MCP, the exact m3e mapping, proof, consumers and legacy removal.'
---

# Material component review

Perform one fresh independent semantic review of the complete resulting Material family.

## Authority

Read applicable `AGENTS.md`, `component-contract.md`, `component-adapter.md`, `component-tokens.md`, the three canonical technical contracts, family `README.md`, current runtime/proof/consumers, current testing ownership, and exact lockfile-resolved m3e documentation/public artifacts.

For official Material facts and guidance, independently query the repository-configured `material3` MCP server. Do not rely on previous worker reports as Material authority.

## Independence

Run in a fresh context independent from API-contract, token-contract, behavior-contract, guidance, implementation and migration workers.

Review the complete current family and all applicable consumers, not only the latest edit.

Do not depend on Git history, PR metadata, branch/diff state or external checks during full review.

Review does not fix production/definition files and does not write a persistent `REVIEW.md`.

## Review order

1. Query Material 3 MCP for the public parameters/props, slots, events, values/defaults and compare them with `contract.ts`.
2. Query Material 3 MCP for official component tokens and compare them with `tokens.css`.
3. Query Material 3 MCP for observable behavior, states, keyboard, accessibility, geometry and motion and compare them with `BEHAVIOR.md`.
4. Query Material 3 MCP for component description, when-to-use/when-not-to-use guidance, variant/configuration guidance, content guidance, consumer accessibility responsibilities, adaptive guidance and related-component distinctions; compare them with family `README.md`.
5. Verify complete applicable Material source coverage was established for each definition artifact. Do not treat a detail Material leaves unspecified after complete coverage as a missing Material requirement.
6. Verify technical contracts and README guidance were not shaped by current demand, legacy vocabulary, or m3e vocabulary.
7. Verify `README.md` does not duplicate API/token/behavior technical contracts or contain implementation/migration history.
8. Verify the Vue component consumes `contract.ts` types directly instead of maintaining a parallel public API declaration.
9. Independently inspect exact-version m3e docs/examples/public artifacts for every renderer mapping, composition, mutable state and token bridge.
10. Verify controlled state has one source of truth and rejected intent cannot drift.
11. Verify public token mappings reach the correct actual rendered parts/states.
12. Verify behavior/accessibility/keyboard/focus/geometry/motion proof is faithful to `BEHAVIOR.md` and existing repository-owned Web/accessibility contracts without promoting platform behavior into Material requirements.
13. Verify canonical stories/browser/visual fixtures use production-valid semantic content.
14. Verify every applicable consumer uses the canonical root API and follows family README guidance for component/variant/configuration choice while product behavior remains with product owners.
15. Verify replaced legacy implementation/exports/proof and old staged family artifacts are removed.
16. Review shared-UI/test-environment blast radius and repository-rule compliance.

Green automated checks prove only covered contracts and do not replace semantic review.

## Finding ownership

Route each underlying problem to one exact owner:

- wrong/missing public parameters/slots/events/types/defaults → `api-contract`;
- wrong/missing public component token contract → `token-contract`;
- wrong/missing normative behavior/accessibility/geometry/motion → `behavior-contract`;
- wrong/missing component description/correct-use/variant/content/accessibility-consumer/related-component guidance → `guidance`;
- correct technical contracts implemented/mapped/proven incorrectly → `implementation`;
- correct finished component/guidance adopted incorrectly, product behavior moved, or legacy removal incomplete → `migration`;
- non-deterministic ownership/cross-family/public-contract compromise or growing workaround problem → `architect`.

Do not collapse Material definition findings into a generic contract route.

Material silence is not a finding by itself. It becomes blocking only when applicable source coverage is incomplete, official Material requirements conflict, or the missing fact is necessary to decide a Material-owned contract requirement.

If two correction rounds for the same underlying problem still reveal ownership drift, unstable semantics, or growing workaround logic, route to `architect`.

## Verdicts

`compliant` requires no unresolved findings.

`compliant-with-listed-risks` is only for complete work with bounded non-blocking limitations. It cannot represent missing proof, missing/incorrect README guidance, unknown consumers, incomplete migration, a blocking Material ambiguity, or deferred required work.

A Material-unspecified detail after complete source coverage is not automatically a risk and does not prevent `compliant`.

`blocked` must identify the earliest exact correction owner.

## Operator observations

Concrete operator visual/motion/accessibility/interaction/usage observations are evidence. Preserve them losslessly and determine whether the current result resolves them. Absence of positive operator acknowledgement is not a blocker.

## PR CI routing mode

When the architect supplies exact failed CI evidence, classify whether correction belongs to api-contract, token-contract, behavior-contract, guidance, implementation, migration, architect, or an external workspace owner.

Do not fetch GitHub state from this worker and do not persist CI state in family definition files.

## Report

```text
MATERIAL REVIEW RESULT
family: <canonical-family>
blockers: none | <findings>
major issues: none | <findings>
minor issues: none | <findings>
accepted risks: none | <risks>
operator observations: none | <status>
required correction owner: none | api-contract | token-contract | behavior-contract | guidance | implementation | migration | architect
verdict: compliant | compliant-with-listed-risks | blocked
PR/CI readiness: ready | blocked
```

## Forbidden

- Fixing production or definition files during review.
- Writing/updating family REVIEW.md.
- Reviewing only changed files/latest patch.
- Replacing Material 3 MCP with previous worker prose, m3e docs, web search or memory as official Material authority.
- Accepting a README whose guidance was inferred from current consumers instead of Material 3 MCP.
- Accepting a Vue component that duplicates rather than consumes the canonical TypeScript API contract.
- Accepting renderer semantics from naming similarity or successful rendering alone.
- Accepting CSS declaration/mapping without rendered-result proof where required.
- Accepting a screenshot as the sole oracle for fixed Material geometry.
- Accepting legacy-to-canonical mapping because names/types look similar.
- Treating missing proof, missing guidance or unknown consumers as accepted risk.
- Treating Material silence after complete source coverage as a contract defect by itself.
- Depending on Git/PR/check state during full review.
- Claiming merge readiness.
