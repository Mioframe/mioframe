# Loading indicator architecture

Artifact revision: 2026-08-01T10:28:43.915Z
Status: ready
DESIGN.md reference: `src/shared/ui/material/components/loadingIndicator/DESIGN.md`
DESIGN.md contract revision: 2026-08-01T09:59:39.918Z
Renderer revision: @m3e/web@2.6.3
Revision summary: Corrected final verification ownership to the outer orchestrator and revalidated the complete architecture contract.
Remaining blockers: none
Required return family: none
Required return stage: none
Implementation readiness: ready
Dependency families: none
Dependency queue: none
Dependency review revisions: none

## Goal

Provide the canonical Mioframe Vue adapter for the official Material Loading indicator as an independently usable, uncontained, indeterminate presentation for real short ongoing work. Preserve its standalone semantics and geometry when a parent such as Button composes it.

The simplest viable design is a single-host adapter over the installed renderer with one required accessible-purpose prop, one bounded overall-size prop, one public active-indicator color token, and an explicit host-attribute boundary. Exporting the renderer directly would leak renderer vocabulary and cannot express the official overall/active sizing relationship because of confirmed renderer divergences. Contained, pull-to-refresh, and progress-indicator behavior are not needed by current scenarios.

Design basis: [Identity and purpose](./DESIGN.md#identity-and-purpose), [Variants and configurations](./DESIGN.md#variants-and-configurations), [Geometry and layout](./DESIGN.md#geometry-and-layout), and [Accessibility](./DESIGN.md#accessibility).

## Non-goals

- Contained presentation, its container tokens, or overlay placement.
- Pull-to-refresh gesture, threshold, cancellation, refresh lifecycle, or alternate refresh action ownership.
- Determinate progress, progress values, transition to determinate progress, or waits outside the official 200 ms through 5 s guidance.
- A rendered label, live-region policy, focus behavior, activation, disabled state, or operation-state ownership.
- Public renderer variants, tags, types, events, CSS variables, motion controls, shape internals, or compatibility aliases.
- Migration of Button or product features to use Loading indicator for provider- or browser-controlled waits.

Design basis: [Variants and configurations](./DESIGN.md#variants-and-configurations), [States and behavior](./DESIGN.md#states-and-behavior), [Usage guidance](./DESIGN.md#usage-guidance), and [Accessibility](./DESIGN.md#accessibility).

## Current scenarios

1. **Standalone library presentation.** A caller renders an indeterminate Loading indicator for a real process expected to last 200 ms through 5 s, supplies a purpose-specific accessible label, optionally selects an overall size from 24 through 240, and may contextually override the active-indicator color while preserving 3:1 contrast.
2. **Button composition.** `MDButton` renders a 24 px Loading indicator in its leading-icon position while its short indeterminate operation is active. The indicator remains the progress-bearing visual and is not decorative use; its redundant child accessibility node is hidden because the Button retains the accessible action name and owns `aria-busy`. Button loading remains presentation-only, and consumers own `disabled` and re-entry guards.
3. **Legacy-surface isolation.** A standalone Loading indicator inside a legacy Material surface retains its Material-primary default instead of inheriting unrelated descendant content color.

There are no direct product consumers of `MDLoadingIndicator`. Existing settings-test elements named `loading-indicator` are unrelated plain-HTML test stubs.

Failure paths remain outside this presentation family: product owners choose progress indicator for work over 5 s, avoid an indicator below 200 ms, retain errors and cancellation, and do not use Loading indicator for an operation that becomes determinate.

## Selected and deferred Material surface

| Material contract                                              | DESIGN.md evidence                                                                                                                                             | Demand and scenario                                                                               | Public Vue/token representation                           | Renderer status and mapping                                                               | Owner and decision                                      | Proof                                                                                    |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Default uncontained indeterminate indicator                    | [Variants and configurations](./DESIGN.md#variants-and-configurations)                                                                                         | Standalone and Button short-operation scenarios                                                   | One `MDLoadingIndicator` component; no public variant     | `direct`: renderer default `variant="uncontained"`; do not bind or expose it              | family; `implement-now`                                 | component contract and Storybook behavior                                                |
| Required active indicator and seven-shape loop                 | [Anatomy and content](./DESIGN.md#anatomy-and-content), [States and behavior](./DESIGN.md#states-and-behavior)                                                 | Communicate real ongoing activity in both scenarios                                               | no public motion or shape API                             | `direct`: renderer owns private shape anatomy and animation lifecycle                     | m3e; `implement-now`                                    | browser lifecycle presence and visual proof; reported defects remain an external channel |
| Named progressbar semantics                                    | [Accessibility](./DESIGN.md#accessibility)                                                                                                                     | Standalone users must understand what is loading                                                  | required `label` prop mapped to `aria-label`              | `direct`: renderer supplies progressbar role; wrapper supplies name                       | family plus m3e; `implement-now`                        | real-browser accessibility tree                                                          |
| 48 overall, 38 active, proportional 24-240 range               | [Geometry and layout](./DESIGN.md#geometry-and-layout)                                                                                                         | Standalone default/custom sizing and 24 px Button composition                                     | optional numeric `size`, default 48, normalized to 24-240 | `divergent`: explicit host geometry plus effective private active-size input at `38 / 48` | family; `temporary-renderer-workaround` M3E-001/M3E-002 | component geometry contract, browser bounding box, visuals                               |
| Uncontained active-indicator color                             | [Complete official token catalogue](./DESIGN.md#complete-official-token-catalogue)                                                                             | Primary standalone color, contextual Button `currentColor`, legacy isolation                      | `--md-comp-loading-indicator-active-indicator-color`      | `direct`: private renderer active-color input with family primary fallback                | family; `implement-now`                                 | token agreement, browser computed color, visuals, Button handoff                         |
| Contained configuration                                        | [Variants and configurations](./DESIGN.md#variants-and-configurations)                                                                                         | No current overlay or pull-to-refresh consumer                                                    | none                                                      | renderer capability exists but does not select public surface                             | family; `defer`                                         | absence from API and renderer binding                                                    |
| Contained/general container colors and circular shape          | [Complete official token catalogue](./DESIGN.md#complete-official-token-catalogue), [Source conflicts and unknowns](./DESIGN.md#source-conflicts-and-unknowns) | Only contained rendering would consume them; general container-color role is officially ambiguous | none                                                      | `not-applicable` to selected uncontained surface                                          | family; `defer`                                         | token catalogue excludes them from runtime public subset                                 |
| Pull-to-refresh behavior                                       | [States and behavior](./DESIGN.md#states-and-behavior)                                                                                                         | No current owner or scenario; documented for Jetpack Compose only                                 | none                                                      | `not-applicable`                                                                          | product/gesture owner; `defer`                          | consumer inventory                                                                       |
| Progress indicator and indeterminate-to-determinate transition | [Identity and purpose](./DESIGN.md#identity-and-purpose), [Related official contracts](./DESIGN.md#related-official-contracts)                                 | Different duration/transition contract                                                            | none                                                      | `not-applicable`                                                                          | progressIndicator family; `defer`                       | API and consumer inventory                                                               |

## Dependency closure

Dependency families: `none`.

- Material foundation supplies `--md-sys-color-primary`, but foundation is not an official component-family dependency.
- `@m3e/web/loading-indicator` is the exact installed private renderer, not a Material family dependency.
- Button is a parent composition consumer and is already the active-path ancestor (`button -> loadingIndicator`); it is not and must not become a dependency of Loading indicator.
- Progress indicator, Material shape library, tabs, and pull-to-refresh are related or composing contracts, not direct dependencies of the selected surface.

The dependency queue and dependency review revisions are both `none`. No dependency cycle exists.

## Ownership

- `loadingIndicator` owns the canonical Vue API, standalone semantic mapping, overall geometry, selected public token, private renderer mapping, exact-version workarounds, host-attribute boundary, exports, and standalone proof.
- `MDButton` owns whether and where the indicator is composed, redundant child-semantic suppression, Button `aria-busy`, leading-icon replacement/restoration, the `currentColor` contextual handoff, and Button interaction behavior.
- Product features own operation applicability and duration, pending state, disabled and re-entry guards, status copy, errors, cancellation, and completion.
- m3e owns the custom element's progressbar role, private DOM/anatomy, seven-shape morph and rotation sequence, reconnect lifecycle, and private animation implementation.
- Material foundation owns the primary system color used by the standalone fallback.

No wrapper, parent, or consumer may recreate renderer motion, inspect its shadow DOM, or acquire dependency-owned geometry or semantics.

## Public Vue API

Canonical export:

```ts
import { MDLoadingIndicator } from '@shared/ui/material';
```

| Prop    | Type     | Required/default       | Contract                                                                                                                                                                                           |
| ------- | -------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label` | `string` | required               | Accessible purpose of the ongoing process. It is the sole `aria-label` source. A composing parent still supplies it even when that parent explicitly hides the redundant child accessibility node. |
| `size`  | `number` | optional; default `48` | Overall square size in Material dp mapped 1:1 to CSS px. Finite values clamp to 24-240; non-finite values normalize to 48; development builds warn when normalization occurs.                      |

- Slots: none.
- Emits: none.
- Exposed refs or methods: none.
- No `variant`, `contained`, `value`, `loading`, `active`, `disabled`, motion, or operation-state prop.
- The single renderer host uses `inheritAttrs: false`. Explicitly allow only `class`, `style`, `id`, `title`, `data-*`, `aria-hidden`, and `aria-describedby`.
- `class` merges with `md-loading-indicator`. `style` merges with adapter geometry, with adapter `width`, `height`, and private effective-size keys winning conflicts while differently keyed public tokens pass through.
- Every other undeclared attribute and listener is dropped. In particular, raw `variant`, `contained`, `role`, value ARIA, `tabindex`, consumer `aria-label`, unknown attributes, and arbitrary listeners cannot reach or modify the renderer.

`aria-hidden` is selected only for the confirmed Button composition handoff. `aria-describedby` permits a consumer-owned description without replacing the label-owned accessible name. Neither creates a generic ARIA fallthrough policy.

## Public token contract

Selected token trace:

| State                          | Rendered part    | DESIGN.md official token path                      | Public Mioframe token                                | Renderer input and fallback                                                                             | Expected consumer result                                                                      | Proof owner                                                    |
| ------------------------------ | ---------------- | -------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Standalone uncontained active  | active indicator | `md.comp.loading-indicator.active-indicator.color` | `--md-comp-loading-indicator-active-indicator-color` | private `--m3e-loading-indicator-active-indicator-color`; family fallback `var(--md-sys-color-primary)` | active shape resolves to Material primary, isolated from legacy descendant content color      | family token tests, browser computed color, visual baseline    |
| Contextual standalone override | active indicator | `md.comp.loading-indicator.active-indicator.color` | same                                                 | same private input; caller-supplied public token precedes family fallback                               | active shape resolves to caller's valid color while caller owns 3:1 contrast                  | browser computed color and visual baseline                     |
| Button-composed active         | active indicator | `md.comp.loading-indicator.active-indicator.color` | same                                                 | same private input; Button sets the public token to `currentColor`                                      | progress-bearing visual matches Button label/icon color while Button owns contextual contrast | Button component/browser composition proof and visual baseline |

No public size token is selected. Current demand is instance-specific, while installed renderer size inputs are divergent. Contained colors, the ambiguous general container color, container shape, and container geometry remain deferred with contained rendering.

## Renderer mapping and gaps

Installed renderer evidence is `@m3e/web@2.6.3`, package entry point `@m3e/web/loading-indicator`, exporting `M3eLoadingIndicatorElement` and `LoadingIndicatorVariant`. The wrapper derives private Vue element typing from the exported element class. Public types remain renderer-independent.

| Selected contract             | Coverage         | Mapping, gap owner, and removal trigger                                                                                                                                                                                                                                                                                                         |
| ----------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Uncontained rendering         | `direct`         | Renderer defaults to `uncontained`; wrapper does not bind or expose `variant`.                                                                                                                                                                                                                                                                  |
| Seven-shape looping motion    | `direct`         | m3e owns private animation, shapes, timing, and reconnect lifecycle. Material does not publish exact motion parameters, so Mioframe does not copy or normalize them.                                                                                                                                                                            |
| Progressbar role              | `direct`         | Renderer role mixin owns the role; real-browser accessibility proof verifies the observable role.                                                                                                                                                                                                                                               |
| Accessible purpose            | `direct`         | Wrapper maps required `label` to host `aria-label`; consumer `aria-label` cannot override it.                                                                                                                                                                                                                                                   |
| Active-indicator color        | `direct`         | Family token maps privately to `--m3e-loading-indicator-active-indicator-color`, with public Material primary fallback.                                                                                                                                                                                                                         |
| Overall size and 24-240 range | `divergent`      | M3E-002: wrapper normalizes public `size` and sets explicit host width/height. Remove when an installed renderer supplies independent correct overall geometry.                                                                                                                                                                                 |
| Active size at 38/48 ratio    | `divergent`      | M3E-001/M3E-002: wrapper computes normalized overall size times `38 / 48` and writes the confirmed effective private `--m3e-loading-indicator-size`; documented `--m3e-loading-indicator-active-indicator-size` is ineffective in 2.6.3. Remove or remap when a consumed renderer's documented input works and overall geometry is independent. |
| Contained rendering           | `not-applicable` | Deferred despite renderer support; renderer capability alone does not select public API.                                                                                                                                                                                                                                                        |

M3E-001 and M3E-002 are family-local, host-level, exact-version-gated, removable workarounds. They do not inspect private DOM or recreate animation. Every renderer update must revalidate or remove both records before implementation proceeds.

## State precedence and restoration

- `size`: non-finite input normalizes to 48; otherwise clamp to `[24, 240]`; a later valid update restores its exact normalized value.
- Overall host width and height always derive from normalized `size`. Active size always derives from normalized size at `38 / 48`; consumer styles cannot override these three owned geometry keys.
- A consumer's public active-color token overrides the family fallback. Removing it restores `--md-sys-color-primary` for standalone use.
- The required `label` always owns `aria-label`. An undeclared consumer `aria-label` never takes precedence.
- `aria-hidden="true"` from the Button composition suppresses the redundant child node; removing it restores the named standalone progressbar. The parent is then responsible for the busy/action semantics while hidden.
- Mount, prop updates, disconnect, and reconnect create no wrapper-owned animation state. The renderer owns animation lifecycle and restoration.
- There is no component disabled, determinate, error, success, hover, pressed, focused, or selected state to combine or prioritize.

## Implementation passes

1. Audit the Vue adapter, package-derived renderer declaration, selected custom-element registration, family/root exports, and single public token against this architecture; change only mismatches.
2. Preserve or correct the explicit host-attribute boundary: `inheritAttrs: false`, render-time projection of exactly the selected allow-list, merged class/style, adapter-owned geometry precedence, and complete rejection of undeclared attributes/listeners.
3. Revalidate M3E-001 and M3E-002 against the installed 2.6.3 public types and artifact. Retain only the exact accepted mappings and current defect references.
4. Audit component contract, Storybook browser behavior, accessibility, token, visual, renderer-boundary, and impact metadata proof against `TEST IMPACT`; add or correct only missing proof.
5. Audit Button read-only as the parent composition consumer: required label, size 24, `aria-hidden="true"`, and public-token `currentColor` must cross only the public family boundary. Do not redesign Button or migrate product consumers.
6. Write a current-schema `IMPLEMENTATION.md` with exact architecture revision, proof results, deviations, and migration readiness. No coding decision is delegated to implementation.

Expected implementation-stage scope is limited to family runtime/proof files, `m3eLoadingIndicator.d.ts`, selected Material exports/custom-element configuration if mismatched, token/defect documentation, impact mappings, and `IMPLEMENTATION.md`.

## TEST IMPACT

- **Public label and size normalization/mapping.** Primary owner: `MDLoadingIndicator.test.ts`. Additional proof: real Chromium accessibility tree and host bounding boxes in `MDLoadingIndicator.browser.spec.ts`. Cover default, valid update, lower/upper clamp, non-finite normalization, and 38/48 mapping.
- **Host-attribute boundary.** Primary owner: `MDLoadingIndicator.test.ts`. Prove the exact allow-list, render-time addition/removal/restoration, class/style union, internal geometry precedence, public-token pass-through, label precedence, and rejection of raw renderer/native/value/listener inputs. Additional lowest-faithful browser proof must show rejected dynamic inputs cannot alter observable custom-element state without private DOM inspection.
- **Standalone color and legacy isolation.** Primary owner: Storybook browser computed-style proof of the actual rendered owner plus bounded visual screenshots. Token declaration/catalogue tests additionally own source agreement. Cover default primary and one contextual override; inspect expected, actual, and diff before any baseline update.
- **Button composition handoff.** Primary owner: Button component and Storybook behavior proof. Confirm the child accessibility node is absent while Button remains named and busy, geometry is 24 px, `currentColor` reaches the active visual through the public token, and Button activation/disabled ownership is unchanged. Button visuals own composed pixels.
- **Renderer boundary and exact-version defects.** Primary owner: package-derived type-check, renderer-boundary checks, defect record inspection, and component mapping assertions. Revalidate against exactly `@m3e/web@2.6.3`; no new raw renderer consumer or private token may appear outside Material ownership.
- **Motion lifecycle.** Browser proof may establish continuing presence/reconnect behavior; visual snapshots establish stable reference pixels. Subjective motion quality is not automatable. A concrete reported visual/motion defect routes to the owning stage; positive operator acknowledgement is not required by the current workflow.

Implementation uses focused verifier-managed unit, type-check, Storybook behavior, and visual lanes for changed files. Migration owns focused verifier-managed consumer, product-scenario or explicit no-consumer, legacy-removal, and impact-metadata proof. After a current independent review, the outer `material-component` orchestrator exclusively owns the single final workflow verification gate selected by the verification workflow.

Persistent impact mappings must include family production, tests, stories, tokens, Button composition proof, and the relevant Storybook/visual specs. One primary proof owner remains explicit for each contract.

## Migration plan

1. Inventory all direct and indirect `MDLoadingIndicator` imports/usages, raw renderer tags/imports/types/tokens, public token consumers, and similarly named non-Material stubs.
2. Audit every current consumer against the exact host allow-list. Do not preserve unsupported renderer access with aliases or compatibility forwarding.
3. Confirm `MDButton` consumes only the public family component, props, `aria-hidden` handoff, and public color token. Record that the child visual represents real ongoing activity even though its redundant semantic node is hidden.
4. Confirm no product consumer uses Loading indicator for provider/browser-controlled waits and that those flows retain feature-owned pending text, disabled guards, live status, errors, and re-entry protection.
5. Confirm no raw `m3e-loading-indicator`, renderer type, or private renderer token exists outside `src/shared/ui/material`.
6. Remove only obsolete Loading-indicator-specific legacy ownership if found; leave unrelated generic loading UI and test stubs unchanged.
7. Write a current-schema `MIGRATION.md` with focused stage verification only. Do not run or claim final workflow verification; after a fresh current independent review, the outer `material-component` orchestrator selects and runs that single final gate.

Migration requires no planned product edit: current evidence shows Button is the sole parent composition consumer and no product layer directly renders this family.

## Acceptance criteria

- The root-exported `MDLoadingIndicator` exposes exactly required `label` and optional bounded `size`; it has no slots, emits, methods, variant, value, disabled, or operation-state API.
- The single raw renderer root has `inheritAttrs: false`; exactly `class`, `style`, `id`, `title`, `data-*`, `aria-hidden`, and `aria-describedby` forward, and no unrestricted `$attrs` spread exists.
- Consumer class/style values merge without replacing the family class or its owned geometry. Internal width, height, and effective active-size keys win conflicts; public active-color overrides pass through.
- Undeclared renderer/native inputs and arbitrary listeners cannot alter renderer state or replace the label-owned accessible name.
- Standalone browser semantics resolve to a named progressbar. Button may hide only the redundant child node while retaining named Button busy semantics for a real operation.
- Geometry is 48 by default, clamps to 24-240, and preserves the official 38/48 active/overall relationship without public renderer vocabulary.
- Standalone active color resolves to Material primary, public override works, legacy descendant color does not capture it, and Button composition resolves to `currentColor` with parent-owned 3:1 contrast.
- m3e retains private anatomy and motion ownership. M3E-001/M3E-002 remain exact, local, removable, and revalidated for 2.6.3.
- Button interaction, icon restoration, disabled/re-entry ownership, and native behavior remain unchanged.
- No current scenario or failure path is lost, no renderer detail leaks, proof and impact metadata agree, current independent review is possible, and final verification passes.
- No concrete reported visual/motion defect remains unresolved. Absence of a reported defect is sufficient; automation is not represented as subjective motion proof.

## Risks

- The renderer documents a size input it does not consume and couples uncontained host size to active size; any renderer upgrade may invalidate either workaround.
- Material defines a seven-shape loop but not exact Web timing or easing; m3e's private motion may drift from an unpublished reference that automation cannot adjudicate.
- A composing parent's `currentColor` can fail the official 3:1 contrast requirement; each parent owns its contextual proof.
- Hiding the child semantics without preserving an accessible parent busy/action contract would erase progress meaning; only the confirmed Button handoff is selected.
- Applying this family to long, sub-200-ms, externally suspended, or eventually determinate activity would communicate the wrong official contract; product owners must select the correct status primitive.
- Tightening the host boundary could break an undiscovered consumer that relied on leaked renderer inputs; migration must audit all consumers and rejection proof before completion.

## Forbidden

- Expose m3e variants, element types, tags, attributes, events, CSS variables, or private animation state.
- Use unrestricted `$attrs` fallthrough, a generic adapter framework, or a broader allow-list without confirmed demand and a new architecture revision.
- Let consumer class/style replace family ownership or override the protected geometry keys.
- Inspect/style renderer shadow DOM, recreate shapes/motion, add timers, or bind unpublished motion controls.
- Add contained, pull-to-refresh, determinate, disabled, or operation-state API without a new architecture revision.
- Use Loading indicator decoratively, for activity outside the official duration/transition guidance, or as a substitute for feature-owned pending/error state.
- Treat Button `loading` as activation blocking or move consumer disabled/re-entry guards into this family.
- Add descendant color cascades, `!important`, public private-token aliases, compatibility fallthrough, or unrelated family migration.
- Make Loading indicator depend on Button, which is the active-path parent consumer.
- Treat source inspection, host attributes, snapshots, or green automation alone as proof of rendered anatomy, accessibility, or subjective motion quality.

## Implementation readiness

Ready. The current design contract is complete, the selected uncontained demand is minimum and explicit, dependency closure is empty, the public Vue/token contract and host boundary are exact, every installed-renderer divergence has one owner and removal trigger, state precedence/restoration is deterministic, implementation passes and `TEST IMPACT` leave no coding choice unresolved, and migration scope is fully inventoried. No dependency or architecture blocker remains.
