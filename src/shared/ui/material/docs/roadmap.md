# Mioframe Material migration roadmap

This file owns only the current sequence, milestone state, blocker, and next action. Durable rules live in `architecture.md` and `component-adapter.md`.

## Current state

Last updated: 2026-07-26

Current milestone: `M1 — MDButton adapter pilot`

Status: `correction`

Owner: current architecture-reset branch

Blocker: bounded repository-local completion work, not an upstream renderer limitation. Package-derived typing, current consumer migration, native behavior, controlled state, and loading compatibility are complete. The adapter still contains unnecessary incomplete Button-token routing, direct typed coverage of canonical documented m3e Button capabilities needs finalization, and the Material/m3e divergence plus animation source assessment remains incomplete.

Next action: rerun `material-component-adapter` for `MDButton`. Remove unused token mappings, finish canonical m3e Button API forwarding, record bounded Material/m3e divergences, inspect exact-version animation code, run focused checks and `pnpm verify`, then hand off visual and motion review to the operator.

The m3e Button renderer remains `ready`; ownership stays `migrating` only until this bounded repository-local work is complete.

## Milestones

| ID  | Milestone                         | Status         | Depends on | Exit gate                                                                                                                                                                                                                                                                                                      |
| --- | --------------------------------- | -------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | m3e-backed architecture reset     | `verification` | none       | library-owned architecture and workflow; private renderer boundary; compatible dependency range; package-derived typing policy; final verification passes                                                                                                                                                      |
| M1  | `MDButton` adapter pilot          | `correction`   | M0         | current Mioframe scenarios preserved; canonical documented m3e Button capabilities exposed through thin typed mappings; confirmed Material/m3e differences recorded; only required wrapper corrections added; no unused public token catalogue; verification passes; operator accepts visual and motion result |
| M2  | `MDSwitch` stateful adapter pilot | `planned`      | M1         | current Switch scenarios plus canonical documented m3e Switch surface; controlled state and event order; bounded divergence record; risk-based verification; operator acceptance                                                                                                                               |
| M3  | sequential component migration    | `planned`      | M2         | one explicit component at a time; current scenarios plus canonical m3e surface; recorded divergences; thin required corrections only; one canonical Vue owner; no renderer leakage                                                                                                                             |

## M0 scope

M0 establishes:

- canonical public Vue and private m3e ownership;
- library-owned Material documentation;
- renderer viability and implementation ownership states;
- dependency, registration, and package-derived typing policy;
- demand-driven token and verification rules;
- one deterministic adapter skill;
- removal of the abandoned exhaustive custom-implementation workflow.

M0 does not create a generic adapter framework or change global theme ownership.

## M1 — MDButton pilot

### Boundary

The migration target is `MDButton` only.

`MDIconButton`, `MDFab`, `MDExtendedFab`, and unrelated Button modules remain legacy-owned.

### Completed

- `@m3e/web@^2.6.2` is installed and resolves to `2.6.2`;
- application, Storybook, and tests recognize `m3e-*` elements;
- the canonical MDButton adapter and public export exist;
- all existing MDButton consumers are migrated;
- the legacy MDButton implementation, story, test, fixture, and export are removed;
- renderer typing derives from `M3eButtonElement`, `ButtonShape`, `ButtonSize`, and `ButtonVariant`;
- current submit/reset, pointer/keyboard, disabled, controlled-toggle, focus, and loading scenarios are implemented;
- loading preserves the accepted visible presentation and enabled behavior.

### Required correction work

1. remove the broad `--m3e-*` bridge backed by unused/undefined public `--md-comp-button-*` variables;
2. keep only actual active public tokens; currently no Button-specific public token contract has consumer evidence;
3. expose canonical documented m3e Button capabilities through direct typed Vue mappings where they belong to the public Material Button surface; direct forwarding does not require one dedicated test per capability;
4. compare that bounded surface with official Material guidance and record each confirmed divergence as accepted, wrapper-corrected, upstream follow-up, or blocker;
5. implement only Mioframe-required divergences that are safely correctable through public m3e APIs or Mioframe-owned light DOM;
6. inspect and record the exact m3e Button animation implementation and reduced-motion path; do not add proxy automated animation proof;
7. run focused verification and final `pnpm verify`;
8. request operator visual and motion acceptance.

M1 must not restore the legacy renderer, add a direct Lit dependency, access private shadow DOM, duplicate renderer motion/state systems, create a generic wrapper framework, or migrate unrelated Button-family components.

## M2 — MDSwitch pilot

M2 validates a different stateful adapter while following the same bounded process:

- current Mioframe Switch scenarios;
- canonical documented m3e Switch capabilities;
- consumer-controlled state and event normalization;
- package-derived renderer typing;
- bounded Material/m3e divergence record;
- thin corrections only when Mioframe requires them;
- active public tokens only;
- risk-based verification and operator acceptance.

Only after M1 and M2 may repeated concrete adapter code be considered for extraction.

## M3 — sequential migration

For each next component:

1. select one product-relevant target;
2. inspect current consumers and exact m3e family surface;
3. compare the bounded supported surface with Material guidance;
4. set renderer viability to `ready` or `blocked-upstream`;
5. migrate only when required behavior can be delivered safely;
6. expose canonical m3e capabilities without mirroring raw renderer API;
7. record non-required m3e divergences for upstream work rather than expanding the wrapper;
8. preserve active tokens only and remove obsolete legacy routes;
9. run risk-based verification and operator review.

## Update protocol

Update only:

- current milestone and status;
- exact blocker;
- single next action;
- milestone exit gate when implementation evidence changes it.

Do not turn this file into a component inventory or detailed implementation log.
