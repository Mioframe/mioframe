# Mioframe Material migration roadmap

This file owns only the current migration sequence, milestone state, blocker, and next action. Durable rules live in `architecture.md` and `component-adapter.md`.

## Current state

Last updated: 2026-07-24

Current milestone: `M0 — m3e-backed architecture reset`

Status: `active`

Owner: PR #162

Blocker: final repository verification.

Next action: complete PR #162 verification and merge it, then start the `MDButton` migration contract and implementation from current `develop`.

## Milestones

| ID  | Milestone                         | Status    | Depends on | Exit gate                                                                                                                                                                                                                                                                                                       |
| --- | --------------------------------- | --------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | m3e-backed architecture reset     | `active`  | none       | library-owned architecture, adapter, token, and roadmap documents; separate renderer-viability and implementation-ownership states; exact dependency-selection policy; custom-element integration ownership; scoped agent workflow; no production behavior change; final repository verification passes         |
| M1  | `MDButton` adapter pilot          | `planned` | M0         | migration target is `MDButton` only; exact m3e version and Button entry point are verified and pinned; viability is `ready`; ownership becomes `migrated`; all MDButton consumers move; only MDButton-exclusive legacy ownership is removed; required contract, browser, visual, build, and consumer proof pass |
| M2  | `MDSwitch` stateful adapter pilot | `planned` | M1         | controlled state, event order, keyboard/pointer behavior, disabled state, property updates, form/accessibility integration, and cleanup are proven without hidden state drift; ownership becomes `migrated`; only integration mechanisms proved by both pilots may be considered for extraction                 |
| M3  | sequential component migration    | `planned` | M2         | one explicit ready component or inseparable family at a time is migrated by product priority; blocked renderers leave legacy ownership intact; every completed target has one canonical Vue owner and no renderer leakage                                                                                       |

## M0 scope

M0 establishes only architecture, documentation ownership, and agent workflow.

Included:

- canonical public Vue and private m3e ownership model;
- source-of-truth and dependency boundaries;
- distinction between renderer viability and implementation ownership;
- token and theme boundary;
- exact m3e version-selection policy;
- Vue custom-element recognition and family-registration ownership;
- component adapter contract and mandatory test minimum;
- scoped Material instructions;
- one implementation skill for an end-to-end component migration;
- removal of the abandoned exhaustive custom-implementation workflow.

Not included:

- adding `@m3e/web` to production dependencies;
- changing Vue compiler or Storybook configuration;
- creating the first family contract;
- implementing a shared adapter framework;
- changing existing Material component implementation, API, styling, stories, tests, or consumers;
- migrating `MDButton` or any other component.

Existing Card, Lists, State, Button, and other legacy directories remain the current implementation owners until their focused migration.

## M1 — MDButton pilot

The first implementation milestone validates the complete boundary rather than only rendering an m3e element.

### Migration boundary

The migration target is `MDButton` only.

`MDIconButton`, `MDFab`, `MDExtendedFab`, and shared Button-directory modules not owned exclusively by `MDButton` remain with the legacy Button implementation until their own migration is approved.

### Required work

1. inspect current MDButton consumers, public API, stories, tests, implementation notes, extensions, and required scenarios;
2. inspect current official Material Button guidance through the configured Material source interface;
3. inspect a current stable, non-prerelease m3e version through primary package evidence;
4. verify and record the exact package version and Button family entry point;
5. decide renderer viability and complete `components/button/README.md` before production edits;
6. record shared Vue custom-element recognition ownership for app, Storybook, and tests;
7. add the exact dependency and required shared compiler configuration;
8. register only the required Button family through the MDButton implementation import;
9. implement a thin `MDButton` adapter;
10. preserve required action, form, link, icon, disabled, selected/toggle, and loading scenarios;
11. privately bridge accepted public Mioframe tokens where supported;
12. migrate all MDButton consumers and remove only MDButton-exclusive legacy ownership;
13. run mandatory component-contract, browser, visual, production-build, and representative-consumer proof;
14. complete final repository verification.

M1 must not introduce a universal wrapper abstraction, all-components import, global runtime registry, or migrate unrelated Button-family components.

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
3. set renderer viability to `ready` or `blocked-upstream`;
4. migrate only when viability is `ready`;
5. retain `legacy` implementation ownership when viability is blocked;
6. migrate consumers and remove target-owned obsolete ownership atomically;
7. update this roadmap only when milestone state or the next action changes.

Priority considers consumer reach, interaction frequency, product risk, implementation quality, migration blast radius, and removal value. Availability of a similarly named m3e element is not sufficient.

## Update protocol

Update only:

- current milestone and status;
- exact blocker;
- single next action;
- milestone exit gate when new implementation evidence materially changes it.

Do not turn this file into a complete component inventory or implementation log.
