# Review

Verdict: blocked

## Scope reviewed

- Repository Explorer recovery composition for local-directory permission/unavailable-root recovery.

## Blockers

None.

## Major issues

### M1 — Widget interprets low-level local-directory provider recovery payloads

Owner: `src/widgets/RepositoryExplorerWidget`

Problem: the widget composition directly scans raw errors and calls file-system/provider recovery parsers. The PR adds `parseFileSystemUnavailableRootRecovery()` beside the pre-existing permission parser, while the architecture says the widget owns recovery precedence/rendering only. Provider-specific recovery interpretation should be behind the local-directory recovery feature/entity contract, not grow inside the widget.

Evidence:

- [Recovery composition](useRepositoryExplorerRecovery.ts) — loops through raw errors and calls both `getFileSystemAccessRecovery()` and `parseFileSystemUnavailableRootRecovery()` before invoking local-directory recovery features.
- [Local-directory feature rules](../../features/AGENTS.md) — recovery actions own user-triggered recovery orchestration and may consume shared provider contracts.

Basis:

- [Widget rules](../AGENTS.md) — widgets may own branch ordering but must compose provider-specific recovery through feature/entity contracts and must not own the low-level domain rule behind recovery states.
- [Root architecture rules](../../../AGENTS.md) — keep behavior with the correct owner and keep widgets composition-only.
- [Local directory recovery handoff](../../../docs/local-directory-access-recovery.md) — assigns the widget recovery precedence/rendering only.

Risk: every new local-directory provider recovery condition adds parsing/selection logic to a screen-level widget, coupling presentation composition to provider error contracts and making the feature less reusable outside Repository Explorer.

Required final state: local-directory recovery feature/entity code owns conversion from the supplied error candidates to its typed recovery/action state. `RepositoryExplorerWidget` only composes the returned local-directory recovery branches/actions with Google Drive/error/loading/content precedence. Keep the correction scoped to the local-directory recovery path; do not redesign unrelated widget reads.

Verification: focused widget tests assert branch precedence through the feature-facing recovery contract, while provider-payload parsing is covered at its lower owner.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
