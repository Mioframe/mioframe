---
name: material-component-review
description: 'Use after standalone implementation and separate migration complete to independently review the API, token and behavior contracts against material3 MCP, the exact m3e mapping, proof, consumers and legacy removal.'
---

# Material component review

Perform one fresh independent semantic review of the complete resulting Material family.

## Authority

Read applicable `AGENTS.md`, `component-contract.md`, `component-adapter.md`, `component-tokens.md`, the three canonical family contracts, current runtime/proof/consumers, current testing ownership, and exact lockfile-resolved m3e documentation/public artifacts.

For official Material facts, independently query the repository-configured `material3` MCP server. Do not rely on previous worker reports as Material authority.

## Independence

Run in a fresh context independent from API-contract, token-contract, behavior-contract, implementation and migration workers.

Review the complete current family and all applicable consumers, not only the latest edit.

Do not depend on Git history, PR metadata, branch/diff state or external checks during full review.

Review does not fix production/contract files and does not write a persistent `REVIEW.md`.

## Review order

1. Query Material 3 MCP for the public parameters/props, slots, events, values/defaults and compare them with `contract.ts`.
2. Query Material 3 MCP for official component tokens and compare them with `tokens.css`.
3. Query Material 3 MCP for observable behavior, states, keyboard, accessibility, geometry and motion and compare them with `BEHAVIOR.md`.
4. Verify no contract was shaped by current demand, legacy vocabulary, or m3e vocabulary.
5. Verify the Vue component consumes `contract.ts` types directly instead of maintaining a parallel public API declaration.
6. Independently inspect exact-version m3e docs/examples/public artifacts for every renderer mapping, composition, mutable state and token bridge.
7. Verify controlled state has one source of truth and rejected intent cannot drift.
8. Verify public token mappings reach the correct actual rendered parts/states.
9. Verify behavior/accessibility/keyboard/focus/geometry/motion proof is faithful to `BEHAVIOR.md`.
10. Verify canonical stories/browser/visual fixtures use production-valid semantic content.
11. Verify all applicable consumers use the canonical root API correctly and product behavior remains with product owners.
12. Verify replaced legacy implementation/exports/proof and old staged family artifacts are removed.
13. Review shared-UI/test-environment blast radius and repository-rule compliance.

Green automated checks prove only covered contracts and do not replace semantic review.

## Finding ownership

Route each underlying problem to one exact owner:

- wrong/missing public parameters/slots/events/types/defaults → `api-contract`;
- wrong/missing public component token contract → `token-contract`;
- wrong/missing normative behavior/accessibility/geometry/motion → `behavior-contract`;
- correct contracts implemented/mapped/proven incorrectly → `implementation`;
- correct finished component adopted incorrectly, product behavior moved, or legacy removal incomplete → `migration`;
- non-deterministic ownership/cross-family/public-contract compromise or growing workaround problem → `architect`.

Do not collapse all Material contract findings into a generic contract route.

If two correction rounds for the same underlying problem still reveal ownership drift, unstable semantics, or growing workaround logic, route to `architect`.

## Verdicts

`compliant` requires no unresolved findings.

`compliant-with-listed-risks` is only for complete work with bounded non-blocking limitations. It cannot represent missing proof, unknown consumers, incomplete migration, contract ambiguity, or deferred required work.

`blocked` must identify the earliest exact correction owner.

## Operator observations

Concrete operator visual/motion/accessibility/interaction observations are evidence. Preserve them losslessly and determine whether the current result resolves them. Absence of positive operator acknowledgement is not a blocker.

## PR CI routing mode

When the architect supplies exact failed CI evidence, classify whether correction belongs to api-contract, token-contract, behavior-contract, implementation, migration, architect, or an external workspace owner.

Do not fetch GitHub state from this worker and do not persist CI state in family contract files.

## Report

```text
MATERIAL REVIEW RESULT
family: <canonical-family>
blockers: none | <findings>
major issues: none | <findings>
minor issues: none | <findings>
accepted risks: none | <risks>
operator observations: none | <status>
required correction owner: none | api-contract | token-contract | behavior-contract | implementation | migration | architect
verdict: compliant | compliant-with-listed-risks | blocked
PR/CI readiness: ready | blocked
```

## Forbidden

- Fixing production or contract files during review.
- Writing/updating family REVIEW.md.
- Reviewing only changed files/latest patch.
- Replacing Material 3 MCP with previous worker prose, m3e docs, web search or memory as official Material authority.
- Accepting a Vue component that duplicates rather than consumes the canonical TypeScript API contract.
- Accepting renderer semantics from naming similarity or successful rendering alone.
- Accepting CSS declaration/mapping without rendered-result proof where required.
- Accepting a screenshot as the sole oracle for fixed Material geometry.
- Accepting legacy-to-canonical mapping because names/types look similar.
- Treating missing proof or unknown consumers as accepted risk.
- Depending on Git/PR/check state during full review.
- Claiming merge readiness.