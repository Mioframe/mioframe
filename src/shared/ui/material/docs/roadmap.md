# Mioframe Material migration roadmap

This file owns only the current sequence, milestone state, blocker, and next action. Durable rules live in `architecture.md` and `component-adapter.md`.

## Current state

Last updated: 2026-07-26

Current milestone: `M1 — MDButton adapter pilot`

Status: `architecture-correction`

Owner: current architecture-reset branch

Blocker: the public Button contract was derived from legacy Mioframe scenarios and m3e capabilities rather than from an official Material-first API matrix. Current implementation and verification are not sufficient to close M1 until the public API is normalized.

Next action: rerun `material-component-adapter` for `MDButton`. Build the source-backed Material–m3e–Vue matrix, select the required Material subset, resolve the non-Material loading requirement, normalize the Vue API and consumers, then rerun verification and operator review.

Implementation ownership remains `migrating`.

## Milestones

| ID | Milestone | Status | Depends on | Exit gate |
| --- | --- | --- | --- | --- |
| M0 | m3e-backed architecture reset | `verification` | none | Material-first public boundary; private m3e renderer boundary; contract-matrix workflow; package-derived typing; final verification |
| M1 | `MDButton` adapter pilot | `architecture-correction` | M0 | accepted Material–m3e–Vue matrix; demand-driven official Material Vue API; non-Material requirements explicitly resolved; correct owner for every selected gap; migrated consumers; verification and operator acceptance |
| M2 | `MDSwitch` stateful adapter pilot | `planned` | M1 | source-backed Material matrix; selected Material API; controlled state and event order; m3e gap ownership; verification and operator acceptance |
| M3 | sequential component migration | `planned` | M2 | one official Material component at a time; demand-driven Material API; explicit m3e mapping and gap ownership; no accidental extensions or renderer leakage |

## M1 — MDButton pilot

### Reusable implementation work

- `@m3e/web@^2.6.2` resolves to `2.6.2`;
- application, Storybook, and tests recognize `m3e-*`;
- an m3e-backed `MDButton` candidate and public export exist;
- renderer typing derives from package exports;
- consumers were moved to the candidate owner;
- native, controlled-state, visual, and motion-assessment work exists;
- the obsolete legacy renderer is removed.

This work remains reusable but does not establish the final public API.

### Required architecture correction

1. derive Button names, options, values, defaults, states, combinations, behavior, and accessibility from official Material documentation;
2. select only the subset required by current consumers and mark the remaining official surface deferred;
3. create the Material–m3e–Vue matrix before further production edits;
4. classify every current public prop, slot, event, and default as Material, Vue/native adaptation, deferred, or non-Material;
5. resolve loading as consumer composition, a separate non-MD component, an explicitly approved extension, or a migration/removal;
6. use m3e maximally for selected Material behavior;
7. route renderer-owned gaps to m3e rather than recreating them in Vue;
8. normalize implementation, consumers, tests, stories, and docs to the accepted API;
9. run focused verification, final `pnpm verify`, and operator visual/motion review.

M1 must not restore the legacy renderer, copy the m3e API into Vue, preserve legacy API merely for compatibility, add a non-Material public option silently, access private shadow DOM, or build a parallel renderer.

## Later milestones

For every later component:

1. inspect official Material first;
2. select the current required subset;
3. create the Material–m3e–Vue matrix;
4. define the public Vue API from Material terminology;
5. resolve non-Material requirements separately;
6. use m3e directly where conformant;
7. assign gaps to wrapper or m3e according to ownership;
8. migrate consumers and verify.

Only after M1 and M2 may repeated concrete adapter code be considered for extraction.

## Update protocol

Update only the current milestone/status, exact blocker, single next action, and exit gate when implementation evidence changes it. Do not turn this file into a component inventory or implementation log.