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

| ID        | Component         | Summary                                                                                                 | Affected version | Mioframe status     | Upstream status |
| --------- | ----------------- | ------------------------------------------------------------------------------------------------------- | ---------------- | ------------------- | --------------- |
| `M3E-001` | Loading indicator | Documented active-indicator size CSS input is not the implemented input                                 | `2.6.2`–`2.7.4`  | `workaround-active` | `unreported`    |
| `M3E-002` | Loading indicator | Uncontained host size is coupled to active-indicator size                                               | `2.6.2`–`2.7.4`  | `workaround-active` | `unreported`    |
| `M3E-004` | Switch            | Native `<label>` association (implicit wrap or explicit `for`/`id`) does not produce an accessible name | `2.6.3`–`2.7.4`  | `workaround-active` | `unreported`    |
| `M3E-005` | Checkbox          | Native `<label>` association (explicit `for`/`id`) does not produce an accessible name                  | `2.6.3`–`2.7.4`  | `workaround-active` | `unreported`    |
| `M3E-006` | Button            | Small Button defaults to 20dp leading/trailing spacing, not the selected 16dp Material geometry         | `2.7.4`          | `workaround-active` | `unreported`    |

`M3E-003` was removed before merge as a Mioframe representation misclassification. Its ID is retired; see Removed records.

## M3E-001 — Documented size input is not implemented

- Component: Loading indicator
- First confirmed version: `2.6.2`
- Last revalidated version: `2.7.4`
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

Installed `2.6.2` through `2.7.4` do not read that input. `LoadingIndicatorToken.activeIndicatorSize` reads:

```css
--m3e-loading-indicator-size
```

A consumer following the documented renderer API cannot control the implemented active-indicator size through the documented name.

### Evidence

- renderer source: `packages/web/src/loading-indicator/LoadingIndicatorElement.ts`;
- renderer source: `packages/web/src/loading-indicator/LoadingIndicatorToken.ts`;
- installed `2.7.4` built artifact: `node_modules/@m3e/web/dist/loading-indicator.js`;
- implementation proof: `../components/loadingIndicator/MDLoadingIndicator.test.ts`;
- browser geometry proof: `../components/loadingIndicator/MDLoadingIndicator.browser.spec.ts`.

### Mioframe impact and mitigation

The public overall-size contract cannot map through the documented input in affected versions. The family architecture records the accepted controlled workaround. The implementation maps the confirmed effective input privately without leaking renderer vocabulary.

### Correct upstream result

m3e should implement and document one consistent public active-indicator size input, preferably the existing documented name or an explicit compatible migration.

### Removal trigger

Consume a renderer version whose documented input is effective, update the private mapping, remove the workaround, and pass the affected family implementation, browser, visual, migration, and review gates.

### Revalidation history

| m3e version | Date       | Result    | Evidence                                                                                    |
| ----------- | ---------- | --------- | ------------------------------------------------------------------------------------------- |
| `2.6.2`     | 2026-07-27 | confirmed | exact source inspection and focused mapping tests                                           |
| `2.6.3`     | 2026-07-27 | confirmed | installed artifact still reads `--m3e-loading-indicator-size`                               |
| `2.7.4`     | 2026-08-14 | confirmed | installed artifact still reads `--m3e-loading-indicator-size`; browser host geometry passed |

## M3E-002 — Uncontained host size is coupled to active size

- Component: Loading indicator
- First confirmed version: `2.6.2`
- Last revalidated version: `2.7.4`
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

In installed `2.6.2`–`2.7.4`, the uncontained host width is assigned from `LoadingIndicatorToken.activeIndicatorSize`, while the active shape is sized again inside that host. This couples layout to active-indicator geometry.

### Evidence

- renderer source: `packages/web/src/loading-indicator/LoadingIndicatorElement.ts`;
- installed `2.7.4` built artifact: `node_modules/@m3e/web/dist/loading-indicator.js`;
- implementation proof: `../components/loadingIndicator/MDLoadingIndicator.test.ts`;
- browser proof: `../components/loadingIndicator/MDLoadingIndicator.browser.spec.ts`;
- visual proof: `../components/loadingIndicator/MDLoadingIndicator.visual.spec.ts`.

