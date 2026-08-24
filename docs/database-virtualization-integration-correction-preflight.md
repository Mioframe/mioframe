# Database virtualization integration correction preflight

Status: **ready**.

Source: `docs/database-virtualization-integration-correction-handoff.md`.

## Goal

Restore the Database table's logical outer boundary by removing zero-distance virtual spacer DOM while preserving the accepted virtualization behavior.

## Expected production change

`src/entities/databaseData/DatabaseDataTable.vue`

- derive booleans for each leading/trailing row/column spacer from the existing virtual sizes;
- render each spacer only when its size is greater than zero;
- make `physicalColumnCount` reflect only rendered spacer columns;
- keep non-zero spacer geometry and accessibility behavior unchanged.

Do not add a second styling system. The simpler alternative—letting real cells/rows regain physical first/last positions—is the selected design.

## Expected proof change

`tests/e2e/databaseVirtualizationFlows.spec.ts`

Extend existing virtualization scenarios rather than creating a new product spec.

Prove:

1. initial logical top/left has no zero-distance leading row/column spacer DOM;
2. an interior/deep virtual range has the required non-zero spacer DOM;
3. logical bottom/right removes zero-distance trailing spacer DOM;
4. a relation/no-action table follows the same boundary rule;
5. existing bounded mounted work, deep sentinels, sticky surfaces, ARIA semantics, and dynamic sizing remain intact.

Do not add screenshot assertions to application E2E.

## TEST IMPACT

- Contract: presentation spacer DOM exists only for non-zero virtual distance.
  - Primary proof owner: `tests/e2e/databaseVirtualizationFlows.spec.ts`.
  - Existing proof: deep two-axis ranges, relation roots, bounded mounted work, dynamic sizing/sticky surfaces.
  - New/updated proof: boundary spacer presence/absence at logical start/interior/end.
  - Risk matrix: desktop/mobile project applicability remains unchanged.
  - Durable ownership updates: none.

- Contract: pre-PR Database table outer border/corner appearance is restored.
  - Primary proof: operator inspection of the real application table after the structural correction.
  - Automated supporting proof: the E2E structural boundary contract above.
  - New Storybook/visual infrastructure: none.

## Verification

Use focused verifier-managed feedback only:

```bash
pnpm verify --only type-check
pnpm verify --only e2e --files tests/e2e/databaseVirtualizationFlows.spec.ts
```

Do not run performance attribution in this pass.

## Stop conditions

Stop and report if conditional omission of zero-distance spacers does not restore the real table boundary without additional shared styling changes. Do not modify `MDTable`, geometry ownership, virtualization APIs, or performance code to compensate.
