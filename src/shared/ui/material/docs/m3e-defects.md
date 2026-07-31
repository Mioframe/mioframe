# Confirmed m3e defect registry

This file owns stable identities and lifecycle facts for confirmed defects in the installed lockfile-resolved `@m3e/web` renderer consumed by Mioframe.

It does not own mutable family-stage status:

- `DESIGN.md` owns the official Material expectation;
- `ARCHITECTURE.md` owns selected scenarios, renderer classification, gap ownership, mitigation decision, risk, and removal trigger;
- `IMPLEMENTATION.md` owns the implemented workaround and proof;
- `roadmap.md` owns current family-stage status;
- this registry owns the stable upstream defect identity, affected versions, evidence, and lifecycle.

## Inclusion boundary

Create an `M3E-*` entry only when installed-version and observable evidence confirms at least one of:

- observable m3e behavior differs from the architecture-selected official Material contract;
- a documented m3e public property, attribute, event, slot, accessibility behavior, or CSS input is broken or implemented under another contract;
- m3e documentation and the installed implementation disagree;
- a renderer-private defect requires an approved temporary workaround or blocks a selected scenario.

The installed package artifact and observable browser behavior define the renderer capability actually consumed. Upstream source, tags, demos, and changelogs are supporting evidence.

Do not create an entry for:

- an official capability m3e does not implement at all — record `missing` in family architecture;
- deferred official surface with no selected scenario;
- a conflict between official Material sources;
- a Mioframe token, integration, composition, architecture, or extension defect;
- a different internal implementation with an equivalent observable result;
- an unverified suspicion.

```text
m3e capability absent
  → family ARCHITECTURE.md only (`missing`)

m3e capability documented or implemented incorrectly
  → family ARCHITECTURE.md (`divergent`, M3E-* reference)
  → this registry
  → family IMPLEMENTATION.md when a workaround is implemented
```

## Identity and lifecycle

- IDs are stable and never reused.
- One observable upstream defect has one entry even when several families are affected.
- Every selected `divergent` architecture row references the applicable ID.
- A temporary workaround requires both a family architecture decision and registry entry.
- Every consumed renderer update revalidates non-resolved entries affecting changed or consumed families.
- An upstream fix does not resolve Mioframe work until the fixed version is consumed, the workaround or blocked path is removed, owned proof passes, and affected family artifacts are refreshed.
- A pre-merge misclassification may be withdrawn. Its ID remains retired.

Upstream status:

- `unreported`;
- `reported`;
- `fix-in-progress`;
- `fixed`;
- `rejected`.

Mioframe status:

- `blocked`;
- `workaround-active`;
- `awaiting-upgrade`;
- `resolved`.

## Summary

| ID        | Component         | Summary                                                                 | Affected version | Mioframe status     | Upstream status |
| --------- | ----------------- | ----------------------------------------------------------------------- | ---------------- | ------------------- | --------------- |
| `M3E-001` | Loading indicator | Documented active-indicator size CSS input is not the implemented input | `2.6.2`–`2.6.3`  | `workaround-active` | `unreported`    |
| `M3E-002` | Loading indicator | Uncontained host size is coupled to active-indicator size               | `2.6.2`–`2.6.3`  | `workaround-active` | `unreported`    |

`M3E-003` was removed before merge as a Mioframe representation misclassification. Its ID is retired; see Removed records.

## M3E-001 — Documented size input is not implemented

- Component: Loading indicator
- First confirmed version: `2.6.2`
- Last revalidated version: `2.6.3`
- Upstream status: `unreported`
- Mioframe status: `workaround-active`
- Family design: `../components/loadingIndicator/DESIGN.md`
- Family architecture: `../components/loadingIndicator/ARCHITECTURE.md`
- Family implementation: `../components/loadingIndicator/IMPLEMENTATION.md`
- Upstream issue: none
- Upstream pull request: none

### Official expectation

Official Loading indicator evidence distinguishes overall/container geometry from active-indicator geometry and records a 48dp overall size with a 38dp active-indicator size for the default uncontained configuration.

Recorded official sources:

- `/components/loading-indicator/specs`;
- `/components/loading-indicator/guidelines`, responsive layout.

### Documented renderer contract

`M3eLoadingIndicatorElement` documents:

```css
--m3e-loading-indicator-active-indicator-size
```

as the active-indicator size input.

### Observed renderer behavior

Installed `2.6.2` and `2.6.3` do not read that input. `LoadingIndicatorToken.activeIndicatorSize` reads:

```css
--m3e-loading-indicator-size
```

A consumer following the documented renderer API cannot control the implemented active-indicator size through the documented name.

### Evidence

- renderer source: `packages/web/src/loading-indicator/LoadingIndicatorElement.ts`;
- renderer source: `packages/web/src/loading-indicator/LoadingIndicatorToken.ts`;
- installed `2.6.3`: `node_modules/@m3e/web/dist/loading-indicator.js`;
- implementation proof: `../components/loadingIndicator/MDLoadingIndicator.test.ts`.