### Mioframe impact and mitigation

Mapping public overall size directly to the effective active-size input produces an incorrect host box and affects Button composition. The family architecture records a host-level mitigation. The implementation sets host width/height from public overall size and maps the private active-size input proportionally; the renderer retains internal animation ownership.

### Correct upstream result

m3e should provide independent documented overall/container and active-indicator sizing for the uncontained variant with Material-correct defaults and proportional scaling.

### Removal trigger

Consume a renderer version with independent correct sizing, remove host-size/ratio workarounds that are no longer required, and pass affected family implementation, browser, visual, migration, and review gates.

### Revalidation history

| m3e version | Date       | Result    | Evidence                                                                           |
| ----------- | ---------- | --------- | ---------------------------------------------------------------------------------- |
| `2.6.2`     | 2026-07-27 | confirmed | source inspection, host-box tests, and visual evidence                             |
| `2.6.3`     | 2026-07-27 | confirmed | uncontained host width remains coupled to active-indicator size                    |
| `2.7.4`     | 2026-08-14 | confirmed | installed host rule remains coupled; browser host geometry and visual proof passed |

## M3E-004 — Native `<label>` association does not produce an accessible name

- Component: Switch
- First confirmed version: `2.6.3`
- Last revalidated version: `2.7.4`
- Upstream status: `unreported`
- Mioframe status: `workaround-active`
- Family design: `../components/switch/DESIGN.md`
- Family architecture: `../components/switch/ARCHITECTURE.md`
- Family implementation: `../components/switch/IMPLEMENTATION.md`
- Upstream issue: none
- Upstream pull request: none

### Official expectation

Official Switch Accessibility guidance ("Labeling") states that the switch's accessibility label uses its adjacent visible label text when implemented correctly, and that assistive technology announces the adjacent UI text followed by the component's role — an adjacent/associated label is expected to supply the accessible name.

Recorded official sources:

- `/components/switch/accessibility` ("Labeling").

### Documented renderer contract

`M3eSwitchElement` implements `LabelledMixin`, exposing a read-only `labels: NodeListOf<HTMLLabelElement>` property, and the element's own class-level JSDoc lists the following as its first documented `@example`:

```html
<label>Switch label&nbsp;<m3e-switch></m3e-switch></label>
```

### Observed renderer behavior

Installed `2.7.4`: real-browser (Chromium) accessibility-tree evidence shows neither implicit `<label>` wrapping (`<label>Labelled switch<m3e-switch></m3e-switch></label>`) nor explicit `for`/`id` association produces an accessible name for `m3e-switch` — the accessibility-tree node reports an unnamed `switch` role in both cases. `aria-label` and `aria-labelledby` are independently confirmed working on the same element.

### Evidence

- installed `2.7.4` type declaration: `node_modules/@m3e/web/dist/src/switch/SwitchElement.d.ts` (documented `<label>`-wrapped `@example`, `LabelledMixin` base);
- installed `2.7.4` type declaration: `node_modules/@m3e/web/dist/src/core/shared/mixins/Labelled.d.ts`;
- browser proof: `../components/switch/MDSwitch.browser.spec.ts` ("MDSwitch native implicit and explicit label associations do not produce accessible names (M3E-004)");
- implementation record: `../components/switch/IMPLEMENTATION.md` ("Component-owned proof").

### Mioframe impact and mitigation

No confirmed current or default scenario is blocked: the decorative list-item composition (`presentation`) hides the Switch node from the accessibility tree entirely, and the standalone default's accessible-name acceptance criterion is an "or" list already satisfied by the two independently confirmed-working mechanisms (`aria-label`, `aria-labelledby`). The family does not rely on native `<label>` wrapping or `for`/`id` association as an accessible-name source; `MDSwitch.stories.ts` and `../components/switch/MDSwitch.browser.spec.ts` use `aria-label`/`aria-labelledby` fixtures instead. No wrapper-level accessible-name synthesis is added, per `docs/component-adapter.md`'s prohibition on recreating renderer-owned accessibility implementation.

### Correct upstream result

