# Checkbox implementation

Status: blocked
ARCHITECTURE.md reference: `src/shared/ui/material/components/checkbox/ARCHITECTURE.md`
Revision summary: Corrected architecture now selects official Material pointer, Space, and Enter activation. Current code still omits Enter because `@m3e/web@2.6.3` does not implement it, so implementation and focused proof require a family-local correction.
Remaining blockers: Implement and prove the architecture-selected Enter activation.
Required return family: none
Required return stage: none
Architecture deviations: missing Enter activation relative to current architecture
Migration readiness: blocked

## Implemented passes

The existing canonical implementation remains valid outside the missing Enter path:

- one semantic `m3e-checkbox` host;
- controlled `checked` / `indeterminate` props as the only state source;
- cancelable pre-mutation `beforeinput` handling for pointer/Space activation;
- rejected-intent control;
- `disabled` and `presentation` mapping;
- explicit host-attribute allow-list;
- private renderer typing and renderer boundary;
- canonical export and owner-local proof.

The current-stage correction is the architecture-selected family-local Enter activation.

## Public API implemented

The public API remains unchanged: `checked`, `indeterminate`, `disabled`, `presentation`; emits `update:checked` and `update:indeterminate`; no slots or renderer exposure.

## Tokens and renderer mappings

No Checkbox-specific public token surface is selected. Existing renderer property mappings remain correct.

Current m3e directly covers pointer/Space but has missing Enter coverage. The adapter must supply the missing official behavior without making renderer-local state authoritative.

## Dependencies

Dependency queue: none.

## Component-owned proof

Existing proof remains useful except for the obsolete assertion that Enter produces no effect.

The implementation worker must update focused proof so real-browser Enter activation is exactly once, rejected Enter intent remains controlled, and disabled/presentation suppress independent Enter activation. Existing pointer/Space and unaffected proof must remain green.

## Stage verification

Previous verification applied to the old Space-only contract. After correction, run the focused verifier-managed unit/browser/type/static scopes selected by current architecture. Broad local CI duplication is not required solely for stage completion.

## Architecture deviations

Current deviation: Enter activation required by current architecture is not implemented.

## Remaining blockers

The implementation worker must resolve the current-stage Enter defect before returning; it must not add a new abstraction or expand public API.

## Migration readiness

Blocked until the Enter correction and focused component proof are complete.
