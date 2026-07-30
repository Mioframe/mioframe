# Confirmed m3e defect registry

This file is the canonical cross-component record of confirmed defects in the installed lockfile-resolved `@m3e/web` renderer used by Mioframe.

It does not replace family stage artifacts:

- `DESIGN.md` owns the complete official Material expectation;
- `ARCHITECTURE.md` owns selected scenarios, renderer classification, gap ownership, mitigation decision, risk, and removal trigger;
- `IMPLEMENTATION.md` owns the implemented workaround and proof result;
- this registry owns the stable upstream defect identity and lifecycle.

## Inclusion boundary

Create an `M3E-*` entry only when installed-version and observable evidence confirms at least one of:

- observable m3e behavior differs from the architecture-selected official Material contract;
- a documented m3e public property, attribute, event, slot, accessibility behavior, or CSS input is broken or implemented under another contract;
- m3e documentation and the installed implementation disagree;
- an m3e-private renderer defect requires an approved `temporary-renderer-workaround` or blocks a selected scenario.

The installed package artifact and observable browser behavior are the runtime source of truth. Upstream source, tags, demos, and changelogs are supporting evidence only.

Do not create an entry for:

- an official capability m3e does not implement at all — record `missing` in family `ARCHITECTURE.md`;
- deferred official surface with no current selected scenario;
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
- Every selected `divergent` architecture row references the applicable `M3E-*` ID.
- A temporary workaround is not accepted without a ready architecture decision and registry entry.
- Every consumed `@m3e/web` update revalidates non-resolved entries affecting changed or consumed families.
- An upstream fix does not resolve Mioframe work until the fixed version is consumed, the workaround or blocked path is removed, owned proof passes, and family stage artifacts are updated.
- A pre-merge misclassification may be withdrawn. Its ID remains retired and is never reused.

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

## M3E-001 — Loading indicator documented size input is not implemented

- Component: Loading indicator
- First confirmed version: `2.6.2`
- Last revalidated version: `2.6.3`
- Upstream status: `unreported`
- Mioframe status: `workaround-active`
- Family design: `../components/loadingIndicator/DESIGN.md` — pending restored design stage
- Family architecture: `../components/loadingIndicator/ARCHITECTURE.md` — pending restored architecture stage
- Family implementation: `../components/loadingIndicator/IMPLEMENTATION.md` — pending staged revalidation
- Upstream issue: none
- Upstream pull request: none

### Official Material expectation

Loading indicator has independently meaningful overall/container and active-indicator geometry. Existing official evidence records a 48dp overall size and 38dp active-indicator size for the default uncontained configuration.

The restored design stage must preserve the complete official geometry and sources before the family architecture is accepted.

Sources currently recorded as evidence:

- `/components/loading-indicator/specs`;
- `/components/loading-indicator/guidelines`, responsive layout.

### Documented m3e contract

`M3eLoadingIndicatorElement` documents:

```css
--m3e-loading-indicator-active-indicator-size
```

as the active-indicator size input.

### Observed m3e behavior

Installed `2.6.2` and `2.6.3` do not read that input. `LoadingIndicatorToken.activeIndicatorSize` reads:

```css
--m3e-loading-indicator-size
```

Consumers following the public m3e documentation therefore cannot control the implemented active-indicator size through the documented name.

### Evidence

- m3e source: `packages/web/src/loading-indicator/LoadingIndicatorElement.ts`;
- m3e source: `packages/web/src/loading-indicator/LoadingIndicatorToken.ts`;
- installed `2.6.3`: `node_modules/@m3e/web/dist/loading-indicator.js`, where `activeIndicatorSize` reads `var(--m3e-loading-indicator-size, 2.375rem)`;
- implementation proof: `../components/loadingIndicator/MDLoadingIndicator.test.ts`.

### Mioframe impact

The current public `MDLoadingIndicator.size` behavior cannot map through the documented m3e CSS input in `2.6.2`–`2.6.3`.

The restored architecture stage must confirm that this public size contract remains selected before retaining the workaround.

### Current implementation evidence

`MDLoadingIndicator` currently uses the confirmed effective host-level `--m3e-loading-indicator-size` input privately. Renderer vocabulary does not leak into its public Vue API, parent components, or consumers.

This is retained implementation evidence, not an approved staged result until Loading Indicator `DESIGN.md`, `ARCHITECTURE.md`, and `IMPLEMENTATION.md` revalidate it.

### Correct upstream result

m3e should implement and document one consistent public active-indicator size input, preferably the existing documented name or an explicit compatible migration.

### Removal trigger

Mioframe consumes a version whose documented input is effective, updates the private mapping, removes the workaround, and passes the family implementation, browser, visual, migration, and review gates.

### Revalidation history

| m3e version | Date       | Result    | Evidence                                                      |
| ----------- | ---------- | --------- | ------------------------------------------------------------- |
| `2.6.2`     | 2026-07-27 | confirmed | exact source inspection and focused mapping tests             |
| `2.6.3`     | 2026-07-27 | confirmed | installed artifact still reads `--m3e-loading-indicator-size` |

## M3E-002 — Uncontained host size is coupled to active-indicator size