m3e should compute an accessible name from an implicit or explicit `<label>` association for `m3e-switch`, consistent with its own documented `LabelledMixin`/`labels` support and its illustrated `<label>`-wrapped usage example.

### Removal trigger

Consume a renderer version whose native `<label>` association produces a correct accessible name, confirm with real-browser accessibility-tree proof, and update the affected family architecture/implementation rows from `divergent` to `direct`.

### Revalidation history

| m3e version | Date       | Result    | Evidence                                                                                                                |
| ----------- | ---------- | --------- | ----------------------------------------------------------------------------------------------------------------------- |
| `2.6.3`     | 2026-08-11 | confirmed | real-browser accessibility-tree proof (`../components/switch/MDSwitch.browser.spec.ts`); renderer JSDoc/type inspection |
| `2.7.4`     | 2026-08-14 | confirmed | installed public label contract unchanged; real-browser implicit and explicit association proof passed                  |

## M3E-005 — Native `<label>` association does not produce an accessible name (Checkbox)

- Component: Checkbox
- First confirmed version: `2.6.3`
- Last revalidated version: `2.7.4`
- Upstream status: `unreported`
- Mioframe status: `workaround-active`
- Family design: `../components/checkbox/DESIGN.md`
- Family architecture: `../components/checkbox/ARCHITECTURE.md`
- Family implementation: `../components/checkbox/IMPLEMENTATION.md`
- Upstream issue: none
- Upstream pull request: none

### Official expectation

Official Checkbox Accessibility guidance ("Labeling") states that if the UI text is correctly linked to the checkbox, assistive technology reads the UI text followed by the component's role, and that the accessibility label for an individual checkbox is typically the same as its adjacent text label — an adjacent/associated label is expected to supply the accessible name.

Recorded official sources:

- `/components/checkbox/accessibility` ("Labeling").

### Documented renderer contract

`M3eCheckboxElement` implements the same `Labelled` mixin as `M3eSwitchElement` (`LabelledMixin`, read-only `labels: NodeListOf<HTMLLabelElement>` property), and the element's own class-level JSDoc documents both an implicit-wrap `<label>` example and an explicit `for`/`id` example:

```html
<label>
  <m3e-checkbox></m3e-checkbox>
  Checkbox label
</label>
```

```html
<m3e-checkbox id="chk"></m3e-checkbox> <label for="chk">Checkbox label</label>
```

### Observed renderer behavior

Installed `2.7.4`: real-browser (Chromium) accessibility-tree evidence shows explicit `for`/`id` association still does not produce an accessible name for `m3e-checkbox`; the observable accessible name is `""`. `aria-label` and `aria-labelledby` are independently confirmed working on the same element (see the accessible-name test in the same spec file).

### Evidence

- installed `2.7.4` type declaration: `node_modules/@m3e/web/dist/src/checkbox/CheckboxElement.d.ts` (documented implicit-wrap and `for`/`id` `@example`s, `LabelledMixin`-derived base);
- installed `2.7.4` type declaration: `node_modules/@m3e/web/dist/src/core/shared/mixins/Labelled.d.ts` (same mixin `M3E-004` already confirmed non-functional for accessible naming on `m3e-switch`);
- browser proof: `../components/checkbox/MDCheckbox.browser.spec.ts` ("MDCheckbox native <label for> association does not produce an accessible name (M3E-005, matching Switch M3E-004)");
- implementation record: `../components/checkbox/IMPLEMENTATION.md` ("Component-owned proof").

### Mioframe impact and mitigation

No confirmed current or default scenario is blocked: ARCHITECTURE.md's "Selected and deferred Material surface" already classified the adjacent-label accessible-name row as `defer` (not relied upon), with `aria-label`/`aria-labelledby` selected as the confirmed-working backstop mechanism for every scenario — including `MDCheckboxField`'s migration-stage requirement to forward one of them explicitly. The family does not rely on native `<label>` association as an accessible-name source; `MDCheckbox.stories.ts`'s `BehaviorContracts` fixture and `MDCheckbox.browser.spec.ts` use `aria-labelledby`/`aria-label` fixtures for the accessible-name contract, and a separate `AdjacentLabel` fixture proves only the click-to-toggle activation effect of the same association, which remains confirmed `direct`. No wrapper-level accessible-name synthesis is added, per `docs/component-adapter.md`'s prohibition on recreating renderer-owned accessibility implementation.

