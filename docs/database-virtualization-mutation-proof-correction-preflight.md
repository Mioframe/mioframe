# Database virtualization mutation-proof correction preflight

Status: **ready**.

Authoring source: `docs/database-virtualization-mutation-proof-correction-handoff.md`, `docs/database-virtualization.md`, active owner-local `REVIEW.md` files, applicable `AGENTS.md`, and `.agents/skills/verification/SKILL.md`.

## Goal

Raise the required mutation proof by adding faithful owner-local tests only. Preserve all accepted production architecture and behavior.

## Expected implementation scope

Primary test files:

- `src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.test.ts`;
- `src/widgets/DocumentView/Database/DatabaseToolbar.test.ts`;
- `src/widgets/DocumentView/Database/EditableInlineValue.test.ts`.

Allowed production edit:

- `src/widgets/DocumentView/Database/EditableInlineValue.vue` — stale ownership comment only.

Production sources under mutation proof, but not expected to change:

- `src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.ts`;
- `src/widgets/DocumentView/Database/DatabaseToolbar.vue`;
- `src/widgets/DocumentView/Database/EditableInlineValue.vue` apart from the comment above.

Do not edit architect-owned review/canonical/handoff documents during the coding pass.

## Feature test matrix

Use the public return surface from `useDatabaseInlineEditSession` and the mocked entity writer.

### Setup discipline

- give each test fresh item/property identities and a fresh feature instance;
- reset `postValue` between tests;
- use deferred promises only where an observable resolving interval or in-flight serialization is required;
- do not inspect `activeInlineEditSession` or `activeInlineEditResolution` directly.

### Required cases

1. **Exact cell lookup**
   - request A/item + A/property;
   - exact lookup returns `{ draft: initial, resolving: false }`;
   - same item/wrong property and wrong item/same property return `undefined`.

2. **Same-cell request is stable**
   - request active cell;
   - update draft;
   - request same cell again;
   - draft remains unchanged and no persistence is triggered.

3. **Resolve without session**
   - resolves `true`;
   - no persistence.

4. **Unchanged draft resolve**
   - request cell and resolve without draft change;
   - resolves `true`;
   - no persistence;
   - session clears.

5. **Changed draft successful resolve**
   - update exact cell;
   - resolve;
   - writer called once with exact item/property/draft;
   - resolves `true` and clears session.

6. **In-flight resolve serialization**
   - changed draft + deferred write;
   - call `resolve()` twice before settlement;
   - same in-flight operation is reused and writer starts once;
   - while resolving, exact lookup reports same draft with `resolving: true`;
   - after success session clears;
   - a later request/resolve can execute normally, proving completed resolution state was released.

7. **Resolving guards**
   - during deferred resolve, `updateDraft` does not replace draft;
   - `cancel` does not clear session;
   - wrong-cell commit/update/cancel remain no-ops.

8. **Switch after successful resolve**
   - active A has changed draft;
   - request B;
   - A is persisted first;
   - after success B becomes the active session with B's initial draft.

9. **Switch blocked by failed prior resolve**
   - active A changed draft, writer rejects;
   - request B completes without replacing A;
   - A retains exact draft and becomes non-resolving again;
   - after a later successful resolve of A, requesting B succeeds.

10. **Commit identity**
    - wrong-cell commit causes no write;
    - exact-cell commit follows normal resolve behavior and clears after successful persistence.

11. **Cancel identity**
    - wrong-cell cancel keeps active session;
    - exact-cell non-resolving cancel clears without persistence.

The existing deferred rejection/exact-draft test may be kept, split, or combined only if the final tests remain clear and independently prove these contracts.

## Toolbar test matrix

Make existing entity/composable mocks controllable from the test file rather than hard-coding every state.

Recommended test-owned controls:

- reactive property count;
- reactive effective/explicit view identities when needed;
- `patchProperty` spy;
- add-dialog stub exposing `added` and `cancel` emits and, if used, its public `valueField` slot;
- configuration sheet stubs exposing `closed`.

Required cases:

1. property count > 0 renders view/sort/add/filter/configure controls;
2. property count = 0 hides view/sort/add/filter but keeps configure-properties;
3. all four request controls emit the correct `DatabaseConfigurationSurface` without opening a sheet by themselves;
4. setting each controlled surface renders only its matching sheet;
5. sheet close emits `closeConfiguration`;
6. add-item dialog starts closed, opens from add-item, closes on `added`, opens again, and closes on `cancel`;
7. if the add dialog's existing public slot can be represented cleanly, a child `update:property` event calls the existing `patchProperty` with current path/document/property/update values.

Do not move toolbar-local add-item state to the parent or change configuration ownership.

