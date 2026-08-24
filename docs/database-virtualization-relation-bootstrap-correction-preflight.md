# Database virtualization relation bootstrap correction preflight

Authoring source: `docs/database-virtualization-relation-bootstrap-correction-handoff.md`.

## Goal / non-goals

Fix the exact-head cold-reload relation-value rendering regression while preserving the settled zero-distance spacer correction. Do not change persistence/query semantics, shared virtualization, `MDTable`, geometry ownership, or deferred Chrome-jank work.

## Confirmed current behavior and evidence

- `tests/e2e/databaseViewsAndQueryFlows.spec.ts` relation-filter persistence scenario passes before `d3c81c27805316a8ebd46e53c96137520e6d14a4` and fails 3/3 on exact head `63a984a85c8f3a4c3b75eea9be122ea64691c963` after reload because the selected related value text is absent.
- Filtering itself remains correct after reload.
- `DatabaseDataTable` derives spacer presence only from positive leading/trailing distance.
- `useVirtualCollection` exposes `items=[]`, `leadingSize=0`, and `trailingSize=0` before a non-empty collection has produced its first range, which is observationally identical to a settled boundary if only distance is inspected.

## Owners / public entry points

- Production owner: `src/entities/databaseData/DatabaseDataTable.vue`.
- Public API: unchanged.
- Product consumer/proof: existing Database Filters Sheet relation inline path.

## Source of truth / state shape

Existing logical source arrays plus TanStack virtual items remain canonical. No stored bootstrap/range state. If needed, derive an ephemeral unresolved-non-empty condition from source length and current `items.length` independently for rows and columns.

## Minimum implementation design and simpler alternative

Preferred minimum design, if the focused failing scenario confirms the hypothesis:

1. Keep settled spacer presence based on positive virtual distance.
2. While a logical collection is non-empty but has no mounted virtual items yet, render only the minimum `aria-hidden` table bootstrap structure required for native-table/root sizing to let TanStack establish the first range.
3. Remove that bootstrap-only structure immediately once real virtual items exist; it must not survive as a zero-distance steady-state spacer or own range/measurement state.
4. Keep `physicalColumnCount` truthful to physically rendered cells in each state.

Simpler alternative considered: restoring unconditional spacers. Rejected because it reintroduces the border/radius defect already fixed by `d3c81c...`.

If focused evidence shows that temporary entity-local table structure is not the cause/fix, stop. Do not substitute a widget min-height, shared API change, or other broader workaround without a new architecture decision.

## Expected files/modules

Production:

- `src/entities/databaseData/DatabaseDataTable.vue`.

Proof, only as needed:

- `tests/e2e/databaseViewsAndQueryFlows.spec.ts` should normally need no semantic weakening; its existing failing assertion is required proof.
- `tests/e2e/databaseVirtualizationFlows.spec.ts` only if a direct bootstrap invariant must be added/adjusted without duplicating the product scenario.

Do not edit `src/entities/databaseData/REVIEW.md`; architect owns review state.

## Implementation passes

1. Reproduce the failing relation-filter persistence scenario through the verifier and inspect enough state to confirm whether the non-empty/no-range bootstrap collapse is the cause.
2. If confirmed, implement the entity-local derived bootstrap distinction with no public/shared changes.
3. Run the failing product scenario focused until it passes without retries/flaky classification.
4. Run the existing Database virtualization structural scenarios to confirm settled start/interior/end spacer behavior, bounded nested ranges, and deep scrolling remain correct.
5. Run focused type-check.
6. When the correction appears complete, run the complete cumulative branch gate: `pnpm verify --base origin/develop`.
7. If that branch gate exposes another PR-caused in-contract failure, fix it and use the smallest relevant focused verifier command for fast feedback; then rerun `pnpm verify --base origin/develop`. Repeat until the branch gate is clean.

If pass 1 disproves the handoff hypothesis or a later branch-gate failure requires ownership/architecture expansion, stop and report the evidence instead of continuing.

## Required removal of replaced logic

Do not leave two competing spacer-presence paths. The final code should clearly separate only:

- transient unresolved non-empty bootstrap presentation; and
- settled positive-distance virtual spacers.

No compatibility path or fallback timer.

## TEST IMPACT

- Contract/scenario: persisted relation-filter selected value renders after cold reload.
  - Primary proof owner: `tests/e2e/databaseViewsAndQueryFlows.spec.ts`.
  - Additional proof: Database virtualization structural E2E where needed.
  - Existing proof: exact scenario already exists and currently fails on exact head.
  - New/updated proof: preserve the existing assertion; add only the smallest direct bootstrap assertion if implementation introduces a distinct transient DOM contract that otherwise has no durable protection.
  - Risk or platform matrix: Chromium application E2E is sufficient for the observed regression; do not broaden browser matrix solely for this correction.
  - Durable ownership/impact updates: none expected.

- Contract/scenario: zero-distance spacer DOM is absent after virtual range settlement at logical boundaries.
  - Primary proof owner: `tests/e2e/databaseVirtualizationFlows.spec.ts`.
  - Additional proof: operator visual acceptance remains architect/operator-owned.
  - Existing proof: start/interior/end spacer-boundary checks for top-level and relation/no-action tables.
  - New/updated proof: only if current checks do not cover the final derived bootstrap/settled distinction.
  - Risk or platform matrix: nested relation roots plus top-level table.
  - Durable ownership/impact updates: none expected.

## Verification

Use the smallest verifier-managed commands useful while implementing or correcting, for example:

- `pnpm verify --only e2e --files tests/e2e/databaseViewsAndQueryFlows.spec.ts`
- `pnpm verify --only e2e --files tests/e2e/databaseVirtualizationFlows.spec.ts`
- `pnpm verify --only type-check`

If the verifier does not accept the exact file scoping above, use its documented nearest focused form; do not invoke Playwright directly.

Before coding handoff, run the complete branch-diff verifier using the normal local profile:

- `pnpm verify --base origin/develop`

Do not add `--profile github-actions` to the ordinary local branch gate. Do not substitute `pnpm verify --full` or `pnpm verify:release` for this PR-diff gate.

If the branch gate fails for a PR-caused issue inside the accepted contract, correct that issue with focused verification for the iteration and then rerun the complete branch gate until it passes cleanly. Exact-head GitHub CI remains architect-owned after handoff.