### Mioframe impact and mitigation

The public overall-size contract cannot map through the documented input in affected versions. The family architecture records the accepted controlled workaround. The implementation maps the confirmed effective input privately without leaking renderer vocabulary.

### Correct upstream result

m3e should implement and document one consistent public active-indicator size input, preferably the existing documented name or an explicit compatible migration.

### Removal trigger

Consume a renderer version whose documented input is effective, update the private mapping, remove the workaround, and pass the affected family implementation, browser, visual, migration, and review gates.

### Revalidation history

| m3e version | Date       | Result    | Evidence                                                      |
| ----------- | ---------- | --------- | ------------------------------------------------------------- |
| `2.6.2`     | 2026-07-27 | confirmed | exact source inspection and focused mapping tests             |
| `2.6.3`     | 2026-07-27 | confirmed | installed artifact still reads `--m3e-loading-indicator-size` |

## M3E-002 — Uncontained host size is coupled to active size

- Component: Loading indicator
- First confirmed version: `2.6.2`
- Last revalidated version: `2.6.3`
- Upstream status: `unreported`
- Mioframe status: `workaround-active`
- Family design: `../components/loadingIndicator/DESIGN.md`
- Family architecture: `../components/loadingIndicator/ARCHITECTURE.md`
- Family implementation: `../components/loadingIndicator/IMPLEMENTATION.md`
- Upstream issue: none
- Upstream pull request: none

### Official expectation

Official evidence distinguishes overall/container size from active-indicator size and records a 48dp/38dp default relationship.

Recorded official sources:

- `/components/loading-indicator/specs`;
- `/components/loading-indicator/guidelines`, responsive layout.

### Observed renderer behavior

In installed `2.6.2`–`2.6.3`, the uncontained host width is assigned from `LoadingIndicatorToken.activeIndicatorSize`, while the active shape is sized again inside that host. This couples layout to active-indicator geometry.

### Evidence

- renderer source: `packages/web/src/loading-indicator/LoadingIndicatorElement.ts`;
- installed `2.6.3`: `node_modules/@m3e/web/dist/loading-indicator.js`;
- implementation proof: `../components/loadingIndicator/MDLoadingIndicator.test.ts`;
- browser proof: `../../../../../tests/e2e/storybook/md-loading-indicator.spec.ts`;
- visual proof: `../../../../../tests/e2e/visual/shared-ui/md-loading-indicator.spec.ts`.

### Mioframe impact and mitigation

Mapping public overall size directly to the effective active-size input produces an incorrect host box and affects Button composition. The family architecture records a host-level mitigation. The implementation sets host width/height from public overall size and maps the private active-size input proportionally; the renderer retains internal animation ownership.

### Correct upstream result

m3e should provide independent documented overall/container and active-indicator sizing for the uncontained variant with Material-correct defaults and proportional scaling.

### Removal trigger

Consume a renderer version with independent correct sizing, remove host-size/ratio workarounds that are no longer required, and pass affected family implementation, browser, visual, migration, and review gates.

### Revalidation history

| m3e version | Date       | Result    | Evidence                                                        |
| ----------- | ---------- | --------- | --------------------------------------------------------------- |
| `2.6.2`     | 2026-07-27 | confirmed | source inspection, host-box tests, and visual evidence          |
| `2.6.3`     | 2026-07-27 | confirmed | uncontained host width remains coupled to active-indicator size |

## Removed records

### M3E-003 — Unitless pressed opacity

This record was withdrawn before merge after installed `2.6.3` evidence separated two primitives:

- Ripple applies opacity and background color independently; unitless opacity is valid.
- State layer uses `color-mix()` weights, where percentages are required.

The renderer shipped compatible percentage defaults. The defect belonged to Mioframe foundation representation, not m3e. The ID remains retired.

### Revalidation history

| m3e version | Date       | Result                                                                |
| ----------- | ---------- | --------------------------------------------------------------------- |
| `2.6.2`     | 2026-07-27 | initially classified from source inspection and operator reproduction |
| `2.6.3`     | 2026-07-27 | removed after installed-artifact inspection                           |

## Update protocol

When confirming a defect:

1. confirm the official expectation from current family design;
2. require a selected scenario and `divergent` architecture decision;
3. inspect the exact installed renderer artifact and documented public contract;
4. reproduce observable behavior in the browser when applicable;
5. assign the next stable ID;
6. add the summary row and complete record;
7. reference the ID from every affected architecture;
8. record mitigation, proof, risk, long-term owner, and removal trigger;
9. record implemented mitigation and proof in implementation artifacts.

When updating m3e:

1. find non-resolved entries for affected families;
2. revalidate against the newly installed version and owned observable proof;
3. update defect history and statuses;
4. refresh affected family artifacts through their owning stages;
5. remove or update workarounds only with owned verification;
6. mark `resolved` only after the fixed version is consumed and the workaround or blocker is removed.

When evidence shows a pre-merge record is not an m3e defect, remove it from the confirmed summary, retain the retired ID and reason, and route the issue to the correct owner.
