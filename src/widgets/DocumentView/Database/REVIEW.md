# Review

Verdict: blocked

## Scope reviewed

- PR #217 Database widget composition, inline-edit session ownership, controlled configuration state, and resolving-state interaction contract.

## Blockers

### B1 — Resolving inline value still presents Material activation feedback

Owner: `src/widgets/DocumentView/Database`

Problem: `EditableInlineValue` correctly hides the editor and removes keyboard/ARIA action semantics while `editSession.resolving`, but the same root still looks and reacts like an enabled action. The root keeps `cursor: pointer`, always renders the live state layer, and always attaches `useRipple`; `useRipple` starts a ripple on pointer-down independently of the edit-session gate. The canonical session intentionally ignores request/draft/cancel interaction while resolving, so the UI can still visibly acknowledge an action that cannot be accepted.

Evidence:

- [`EditableInlineValue.vue`](./EditableInlineValue.vue) — `isInteractionEnabled` gates semantic attributes and handlers, but `useStateLayer(inlineEl)`, `useRipple(inlineEl)`, `MDStateLayer`, and the pointer cursor remain unconditional.
- [`../../../shared/ui/State/useRipple.ts`](../../../shared/ui/State/useRipple.ts) — the composable listens to pointer-down on its host and starts the ripple without a disabled/session condition.
- [`EditableInlineValue.test.ts`](./EditableInlineValue.test.ts) — the resolving proof stubs state/ripple behavior and therefore proves hidden editor/attributes but not the remaining activation feedback.

Basis:

- [`../../../../docs/database-virtualization-final-correction-handoff.md`](../../../../docs/database-virtualization-final-correction-handoff.md) — acceptance requires that no user input appear accepted while the canonical edit session refuses it, and resolving state must not expose edit/cancel interaction.
- [`../../../AGENTS.md`](../../../AGENTS.md) — disabled or non-action states must not appear clickable.
- [`../../../../.agents/skills/ui-browser-behavior/SKILL.md`](../../../../.agents/skills/ui-browser-behavior/SKILL.md) — pointer target actionability and interaction feedback are browser-observable behavior and must be proved at a faithful layer.

Risk: during an in-flight save, pointer interaction can produce Material press/ripple feedback even though the widget-owned session rejects the corresponding action. This leaves the final semantic correction incomplete and can make a dropped action appear successful.

Required final state: while the session is resolving, the inline value is both semantically and visibly non-interactive: no clickable cursor, hover/press/ripple activation feedback, editable field, draft mutation, cancel, or new edit request. A rejected write must restore the exact same draft and the normal interaction surface. Do not add a second draft or a generic shared disabled API solely for this case.

Verification: retain the deferred-writer session proof and add the smallest faithful proof that resolving state exposes no activation feedback/actionability and that recoverable failure restores the same interactive draft. Do not substitute a mocked state-layer unit assertion for browser-observable pointer behavior if the implementation still depends on pointer/ripple lifecycle.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- The pre-existing `RelationValueFieldData.onSelect` function prop does not belong to the final correction scope; the accepted handoff explicitly excludes unrelated pre-existing callback-prop cleanup from PR #217.

## Unresolved questions

None.
