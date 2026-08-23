# Database virtualization mutation-proof correction handoff

Status: **ready**.

This is the implementation contract for the remaining required proof in PR #217 after the Database virtualization architecture, feature ownership, resolving interaction, toolbar contract, and E2E ownership corrections were accepted.

## Goal

Close the exact-head mutation-verification blocker by strengthening focused tests around the meaningful public behavior of the three touched production owners:

- `src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.ts`;
- `src/widgets/DocumentView/Database/DatabaseToolbar.vue`;
- `src/widgets/DocumentView/Database/EditableInlineValue.vue`.

The correction is proof work. It must preserve the accepted production architecture and runtime behavior.

## Current evidence

The first verifier-managed run after the quality correction passed format, oxlint, eslint, type-check, unit tests, visual, and Storybook behavior, but failed mutation verification.

Observed mutation scores:

- aggregate touched source: **32.84%**;
- `features/databaseInlineValueEdit/useDatabaseInlineEditSession.ts`: **56.58%**;
- `DatabaseToolbar.vue`: **40.00%**;
- `EditableInlineValue.vue`: **14.81%**;
- repository breaking threshold: **60%**.

The failure is not an architecture defect and is not a reason to weaken mutation configuration. It exposes insufficient focused proof for existing observable lifecycle/component branches now included in the touched-source mutation scope.

Active review evidence:

- `src/features/databaseInlineValueEdit/REVIEW.md`;
- `src/widgets/DocumentView/Database/REVIEW.md`.

## Architecture decision

Do not change production behavior to satisfy mutation tooling.

The minimum complete correction is:

1. keep the accepted feature/widget implementation unchanged;
2. extend colocated tests so they exercise the meaningful public lifecycle and component contracts that are currently under-proved;
3. rerun mutation through the normal verifier-managed surface over the three existing mutation targets;
4. stop when the normal mutation gate passes without threshold/configuration/scope weakening.

The only expected production-file edit is the stale ownership comment in `EditableInlineValue.vue`; make it feature-owned or ownership-neutral. Any other production change requires a concrete correctness defect discovered by the tests and must be reported rather than introduced merely to improve mutation score.

Do not optimize for killing every individual mutant. Tests must assert stable user/action/component contracts. Equivalent or implementation-detail mutants do not justify exposing internals, adding test hooks, or reshaping production code.

## Feature proof: `databaseInlineValueEdit`

`useDatabaseInlineEditSession` owns one active logical cell session and the complete request/update/resolve/commit/cancel lifecycle. Extend `useDatabaseInlineEditSession.test.ts` around its public API.

Required behavior to prove:

### Identity

- `getSession(itemId, propertyId)` returns the active draft only for the exact item/property pair;
- a different item or a different property does not match the active session;
- requesting the already-active exact cell is a no-op and does not replace/re-resolve it.

### Resolve success and no-op

- resolving with no active session returns success and performs no write;
- an unchanged draft resolves successfully without persistence and clears the session;
- a changed draft persists exactly `{ itemId, propertyId, draft }`, returns success, and clears the session;
- after settlement, a later resolve/request is not incorrectly tied to the old completed in-flight promise.

### Serialized in-flight resolution

- two `resolve()` calls while one write is pending reuse the same in-flight resolution rather than starting a second write;
- while resolving, draft updates and cancel attempts do not mutate/clear the canonical session;
- successful settlement leaves no stale active session.

### Switching cells

- requesting a different cell resolves the current cell first, then opens the new cell only after successful settlement;
- if resolving the previous cell fails, the new request does not replace the recoverable previous session;
- after a recoverable failure, a subsequent successful resolution can clear the old session and allow the next request.

### Update / commit / cancel guards

- `updateDraft` changes only the exact active non-resolving cell;
- wrong item/property and resolving sessions ignore draft updates;
- `commit` resolves only the exact active cell; a wrong cell is a no-op;
- `cancel` clears only the exact active non-resolving cell; a wrong cell or resolving session is not cleared.

Keep the existing deferred-rejection/exact-draft recovery proof.

## Widget proof: `DatabaseToolbar`

Extend `DatabaseToolbar.test.ts` to cover the component's observable toolbar contract, not internal refs.

Required behavior to prove:

- with properties present, view/sort/add/filter/configure controls are rendered;
- with zero properties, property-dependent controls are hidden while `configure properties` remains available;
- each configuration control emits the correct typed request and does not self-open a sheet;
- each controlled configuration surface (`views`, `sort`, `filter`, `properties`) renders only its matching sheet;
- closing any controlled sheet emits `closeConfiguration` upward;
- the add-item dialog is toolbar-local: initially closed, opens from `add item`, and closes on both `added` and `cancel`;
- the add-item value-field slot continues to forward property edits through `patchProperty` with the current path/document/property identity when this can be proven with the existing public child emit contract.

