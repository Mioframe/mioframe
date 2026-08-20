# Review

Verdict: blocked

## Scope reviewed

- Starter-example consumer migration from replay-based directory fetch to canonical `refreshDirectory()`.

## Blockers

None.

## Major issues

### M1 — listing failure fallback is not preserved explicitly

Owner: `src/features/exampleDocumentsCreate`

Problem: [the architecture handoff](../../../docs/directory-state-reactivity.md) requires replacing `directoryContent.fetch()` with rejecting `refreshDirectory()`, but only names first-free selection and `FileExists` race preservation. The current feature deliberately treats a failed/pre-existing listing read as best-effort: it falls back to an empty name set and still attempts `createDirectory`, letting `FileExists` advance the index and letting the actual create result decide whether the action fails. A direct `await refreshDirectory()` migration can make the preliminary read failure fatal and change existing behavior.

Evidence:

- [Current example creation](./useExampleDocumentsCreate.ts) — `listExistingNames()` catches both returned/read errors and rejected fetches, returns an empty set, and then continues the bounded create loop.
- [Directory-state reactivity architecture](../../../docs/directory-state-reactivity.md) — defines `refreshDirectory()` as rejecting on terminal read failure but does not specify this feature-level best-effort fallback.

Basis:

- [Root architecture rules](../../../AGENTS.md) — existing user scenarios must be preserved unless the task explicitly changes them.
- [Architect handoff skill](../../../.agents/skills/architect-handoff/SKILL.md) — affected failure paths and expected final behavior must be resolved before implementation.

Risk: a transient directory listing failure that currently still allows successful example creation can become an immediate generic action failure after migration.

Required final state: keep the fresh-read pre-inspection best-effort. A successful `refreshDirectory()` supplies the names used to skip known occupied candidates; a rejected refresh is treated like the current failed listing and falls back to an empty name set. The bounded `FileExists` retry and final create/document failure behavior remain authoritative.

Verification: add a feature test where `refreshDirectory()` rejects but `createDirectory()` succeeds, proving example creation continues; retain first-free-name, `FileExists`, safety-limit, loading, and final-error tests.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
