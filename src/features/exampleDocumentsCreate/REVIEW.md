# Review

Verdict: blocked

## Scope reviewed

- Starter-example consumer migration from replay-based directory fetch to a real one-shot fresh filesystem listing.

## Blockers

None.

## Major issues

### M1 — listing failure fallback is not preserved explicitly

Owner: `src/features/exampleDocumentsCreate`

Problem: [the architecture handoff](../../../docs/directory-state-reactivity.md) requires replacing replay-based `directoryContent.fetch()` with a rejecting fresh-read contract, but only names first-free selection and `FileExists` race preservation. The current feature deliberately treats the preliminary listing as best-effort: a failed listing falls back to an empty name set and still attempts `createDirectory`, letting `FileExists` advance the index and letting the actual create result decide whether the action fails. A direct `await` migration can make the preliminary read failure fatal and change existing behavior.

Evidence:

- [Current example creation](./useExampleDocumentsCreate.ts) — `listExistingNames()` catches returned/read errors and rejected fetches, returns an empty set, and then continues the bounded create loop.
- [Directory-state reactivity architecture](../../../docs/directory-state-reactivity.md) — introduces a rejecting fresh-list operation but does not specify this feature-level best-effort fallback.

Basis:

- [Root architecture rules](../../../AGENTS.md) — existing user scenarios must be preserved unless the task explicitly changes them.
- [Architect handoff skill](../../../.agents/skills/architect-handoff/SKILL.md) — affected failure paths and expected final behavior must be resolved before implementation.

Risk: a transient preliminary directory-list failure that currently still allows successful example creation can become an immediate generic action failure after migration.

Required final state: keep fresh pre-inspection best-effort. A successful one-shot fresh listing supplies names used to skip known occupied candidates; a rejected listing falls back to an empty name set. The bounded `FileExists` retry and final create/document failure behavior remain authoritative.

Verification: add a feature test where the fresh listing rejects but `createDirectory()` succeeds, proving example creation continues; retain first-free-name, `FileExists`, safety-limit, loading, and final-error tests.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
