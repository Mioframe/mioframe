# Material implementation review

This document separates technical review from operator visual comparison.

## Technical review

`material-component-review` performs an independent source-backed review and replaces only the family `AUDIT.md` beside implementation.

The reviewer checks:

1. current official Material 3 Expressive evidence;
2. the family README's implemented and unsupported claims;
3. architecture and physical ownership;
4. public API, native semantics, and accessibility;
5. state, token, motion, and final property routing;
6. applicable foundation/style dependencies;
7. consumer migration and obsolete ownership;
8. proportional tests and stories;
9. all documented and undocumented incomplete work.

The reviewer does not modify implementation or the family README.

## Evidence boundary

Review the project implementation, not browser or framework internals.

- A final route must be real; declarations, aliases, colocation, comments, and equality assertions are insufficient.
- Ordinary CSS motion is reviewed through official requirement, runtime contract, property ownership, state routing, and conflicting timing.
- Browser checks are used only for browser-owned behavior or computed behavior that source inspection cannot resolve reliably.
- Broad root/system token, universal-selector, pseudo-element, or shared-formula changes require cross-family impact evidence.
- Green tests do not override a demonstrated implementation or documentation defect.

## Documentation review

The family README must state honestly:

- what is implemented;
- what official capability is not implemented;
- what is defective or incomplete;
- what is provisional or unverified;
- what requires further work or visual comparison.

An undocumented omission or known mismatch is a finding. A documented optional unsupported feature is not a defect by itself.

## Audit result

Use:

- `compliant` — every claimed and required technical contract passes and documentation is truthful;
- `partially-compliant` — usable, but non-critical defects or documentation/verification gaps remain;
- `non-compliant` — a critical or high defect invalidates a required or claimed contract;
- `blocked` — authoritative evidence required for review is unavailable or conflicting.

The result and findings are stored in the colocated `AUDIT.md`.

## Operator visual review

Operator visual comparison happens only after technical findings are resolved sufficiently for meaningful comparison.

The operator evaluates visible fidelity against named official references, including applicable geometry, spacing, shape, color, typography, elevation, state composition, focus indication, and perceived motion quality.

The operator is not responsible for finding API, semantics, accessibility, ownership, token-routing, or implementation defects.

Visual status is recorded in `AUDIT.md` as:

- `not required`;
- `required`;
- `accepted`;
- `blocked`.

The automated reviewer does not invent operator acceptance.

## Correction loop

When the audit finds defects:

```text
AUDIT.md findings → material-component <family> → README/code/tests update →
material-component-review <family> → updated AUDIT.md
```

The implementation workflow never edits the audit to declare its own work correct.

## Completion gate

A family is ready to leave the active migration state when:

- its README and code agree;
- required technical contracts pass independent review;
- all unsupported and remaining work is documented;
- required consumers are migrated and obsolete ownership is removed;
- applicable local verification passes;
- required operator visual review is accepted.

Do not hide unfinished work behind a successful status.