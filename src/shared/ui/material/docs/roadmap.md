# Mioframe Material migration roadmap

This file is the only owner of current Material milestone status, family-stage status, technical blockers, latest pilot result, and next operator action. Durable workflow rules live in the other canonical documents.

## Current state

Last updated: 2026-08-11

Current milestone: `M2 — Switch stateful pilot`

Status: `complete`

The Switch family calibration workflow is complete:

```text
DESIGN.md          current
ARCHITECTURE.md    ready
IMPLEMENTATION.md  complete
MIGRATION.md       complete
REVIEW.md          compliant
```

The branch is synchronized with current `develop` and `package.json` is `0.3.5`, above current `develop` `0.3.4`. The previous branch-sync and release-version blockers are resolved.

The family remains compliant. The current outer invocation is blocked only by shared Playwright discovery infrastructure.

## Calibration result

Switch established the stateful Material adapter invariants now recorded in the canonical rules:

1. `selected` is the sole controlled-state source of truth; renderer mutation is prevented at the cancelable pre-mutation intent boundary.
2. Rejected controlled intent cannot leave renderer state divergent from the public prop.
3. Ordinary component-owned browser proof uses owner-local `*.browser.spec.ts` ownership.
4. Renderer-specific non-browser test shims stay at the narrowest truthful owner.
5. Decorative `presentation` composition proves both child suppression and positive input handoff to the real action owner.
6. Independent review rechecks current renderer lifecycle, proof ownership, test-environment blast radius, and composition ownership rather than trusting family prose.

No generic m3e adapter framework, duplicate state manager, compatibility layer, or new registry abstraction was introduced.

## Current external blocker

The synchronized final command

```text
pnpm verify --base origin/develop --profile local
```

reached the Playwright lanes and failed in `visual`. The failure executed a stale MDSwitch drag test that exists only inside a sibling ignored checkout under `.claude/worktrees/...`, not in the active repository tree.

The underlying tooling defect is broader than one visual glob:

- `playwright.visual.config.ts` uses `testDir: '.'` with mixed root-relative `testMatch` patterns and does not enable ignored-workspace filtering;
- `playwright.storybook.config.ts` has the same root-scanning shape and the same latent isolation gap;
- `.gitignore` already owns local/nested workspace exclusions, including `.claude/*`, `.brv/`, `.sisyphus/`, and `.opencode/`;
- root-scanning Playwright lanes must not discover tests from ignored sibling/nested workspaces.

The preferred minimum correction is to make both root-scanning Playwright configurations respect the repository ignore boundary (for example `respectGitIgnore: true`) rather than hard-coding a second `.claude/worktrees/**` exclusion list. The lane-configuration regression proof must be updated accordingly.

This correction belongs to shared verification/Playwright tooling, not to any Material family. `REVIEW.md` remains compliant and must not be rewritten merely because the outer verifier is blocked.

## Verification state

On the synchronized branch, the latest local outer invocation passed:

- agent-environment;
- format;
- oxlint;
- eslint;
- type-check;
- unit-tests;
- e2e;
- storybook-behavior;
- storybook-build.

`visual` failed because of the ignored nested-workspace discovery defect; `mutation` was not reached after that failure.

GitHub `release-version` is green on the current versioned head. Full GitHub verification is still required after the shared Playwright correction.

## Milestones

| ID  | Milestone                           | Status     | Exit gate                                                       |
| --- | ----------------------------------- | ---------- | --------------------------------------------------------------- |
| M0  | workflow architecture and rules     | `complete` | coherent staged workflow and corrected calibration invariants   |
| M1a | Loading Indicator dependency family | `complete` | current artifacts and compliant review                          |
| M1  | Button action family                | `complete` | canonical m3e-backed action component migrated and merged       |
| M2  | Switch stateful pilot               | `complete` | family workflow completed without unresolved family findings    |
| M3  | sequential component migration      | `planned`  | begin after PR #186 is integrated into current `develop`        |

## Next operator action

Do not rebuild the Switch family and do not start M3 yet.

Correct the shared root-scanning Playwright workspace-isolation contract for both Storybook behavior and visual lanes, with regression proof. Then rerun focused verifier-managed proof for every affected lane and rerun the original final command:

```text
pnpm verify --base origin/develop --profile local
```

If the final verifier reveals no Switch-owned regression, the existing compliant family review remains valid. Merge PR #186 only after the final gate and GitHub CI are fully green.
