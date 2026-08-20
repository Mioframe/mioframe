# Review

Verdict: blocked

## Scope reviewed

- PR #212 final Extended FAB real-keyboard focus proof and its deterministic Storybook fixture.
- Storybook behavior execution on the final implementation and documentation heads.
- Required correction verification for the previously reproducible focus flake.

## Blockers

### B1 — Required repeated real-Tab stability proof was not completed

Owner: `src/shared/ui/material/components/extendedFloatingActionButton`

Problem: the final focus-origin correction is structurally faithful, but the correction contract required the exact real-Tab test to pass 10 consecutive isolated executions against one built Storybook with no retry/flaky classification. [PR #212](https://github.com/Mioframe/mioframe/pull/212) explicitly records that this requested 10x repetition was not run because the coding-agent environment rejected Podman. Exact-head GitHub runs exercise the corrected test once per Storybook-behavior lane; they do not establish the required repeated stability proof for a defect that had already remained reproducibly flaky after the previous readiness fix.

Evidence:

- [Browser proof](./MDExtendedFloatingActionButton.browser.spec.ts) — the corrected test now focuses a dedicated origin and performs a real `Tab` onto the FAB.
- [Storybook fixture](./MDExtendedFloatingActionButton.stories.ts) — the dedicated native focus origin is immediately before the target FAB.
- [PR #212](https://github.com/Mioframe/mioframe/pull/212) — `Verification evidence` states that the requested final local 10x browser repetition was not completed.
- [Exact-head run #3852](https://github.com/Mioframe/mioframe/actions/runs/32300484836) — Storybook behavior passed the target once without retry, which is useful evidence but not the requested repeated stability proof.

Basis:

- [Project review skill](../../../../../../.agents/skills/project-review/SKILL.md) — required proof absent is a blocker, and missing risk-specific proof must not be replaced by green checks that do not prove it.
- [Architecture handoff skill](../../../../../../.agents/skills/architect-handoff/SKILL.md) — implementation/review must preserve the resolved required test proof and verification rather than silently weakening the implementation contract.

Risk: the PR may still retain the intermittent Extended FAB focus failure that this correction round exists to remove. A one-shot green browser lane, even on more than one workflow run, does not demonstrate the requested stability margin after the previous fix was itself observed to fail intermittently.

Required final state: establish the previously required repeated stability evidence on the current implementation: one deterministic Storybook build followed by 10 consecutive executions of the exact real-Tab focus test with no failure, retry, or flaky classification. If that proof exposes another failure, correct the underlying deterministic test setup without weakening the real-Tab/focus-visible contract. If the normal environment rejects the canonical command, follow the verification skill's command-scoped environment handling rather than substituting operator-run or weaker proof.

Verification: build Storybook once, run the exact Extended FAB real-Tab test 10 consecutive times while reusing that build, then run the verifier-managed Storybook behavior check. After the finding is closed and this review artifact is removed, final exact-head GitHub CI must remain green.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Two internal comments still use slightly outdated wording around the Storybook CI fallback/independent build contract; the executable behavior and canonical documentation are unambiguous, so this is optional wording cleanup rather than a current acceptance issue.

## Unresolved questions

None.
