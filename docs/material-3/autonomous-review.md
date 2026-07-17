# Material implementation review

This document separates independent technical review from operator visual comparison.

## Technical review model

`material-component-review` performs a two-stage source-backed review and replaces only the family `AUDIT.md` beside implementation.

The evidence layers are:

1. actual implementation evidence;
2. project implementation documentation;
3. canonical Material 3 Expressive evidence.

The family README and directly applicable project contracts define the intended Mioframe implementation contract. They are not assumed to be correct relative to Material.

Before the two comparisons, the reviewer independently reconstructs the complete contract-level capability inventory for the resolved official family. Current consumer demand may prioritize implementation, but it cannot remove capability from the inventory.

The reviewer classifies every official capability as:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- unresolved because canonical evidence is incomplete or conflicting;
- outside the resolved family boundary, with its separate official owner named.

The reviewer may group coherent capabilities, but must not omit public subcomponents, variants, configurations, states, semantics, accessibility behavior, adaptive behavior, or documented interactions merely because Mioframe does not use them.

## Stage 1 — implementation vs project documentation

The reviewer first checks whether the repository implementation matches what the project says it implements and omits.

Review:

- production code and physical ownership;
- public exports and consumers;
- family README claims and capability inventory;
- directly applicable architecture and foundation/style contracts;
- public API, native semantics, and accessibility;
- states, tokens, motion, and final property routing;
- extensions and deviations;
- tests, stories, rendered evidence, and verification claims;
- all documented and undocumented incomplete work;
- every official capability absent from implementation, whether or not a current consumer requires it.

The audit reports:

- documented behavior missing from implementation;
- implementation behavior absent from documentation;
- code contradicting documented API, semantics, state, token, or ownership rules;
- documentation claiming proof not established by the named tests or stories;
- official capability absent from both implementation and the README's `Not implemented` inventory;
- partial or unverified capability misclassified as fully implemented or fully absent;
- implementation violating applicable project architecture;
- unfinished or questionable work hidden from the family README.

A final route must be real. Declarations, aliases, colocation, comments, stories, and equality assertions are insufficient by themselves.

## Stage 2 — project documentation vs Material 3 Expressive

The reviewer then checks whether the documented project contract and capability inventory correctly represent canonical Material 3 Expressive.

Review:

- official component-family mapping and scope;
- complete official capability inventory across every current family page;
- variants, sizes, shapes, modes, defaults, states, and invalid combinations;
- native semantics and accessibility;
- anatomy and final property ownership;
- official color, elevation, icon, motion, shape, typography, interaction, ripple, and focus contracts;
- exact token names, values, meanings, and state routes;
- every official capability documented as not implemented, independently of current consumer demand;
- project extensions and intentional deviations;
- exact official pages, snapshots, and Design Kit evidence when applicable.

The audit reports:

- project documentation contradicting canonical Material;
- invented, obsolete, or misinterpreted Material contracts;
- required behavior absent from the documented implemented surface;
- incomplete or inaccurate official capability inventory;
- undocumented Material deviations;
- project extensions incorrectly presented as official Material behavior;
- any official capability omitted from both implemented and unimplemented documentation;
- insufficient or contradictory canonical source evidence.

A documented optional unsupported feature is not automatically an implementation defect when the implemented surface remains coherent. It still must be listed in both README and AUDIT.

## Reconciliation

The two comparisons determine the correction direction:

- correct implementation when it differs from correct project documentation;
- correct documentation and implementation when both follow a non-canonical project contract;
- correct only documentation when implementation matches Material but local text is stale;
- record both mismatches when implementation and documentation independently diverge;
- retain project extensions only when they are explicit, coherent, and not represented as canonical Material.

The audit must distinguish implementation defects from project-documentation defects. It must not use incorrect local documentation as a reason to regress correct implementation.

## Evidence boundary

Review the project implementation, not browser or framework internals.

- Ordinary CSS motion is reviewed through the documented project runtime contract, actual consumption, canonical Material requirement, property ownership, state routing, and conflicting timing.
- Browser checks are used only for browser-owned behavior or computed behavior source inspection cannot resolve reliably.
- Broad root/system token, universal-selector, pseudo-element, or shared-formula changes require cross-family impact evidence under project architecture before their documented contract is compared with Material.
- Green tests do not override a demonstrated implementation or documentation defect.

## Compliance and coverage

Use one overall compliance result derived from both stages:

- `compliant` — implementation matches truthful project documentation, and that documentation accurately represents the implemented canonical Material contract plus explicit extensions/deviations;
- `partially-compliant` — usable, but non-critical implementation, documentation, canonical-alignment, or verification gaps remain;
- `non-compliant` — a critical or high finding exists in either stage;
- `blocked` — evidence required for either comparison is unavailable or conflicting.

Report official coverage separately:

- `full` — every official capability in the resolved family is implemented and verified;
- `partial` — at least one official capability is not implemented, partial, defective, provisional, or unverified;
- `unresolved` — canonical evidence is insufficient to complete the family inventory.

The audit independently lists all not implemented official capability. It does not merely approve the README's list.

A compliant implemented subset may still have partial official coverage. It must not be described as fully implemented.

## Operator visual review

Operator visual comparison happens only after technical findings are resolved sufficiently for meaningful comparison.

The operator evaluates visible fidelity against named official references, including applicable geometry, spacing, shape, color, typography, elevation, state composition, focus indication, and perceived motion quality.

The operator is not responsible for finding API, semantics, accessibility, ownership, token-routing, implementation, documentation, or capability-inventory defects.

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
material-component-review <family> → updated two-stage AUDIT.md
```

The implementation workflow never edits the audit to declare its own work correct.

## Completion gate

A family is ready to leave active migration only when:

- implementation and project documentation agree;
- project documentation accurately represents Material 3 Expressive;
- the official capability inventory is complete;
- every unsupported, partial, unresolved, extended, deviated, and remaining item is explicit;
- required consumers are migrated and obsolete ownership is removed;
- applicable local verification passes;
- required operator visual review is accepted.

A family is fully implemented only when the audit reports `Official coverage: full`.

Do not hide unfinished work, absent capability, or documentation divergence behind a successful status.
