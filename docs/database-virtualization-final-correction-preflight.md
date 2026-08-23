# Database virtualization final correction preflight

Status: **ready**.

Authoring source: `docs/database-virtualization-final-correction-handoff.md`, `docs/database-virtualization.md`, active owner-local `REVIEW.md` files, applicable `AGENTS.md`, `.agents/skills/vue-component-implementation/SKILL.md`, and `docs/testing/architecture.md`.

## Goal / non-goals

Fix the remaining semantic-review findings only. Do not change virtualization geometry, relation roots, service/worker behavior, persisted state, or performance architecture.

## Final component contracts

### `EditableInlineValue`

- session present + `resolving: false`: editor may accept draft/commit/cancel interaction;
- session present + `resolving: true`: no editable field and no cancel/draft interaction may be accepted;
- failed resolve: same session/draft becomes interactive again;
- successful resolve: session disappears normally.

No secondary draft state.

### Database configuration

Use one local shared type:

```ts
export type DatabaseConfigurationSurface = 'views' | 'sort' | 'filter' | 'properties';
```

`DatabaseViewWidget` owns `DatabaseConfigurationSurface | undefined`.

`DatabaseToolbar`:

- prop: controlled active configuration surface;
- emits: typed `requestConfiguration(surface)` and `closeConfiguration`;
- no function-valued parent orchestration/permission prop;
- configuration sheets render only from the controlled prop;
- add-item dialog remains toolbar-local because it is not part of the source/shape gate.

Parent request handling resolves the active edit first and sets the controlled surface only on success. Direct explicit-view gating remains unchanged.

## Expected production scope

- `src/widgets/DocumentView/Database/EditableInlineValue.vue`
- `src/widgets/DocumentView/Database/useDatabaseInlineEditSession.ts` only if required to expose already-owned state cleanly; do not redesign it
- `src/widgets/DocumentView/Database/DatabaseToolbar.vue`
- `src/widgets/DocumentView/Database/DatabaseViewWidget.vue`
- one narrow local type module for `DatabaseConfigurationSurface` if needed by both components
- focused colocated tests
- `tests/e2e/databaseViewsAndQueryFlows.spec.ts`

Do not touch `src/shared/ui/virtualization/*`, `DatabaseDataTable` geometry, relation-root implementation, `MDTable`, tooltip/overlay APIs, service/worker, or persistence unless a concrete blocker is discovered.

## Pass order

1. Fix resolving-editor interaction contract and focused deterministic/component proof.
2. Replace toolbar callback-prop gating with controlled state + emits and component proof.
3. Replace private surface-test state with public logical semantics and prove post-move deep behavior.
4. Run focused affected verification only.

## TEST IMPACT

- **Edit resolving interval**
  - Primary proof: deterministic/session + component contract.
  - Update `useDatabaseInlineEditSession.test.ts` with a deferred writer so `resolving: true` is observable before settlement and rejected settlement restores the exact draft.
  - Add/update focused `EditableInlineValue` component proof for no editable interaction during resolving and recovery after failure-state input.
  - Existing application E2E continues to own commit/Escape/vertical eviction/horizontal eviction/view-switch behavior.

- **Configuration Vue contract**
  - Primary proof: `DatabaseToolbar` component contract.
  - Replace callback-prop test with request/controlled-open/close behavior.
  - Existing application E2E continues to own successful resolve-before-configuration and current-view removal.
  - No new product failure-injection infrastructure is required.

- **Surface movement**
  - Primary proof: existing application E2E.
  - Remove all reads of `data-mioframe-virtual-index`.
  - Use public `aria-rowindex`/`aria-rowcount` or visible logical sentinels plus bounded mounted work.
  - Prove deep logical behavior while preceding content creates a non-zero offset, then move/remove that content and prove logical deep behavior again.

No new visual, mutation, release, schema, or performance proof is required. Existing final S0/G1 evidence remains valid unless production virtualization/geometry is changed.

## Required removal

- `resolveInlineEditBeforeConfiguration` prop and its callback-prop test contract;
- four independent configuration visibility refs if they are replaced by the accepted single controlled state;
- private `data-mioframe-virtual-index` reads from product E2E;
- any interaction path that emits draft/cancel while `resolving`.

## Verification

Use focused verifier-managed unit/component/type/lint/E2E checks needed for the changed files. Do not rerun the performance matrix or a repository-wide final local gate solely for handoff. Exact-head CI remains architect-owned.

## Forbidden

Second edit state; generic state manager; callback permission props; duplicate configuration state; private virtualizer assertions; test hooks in production; changes to virtualization/geometry or cross-layer optimization without new evidence; sleeps/retries/timeout inflation/tolerance weakening.

Verdict: **ready**.
