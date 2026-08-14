# Checkbox implementation

Artifact revision: 2026-08-14T11:46:35.000Z
Status: complete
ARCHITECTURE.md reference: `src/shared/ui/material/components/checkbox/ARCHITECTURE.md`
ARCHITECTURE.md revision: 2026-08-14T11:46:35.000Z
Revision summary: Revalidated the installed 2.7.4 Checkbox boundary. M3E-005 remains active after real-browser external-label proof; no public API, controlled-state mapping, or Enter behavior changed.
Remaining blockers: none
Required return family: none
Required return stage: none
Architecture deviations: none
Migration readiness: ready

## Implemented passes

The canonical implementation remains intentionally small:

- one semantic `m3e-checkbox` host;
- controlled `checked` / `indeterminate` props as the only public state sources;
- cancelable pre-mutation `beforeinput` handling for renderer activation intent;
- rejected-intent control;
- `disabled` and `presentation` mapping;
- explicit host-attribute allow-list;
- private renderer typing and renderer boundary;
- canonical export and owner-local proof.

No production edit is required for the corrected architecture.

## Public API implemented

Props: `checked`, `indeterminate`, `disabled`, `presentation`.

Emits: `update:checked(value: boolean)` and `update:indeterminate(value: boolean)`.

No renderer-specific API, form surface, slots, or compatibility layer is exposed.

## Keyboard evidence

The current official Material Checkbox cache contains one keyboard table, but every row is written for Chips (`chip`, `chip group`, `input chip`, chip arrow navigation). The same table appears in the Chips accessibility source where those semantics are valid. `DESIGN.md` therefore records it as a source conflict rather than reliable Checkbox-specific keyboard evidence.

The implementation keeps the existing renderer-supported keyboard interaction and does not invent a family-local Enter toggle from that corrupted source.

## Component-owned proof

Existing proof remains valid:

- pointer/Space activation follows the controlled intent path;
- rejected intent leaves public props authoritative;
- disabled and presentation suppress independent interaction;
- Enter does not gain a custom wrapper-owned toggle;
- host forwarding, focus/label composition, target geometry, accessibility backstops, and visual states remain covered by their existing owners.

## @m3e/web 2.7.4 compatibility revalidation

The installed Checkbox public type and cancelable plain-`Event` `beforeinput` contract remain compatible with the existing private typing seam. Its documented native-label association still yields an empty accessible name in Chromium, so the explicit ARIA naming backstop remains and no wrapper-level accessible-name synthesis is added.

## Stage verification

No production or test correction is required by this architecture change. Existing focused proof remains the implementation evidence; exact-head GitHub CI is the repository gate for the PR.

## Remaining blockers

none

## Migration readiness

ready