Make test mocks/stubs configurable where needed; do not introduce production test hooks.

## Widget proof: `EditableInlineValue`

Keep the existing resolving-target test and add focused component tests for the rest of the public interaction contract.

Required behavior to prove where applicable with existing public DOM/emits/entity mocks:

### Normal non-boolean activation

- without an edit session the inline root is keyboard/click interactive and exposes the non-boolean button/dialog semantics;
- click and Enter/Space request editing with the current effective value;
- unrelated keys do not request editing;
- an active non-resolving editor renders the exact lifted draft and emits `update:draft` from field input.

### Commit / cancel / unmount

- editor commit paths emit `commitEdit` only while an editor is active;
- Escape/tooltip-close cancel paths emit `cancelEdit` only while active;
- virtual/unmount with an active uncancelled editor requests commit so the lifted draft is not silently lost;
- once cancellation was requested, unmount does not additionally commit.

### Boolean activation and semantics

- a boolean property uses checkbox semantics and does not open the editor;
- click/keyboard activation writes the toggled value through the existing stored-value entity contract;
- `aria-checked` reflects stored true/false and the supported undefined/default/indeterminate state.

### Forwarded editor/property behavior

- child property updates are re-emitted through `update:property`;
- string editor sizing derived from the public draft/value contract remains correct for minimum and longer values when this is observable through child props;
- resolving-state coverage continues to prove target detachment, no state layer/clickable presentation/input, no new request/cancel/draft acceptance, and exact-draft recovery.

Do not duplicate complete product E2E scenarios in component tests. These are owner-local contract proofs for branches mutation verification can observe.

## Test design constraints

- Prefer small independent tests over one large stateful scenario.
- Reset configurable mocks between tests so one case cannot make another pass accidentally.
- Assert externally meaningful effects: returned booleans, public session lookup, writes, emitted events, rendered controls/roles/attributes/child props.
- Do not assert private refs or implementation-specific helper calls unless the helper itself is the existing public dependency contract being mocked (`postValue`, `patchProperty`, State/Ripple target proof already accepted).
- Do not snapshot whole components merely to increase coverage.
- Do not add sleeps, retries, timing inflation, broad browser tests, or new E2E for this correction.

## Acceptance criteria

- all feature lifecycle behavior listed above that is represented by the current implementation is protected by focused tests;
- meaningful toolbar and inline-value public branches are protected by focused component tests;
- existing resolving rejection/recovery behavior remains covered;
- stale `widget-owned session` comment is corrected without runtime change;
- no virtualization, geometry, relation-root, worker/service, persistence API, configuration ownership, or feature/widget ownership change;
- no mutation threshold/exclusion/verifier-scope/configuration change;
- verifier-managed mutation over the three touched production targets passes the repository's existing 60% breaking threshold;
- focused unit/type/lint verification for changed test/comment files passes.

## Verification

Use focused implementation feedback:

```bash
pnpm verify --only unit-tests --files \
  src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.test.ts \
  src/widgets/DocumentView/Database/DatabaseToolbar.test.ts \
  src/widgets/DocumentView/Database/EditableInlineValue.test.ts

pnpm verify --only type-check
```

Run lint/format feedback only for the files actually changed when needed.

Required risk-specific proof before handoff:

```bash
pnpm verify --only mutation --files \
  src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.ts \
  src/widgets/DocumentView/Database/DatabaseToolbar.vue \
  src/widgets/DocumentView/Database/EditableInlineValue.vue
```

Do not run a repository-wide final local gate solely for handoff. Exact-head GitHub CI remains architect-owned.

No E2E, Storybook-behavior, visual, or performance rerun is required unless the correction unexpectedly changes runtime behavior outside the allowed stale-comment edit. If such a production change appears necessary, stop and report the concrete defect.

## Forbidden

- changing production behavior merely to make mutants easier to kill;
- lowering `thresholds.break`, changing Stryker configuration, excluding mutants/files, changing verifier mutation selection, or adding ignore comments;
- test-only production APIs, exported internals, debug state, or selectors;
- second edit/session state or lifecycle manager;
- moving persistence back into the widget;
- changing `useVirtualCollection`, `DatabaseDataTable`, table/root geometry, relation roots, State/Ripple APIs, tooltip/overlay APIs, service/worker, or entity write APIs;
- adding duplicate application E2E proof;
- broad unrelated cleanup;
- sleeps, retries, force, timeout inflation, assertion weakening, or treating retry-pass as success.

## Readiness

Architecture: **resolved**.

Production behavior: **accepted**.

Required mutation proof: **implementation-ready**.

Merge remains blocked until this proof correction passes, the resulting scope is re-reviewed, and exact-head GitHub CI is green.
