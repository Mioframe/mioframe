# Review

Verdict: blocked

## Scope reviewed

- PR #217 Database virtualization product E2E after scenario decomposition.
- Historical relation-property timeout diagnosis.
- Local focused Chromium and Mobile Chrome proof reported by the coding correction.
- Exact-head CI run `32661076560`.

## Blockers

### B1 — Current E2E source does not pass exact-head static verification

Owner: `tests/e2e`

Problem: the oversized inline-edit virtualization scenario has been correctly split and the focused local product proof passed, but exact-head CI stops in oxlint before browser lanes because the third new scenario destructures an unused `fixture` value.

Evidence:

- [`databaseVirtualizationFlows.spec.ts`](./databaseVirtualizationFlows.spec.ts) — `resolves before one configuration surface and current-view removal` destructures `fixture` without using it.
- Exact-head run `32661076560` reports `eslint(no-unused-vars)` for that binding and skips the E2E lane after autofix fails.

Required final state: remove the unused binding without changing the scenario contract, then let final exact-head CI execute the browser lane normally.

Verification: focused oxlint for the touched E2E file; final exact-head CI remains architect-owned.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Resolved in this correction

- The former oversized inline-edit scenario is split into three behavior-focused scenarios under the same dedicated product owner.
- Focused local proof reports all 18 Chromium/Mobile Chrome executions passing without timeout inflation, sleeps, force, or retry-as-success.
- The historical relation-property timeout was a test-state leak: the properties sheet remained open before document-pane navigation. The scenario now closes that already-open sheet before navigation and passes focused verification; no production defect was found.

## Items not required

None.

## Unresolved questions

None.
