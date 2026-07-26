# Mioframe Material migration roadmap

This file owns only the current migration sequence, milestone state, blocker, and next action. Durable rules live in `architecture.md` and `component-adapter.md`.

## Current state

Last updated: 2026-07-26

Current milestone: `M1 — MDButton adapter pilot`

Status: `correction`

Owner: current architecture-reset branch

Blocker: implementation exit-gate findings, not an upstream renderer limitation. Package-derived renderer typing, accepted loading presentation, and the missing native/controlled-state paths are corrected. Retained token declaration/mapping ownership and complete scenario-linked proof for motion, themes, RTL, and active token effects remain incomplete.

Next action: continue the `MDButton` correction pass with complete retained token ownership and exact motion, theme, RTL, active-token, build, and consumer proof before operator visual acceptance and before starting M2.

The m3e Button renderer remains `ready`. The new canonical adapter and migrated consumers remain in place while implementation ownership stays `migrating` until the complete exit gate passes.

## Milestones

| ID  | Milestone                         | Status         | Depends on | Exit gate                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | --------------------------------- | -------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M0  | m3e-backed architecture reset     | `verification` | none       | library-owned architecture, adapter, token, and roadmap documents; separate renderer-viability and implementation-ownership states; compatible dependency-range policy with exact lockfile-resolved contract and exported-type tracking; custom-element integration ownership; scoped agent workflow; final repository verification passes                                                             |
| M1  | `MDButton` adapter pilot          | `correction`   | M0         | migration target is `MDButton` only; exact lockfile-resolved m3e version, Button entry point, and exported types are verified; viability is `ready`; ownership becomes `migrated`; all consumers move; retained token declarations/mappings and accepted behavior are complete; only obsolete ownership is removed; required type, contract, browser, visual, build, consumer, and operator proof pass |
| M2  | `MDSwitch` stateful adapter pilot | `planned`      | M1         | controlled state, event order, keyboard/pointer behavior, disabled state, property updates, form/accessibility integration, typed renderer boundary, and cleanup are proven without hidden state drift; ownership becomes `migrated`; only integration mechanisms proved by both pilots may be considered for extraction                                                                               |
| M3  | sequential component migration    | `planned`      | M2         | one explicit ready component or inseparable family at a time is migrated by product priority; blocked renderers leave legacy ownership intact; every completed target has one canonical Vue owner, package-derived renderer typing, complete active token ownership, scenario-linked proof, and no renderer leakage                                                                                    |

## M0 scope

M0 establishes architecture, documentation ownership, agent workflow, and the shared technical integration required before the first adapter.

Included:

- canonical public Vue and private m3e ownership model;
- source-of-truth and dependency boundaries;
- distinction between renderer viability and implementation ownership;
- token and theme boundary;
- repository-standard compatible semver declaration with exact lockfile-resolved contract tracking;
- Vue custom-element recognition and family-registration ownership;
- component adapter contract and mandatory test minimum;
- scoped Material instructions;
- one implementation skill for an end-to-end component migration;
- shared technical integration without production Material component behavior changes;
- removal of the abandoned exhaustive custom-implementation workflow.

Not included:

- implementing a shared adapter framework;
- changing global theme ownership;
- migrating components beyond the selected pilot.

`@m3e/web` is declared through the repository-standard compatible range, the lockfile resolves the inspected renderer version, and shared Vue custom-element recognition is established as the technical foundation required before M1.

## M1 — MDButton pilot

The first implementation milestone validates the complete boundary rather than only rendering an m3e element.

### Migration boundary

The migration target is `MDButton` only.

`MDIconButton`, `MDFab`, `MDExtendedFab`, and shared Button-directory modules not owned exclusively by `MDButton` remain with the legacy Button implementation until their own migration is approved.

### Completed prerequisites

- `@m3e/web` is declared with the repository-standard compatible semver range and currently resolves through the lockfile to `2.6.2`;
- shared Vue custom-element recognition is established for application, Storybook, and component-test compilation;
- current MDButton consumers, public API, required scenarios, Material guidance, and exact m3e Button public contract have been inspected;
- `@m3e/web/button` exports `M3eButtonElement`, `ButtonShape`, `ButtonSize`, `ButtonVariant`, and the `m3e-button` tag-map type required for a package-derived renderer boundary;
- `components/button/README.md` records renderer viability `ready`, explicit mapping, consumer scope, obsolete legacy token surface, correction findings, and required proof;
- no unresolved architecture or upstream blocker remains.

### Current implementation state

- the canonical adapter exists under `src/shared/ui/material/components/button`;
- consumers and the public export have moved to `@shared/ui/material`;
- the legacy MDButton implementation, story, test, fixture, and export have been removed;
- unrelated Button-family components remain legacy-owned;
- implementation ownership remains `migrating` because the exit gate is incomplete.

### Required correction work

1. transfer canonical defaults and complete semantic m3e mapping for every retained active public Button token;
2. keep obsolete declaration-only spring stiffness/damping surface removed;
3. complete exact proof for themes, RTL, active token effects, and actual motion/final-state claims;
4. complete representative-consumer, Storybook-build, and production-build proof;
5. update the Button proof ledger, run focused checks and final `pnpm verify`, then obtain operator visual acceptance for the complete corrected visual set.

M1 must not restore the legacy renderer, introduce a universal wrapper abstraction, add a direct Lit dependency, use private shadow DOM, duplicate renderer motion, use an all-components import or global registry, or migrate unrelated Button-family components.

## M2 — MDSwitch pilot

The second pilot validates a materially different stateful contract:

- package-derived renderer typing;
- consumer-controlled selected state;
- user intent and event normalization;
- programmatic prop updates;
- no hidden renderer-state drift;
- keyboard, pointer, touch, disabled, and focus behavior;
- form and accessibility behavior when applicable;
- mount, unmount, cancellation, and cleanup;
- private token mapping with canonical public declarations;
- scenario-linked proof.

Only after M1 and M2 may identical integration code be considered for extraction.

## M3 — sequential migration

After both pilots:

1. select one high-value component or inseparable family whose renderer is likely to cover current scenarios;
2. complete bounded discovery, including package-exported types;
3. set renderer viability to `ready` or `blocked-upstream` using the evidence gate;
4. migrate only when viability is `ready`;
5. retain `legacy` implementation ownership when viability is genuinely blocked;
6. migrate consumers, preserve accepted observable behavior, transfer active token ownership, and remove target-owned obsolete ownership atomically;
7. complete scenario-linked automated proof and required operator review;
8. update this roadmap only when milestone state or the next action changes.

Priority considers consumer reach, interaction frequency, product risk, implementation quality, migration blast radius, and removal value. Availability of a similarly named m3e element is not sufficient, and exact legacy implementation parity is not required when observable contracts are preserved.

## Update protocol

Update only:

- current milestone and status;
- exact blocker;
- single next action;
- milestone exit gate when new implementation evidence materially changes it.

Do not turn this file into a complete component inventory or implementation log.
