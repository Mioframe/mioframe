# Review

Verdict: blocked

## Scope reviewed

- PR #217 `DatabaseToolbar` and `EditableInlineValue` proof after the review correction.
- Keyboard commit/cancel, boolean writer wiring/ARIA, string sizing, exact property-patch identity, and resolving interaction.

## Blockers

### B1 — Boolean writer test does not distinguish `toggleBoolean` output from an independently recomputed toggle

Owner: `src/widgets/DocumentView/Database`

Problem: the corrected test now asserts the value passed to the stored-value writer, but its mock returns `true` while the current stored value is `false`. That is also the natural result of `!false`, so the test can still pass if production stops using the returned `toggleBoolean` value and recomputes the toggle independently.

Evidence:

- [`EditableInlineValue.vue`](./EditableInlineValue.vue) intentionally persists the exact `newState` returned by `toggleBoolean(...)`.
- [`EditableInlineValue.test.ts`](./EditableInlineValue.test.ts) sets stored value to `false`, mocks `toggleBoolean` to return `true`, then expects `postValue(true)`; the expected dependency result is not distinguishable from a naive direct toggle.

Required final state: make the mocked `toggleBoolean` result observably distinct from a direct toggle of the test input, then assert every activation persists that exact mocked result. Do not change production behavior.

Verification: focused `EditableInlineValue` component test and existing mutation target.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Resolved in this correction

- field Enter/Escape now use real `keydown` events carrying `KeyboardEvent.key`;
- stored `true` ARIA is covered;
- short-string minimum sizing is covered;
- toolbar property patch asserts the exact mounted `documentId`;
- existing resolving-target/draft-recovery proof remains intact.

## Items not required

- The pre-existing `RelationValueFieldData.onSelect` function prop remains outside PR #217.
- The pre-existing direct item-removal entity mutation in `DatabaseViewWidget` remains separate FSD debt.
- The pre-existing duplicate Database read subscriptions remain separate cleanup.
- Historical `props.class` / `props.inputSize` usage in `DatabasePropertyValueField.vue` is unrelated to this correction.

## Unresolved questions

None.
