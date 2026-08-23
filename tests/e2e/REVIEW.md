# Review

Verdict: blocked

## Scope reviewed

- PR #217 application E2E ownership, Database virtualization product scenarios, source-to-spec impact mapping, and desktop/mobile project applicability.

## Blockers

None.

## Major issues

### M1 — Virtualization scenarios broaden an unrelated spec's mobile applicability without the required audit

Owner: `tests/e2e` application E2E ownership and `scripts/lib/e2eProjectApplicability.ts` metadata.

Problem: PR #217 adds a large set of virtualization-specific product scenarios to `databaseViewsAndQueryFlows.spec.ts` and changes that entire existing spec from `desktop` to `both`. The applicability test only records the new classification; it does not establish the dedicated audit required to conclude that every pre-existing view/query scenario in the file now truthfully belongs to Mobile Chrome. This also couples relation-root, virtualization geometry, edit-lifecycle, sticky-table, and bounded-rendering proof to a broad views/query container.

Evidence:

- [`databaseViewsAndQueryFlows.spec.ts`](./databaseViewsAndQueryFlows.spec.ts) — the PR adds relation-root, recursive-teleport, bounded-DOM, surface-offset, deep 2D, dynamic geometry, sticky, and inline-edit virtualization scenarios to the existing views/query spec.
- [`../../scripts/lib/e2eProjectApplicability.ts`](../../scripts/lib/e2eProjectApplicability.ts) — the whole spec changes from `desktop` to `both`.
- [`../../scripts/lib/e2eProjectApplicability.test.ts`](../../scripts/lib/e2eProjectApplicability.test.ts) — the test only moves the spec between expected classification lists; it does not audit the existing scenarios' platform/input/viewport/lifecycle requirements.
- [`../../scripts/lib/e2eRisk.ts`](../../scripts/lib/e2eRisk.ts) — virtualization source impact is already explicit, so the new product proof can have a dedicated application-E2E owner without losing deterministic selection.

Basis:

- [`../../.agents/skills/ui-browser-behavior/SKILL.md`](../../.agents/skills/ui-browser-behavior/SKILL.md) — each application E2E spec's persistent project applicability must be preserved unless a dedicated audited reclassification covers observable platform, input, viewport, lifecycle, and composition requirements; changing applicability without that audit is forbidden.
- [`../../docs/testing/architecture.md`](../../docs/testing/architecture.md) — proof should be proportional, have truthful ownership, and avoid unnecessary duplicate/broad execution.
- [`../../AGENTS.md`](../../AGENTS.md) — tests should be split by behavior when ownership/setup makes a broad file stop representing one cohesive contract.

Risk: unrelated existing views/query scenarios are now forced through Mobile Chrome without evidence that `both` is their truthful persistent applicability. This increases CI blast radius and couples future view/query changes to virtualization mobile coverage, while the very large mixed-contract spec makes ownership and future impact selection harder to reason about.

Required final state: Mobile Chrome applicability must belong only to scenarios that were actually audited for it. Keep the existing views/query spec's prior applicability unless the whole file is explicitly audited, or give the virtualization/mobile product scenarios a cohesive application-E2E owner with its own truthful project applicability and source-impact mapping. Do not duplicate the same complete product scenarios across two specs.

Verification: applicability metadata/tests must reflect the audited spec boundaries; virtualization source changes must deterministically select the owning product spec; the mobile-required virtualization scenarios must execute in both applicable projects while unrelated existing scenarios retain their previously audited applicability unless separately reviewed.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
