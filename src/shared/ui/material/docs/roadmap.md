# Mioframe Material migration roadmap

This file owns only the current sequence, milestone state, blocker, and next action. Durable rules live in `architecture.md` and `component-adapter.md`.

## Current state

Last updated: 2026-07-26

Current milestone: `M1 — MDButton adapter pilot`

Status: `operator-review`

Owner: current architecture-reset branch

Blocker: none upstream. The last agent run incorrectly promoted renderer-owned press timing and expanded-target pressed feedback into Mioframe requirements. Repository evidence shows the legacy component also retained pressed state through its transition duration and used the same host pressed state for expanded-target activation. Neither behavior is an accepted blocker.

Next action: operator reviews the canonical MDButton visual stories and renderer-owned press motion. Record explicit acceptance or rejection before closing M1.

Implementation ownership remains `migrating` until the required operator acceptance closes the M1 migration gate.

## Milestones

| ID  | Milestone                         | Status         | Depends on | Exit gate                                                                                                                                                                                                                                                                                   |
| --- | --------------------------------- | -------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | m3e-backed architecture reset     | `verification` | none       | library-owned architecture and workflow; private renderer boundary; compatible dependency range; package-derived typing; final verification                                                                                                                                                 |
| M1  | `MDButton` adapter pilot          | `correction`   | M0         | accepted Mioframe scenarios preserved; canonical documented m3e Button capabilities exposed through thin typed mappings; genuine divergences recorded; only evidenced required corrections added; no unused token catalogue; verification passes; operator accepts visual and motion result |
| M2  | `MDSwitch` stateful adapter pilot | `planned`      | M1         | current Switch scenarios plus canonical documented m3e surface; controlled state and event order; bounded divergence record; risk-based verification; operator acceptance                                                                                                                   |
| M3  | sequential component migration    | `planned`      | M2         | one explicit component at a time; accepted scenarios plus canonical m3e surface; evidence-gated divergences; thin required corrections only; one canonical Vue owner; no renderer leakage                                                                                                   |

## M1 — MDButton pilot

### Boundary

The migration target is `MDButton` only. `MDIconButton`, `MDFab`, `MDExtendedFab`, and unrelated Button modules remain legacy-owned.

### Completed

- `@m3e/web@^2.6.2` resolves to `2.6.2`;
- application, Storybook, and tests recognize `m3e-*`;
- canonical MDButton adapter and public export exist;
- all existing consumers are migrated;
- obsolete legacy MDButton owner and target-exclusive artifacts are removed;
- renderer typing derives from package exports;
- submit/reset, pointer/keyboard, disabled, controlled-toggle, focus, loading, and expanded-target actionability scenarios are implemented;
- loading preserves accepted presentation and enabled behavior;
- no accepted scenario requires immediate pressed-shape release or suppressing pressed feedback for expanded-target activation.

### Completed correction work

1. removed the broad `--m3e-*` bridge backed by unused or undefined public Button tokens;
2. retained no Button-specific public tokens because none has consumer evidence;
3. completed direct package-checked Vue mappings for the documented Button properties and slots in scope;
4. kept renderer viability `ready`; no observation passed the blocker gate;
5. recorded exact m3e Button press, retained-duration, release/interruption, and reduced-motion implementation paths;
6. removed automated wording that overclaimed internal motion proof;
7. passed focused component, type, Storybook behavior, and visual verification.

Operator visual and motion acceptance remains required.

M1 must not restore the legacy renderer, add a direct Lit dependency, access private shadow DOM, duplicate renderer motion/state systems, create a generic wrapper framework, or migrate unrelated Button-family components.

## Later milestones

M2 applies the same bounded process to a materially different stateful component. Only after M1 and M2 may repeated concrete adapter code be considered for extraction.

For each M3 component:

1. select one product-relevant target;
2. inspect current consumers and exact m3e family surface;
3. establish accepted requirements before classifying source differences;
4. compare only the supported surface with Material guidance;
5. migrate when accepted behavior can be delivered safely;
6. record non-required divergences for upstream work instead of expanding the wrapper;
7. preserve active tokens only;
8. run risk-based verification and operator review.

## Update protocol

Update only the current milestone/status, exact blocker, single next action, and exit gate when implementation evidence changes it. Do not turn this file into a component inventory or implementation log.
