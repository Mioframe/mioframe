# Checkbox implementation

Status: blocked
ARCHITECTURE.md reference: `src/shared/ui/material/components/checkbox/ARCHITECTURE.md`
Revision summary: Full PR review found that the current implementation intentionally treats Enter as a no-op because installed `@m3e/web@2.6.3` does not activate Checkbox on Enter. Official Material Checkbox accessibility guidance publishes Space or Enter activation, so official Material remains authoritative and the implementation requires a family-local Enter correction after architecture is updated.
Remaining blockers: Correct architecture and then implement/prove official Enter activation.
Required return family: self
Required return stage: architecture
Architecture deviations: current code follows the checked-in Space-only architecture, but that architecture is the upstream defect
Migration readiness: blocked

## Implemented passes

The existing canonical implementation remains valid in the reviewed areas unrelated to Enter:

- one semantic `m3e-checkbox` host;
- controlled `checked` / `indeterminate` props as the only state source;
- cancelable pre-mutation `beforeinput` handling for pointer/Space activation;
- rejected-intent control;
- `disabled` and `presentation` mapping;
- explicit host-attribute allow-list;
- private renderer typing and renderer boundary;
- canonical export and owner-local proof.

The missing required pass is official Enter activation for the current renderer gap.

## Public API implemented

The public API remains unchanged:

- props: `checked`, `indeterminate`, `disabled`, `presentation`;
- emits: `update:checked`, `update:indeterminate`;
- no slots;
- no public renderer types/events.

No public API expansion is required for the correction.

## Tokens and renderer mappings

No Checkbox-specific public token surface is selected. Existing renderer property mappings remain correct.

The unresolved renderer mapping is behavioral: current `@m3e/web@2.6.3` handles pointer/Space activation but not Enter while official Material publishes Space or Enter activation.

## Dependencies

Dependency queue: none.

## Component-owned proof

Existing proof remains useful except for the browser assertion that Enter produces no effect. That assertion is now proof of the defect and must be replaced.

Required post-architecture proof:

- Enter produces one controlled intent and accepted state round-trips;
- rejected Enter intent leaves rendered state unchanged;
- disabled/presentation suppress independent Enter activation;
- pointer and Space remain exactly-once activation paths;
- visual baselines remain unchanged unless an actual visible change occurs.

## Stage verification

Previous focused checks and exact-head CI applied to the old Space-only target state. They do not prove the corrected official contract.

After code correction, run focused verifier-managed checks selected by the corrected architecture. Required exact-head GitHub CI belongs to the architect after the corrected head is published.

## Architecture deviations

The current code is not a deviation from the current checked-in architecture; the architecture itself incorrectly promoted renderer behavior into the public keyboard contract. The earliest correction owner is architecture, as recorded in `REVIEW.md`.

## Remaining blockers

1. Correct Checkbox architecture to select official Space/Enter activation.
2. Implement the minimum family-local Enter correction without a generic keyboard abstraction or duplicate state owner.
3. Update focused unit/browser proof.

## Migration readiness

Blocked until architecture and implementation are corrected and focused component proof passes.
