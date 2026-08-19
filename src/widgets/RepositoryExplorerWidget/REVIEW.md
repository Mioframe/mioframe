# Review

Verdict: blocked

## Scope reviewed

- Repository Explorer recovery composition and post-reconnect navigation for PR #211.

## Blockers

### B1 — Post-reconnect navigation is not scoped to the path that started the action

Owner: `src/widgets/RepositoryExplorerWidget`

Problem: `onClickReconnectFolder()` awaits the feature action and unconditionally emits `clickPath` when a mounted name is returned. The widget does not remember the `directoryPath` that initiated the action. If the user navigates elsewhere while reconnect/relocation is pending, a later successful result can navigate the user back into the recovered mount even though the initiating screen context is stale.

Evidence:

- [Repository Explorer widget](RepositoryExplorerWidget.vue) — `onClickReconnectFolder()` contains no initiating-path check around the awaited action.
- [Widget tests](RepositoryExplorerWidget.test.ts) — navigation is covered for returned/undefined names, but not for `directoryPath` changing while the action is pending.

Basis:

- [Local-directory recovery handoff](../../../docs/local-directory-access-recovery.md) — the widget owns post-relocation navigation and stale recovery must not overwrite navigation/state.
- [Widget rules](../AGENTS.md) — routing/navigation and screen composition belong to the composition layer rather than the feature's provider/action state.

Risk: a completed background reconnect can override a newer user navigation decision. Keeping this responsibility in the feature would again couple provider-derived recovery state to page navigation lifecycle.

Required final state: navigation resulting from reconnect is applied only if Repository Explorer is still showing the same `directoryPath` that initiated the action. The feature remains responsible for the committed action result; the widget owns whether that result is still applicable to current navigation context.

Verification: add a widget test that starts reconnect, changes `directoryPath` before the promise resolves, then resolves with a mounted name and proves no stale `clickPath` is emitted; retain the positive relocation/already-mounted navigation proof.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
