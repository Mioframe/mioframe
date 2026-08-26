# Review

Verdict: blocked

## Scope reviewed

- PR #218 develop verification workflow after the verifier public-type migration.
- Aggregate implementation gate and its direct type-level jobs.

## Blockers

### B1 — Develop CI omits the browser-integration verification type

Owner: `.github/workflows`

Problem: `.github/workflows/verify.yml` runs focused `static`, `unit`, `mutation`, `e2e`, `behavior`, and `visual`, but has no `pnpm verify --only browser-integration` job/step. The aggregate `verification` job therefore succeeds without requiring browser-integration proof.

Evidence:

- [`verify.yml`](verify.yml) — `verification-static` runs `static`, `unit`, and `mutation`; `verification-browser-e2e` runs `e2e`; the Storybook matrix runs `behavior` and `visual`; aggregate `verification` depends only on those jobs.
- [`../../docs/testing/architecture.md`](../../docs/testing/architecture.md) — `browser-integration` is one of the eight public verification types and owns isolated service-worker/browser-runtime contracts.

Basis:

- [`../../docs/testing/architecture.md`](../../docs/testing/architecture.md) — a verification type may be skipped only with deterministic evidence of irrelevance; ordinary production changes may require several types.
- [`../../AGENTS.md`](../../AGENTS.md) — exact-head GitHub CI is the authoritative automatic repository verification gate, so required type coverage must actually participate in that gate.

Risk: a develop PR that affects a service-worker/browser-runtime contract can receive a green required `verify` check even when no browser-integration proof ran.

Required final state: after the scripts-owned browser-integration planner is corrected and re-reviewed, the develop verification workflow must run the public `browser-integration` type as an independent verifier-managed lane and the aggregate `verification` job must require its success. Preserve container-only Playwright execution and the existing parallel topology; do not expose private leaf labels in workflow commands.

Verification: inspect workflow dependency topology and exact public commands; exact-head GitHub CI must show the browser-integration lane and aggregate gate succeeding on the corrected head.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Do not fold browser integration into the Storybook matrix merely because both use Playwright; it is a separate proof type and execution owner.

## Unresolved questions

None.
