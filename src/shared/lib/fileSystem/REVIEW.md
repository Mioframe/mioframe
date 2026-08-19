# Review

Verdict: blocked

## Scope reviewed

- Shared Mioframe-space marker inspection introduced/reused by local-directory recovery and Mioframe space picking.

## Blockers

None.

## Major issues

### M1 — Automerge storage-marker policy was moved into generic file-system shared code

Owner: `src/shared/lib/fileSystem`

Problem: `mioframeSpaceDirectoryInspection.ts` is named and exposed as generic file-system infrastructure but its only policy is recognition of the Automerge `storage-adapter-id` marker. The move was made to share logic between two features, but it relocates storage-format responsibility away from the module that owns that marker.

Evidence:

- [Mioframe space directory inspection](mioframeSpaceDirectoryInspection.ts) — imports `storageAdapterMarkerFileName` and interprets its presence as an existing Mioframe space.
- [File-system barrel](index.ts) — publishes `inspectMioframeSpaceDirectory`, `MioframeSpaceInspection`, and the marker-error classifier as generic file-system APIs.
- [Automerge storage contract](../automergeAdapter/README.md) — explicitly states that `shared/lib/automergeAdapter` owns physical Automerge storage formats/policy and that `storage-adapter-id.automerge` marker behavior must remain stable.
- [Marker owner](../automergeAdapter/storageAdapterMarkerFileName.ts) — defines the canonical marker filename and describes it as the storage-adapter marker identifying a Mioframe space.

Basis:

- [Shared-lib rules](../AGENTS.md) — do not mix generic helpers with project-specific policy unless the contract is intentionally shared; keep one clear responsibility.
- [Root architecture rules](../../../../AGENTS.md) — keep behavior with the owner and do not move logic to shared merely to remove duplication.

Risk: generic file-system code becomes coupled to Automerge/Mioframe storage-format semantics, while future marker-format changes require coordinating two owners and the public `@shared/lib/fileSystem` API.

Required final state: marker filename/recognition policy remains owned next to the Automerge storage contract. Both features may consume one lower-level shared marker-presence/inspection API from that owner; do not create a feature-to-feature dependency and do not publish Mioframe/Automerge storage policy from generic `shared/lib/fileSystem` solely to deduplicate it.

Verification: focused marker-present/missing/unexpected-error proof remains with the canonical marker inspection owner, and both feature consumers use that owner.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
