# Mioframe Material migration roadmap

This file owns only the current migration sequence, milestone state, blocker, and next action. Durable rules live in `architecture.md` and `component-adapter.md`.

## Current state

Last updated: 2026-07-24

Current milestone: `M0 — m3e-backed architecture reset`

Status: `active`

Owner: PR #162

Blocker: none.

Next action: complete and merge PR #162, then start the `MDButton` end-to-end m3e adapter pilot from current `develop`.

## Milestones

| ID | Milestone | Status | Depends on | Exit gate |
| --- | --- | --- | --- | --- |
| M0 | m3e-backed architecture reset | `active` | none | repository rules, Material docs, scoped instructions, and the adapter skill agree that Mioframe owns the public Vue API and m3e is a private renderer; obsolete custom-implementation workflow is removed; no production behavior changes |
| M1 | `MDButton` adapter pilot | `planned` | M0 | exact m3e dependency and Vue integration are established; Button renderer viability is ready; one canonical Vue owner remains; consumers are migrated; legacy owner is removed; contract, browser, visual, build, and representative consumer proof pass |
| M2 | `MDSwitch` stateful adapter pilot | `planned` | M1 | controlled state, event order, keyboard/pointer behavior, disabled state, property updates, form/accessibility integration, and cleanup are proven without hidden state drift; only repeated integration helpers justified by both pilots are extracted |
| M3 | sequential family migration | `planned` | M2 | one ready family at a time is migrated by product priority; blocked families retain their safe owner; every completed family has one canonical Vue owner and no renderer leakage |

## M0 scope

M0 establishes only the architecture and agent process.

Included:

- canonical public Vue and private m3e ownership model;
- source-of-truth and dependency boundaries;
- token and theme boundary;
- family adapter contract;
- renderer viability and fallback policy;
- scoped Material instructions;
- one implementation skill for an end-to-end family migration;
- removal of the abandoned exhaustive `DESIGN.md` workflow.

Not included:

- adding `@m3e/web` to production dependencies;
- Vue compiler custom-element configuration;
- a shared adapter framework;
- changes to existing Material component implementation, API, styling, stories, tests, or consumers;
- generating a component design document;
- migrating `MDButton` or any other family.

## M1 — MDButton pilot

The first implementation milestone must validate the complete boundary rather than only render an m3e element.

Required work:

1. inspect current Button consumers and required scenarios;
2. inspect current official Material Button guidance;
3. inspect the exact public API of the selected pinned m3e Button version;
4. decide renderer viability and record the Vue-to-m3e mapping;
5. add the exact dependency and required Vue custom-element configuration;
6. implement a thin `MDButton` adapter;
7. preserve required action, form, link, icon, disabled, selected, and loading scenarios;
8. privately bridge existing public Mioframe tokens where needed;
9. migrate all consumers and remove the old owner;
10. verify the public contract, browser integration, visible output, build, and representative consumers.

M1 must not introduce a universal wrapper abstraction.

## M2 — MDSwitch pilot

The second pilot validates a materially different stateful contract:

- consumer-controlled selected state;
- user intent and event normalization;
- programmatic prop updates;
- no hidden state drift;
- keyboard, pointer, touch, disabled, and focus behavior;
- form and accessibility behavior when applicable;
- mount, unmount, cancellation, and cleanup;
- private token mapping.

Only after M1 and M2 may identical integration code be considered for extraction.

## M3 — sequential migration

After both pilots:

1. select one high-value family whose m3e renderer is likely to cover current scenarios;
2. complete bounded discovery and renderer viability classification;
3. migrate only when status is `ready`;
4. use `blocked-upstream` or `retain-legacy` when a public m3e contract is insufficient;
5. migrate consumers and remove obsolete ownership atomically;
6. update this roadmap only when milestone state or the next action changes.

Priority considers consumer reach, interaction frequency, product risk, implementation quality, migration blast radius, and removal value. Availability of a similarly named m3e element is not sufficient.

## Update protocol

Update only:

- current milestone and status;
- exact blocker;
- single next action;
- milestone exit gate when new implementation evidence materially changes it.

Do not turn this file into a complete component inventory or implementation log.