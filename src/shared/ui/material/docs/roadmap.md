# Mioframe Material migration roadmap

This file owns only the current migration sequence, milestone state, blocker, and next action. Durable rules live in `architecture.md` and `component-adapter.md`.

## Current state

Last updated: 2026-07-26

Current milestone: `M1 — MDButton adapter pilot`

Status: `implementation`

Owner: current architecture-reset branch

Blocker: none. The assessed m3e Button public contract covers the required observable scenarios. Legacy per-size spring stiffness/damping declarations are obsolete value-only surface, not an active consumer contract.

Next action: implement the thin `MDButton` adapter, migrate all target consumers, remove MDButton-exclusive legacy ownership and obsolete token declarations, and complete the required contract, browser, visual, build, and representative-consumer proof.

The repository-standard `@m3e/web` dependency range, exact lockfile-resolved renderer version, shared Vue custom-element recognition, and ready Button family contract are established on this branch.

## Milestones

| ID  | Milestone                         | Status          | Depends on | Exit gate                                                                                                                                                                                                                                                                                                                                               |
| --- | --------------------------------- | --------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | m3e-backed architecture reset     | `verification`  | none       | library-owned architecture, adapter, token, and roadmap documents; separate renderer-viability and implementation-ownership states; compatible dependency-range policy with exact lockfile-resolved contract tracking; custom-element integration ownership; scoped agent workflow; no production behavior change; final repository verification passes |
| M1  | `MDButton` adapter pilot          | `implementation` | M0         | migration target is `MDButton` only; exact lockfile-resolved m3e version and Button entry point are verified; viability is `ready`; ownership becomes `migrated`; all MDButton consumers move; only MDButton-exclusive legacy ownership and obsolete surface are removed; required contract, browser, visual, build, and consumer proof pass             |
| M2  | `MDSwitch` stateful adapter pilot | `planned`       | M1         | controlled state, event order, keyboard/pointer behavior, disabled state, property updates, form/accessibility integration, and cleanup are proven without hidden state drift; ownership becomes `migrated`; only integration mechanisms proved by both pilots may be considered for extraction                                                         |
| M3  | sequential component migration    | `planned`       | M2         | one explicit ready component or inseparable family at a time is migrated by product priority; blocked renderers leave legacy ownership intact; every completed target has one canonical Vue owner and no renderer leakage                                                                                                                               |

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

- creating the first family contract;
- implementing a shared adapter framework;
- changing existing Material component implementation, API, styling, stories, tests, or consumers;
- migrating `MDButton` or any other component.

`@m3e/web` is declared through the repository-standard compatible range, the lockfile resolves the inspected renderer version, and shared Vue custom-element recognition is established as the technical foundation required before M1.

Existing Card, Lists, State, Button, and other legacy directories remain the current implementation owners until their focused migration.

## M1 — MDButton pilot

The first implementation milestone validates the complete boundary rather than only rendering an m3e element.

### Migration boundary

The migration target is `MDButton` only.

`MDIconButton`, `MDFab`, `MDExtendedFab`, and shared Button-directory modules not owned exclusively by `MDButton` remain with the legacy Button implementation until their own migration is approved.

### Completed prerequisites

- `@m3e/web` is declared with the repository-standard compatible semver range and currently resolves through the lockfile to `2.6.2`;
- shared Vue custom-element recognition is established for application, Storybook, and component-test compilation;
- current MDButton consumers, public API, required scenarios, Material guidance, and exact m3e Button public contract have been inspected;
- `components/button/README.md` records renderer viability `ready`, explicit mapping, consumer scope, obsolete legacy token surface, and required proof;
- no unresolved architecture or upstream blocker remains.

### Required work

1. run implementation preflight from the ready Button family contract;
2. register only `@m3e/web/button` through the canonical MDButton implementation import;
3. implement the thin `MDButton` Vue adapter;
4. preserve required action, form, icon, disabled, selected/toggle, loading, focus, theme, and RTL scenarios;
5. privately bridge active public Mioframe tokens through documented semantically equivalent m3e CSS variables;
6. remove obsolete declaration-only spring stiffness/damping surface and its value-only test;
7. migrate all MDButton consumers and remove only MDButton-exclusive legacy ownership;
8. run mandatory component-contract, browser, visual, production-build, and representative-consumer proof;
9. complete final repository verification.

M1 must not introduce a universal wrapper abstraction, all-components import, global runtime registry, duplicate renderer motion, or migrate unrelated Button-family components.

## M2 — MDSwitch pilot

The second pilot validates a materially different stateful contract:

- consumer-controlled selected state;
- user intent and event normalization;
- programmatic prop updates;
- no hidden renderer-state drift;
- keyboard, pointer, touch, disabled, and focus behavior;
- form and accessibility behavior when applicable;
- mount, unmount, cancellation, and cleanup;
- private token mapping.

Only after M1 and M2 may identical integration code be considered for extraction.

## M3 — sequential migration

After both pilots:

1. select one high-value component or inseparable family whose renderer is likely to cover current scenarios;
2. complete bounded discovery;
3. set renderer viability to `ready` or `blocked-upstream` using the evidence gate;
4. migrate only when viability is `ready`;
5. retain `legacy` implementation ownership when viability is genuinely blocked;
6. migrate consumers and remove target-owned obsolete ownership atomically;
7. update this roadmap only when milestone state or the next action changes.

Priority considers consumer reach, interaction frequency, product risk, implementation quality, migration blast radius, and removal value. Availability of a similarly named m3e element is not sufficient, and exact legacy implementation parity is not required.

## Update protocol

Update only:

- current milestone and status;
- exact blocker;
- single next action;
- milestone exit gate when new implementation evidence materially changes it.

Do not turn this file into a complete component inventory or implementation log.