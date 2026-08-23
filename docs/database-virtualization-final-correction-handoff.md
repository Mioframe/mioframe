# Database virtualization final correction handoff

Status: **ready**.

This is the implementation contract for the remaining semantic-review findings in PR #217. It supersedes earlier correction wording only where this document is more specific.

## Goal

Close the remaining edit-lifecycle, Vue component-contract, and product-proof defects without changing virtualization architecture or performance behavior.

## Current defects

- `EditableInlineValue` remains interactive while its session is `resolving`, but the session rejects draft/cancel changes during that interval.
- `DatabaseToolbar` receives a parent-owned async resolve/permission callback as a prop and owns the resulting configuration visibility mutation.
- the surface-offset E2E reads private `data-mioframe-virtual-index` state and does not prove logical virtualized behavior again after the preceding surface moves.

## Non-goals

- no `useVirtualCollection`, table geometry, relation-root, service/worker, persistence, or performance redesign;
- no generic edit/configuration manager or new shared UI API;
- no cleanup of pre-existing unrelated callback props.

## Ownership and state

- `useDatabaseInlineEditSession` remains the single owner of `{ itemId, propertyId, initialValue, draft, resolving }`.
- `EditableInlineValue` renders editing UI from that session and must not accept draft/cancel interaction while `resolving`.
- `DatabaseViewWidget` owns one controlled `DatabaseConfigurationSurface = 'views' | 'sort' | 'filter' | 'properties' | undefined` state.
- `DatabaseToolbar` receives that controlled state and emits typed request/close intents; it does not receive parent commands, permission callbacks, or async gates as props.
- `DatabaseDataTable` geometry implementation remains unchanged.

## Minimum sufficient design

1. Distinguish session existence from editor interactivity. While `resolving`, do not expose an editable field or accept cancel/draft updates. A failed write returns the same draft to an interactive editor; success removes the session normally. Do not create local/secondary draft state.
2. Replace `resolveInlineEditBeforeConfiguration` with normal Vue composition:
   - toolbar emits `requestConfiguration(surface)`;
   - parent resolves the active edit;
   - only on success parent sets the controlled configuration surface;
   - toolbar renders the selected sheet from the controlled prop and emits `closeConfiguration` to clear it.
3. Keep direct explicit-view resolve-before-set handling.
4. Correct the surface proof to use public table semantics (`aria-rowindex`, `aria-rowcount`, logical sentinels, bounded mounted rows/cells). Exercise a deep range while preceding content exists and repeat logical deep-range proof after that content is removed/moves the table.

## Acceptance

- no user input can appear accepted while the canonical edit session refuses it;
- rejected persistence restores the exact draft to an interactive editor;
- `DatabaseToolbar` has no parent action/permission callback prop;
- one parent-controlled configuration state covers views/filter/sort/properties;
- failed edit resolution cannot open configuration;
- current-view removal remains reachable only after successful configuration gating;
- surface E2E uses no private virtualizer marker and proves correct logical ranges before and after real surface movement;
- existing relation roots, bounded DOM, accessibility, edit eviction, view switching, desktop/mobile behavior remain unchanged.

## Required proof

- deterministic deferred-writer proof for the `resolving` interval and rejected-write recovery;
- focused component contract proof that `EditableInlineValue` is non-interactive while resolving and becomes editable again after failure-state input;
- `DatabaseToolbar` component contract: user actions emit request intents, sheets render only from controlled state, close emits upward;
- existing application E2E remains the successful configuration/current-view-removal owner;
- corrected application E2E owns non-zero/moved surface behavior using public logical table semantics.

No new E2E failure-injection framework and no new performance run are required unless this correction changes virtualization/geometry code or reveals a regression.

## Forbidden

Callback props for parent-owned commands/gates; second draft state; generic managers/providers; private virtualizer state in product tests; test-only production APIs; changes to shared virtualization, table, tooltip/overlay, worker/query/storage; sleeps/retries/timeout inflation/tolerance weakening.

## Readiness

Ownership, state shape, API direction, acceptance, and proof are resolved.

Verdict: **ready**.