## EditableInlineValue test matrix

Prefer multiple small mounts with configurable property/value mocks.

Recommended test-owned controls:

- reactive property model (`string`, `boolean`, name/default/indeterminate as needed);
- reactive effective value;
- stored-value `post` spy;
- existing State/Ripple target capture;
- field/tooltip stubs that expose only their public props/emits;
- optional deterministic `useElementSize` width only if needed to prove currently exposed editor sizing/style behavior.

Required cases:

1. **Idle string cell**
   - interactive root, `role=button`, keyboard focusable, dialog-haspopup semantics;
   - click emits `requestEdit` with current effective value;
   - Enter and Space activate; unrelated key does not.

2. **Active string editor**
   - exact lifted draft appears in the value-field stub;
   - child value update emits `update:draft`;
   - Enter/interaction-outside emits commit;
   - Escape/tooltip-close emits cancel;
   - commit/cancel paths do nothing when editor is not active.

3. **Unmount behavior**
   - active uncancelled editor emits commit on unmount;
   - after a cancel request, unmount does not emit an additional commit.

4. **Boolean cell**
   - `role=checkbox`, no dialog-haspopup/editor request;
   - activation calls stored-value write with the result of the existing `toggleBoolean` dependency;
   - keyboard activation follows the same path;
   - prove `aria-checked` for stored true/false and supported undefined/default/indeterminate semantics.

5. **Property forwarding**
   - value-field `update:property` becomes component `update:property` with the same payload.

6. **String sizing**
   - if observable through current child props, short string input uses the existing minimum size and a longer lifted draft increases it accordingly;
   - non-string editor does not invent string sizing.

7. **Resolving/recovery regression proof**
   - retain the current root -> null -> root State/Ripple target assertion;
   - resolving removes interactive modifier/state layer/input/tab stop and accepts no new request/cancel/draft;
   - recovery restores the exact lifted draft and interaction target.

Correct the stale virtual-unmount comment from `widget-owned session` to feature-owned or ownership-neutral wording only.

## Mutation feedback loop

Do not edit source to chase individual mutants.

Suggested order:

1. add feature lifecycle tests;
2. run focused feature unit tests;
3. add toolbar tests;
4. add inline-value tests and comment correction;
5. run all three focused unit tests + type-check;
6. run the required mutation proof over the three production targets;
7. inspect surviving mutants only if the normal gate still fails;
8. for each remaining meaningful mutant, add/strengthen the missing public-contract assertion;
9. ignore equivalent/implementation-detail mutants only by leaving them alone — do not add Stryker exclusions or production seams.

If reaching the repository threshold would require changing production logic, exporting internals, changing mutation configuration, or testing implementation details with no stable contract value, stop and report that as a blocker instead of forcing the score.

## Verification

Development feedback:

```bash
pnpm verify --only unit-tests --files \
  src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.test.ts \
  src/widgets/DocumentView/Database/DatabaseToolbar.test.ts \
  src/widgets/DocumentView/Database/EditableInlineValue.test.ts

pnpm verify --only type-check
```

Use focused `format`, `eslint`, and `oxlint` only for actually changed files when useful.

Required task-specific proof:

```bash
pnpm verify --only mutation --files \
  src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.ts \
  src/widgets/DocumentView/Database/DatabaseToolbar.vue \
  src/widgets/DocumentView/Database/EditableInlineValue.vue
```

The required result is a normal passing verifier mutation run with the repository's unchanged configuration and 60% breaking threshold.

Do not run `pnpm verify`, `pnpm verify --full`, or `pnpm verify:release` solely for handoff. Exact-head CI remains architect-owned.

## Forbidden

- production behavior changes for coverage convenience;
- mutation threshold/config/exclusion/verifier changes;
- test-only production exports/hooks/selectors;
- direct inspection of private feature refs;
- replacing public behavior assertions with snapshots or raw line coverage goals;
- new E2E/browser/performance work without a newly discovered runtime defect;
- unrelated Database cleanup;
- sleeps, retries, force, timeout inflation, weakened assertions.

## Handoff report

Return:

```text
TASK RESULT
status: complete | partial | blocked
remaining: none | <remaining implementation/proof/blocker>

LOCAL FEEDBACK
commands: none | <focused verifier-managed commands actually run>
status: not run | passed | failed | partial
reason if failed/partial: <exact reason>

PROOF
feature lifecycle: <covered public contracts>
toolbar component: <covered public contracts>
inline value component: <covered public contracts>
mutation: <score/result from verifier-managed run>

PRODUCTION CHANGES
runtime behavior: unchanged | <concrete discovered defect and change>
comment-only: <summary>

CI GATE
status: architect-owned
```
