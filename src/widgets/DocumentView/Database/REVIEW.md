# Review

Verdict: blocked

## Scope reviewed

- PR #217 Database widget composition, inline-edit ownership, controlled configuration state, Vue template conventions, and resolving-state interaction contract.

## Blockers

### B1 — Resolving inline value still presents Material activation feedback

Owner: `src/widgets/DocumentView/Database/EditableInlineValue.vue`.

Problem: `EditableInlineValue` correctly hides the editor and removes keyboard/ARIA action semantics while `editSession.resolving`, but the same root still looks and reacts like an enabled action. The root keeps `cursor: pointer`, always renders the live state layer, and always attaches `useRipple`; `useRipple` starts a ripple on pointer-down independently of the edit-session gate.

Required final state: while the session is resolving, the inline value is both semantically and visibly non-interactive: no clickable cursor, hover/press/ripple activation feedback, editable field, draft mutation, cancel, or new edit request. A rejected write restores the exact same draft and normal interaction surface. Keep one interaction fact derived from the session; do not add a shared disabled API or second state.

Verification: retain the deterministic rejected-write session proof and make the component contract prove that the actual state/ripple target becomes `null` while resolving and is restored after recovery. If implementation keeps a live target attached and relies on CSS/event timing, browser-faithful pointer proof is required instead.

## Major issues

### M1 — Inline-edit session lifecycle is owned by the widget instead of a feature

Owner: FSD boundary between `src/widgets/DocumentView/Database` and a dedicated inline-value-edit feature.

Problem: `useDatabaseInlineEditSession.ts` owns a complete user-action flow: one active draft, request/claim, update, cancel, commit/resolve, persistence, serialization of an in-flight write, and recoverable failure. `DatabaseViewWidget.vue` also constructs that flow by reading `useDatabaseValueWrite` directly and injecting `postValue` into the widget-local composable.

This is beyond widget composition. Repository rules assign inline actions, submit flows, cancel/recovery behavior, and action orchestration to `features`; widgets should compose features/entities and own only cross-feature screen coordination.

Required final state:

- move the session composable and its focused tests to a dedicated feature, `src/features/databaseInlineValueEdit/`;
- the feature owns the single active session and obtains the narrow entity writer from `@entity/databaseValue` using `path` and `documentId` inputs;
- `DatabaseViewWidget` consumes the feature API and no longer imports `useDatabaseValueWrite` or constructs persistence dependencies;
- `DatabaseViewWidget` continues to own cross-feature orchestration: resolve the active edit before changing explicit view or opening a source/shape configuration surface;
- keep the existing session state shape and behavior unless a mechanical type/export adjustment is required by the move;
- do not introduce a manager, provider, registry, global store, or second draft.

The feature must not know about views, toolbar surfaces, virtualization roots, or Database screen layout. Those remain widget composition concerns.

### M2 — Virtualization scenarios broaden an unrelated E2E spec's mobile applicability

Owner: `tests/e2e` and application-E2E applicability/risk metadata.

The detailed finding remains in `tests/e2e/REVIEW.md`. The accepted correction is a dedicated `tests/e2e/databaseVirtualizationFlows.spec.ts` with persistent applicability `both`, while `databaseViewsAndQueryFlows.spec.ts` returns to `desktop`. The virtualization risk mapping must target the dedicated spec and follow the moved inline-edit feature path.

## Minor issues

### m1 — New controlled configuration prop is accessed through `props.` in the template

Owner: `DatabaseToolbar.vue`.

The PR added `activeConfigurationSurface`, but the template checks `props.activeConfigurationSurface` while the component already exposes its other props through named refs such as `documentId`, `path`, and `autoHideTarget`. This creates an unnecessary mixed template style.

Required final state: expose `activeConfigurationSurface` as a named ref/value in `<script setup>` and use that name directly in the template. Do not introduce a broad props destructuring/refactor solely for this cleanup.

## Accepted risks

None.

## Items not required for PR #217

- The pre-existing `RelationValueFieldData.onSelect` function prop remains outside this correction scope.
- `DatabaseViewWidget` directly using `useDatabaseData().removeItem` instead of the existing `@feature/databaseItemRemove` is pre-existing FSD debt. It should be corrected separately unless current work materially touches that action.
- Duplicate `useDatabaseProperties` / `useDatabaseViewSelection` reads across existing Database widget composition are pre-existing ownership debt. Do not expand #217 into a broad read-model refactor.
- Existing `props.class` / `props.inputSize` template usage in `DatabasePropertyValueField.vue` predates #217. It may be normalized separately; only the newly introduced `activeConfigurationSurface` usage is part of this correction.

## Unresolved questions

None.
