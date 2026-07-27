# Confirmed m3e defect registry

This file is the canonical cross-component record of confirmed defects in the exact lockfile-resolved `@m3e/web` renderer used by Mioframe.

It does not replace a component family Material–m3e–Vue matrix. A family matrix owns the current Mioframe contract, selected Material surface, renderer coverage, implementation decision, and proof. This registry owns the upstream defect identity and lifecycle when m3e implements or documents a capability incorrectly.

## Inclusion boundary

Create an `M3E-*` entry only when exact-version evidence confirms at least one of the following:

- observable m3e behavior differs from the selected official Material contract;
- a documented m3e public property, attribute, event, slot, accessibility behavior, or CSS input is broken or implemented under a different contract;
- m3e documentation and the exact implementation disagree;
- an m3e private renderer defect requires a Mioframe `temporary-renderer-workaround` or blocks a selected scenario.

Do not create an entry for:

- an official Material capability that m3e does not implement at all; keep it `missing` in the family matrix;
- deferred Material surface that no current Mioframe scenario requires;
- a `source-conflict` in official Material evidence;
- a Mioframe-specific extension or composition decision;
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
- A family matrix row with a confirmed `divergent` renderer status must reference the applicable `M3E-*` ID.
- A `temporary-renderer-workaround` for a confirmed m3e defect is not accepted without a registry entry.
- Every `@m3e/web` version update must revalidate all non-resolved entries affecting changed or consumed renderer families.
- An upstream fix does not resolve the Mioframe entry until Mioframe consumes the fixed version, removes the workaround or blocked path, and passes the owned proof.

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
| `M3E-001` | Loading indicator | Documented active-indicator size CSS input is not the implemented input | `2.6.2`          | `workaround-active` | `unreported`    |
| `M3E-002` | Loading indicator | Uncontained host size is incorrectly coupled to active-indicator size   | `2.6.2`          | `workaround-active` | `unreported`    |

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

Loading indicator exposes independently meaningful overall/container and active-indicator geometry. The selected Mioframe scenario requires scalable Loading indicator geometry with a default 48dp overall size and 38dp active-indicator size.

Sources:

- `/components/loading-indicator/specs`;
- `/components/loading-indicator/guidelines`, responsive layout.

### Documented m3e contract

`M3eLoadingIndicatorElement` documents the active-indicator size CSS input as:

```css
--m3e-loading-indicator-active-indicator-size
```

### Observed m3e behavior

The exact `2.6.2` implementation does not read the documented input. `LoadingIndicatorToken.activeIndicatorSize` reads:

```css
--m3e-loading-indicator-size
```

Therefore consumers following the public m3e documentation cannot control the implemented active-indicator size.

### Evidence

- m3e source: `packages/web/src/loading-indicator/LoadingIndicatorElement.ts`;
- m3e source: `packages/web/src/loading-indicator/LoadingIndicatorToken.ts`;
- Mioframe contract and reproduction: `../components/loading-indicator/README.md`;
- focused mapping proof: `../components/loading-indicator/MDLoadingIndicator.test.ts`.

### Mioframe impact

The canonical `MDLoadingIndicator.size` contract cannot be mapped through the documented m3e CSS input in `2.6.2`.

### Current Mioframe mitigation

`MDLoadingIndicator` privately uses the confirmed effective host-level `--m3e-loading-indicator-size` input under the exact-version workaround gate. The renderer vocabulary does not leak into the public Vue API, parent adapters, or consumers.

### Correct upstream result

m3e should implement and document one consistent public active-indicator size input. Prefer the already documented `--m3e-loading-indicator-active-indicator-size` name or provide an explicit compatible migration.

### Removal trigger

Mioframe consumes an m3e version whose documented active-indicator size input is the effective implementation input, updates the private mapping, removes the undocumented-variable workaround, and passes Loading indicator contract, browser, and visual proof.

### Revalidation history

| m3e version | Date       | Result    | Evidence                                                   |
| ----------- | ---------- | --------- | ---------------------------------------------------------- |
| `2.6.2`     | 2026-07-27 | confirmed | exact source inspection and Mioframe focused mapping tests |

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

Material distinguishes the Loading indicator overall/container size from the active-indicator size. The default relationship is 48dp overall/container and 38dp active indicator, and the ratio remains stable when resized.

Sources:

- `/components/loading-indicator/specs`;
- `/components/loading-indicator/guidelines`, responsive layout.

### Documented m3e contract

m3e documents separate active-indicator and container size concepts. The uncontained configuration has no visible container, but its public host still needs an overall layout box independent from the active-indicator geometry for Material-correct placement and scaling.

### Observed m3e behavior

In `2.6.2`, the uncontained host width is assigned directly from `LoadingIndicatorToken.activeIndicatorSize`, while the animated active shape is sized again inside that host. This couples the component layout box to the active-indicator size and removes the official overall/active distinction.

### Evidence

- m3e source: `packages/web/src/loading-indicator/LoadingIndicatorElement.ts`;
- Mioframe contract and geometry analysis: `../components/loading-indicator/README.md`;
- focused mapping proof: `../components/loading-indicator/MDLoadingIndicator.test.ts`;
- browser host-box proof: `../../../../../tests/e2e/storybook/md-loading-indicator.spec.ts`;
- visual proof: `../../../../../tests/e2e/visual/shared-ui/md-loading-indicator.spec.ts`.

### Mioframe impact

Forwarding the public overall `size` 1:1 to the effective m3e active-size input produces the wrong component box and the wrong relationship between overall and active geometry. It also changes Button composition layout because Button consumes Loading indicator through its overall-size API.

### Current Mioframe mitigation

`MDLoadingIndicator` sets explicit host `width` and `height` from the public overall size and separately maps the private active-size input to `overallSize × 38 / 48`. m3e's internal animated-shape scale remains renderer-owned and is not compensated.

### Correct upstream result

m3e should provide independent, documented overall/container and active-indicator sizing for the uncontained variant with Material-correct defaults and proportional scaling. The host layout box must not be derived from the active-indicator token.

### Removal trigger

Mioframe consumes an m3e version with independent Material-correct uncontained overall and active sizing, removes the explicit host-size workaround and private ratio mapping where no longer needed, and passes Loading indicator contract, browser, visual, and Button composition proof.

### Revalidation history

| m3e version | Date       | Result    | Evidence                                                                         |
| ----------- | ---------- | --------- | -------------------------------------------------------------------------------- |
| `2.6.2`     | 2026-07-27 | confirmed | exact source inspection, host bounding-box tests, and inspected visual baselines |

## Update protocol

When confirming a new defect:

1. verify the selected Material expectation and the exact lockfile-resolved m3e behavior;
2. assign the next stable `M3E-*` ID;
3. add the summary row and complete detail record;
4. reference the ID from every affected family matrix row;
5. record the current Mioframe mitigation or blocker, proof, risk, long-term owner, and removal trigger;
6. update upstream links and both statuses as work progresses.

When updating m3e:

1. find all non-`resolved` entries for the affected renderer families;
2. revalidate each entry against the new exact version;
3. update the revalidation history and statuses;
4. remove or update Mioframe workarounds only with owned verification;
5. mark `resolved` only after the fixed version is consumed and the workaround or blocker is gone.