### Correct upstream result

m3e should compute an accessible name from an implicit or explicit `<label>` association for `m3e-checkbox`, consistent with its own documented `LabelledMixin`/`labels` support and its illustrated `<label>`-wrapped and `for`/`id` usage examples.

### Removal trigger

Consume a renderer version whose native `<label>` association produces a correct accessible name, confirm with real-browser accessibility-tree proof, and update the affected family architecture/implementation rows from `divergent` to `direct`.

### Revalidation history

| m3e version | Date       | Result    | Evidence                                                                                                                    |
| ----------- | ---------- | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| `2.6.3`     | 2026-08-12 | confirmed | real-browser accessibility-tree proof (`../components/checkbox/MDCheckbox.browser.spec.ts`); renderer JSDoc/type inspection |
| `2.7.4`     | 2026-08-14 | confirmed | installed public label contract unchanged; real-browser external-label proof passed                                         |

## M3E-006 — Small Button default spacing differs from the selected Material geometry

- Component: Button
- First confirmed version: `2.7.4`
- Last revalidated version: `2.7.4`
- Upstream status: `unreported`
- Mioframe status: `workaround-active`
- Family design: `../components/button/DESIGN.md`
- Family architecture: `../components/button/ARCHITECTURE.md`
- Family implementation: `../components/button/IMPLEMENTATION.md`
- Upstream issue: none
- Upstream pull request: none

### Official expectation

The selected small Button geometry is a 40dp visible container with 16dp leading and trailing spacing. The selected contract does not expose spacing as a consumer token or prop.

Recorded official source:

- `../components/button/DESIGN.md`, Geometry and layout.

### Documented renderer contract

`M3eButtonElement` documents the size-specific CSS inputs:

```css
--m3e-button-small-leading-space
--m3e-button-small-trailing-space
```

They are renderer terminology and remain private to the Material Button boundary.

### Observed renderer behavior

Installed `2.7.4` assigns the small `ButtonSizeToken.leadingSpace` and `trailingSpace` fallbacks to `DesignToken.measurement.space250`. The installed design-token bundle resolves that default to 20dp. Before the family correction, real-browser host-versus-light-DOM-label geometry measured 40px total horizontal padding rather than the selected 32px.

### Evidence

- installed `2.7.4` built artifact: `node_modules/@m3e/web/dist/button.js` (`ButtonSizeToken.small` and documented CSS inputs);
- installed `2.7.4` design-token bundle: `node_modules/@m3e/web/dist/all.js` (`DesignToken.measurement.space250 = 20dp`);
- component mapping proof: `../components/button/MDButton.test.ts`;
- browser geometry proof: `../components/button/MDButton.browser.spec.ts` ("MDButton small geometry preserves the selected 16dp horizontal padding (M3E-006)");
- visual proof: `tests/e2e/visual/shared-ui/md-button.spec.ts`.

### Mioframe impact and mitigation

No public API changes. `components/button/tokens.css` sets only the two documented size-specific renderer inputs to the selected 16px values. The mapping is fixed to the consumed `2.7.4` baseline, applies only to the selected small size, and does not recreate renderer geometry, ripple, state-layer, focus, elevation, or motion behavior.

### Correct upstream result

A consumed renderer baseline should supply the selected small Button 16dp leading/trailing default directly, so the private family mapping can be removed without changing Mioframe's public contract.

### Removal trigger

Consume a renderer version whose small Button default is 16dp on both sides, remove the two family-local mappings, and pass the component, real-browser geometry, and visual proof without a baseline update caused by the removal.

### Revalidation history

| m3e version | Date       | Result    | Evidence                                                                                                                                                            |
| ----------- | ---------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2.7.4`     | 2026-08-14 | confirmed | installed artifact defaults to 20dp; browser regression measured 40px before correction and 32px after; 214-reference visual suite passed without a baseline update |

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
