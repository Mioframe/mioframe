# Confirmed m3e defect registry

This file owns stable identities and lifecycle facts for confirmed defects in the exact `@m3e/web` renderer consumed by Mioframe.

It is intentionally a registry, not a workflow log.

## Ownership

```text
family canonical contract
  → defines the required Material result

component implementation + proof
  → confirms exact-version renderer behavior
  → owns any family-local mitigation

m3e-defects.md
  → owns stable M3E-* identity, affected versions, evidence,
    status, and removal trigger
```

A converted family records official expectations in `contract.ts`, `tokens.css`, `BEHAVIOR.md`, `GUIDANCE.md`, and `SOURCES.md`. Untouched legacy families may still have historical DESIGN/ARCHITECTURE/IMPLEMENTATION evidence until they are converted.

## Inclusion boundary

Create an `M3E-*` entry only when exact installed-version evidence confirms at least one of:

- observable renderer behavior differs from the canonical Material contract;
- documented m3e public API exists but is broken or implemented under another observable contract;
- m3e documentation and the installed public implementation disagree;
- a renderer defect requires a temporary family-local workaround or blocks faithful implementation.

Do not create an entry for:

- a Material capability that m3e simply does not provide;
- an official Material source conflict;
- a Mioframe adapter, consumer, token, composition, or ownership defect;
- a different internal implementation with equivalent observable behavior;
- an unverified suspicion.

A missing renderer capability is an implementation finding. If the canonical contract cannot be implemented through a small documented family-local seam, route it to the architect/upstream rather than redefining the public Material contract.

## Lifecycle

- IDs are stable and never reused.
- One observable upstream defect has one ID even when multiple families consume it.
- A workaround must remain private to the owning family and be proven at the observable boundary.
- Every consumed renderer update revalidates entries affecting changed or consumed families.
- An upstream fix is not resolved for Mioframe until the fixed version is consumed, the workaround/blocked path is removed, and affected proof passes.
- A pre-merge misclassification may be retired; its ID remains reserved.

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

## Active records

| ID        | Component         | Summary                                                                                      | Affected version | Mioframe status     | Upstream status | Last revalidated |
| --------- | ----------------- | -------------------------------------------------------------------------------------------- | ---------------- | ------------------- | --------------- | ---------------- |
| `M3E-001` | Loading Indicator | documented active-indicator size CSS input is not the implemented input                      | `2.6.2`–`2.7.4`  | `workaround-active` | `unreported`    | 2026-08-14       |
| `M3E-002` | Loading Indicator | uncontained host size is coupled to active-indicator size                                    | `2.6.2`–`2.7.4`  | `workaround-active` | `unreported`    | 2026-08-14       |
| `M3E-004` | Switch            | native `<label>` association does not produce an accessible name                             | `2.6.3`–`2.7.4`  | `workaround-active` | `unreported`    | 2026-08-14       |
| `M3E-005` | Checkbox          | explicit native `<label for>` association does not produce an accessible name                | `2.6.3`–`2.7.4`  | `workaround-active` | `unreported`    | 2026-08-14       |
| `M3E-006` | Button            | small Button defaults to 20dp leading/trailing spacing instead of the required 16dp geometry | `2.7.4`          | `workaround-active` | `unreported`    | 2026-08-14       |

`M3E-003` is retired; see Removed records.

## M3E-001 — documented active-indicator size input is ineffective

**Observed:** installed `2.6.2` through `2.7.4` document `--m3e-loading-indicator-active-indicator-size`, but the implementation reads `--m3e-loading-indicator-size` for the active-indicator token.

**Evidence:**

- installed/public renderer source and built artifact for Loading Indicator;
- `components/loadingIndicator/MDLoadingIndicator.test.ts`;
- `components/loadingIndicator/MDLoadingIndicator.browser.spec.ts`.

**Current mitigation:** the owning family privately maps the confirmed effective renderer input while preserving the public Material sizing contract.

**Removal trigger:** consume a renderer version whose documented active-indicator input is effective, remove the private workaround, and rerun affected component/browser/visual proof.

## M3E-002 — uncontained host size is coupled to active size

**Observed:** installed `2.6.2` through `2.7.4` derive the uncontained host width from the active-indicator size, while the Material contract distinguishes overall/container geometry from active-indicator geometry.

**Evidence:**

- installed/public Loading Indicator renderer artifact;
- `components/loadingIndicator/MDLoadingIndicator.test.ts`;
- `components/loadingIndicator/MDLoadingIndicator.browser.spec.ts`;
- `components/loadingIndicator/MDLoadingIndicator.visual.spec.ts`.

**Current mitigation:** the family owns the minimum host-level correction needed to preserve the public overall/active geometry while m3e retains animation ownership.

**Removal trigger:** consume a renderer version with independent correct overall and active sizing, remove the host/ratio correction, and rerun affected proof.

## M3E-004 — Switch native label association does not name the control

**Observed:** installed `2.7.4` documents label association through `LabelledMixin` and a `<label>`-wrapped example, but Chromium accessibility-tree proof shows implicit wrapping and explicit `for`/`id` association leave `m3e-switch` unnamed. `aria-label` and `aria-labelledby` work.

**Evidence:**

- installed `SwitchElement.d.ts` and `Labelled.d.ts`;
- `components/switch/MDSwitch.browser.spec.ts`.

**Current mitigation:** Mioframe does not synthesize renderer accessibility internals. Supported Switch composition uses independently proven accessible-name mechanisms or presentation semantics where the Switch is decorative.

**Removal trigger:** consume a renderer version where native label association produces the correct accessible name and confirm it with real-browser accessibility-tree proof.

## M3E-005 — Checkbox explicit label association does not name the control

**Observed:** installed `2.7.4` documents implicit and explicit label association through `LabelledMixin`, but Chromium accessibility-tree proof shows explicit `for`/`id` association leaves `m3e-checkbox` unnamed. `aria-label` and `aria-labelledby` work.

**Evidence:**

- installed `CheckboxElement.d.ts` and `Labelled.d.ts`;
- `components/checkbox/MDCheckbox.browser.spec.ts`.

**Current mitigation:** Mioframe does not synthesize renderer accessibility internals and uses independently proven accessible-name mechanisms for supported scenarios.

**Removal trigger:** consume a renderer version where native label association produces the correct accessible name and confirm it with real-browser accessibility-tree proof.

## M3E-006 — Small Button spacing differs from Material geometry

**Observed:** installed `2.7.4` maps the small Button leading/trailing spacing fallback to `DesignToken.measurement.space250`, which resolves to 20dp. Browser geometry measured 40px total horizontal padding before correction rather than the required 32px.

**Evidence:**

- `node_modules/@m3e/web/dist/button.js` (`ButtonSizeToken.small` and documented CSS inputs);
- `node_modules/@m3e/web/dist/all.js` (`DesignToken.measurement.space250 = 20dp`);
- `components/button/MDButton.test.ts`;
- `components/button/MDButton.browser.spec.ts`;
- existing Button visual regression proof.

**Current mitigation:** the Button family privately sets the documented renderer spacing inputs to 16px for the affected small variant.

**Removal trigger:** consume a renderer version with the Material-correct default, remove the private spacing correction, and confirm 32px total horizontal padding plus affected visual proof without compensating baseline changes.

## Removed records

### M3E-003 — unitless pressed opacity

Retired before merge after the suspected renderer defect was determined to be a Mioframe representation/mapping misclassification rather than a confirmed upstream defect. The ID remains reserved and must not be reused.
