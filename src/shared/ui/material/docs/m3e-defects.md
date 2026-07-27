# Confirmed m3e defect registry

This file is the canonical cross-component record of confirmed defects in the installed lockfile-resolved `@m3e/web` renderer used by Mioframe.

It does not replace a component family Material–m3e–Vue matrix. A family matrix owns the current Mioframe contract, selected Material surface, renderer coverage, implementation decision, and proof. This registry owns an upstream defect identity and lifecycle only when m3e implements or documents a capability incorrectly.

## Inclusion boundary

Create an `M3E-*` entry only when installed-version and observable evidence confirms at least one of:

- observable m3e behavior differs from the selected official Material contract;
- a documented m3e public property, attribute, event, slot, accessibility behavior, or CSS input is broken or implemented under a different contract;
- m3e documentation and the installed implementation disagree;
- an m3e private renderer defect requires a Mioframe `temporary-renderer-workaround` or blocks a selected scenario.

The installed package artifact and observable browser behavior are the runtime source of truth. Upstream repository source, tags, demos, and changelogs are supporting evidence only.

Do not create an entry for:

- an official Material capability that m3e does not implement at all; keep it `missing` in the family matrix;
- deferred Material surface that no current Mioframe scenario requires;
- a `source-conflict` in official Material evidence;
- a Mioframe token, integration, composition, or extension defect;
- a different internal implementation with an observably equivalent Material result;
- an unverified suspicion.

```text
m3e capability absent
  → family matrix only (`missing`)

m3e capability documented or implemented incorrectly
  → family matrix (`divergent`, `M3E-*` reference)
  → this registry
```

## Identity and lifecycle

- IDs are stable and never reused.
- One observable upstream defect has one entry, even when several Mioframe components are affected.
- A family matrix row with confirmed `divergent` renderer status references the applicable `M3E-*` ID.
- A `temporary-renderer-workaround` for a confirmed m3e defect is not accepted without a registry entry.
- Every `@m3e/web` update revalidates all non-resolved entries affecting changed or consumed renderer families.
- An upstream fix does not resolve Mioframe work until the fixed version is consumed, the workaround or blocked path is removed, and owned proof passes.
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

| ID | Component | Summary | Affected version | Mioframe status | Upstream status |
| --- | --- | --- | --- | --- | --- |
| `M3E-001` | Loading indicator | Documented active-indicator size CSS input is not the implemented input | `2.6.2` | `workaround-active` | `unreported` |
| `M3E-002` | Loading indicator | Uncontained host size is incorrectly coupled to active-indicator size | `2.6.2` | `workaround-active` | `unreported` |

## Retired pre-merge IDs

| ID | Reason | Reuse |
| --- | --- | --- |
| `M3E-003` | Withdrawn during PR #162 calibration. The missing Button ripple is currently proven as an incompatibility between Mioframe's unitless state-opacity representation and the percentage-compatible consumed renderer path. It is not a confirmed m3e defect unless installed-artifact and documented-contract evidence later proves otherwise. | forbidden |

The Button family keeps the current interaction issue in its family matrix as an integration/foundation correction until the installed package and all selected token consumers are audited. Do not reference `M3E-003` as a confirmed defect.

## M3E-001 — Loading indicator documented size input is not implemented

- Component: Loading indicator
- First confirmed version: `2.6.2`
- Last revalidated version: `2.6.2`
- Upstream status: `unreported`
- Mioframe status: `workaround-active`
- Family matrix: `../components/loading-indicator/README.md`
- Upstream issue: none
- Upstream pull request: none

### Official Material contract

Loading indicator exposes independently meaningful overall/container and active-indicator geometry. The selected Mioframe scenario requires scalable geometry with a default 48dp overall size and 38dp active-indicator size.

Sources:

- `/components/loading-indicator/specs`;
- `/components/loading-indicator/guidelines`, responsive layout.

### Documented m3e contract

`M3eLoadingIndicatorElement` documents the active-indicator size CSS input as:

```css
--m3e-loading-indicator-active-indicator-size
```

### Observed m3e behavior

The installed `2.6.2` implementation does not read the documented input. `LoadingIndicatorToken.activeIndicatorSize` reads:

```css
--m3e-loading-indicator-size
```

Therefore consumers following the public m3e documentation cannot control the implemented active-indicator size.

### Evidence

- installed m3e `2.6.2` loading-indicator artifact;
- Mioframe contract and reproduction: `../components/loading-indicator/README.md`;
- focused mapping proof: `../components/loading-indicator/MDLoadingIndicator.test.ts`.

