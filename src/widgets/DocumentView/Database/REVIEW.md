# Review

Verdict: blocked

## Scope reviewed

- PR #217 Database widget proof after the mutation-proof correction.
- `DatabaseToolbar` controlled configuration/add-item/property-patch contract.
- `EditableInlineValue` activation, edit lifecycle, boolean semantics, sizing, resolving interaction, and current focused tests.
- The accepted mutation-proof correction contract in `docs/database-virtualization-mutation-proof-correction-handoff.md`.

## Blockers

### B1 — Component tests still leave required public contracts weak or falsely exercised

Owner: `src/widgets/DocumentView/Database`

Problem: the expanded tests cover most of the requested component surface and the production runtime was not changed, but several required focused contracts are still not faithfully proved.

Evidence:

- [`EditableInlineValue.test.ts`](./EditableInlineValue.test.ts) — `ValueFieldStub` declares and emits literal `keydown.enter` / `keydown.escape` custom events. Production uses Vue key modifiers `@keydown.enter` / `@keydown.escape`, which filter the `keydown` event by `KeyboardEvent.key`; clicking those stub buttons therefore does not exercise the production field-keyboard listeners. The same test then receives its one commit from `interaction-outside` and its one cancel from tooltip close, so it can pass while the field Enter/Escape paths are not exercised.
- [`EditableInlineValue.test.ts`](./EditableInlineValue.test.ts) — the boolean case checks `postValue` call count but not that each write receives the value returned by `toggleBoolean`; it proves stored `false`, `mixed`, and defaulted `true` ARIA states but not stored `true`; the sizing test proves a long string and non-string zero but not the required short-string minimum.
- [`DatabaseToolbar.test.ts`](./DatabaseToolbar.test.ts) — property patch forwarding asserts the current path/property/patch, but accepts any string as `documentId` rather than the exact mounted document identity.
- [`../../../../docs/database-virtualization-mutation-proof-correction-handoff.md`](../../../../docs/database-virtualization-mutation-proof-correction-handoff.md) — explicitly requires faithful Enter/Escape component proof, writing the toggled boolean result, stored true/false plus supported undefined ARIA semantics, minimum/longer string sizing, and current path/document/property identity for property patching.
- [Vue event handling — key modifiers](https://vuejs.org/guide/essentials/event-handling.html#key-modifiers) — `.enter`/`.escape` are key modifiers on keyboard events, not literal event-name suffixes.

Basis:

- [`../../../../docs/database-virtualization-mutation-proof-correction-handoff.md`](../../../../docs/database-virtualization-mutation-proof-correction-handoff.md) — acceptance requires the listed meaningful toolbar/inline-value public branches to be protected by focused component tests.
- [`../../../../.agents/skills/project-review/SKILL.md`](../../../../.agents/skills/project-review/SKILL.md) — required proof must be faithful to the behavior it claims to test; a green threshold does not by itself prove an unexercised contract.

Risk: the focused suite can remain green if the field Enter/Escape wiring regresses, if boolean activation writes a value other than the toggle result, if stored-true ARIA semantics regress, if the short-string minimum changes, or if property patching uses a wrong document identity. Existing product E2E already covers real Enter/Escape user behavior, so this is not a production-architecture defect; it is an incomplete owner-local proof correction.

Required final state: use a faithful `keydown` event with `KeyboardEvent.key` (or equivalent native fallthrough through the stub) to exercise field Enter and Escape; assert the stored-value writer receives the `toggleBoolean` result; cover stored `true` and the short-string minimum; assert the exact mounted document ID in property patch forwarding. Preserve production behavior and existing E2E ownership.

Verification: focused widget unit tests and the unchanged verifier-managed mutation targets after the test correction.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- The pre-existing `RelationValueFieldData.onSelect` function prop remains outside PR #217.
- The pre-existing direct item-removal entity mutation in `DatabaseViewWidget` remains separate FSD debt.
- The pre-existing duplicate Database read subscriptions remain separate cleanup.
- Historical `props.class` / `props.inputSize` usage in `DatabasePropertyValueField.vue` is unrelated to this correction.

## Unresolved questions

None.
