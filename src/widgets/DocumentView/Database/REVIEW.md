# Review

Verdict: blocked

## Scope reviewed

- PR #217 Database widget composition after the simplification correction: relation roots, inline-edit lifecycle, configuration gating, Vue component contracts, and corresponding product/component proof.

## Blockers

### B1 — Resolving inline edits remain interactive while draft updates are rejected

Owner: `src/widgets/DocumentView/Database`

Problem: `EditableInlineValue` treats any existing `editSession` as an open editor and continues to render an interactive value field while `editSession.resolving` is true. At the same time, `useDatabaseInlineEditSession.updateDraft()` deliberately ignores updates while the session is resolving. User input can therefore be accepted by the mounted field UI while the canonical lifted draft silently refuses the same update. Escape can likewise mark the component cancellation state while the resolving session cannot actually be cancelled.

Evidence:

- [`EditableInlineValue.vue`](EditableInlineValue.vue) — `isEditorOpen` depends only on session presence; the field remains rendered during `resolving`, and `editorValue` continues to emit draft updates.
- [`useDatabaseInlineEditSession.ts`](useDatabaseInlineEditSession.ts) — `updateDraft()` returns without applying a draft while `session.resolving`; `cancel()` also refuses a resolving session.

Basis:

- [`../../../../docs/database-virtualization.md`](../../../../docs/database-virtualization.md) — eviction must not silently lose a draft, failed persistence must leave the session recoverable, and `resolving` exists to serialize the lifecycle safely.
- [`../../../../.agents/skills/vue-component-implementation/SKILL.md`](../../../../.agents/skills/vue-component-implementation/SKILL.md) — component state must remain declarative and interaction ownership explicit rather than exposing an interactive state whose events cannot be honored.

Risk: a user can type or press Escape while persistence is pending and see an apparently active editor even though those interactions are not represented in the canonical session. A successful write can then close the editor with the later typed value lost; a failed write can leave local cancellation state inconsistent with the recovered session.

Required final state: while a session is resolving, the UI must not accept edit/cancel interactions that the session intentionally rejects. After failed persistence, the exact recoverable draft must become editable again; after success, the editor closes normally. Do not add a second draft state or another lifecycle manager.

Verification: a deterministic component/lifecycle proof with a controllable deferred writer must exercise the resolving interval, plus the existing product edit/eviction flows must remain green.

## Major issues

### M1 — DatabaseToolbar uses a parent action callback as a prop

Owner: `src/widgets/DocumentView/Database`

Problem: the correction added `resolveInlineEditBeforeConfiguration: () => Promise<boolean>` as a `DatabaseToolbar` prop. The child invokes parent-owned orchestration as an imperative permission callback while still owning the four sheet visibility states. This splits one transition between parent permission state and child mutation state and violates the repository Vue communication contract.

Evidence:

- [`DatabaseToolbar.vue`](DatabaseToolbar.vue) — declares and awaits `resolveInlineEditBeforeConfiguration` from props before mutating local sheet state.
- [`DatabaseViewWidget.vue`](DatabaseViewWidget.vue) — passes `resolveActiveInlineEdit` downward as that prop.
- [`DatabaseToolbar.test.ts`](DatabaseToolbar.test.ts) — codifies the callback-prop API as the component contract.

Basis:

- [`../../../../.agents/skills/vue-component-implementation/SKILL.md`](../../../../.agents/skills/vue-component-implementation/SKILL.md) — parent-owned commands/permission gates are upward intents; async approval must be represented through emits plus controlled parent state, not callback props.
- [`AGENTS.md`](AGENTS.md) — Database widget composition prefers explicit props and named event handlers and must keep responsibilities readable and local.

Risk: orchestration direction is inverted, the toolbar cannot be understood from declarative inputs alone, tests protect an imperative callback channel, and future async gates can multiply function props instead of one controlled state transition.

Required final state: configuration opening must use normal Vue upward intent plus parent-controlled state (prop/model) after the parent resolves the edit. `DatabaseToolbar` must not receive a parent command/permission callback prop. Keep one narrow configuration state rather than adding separate callback channels.

Verification: component-contract proof for request/controlled-open behavior plus the existing application E2E for successful resolution and current-view removal.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- The pre-existing `RelationValueFieldData.onSelect` callback prop predates PR #217; it confirms the general pattern is worth preventing but is not required to be refactored by this performance PR unless the correction must touch that contract again.
- No shared `useVirtualCollection`, `MDTable`, worker/query, or storage redesign is justified.

## Unresolved questions

None.