- Component: Loading indicator
- First confirmed version: `2.6.2`
- Last revalidated version: `2.6.3`
- Upstream status: `unreported`
- Mioframe status: `workaround-active`
- Family design: `../components/loadingIndicator/DESIGN.md` — pending restored design stage
- Family architecture: `../components/loadingIndicator/ARCHITECTURE.md` — pending restored architecture stage
- Family implementation: `../components/loadingIndicator/IMPLEMENTATION.md` — pending staged revalidation
- Upstream issue: none
- Upstream pull request: none

### Official Material expectation

Official evidence distinguishes the Loading indicator overall/container size from active-indicator size and records a 48dp/38dp default relationship. The restored design stage must capture the complete official sizing contract before architecture acceptance.

Sources currently recorded as evidence:

- `/components/loading-indicator/specs`;
- `/components/loading-indicator/guidelines`, responsive layout.

### Documented m3e contract

m3e documents separate active-indicator and container concepts. Even without a visible container, the public host requires an overall layout box independent of active-shape geometry for the selected Material behavior.

### Observed m3e behavior

In installed `2.6.2`–`2.6.3`, the uncontained host width is assigned directly from `LoadingIndicatorToken.activeIndicatorSize`, while the active shape is sized again inside that host. This couples layout to active-indicator size.

### Evidence

- m3e source: `packages/web/src/loading-indicator/LoadingIndicatorElement.ts`;
- installed `2.6.3`: `node_modules/@m3e/web/dist/loading-indicator.js`, where the uncontained host width uses `LoadingIndicatorToken.activeIndicatorSize`;
- implementation proof: `../components/loadingIndicator/MDLoadingIndicator.test.ts`;
- browser proof: `../../../../../tests/e2e/storybook/md-loading-indicator.spec.ts`;
- visual proof: `../../../../../tests/e2e/visual/shared-ui/md-loading-indicator.spec.ts`.

### Mioframe impact

Forwarding public overall size directly to the effective active-size input produces the wrong host box and overall/active relationship and affects Button composition layout.

### Current implementation evidence

`MDLoadingIndicator` currently sets host width/height from public overall size and maps the private effective active-size input to `overallSize × 38 / 48`. Internal animated-shape scale remains renderer-owned.

This mitigation must be accepted or replaced by the restored Loading Indicator architecture stage and then recorded in `IMPLEMENTATION.md`.

### Correct upstream result

m3e should provide independent documented overall/container and active-indicator sizing for the uncontained variant with Material-correct defaults and proportional scaling.

### Removal trigger

Mioframe consumes a version with independent correct sizing, removes explicit host-size/ratio workarounds where no longer needed, and passes family implementation, browser, visual, migration, and review gates.

### Revalidation history

| m3e version | Date       | Result    | Evidence                                                        |
| ----------- | ---------- | --------- | --------------------------------------------------------------- |
| `2.6.2`     | 2026-07-27 | confirmed | source inspection, host-box tests, and visual evidence          |
| `2.6.3`     | 2026-07-27 | confirmed | uncontained host width remains coupled to active-indicator size |

## Removed records

### M3E-003 (removed) — Unitless pressed opacity makes the 2.6.2 ripple color invalid

The record was created against `2.6.2` source inspection and later withdrawn before merge after installed `2.6.3` evidence separated two primitives:

- Ripple applies opacity and background color independently; unitless opacity is valid.
- State layer uses `color-mix()` weights, where percentages are required. Mioframe’s former unitless state-opacity representation was incompatible with that consumer grammar.

The renderer shipped compatible percentage defaults. The defect therefore belonged to Mioframe foundation representation, not m3e. No replacement `M3E-*` ID was created.

The relevant correction and proof must be reconstructed in Button `ARCHITECTURE.md` and `IMPLEMENTATION.md`; the family README is not the owner.

### Revalidation history

| m3e version | Date       | Result                                                                |
| ----------- | ---------- | --------------------------------------------------------------------- |
| `2.6.2`     | 2026-07-27 | initially classified from source inspection and operator reproduction |
| `2.6.3`     | 2026-07-27 | reclassified and removed after installed-artifact inspection          |

## Update protocol

When confirming a new defect:

1. confirm the official expectation from current family `DESIGN.md`;
2. require a selected scenario and `divergent` decision in ready family `ARCHITECTURE.md`;
3. inspect the exact installed m3e artifact and documented public contract;
4. reproduce observable behavior in the browser when applicable;
5. assign the next stable `M3E-*` ID;
6. add the summary row and complete record;
7. reference the ID from every affected architecture;
8. record mitigation, proof, risk, long-term owner, and removal trigger;
9. record implemented mitigation and proof in `IMPLEMENTATION.md`.

When updating m3e:

1. find all non-resolved entries for affected families;
2. revalidate against the newly installed version and owned observable proof;
3. update history and statuses;
4. update affected architecture and implementation records;
5. remove or update workarounds only with owned verification;
6. mark `resolved` only after the fixed version is consumed and the workaround or blocker is gone.

When evidence shows a pre-merge record is not an m3e defect, remove it from the confirmed summary, retain the retired ID and reason, and route the issue to the correct design, architecture, implementation, migration, or application owner.
