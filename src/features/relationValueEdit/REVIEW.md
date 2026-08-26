# Review

Verdict: blocked

## Scope reviewed

- PR #217 relation selection composition across `RelationValueField.vue`, `RelationValueFieldData.vue`, and `DatabasePropertyValueField.vue`.
- Current Vue component communication rules introduced by this PR.

## Blockers

None.

## Major issues

### M1 — Relation selection mutation crosses the component boundary through a callback prop

Owner: `src/features/relationValueEdit`

Problem: `RelationValueFieldData` declares `onSelect` as a function-valued prop and invokes it from its checkbox interaction. `DatabasePropertyValueField` passes the parent-owned relation-selection command into that prop. This is an upward mutation channel encoded as downward data and conflicts with the current component communication contract.

Evidence:

- [RelationValueFieldData.vue](./RelationValueFieldData.vue) — `onSelect: (itemId) => void` is a component prop and `onUpdateSelectedValue()` invokes `props.onSelect(itemId)`.
- [RelationValueField.vue](./RelationValueField.vue) — the relation editor owns `onSelect` and exposes it to the composing slot as the relation-selection interaction.
- [DatabasePropertyValueField.vue](../../widgets/DocumentView/Database/DatabasePropertyValueField.vue) — passes the slot callback into `RelationValueFieldData` as `:on-select="onSelect"`.

Basis:

- [Vue component implementation skill](../../../.agents/skills/vue-component-implementation/SKILL.md) — parent-owned mutation callbacks are not downward component props; child interaction is emitted upward through a typed event and the parent remains the mutation owner.
- [root repository rules](../../../AGENTS.md) — keep behavior in its owning layer and use the minimum complete design.

Risk: the PR introduces a durable component-communication rule while leaving a changed production path that violates it. That makes ownership ambiguous and establishes contradictory examples for future component work.

Required final state: `RelationValueFieldData` exposes relation-row selection as a typed upward interaction event rather than a function-valued mutation prop. `RelationValueField` remains the relation-selection mutation owner; no new state, service API, shared abstraction, or callback channel is introduced.

Verification: update the existing `RelationValueFieldData` component contract to prove the selection event payload, preserve current relation selection behavior, then run the focused relation/Database proof selected by the existing E2E impact mapping and the cumulative branch gate.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Changing scoped-slot function payloads that are composition data rather than component callback props.
- Weakening or removing the current Vue component communication rule.
- Redesigning relation persistence, relation view selection, virtualization, or nested scroll-root ownership.

## Unresolved questions

None.
