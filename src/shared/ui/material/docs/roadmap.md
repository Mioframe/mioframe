# Mioframe Material migration roadmap

This file owns only the current migration sequence, milestone state, blocker, and next action. Durable rules live in `architecture.md` and `component-adapter.md`.

## Current state

Last updated: 2026-07-24

Current milestone: `M0 — m3e-backed architecture reset`

Status: `verification`

Owner: PR #162

Blocker: final repository verification for the current branch state.

Next action: complete M0 verification, then continue with the `MDButton` adapter pilot in the same branch; evaluate PR #162 merge readiness only after the pilot and its required verification are complete.

The repository-standard `@m3e/web` dependency range, exact lockfile-resolved renderer version, and shared Vue custom-element recognition for application, Storybook, and component tests are already established on this branch. M1 still owns the Button family contract, family-local registration, adapter implementation, consumer migration, and component proof.

## Milestones

| ID  | Milestone                         | Status         | Depends on | Exit gate                                                                                                                                                                                                                                                                                                                                               |
| --- | --------------------------------- | -------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | m3e-backed architecture reset     | `verification` | none       | library-owned architecture, adapter, token, and roadmap documents; separate renderer-viability and implementation-ownership states; compatible dependency-range policy with exact lockfile-resolved contract tracking; custom-element integration ownership; scoped agent workflow; no production behavior change; final repository verification passes |
| M1  | `MDButton` adapter pilot          | `planned`      | M0         | migration target is `MDButton` only; exact lockfile-resolved m3e version and Button entry point are verified; viability is `ready`; ownership becomes `migrated`; all MDButton consumers move; only MDButton-exclusive legacy ownership is removed; required contract, browser, visual, build, and consumer proof pass                                  |
| M2  | `MDSwitch` stateful adapter pilot | `planned`      | M1         | controlled state, event order, keyboard/pointer behavior, disabled state, property updates, form/accessibility integration, and cleanup are proven without hidden state drift; ownership becomes `migrated`; only integration mechanisms proved by both pilots may be considered for extraction                                                         |
| M3  | sequential component migration    | `planned`      | M2         | one explicit ready component or inseparable family at a time is migrated by product priority; blocked renderers leave legacy ownership intact; every completed target has one canonical Vue owner and no renderer leakage                                                                                                                               |

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
- shared Vue custom-element recognition is established for application, Storybook, and component-test compilation.

### Required work

1. inspect current MDButton consumers, public API, stories, tests, implementation notes, extensions, and required scenarios;
2. inspect current official Material Button guidance through the configured Material source interface;
3. inspect the exact lockfile-resolved version of the selected stable, non-prerelease m3e release through primary package evidence;
4. verify and record that exact resolved version and the Button family entry point;
5. decide renderer viability and complete `components/button/README.md` before production edits;
6. register only the required Button family through the MDButton implementation import;
7. implement a thin `MDButton` adapter;
8. preserve required action, form, link, icon, disabled, selected/toggle, and loading scenarios;
9. privately bridge accepted public Mioframe tokens where supported;
10. migrate all MDButton consumers and remove only MDButton-exclusive legacy ownership;
11. run mandatory component-contract, browser, visual, production-build, and representative-consumer proof;
12. complete final repository verification.

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
