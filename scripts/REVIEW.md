# Review

Verdict: blocked

## Scope reviewed

- Current Verify Redesign Pass A after the first correction round.
- Re-reviewed verification-type ownership, production-artifact manifest split, managed-update expensive execution routing, surrounding planner comments/tests, and Pass B boundary safety.

## Blockers

None.

## Major issues

### M1 — Obsolete planner comments contradict the accepted Storybook proof ownership and depend on transient review state

Owner: `scripts`

Problem: the correction makes `storybook-build` a `static` proof leaf in code, but nearby verifier/test comments still describe the Storybook static build as "not an independent proof owner" and several new comments cite `scripts/REVIEW.md` findings as permanent implementation rationale. That review file is temporary working state and must be deleted when the review closes.

Evidence:

- [`verify.ts`](verify.ts) — the Storybook scheduling comment still says the shared Storybook static build is "a prerequisite for both storybook-behavior and visual, not an independent proof owner", contradicting the corrected `VERIFICATION_TYPE_BY_LABEL` mapping and accepted architecture.
- [`verify.ts`](verify.ts) — the prerequisite/type-ownership comment cites `scripts/REVIEW.md B1` as durable rationale.
- [`lib/commandWeight.ts`](lib/commandWeight.ts) — the `managed-updates-static` weight comment cites `scripts/REVIEW.md M1`.
- [`verify.test.ts`](verify.test.ts) — correction tests also cite `scripts/REVIEW.md B1/M1`.

Basis:

- [`../AGENTS.md`](../AGENTS.md) — implementation quality requires obsolete comments to be removed when their replacement is introduced unless compatibility requires them.
- [`../docs/testing/verify-redesign-implementation-preflight.md`](../docs/testing/verify-redesign-implementation-preflight.md) — **Static composition** defines Storybook buildability as `static`; behavior/visual build reuse is only an execution optimization and must not merge proof ownership.
- [`../.agents/skills/project-review/SKILL.md`](../.agents/skills/project-review/SKILL.md) — `REVIEW.md` is durable working state for an active review, not permanent product documentation, and is deleted when no active review state remains.

Risk: Pass B will modify this exact planner area. Contradictory local comments can drive the next implementation back toward the rejected ownership model, while permanent references to a transient review artifact either become broken after review closure or force the review file to survive incorrectly.

Required final state: comments adjacent to Storybook planning consistently state that Storybook buildability is `static` proof and build reuse by behavior/visual is an execution optimization. Permanent code/tests must not cite `scripts/REVIEW.md`; use the accepted preflight/architecture where a durable reference is useful, or keep the explanation self-contained.

Verification: focused lint/unit proof is sufficient if only comments/test descriptions change; no browser/release compatibility rerun is required.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- The agent-reported local character-device state for `.env.example`, `.gitconfig`, and `.gitmodules` is not present in the GitHub branch diff and is not part of this repository review.

## Unresolved questions

None.
