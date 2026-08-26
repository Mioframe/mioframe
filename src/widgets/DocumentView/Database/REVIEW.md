# Review

Verdict: blocked

## Scope reviewed

- PR #217 Database virtualization/edit lifecycle across `DatabaseViewWidget.vue`, `EditableInlineValue.vue`, and `databaseInlineValueEdit`.
- Unit and application-E2E proof for virtual eviction, explicit cancel/commit, view changes, and configuration changes.

## Blockers

None.

## Major issues

### M1 — Virtual cell eviction implicitly persists the lifted inline-edit draft

Owner: `src/widgets/DocumentView/Database`

Problem: `EditableInlineValue` calls `commitEditor()` from `onBeforeUnmount()` whenever an active editor is unmounted without an explicit cancellation. A virtual range change therefore converts ordinary cell eviction into a persistence action. The feature-owned session already outlives the virtual cell and explicitly exists to keep one draft stable across virtual remounts, so unmount is not a user commit boundary.

Evidence:

- [EditableInlineValue.vue](./EditableInlineValue.vue) — `onBeforeUnmount()` emits `commitEdit` for an open editor.
- [inline-edit feature](../../../features/databaseInlineValueEdit/useDatabaseInlineEditSession.ts) — the feature owns one active draft and documents that it remains stable across virtual remounts.
- [EditableInlineValue.test.ts](./EditableInlineValue.test.ts) — the current unit test explicitly expects an active editor to commit on unmount.
- [databaseVirtualizationFlows.spec.ts](../../../../tests/e2e/databaseVirtualizationFlows.spec.ts) — the virtual-eviction scenario verifies only that the draft text is visible after returning, which also passes when eviction persisted the draft and cleared the lifted session.

Basis:

- [root repository rules](../../../../AGENTS.md) — preserve user scenarios unless explicitly changed and keep behavior in its truthful owner.
- [database virtualization architecture](../../../../docs/database-virtualization.md) — inline-edit ownership remains in `databaseInlineValueEdit`; widget composition arbitrates explicit transitions while virtualization must not become a persistence owner.

Risk: scrolling a cell out of the mounted virtual range can save an in-progress draft without an explicit commit interaction. The existing product test cannot distinguish this behavior from true lifted-draft survival, so green E2E does not prove the stated lifecycle contract.

Required final state: virtual child unmount/remount must not itself commit or cancel the feature-owned session. The same draft remains active across eviction and is persisted/cancelled only through the existing explicit interaction or screen-transition resolution paths. Do not add another lifecycle manager, persistence path, cache, or virtualization hook.

Verification: update the component contract so ordinary unmount does not emit commit, and strengthen the existing virtual-eviction product scenario to prove that after remount the editor is still active with the exact draft and that explicit cancellation restores the original persisted value. Preserve existing explicit commit/cancel and view/configuration resolution proofs.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Redesigning the feature session API or entity value writer.
- Adding persistence on generic component teardown or page navigation without a confirmed product requirement.
- Changing virtualization geometry, range ownership, timeouts, retries, or scroll behavior.

## Unresolved questions

None.