### Mioframe impact

The canonical `MDLoadingIndicator.size` contract cannot be mapped through the documented m3e CSS input in `2.6.2`.

### Current Mioframe mitigation

`MDLoadingIndicator` privately uses the confirmed effective host-level `--m3e-loading-indicator-size` input under the exact-version workaround gate. Renderer vocabulary does not leak into the public Vue API, parent adapters, or consumers.

### Correct upstream result

m3e should implement and document one consistent public active-indicator size input. Prefer the already documented name or provide an explicit compatible migration.

### Removal trigger

Mioframe consumes an m3e version whose documented active-indicator size input is effective, updates the private mapping, removes the undocumented-variable workaround, and passes Loading indicator contract, browser, and visual proof.

### Revalidation history

| m3e version | Date | Result | Evidence |
| --- | --- | --- | --- |
| `2.6.2` | 2026-07-27 | confirmed | installed artifact inspection and focused mapping tests |

## M3E-002 — Uncontained host size is coupled to active-indicator size

- Component: Loading indicator
- First confirmed version: `2.6.2`
- Last revalidated version: `2.6.2`
- Upstream status: `unreported`
- Mioframe status: `workaround-active`
- Family matrix: `../components/loading-indicator/README.md`
- Upstream issue: none
- Upstream pull request: none

### Official Material contract

Material distinguishes the Loading indicator overall/container size from active-indicator size. The default relationship is 48dp overall/container and 38dp active indicator, and the ratio remains stable when resized.

Sources:

- `/components/loading-indicator/specs`;
- `/components/loading-indicator/guidelines`, responsive layout.

### Documented m3e contract

m3e documents separate active-indicator and container size concepts. The uncontained configuration has no visible container, but its public host still needs an overall layout box independent from active-indicator geometry for Material-correct placement and scaling.

### Observed m3e behavior

In installed `2.6.2`, the uncontained host width is assigned directly from `LoadingIndicatorToken.activeIndicatorSize`, while the animated active shape is sized again inside that host. This couples layout to active-indicator size and removes the official overall/active distinction.

### Evidence

- installed m3e `2.6.2` loading-indicator artifact;
- Mioframe contract and geometry analysis: `../components/loading-indicator/README.md`;
- focused mapping proof: `../components/loading-indicator/MDLoadingIndicator.test.ts`;
- browser host-box proof: `../../../../../tests/e2e/storybook/md-loading-indicator.spec.ts`;
- visual proof: `../../../../../tests/e2e/visual/shared-ui/md-loading-indicator.spec.ts`.

### Mioframe impact

Forwarding public overall `size` 1:1 to the effective active-size input produces the wrong component box and relationship between overall and active geometry. It also affects Button composition layout.

### Current Mioframe mitigation

`MDLoadingIndicator` sets explicit host width and height from public overall size and maps the private active-size input to `overallSize × 38 / 48`. m3e internal animated-shape scale remains renderer-owned and is not compensated.

### Correct upstream result

m3e should provide independent, documented overall/container and active-indicator sizing for the uncontained variant with Material-correct defaults and proportional scaling. Host layout must not be derived from the active-indicator token.

### Removal trigger

Mioframe consumes a version with independent Material-correct sizing, removes explicit host-size and ratio workarounds where no longer needed, and passes Loading indicator contract, browser, visual, and Button composition proof.

### Revalidation history

| m3e version | Date | Result | Evidence |
| --- | --- | --- | --- |
| `2.6.2` | 2026-07-27 | confirmed | installed artifact inspection, host geometry tests, and inspected baselines |

## Update protocol

When confirming a new defect:

1. verify the selected Material expectation;
2. inspect the installed lockfile-resolved m3e artifact and documented public contract;
3. reproduce the observable behavior in the browser when applicable;
4. assign the next stable `M3E-*` ID;
5. add the summary row and complete record;
6. reference the ID from every affected family matrix;
7. record mitigation, proof, risk, long-term owner, and removal trigger.

When updating m3e:

1. find all non-`resolved` entries for affected renderer families;
2. revalidate each against the newly installed version and owned observable proof;
3. update history and statuses;
4. remove or update workarounds only with owned verification;
5. mark `resolved` only after the fixed version is consumed and the workaround or blocker is gone.

When evidence shows a pre-merge record is not an m3e defect, remove it from the confirmed summary and affected family matrices, add its ID to the retired table with the reason, and route the issue to the correct Mioframe owner.