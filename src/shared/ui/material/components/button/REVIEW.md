# Button review

Artifact revision: 2026-08-01T12:50:00.000Z
DESIGN.md contract revision: 2026-08-01T09:54:01.860Z
ARCHITECTURE.md revision: 2026-08-01T11:51:42.309Z
IMPLEMENTATION.md revision: 2026-08-01T12:02:58.888Z
MIGRATION.md revision: 2026-08-01T12:15:27.037Z
Verdict: compliant
Required return family: none
Required return stage: none
Completion status: complete
Final workflow verification readiness: ready
Operator visual status: no-reported-defect
Blockers: none
Major issues: none
Minor issues: none
Accepted risks: none

## Goal and scenarios reviewed

This independent review covers the complete current Button family after Loading Indicator dependency propagation and Navigation Path migration correction.

Reviewed scenarios include filled, outlined, and text action Buttons; extra-small and small round geometry; native button and submit behavior; required labels and optional leading icons; disabled and presentation-only loading precedence; 48 dp targets; keyboard, pointer, focus, form, and component-ref behavior; the strict renderer-host boundary; contextual Snackbar tokens; Navigation Path geometry and horizontal overflow; overlay and menu targets; consumer-owned pending and re-entry guards; Loading Indicator composition; renderer-owned state, motion, and accessibility; and removal of replaced consumer ownership.

Elevated, tonal, medium through extra-large, square, toggle, trailing-icon, link, form-data, Button-group, Icon Button, and FAB surfaces remain intentionally deferred. The simplest viable implementation remains the thin single-host adapter plus public `MDLoadingIndicator` composition.

No concrete operator-reported visual or motion defect exists.

## Official design compliance

`DESIGN.md` contract revision `2026-08-01T09:54:01.860Z` is current, complete, and source-backed. It records Button identity, anatomy, variants, geometry, states, behavior, usage guidance, accessibility, the complete official token catalogue, source conflicts, and related contracts.

The selected action-Button subset and explicit deferrals are supported by the official contract. No missing or incorrect official fact was identified.

## Architecture compliance

This independent review was recorded against `@m3e/web@2.6.3` and the then-current Loading Indicator review. The current `2.7.4` compatibility revalidation is recorded in the family architecture/implementation artifacts and `docs/m3e-defects.md`; it adds the M3E-006 private mapping for the selected small 16dp geometry and does not represent a new independent family review. The dependency queue remains empty.

The architecture resolves the minimum current demand, one-host renderer boundary, public Vue API, exact host-attribute allow-list, state precedence, loading composition, seven contextual text-Button tokens, private mappings, consumer ownership, implementation passes, proof owners, migration inventory, risks, and forbidden approaches without leaving a coding decision open.

Loading remains presentation and accessibility composition only. Loading Indicator owns standalone indicator behavior, Button owns composition, m3e owns transient interaction behavior, and consumers own operation state, disabled and re-entry guards, surrounding layout, errors, and result handling.

Navigation Path correctly uses canonical small Button geometry rather than an unsupported padding API. No compatibility token, private renderer input, descendant override, or new prop is required.

## Implementation compliance

`IMPLEMENTATION.md` revision `2026-08-14T12:28:07.000Z` records the 2.7.4 M3E-006 correction: two documented renderer CSS inputs stay private in the Button family to restore the selected small 16dp geometry. It adds no public Vue API, consumer token, compatibility branch, renderer DOM access, or interaction implementation.

The implementation uses one semantic `m3e-button` host, package-derived renderer typing, explicit Boolean and native-type mappings, required label, optional leading icon, decorative public `MDLoadingIndicator` composition, Button-owned `aria-busy`, and an exact positive host-attribute allow-list.

Exactly seven selected public contextual text-Button tokens are family-owned and mapped privately to renderer inputs. No renderer vocabulary, compatibility alias, unrestricted listener forwarding, private shadow-DOM access, or wrapper-owned interaction system is exposed.

Component and browser proof cover defaults and reactive mappings, native form behavior, click propagation, disabled suppression, loading replacement and restoration, decorative child semantics, target and visible geometry, focus and input behavior, renderer-surface rejection, native host refs, contextual rendered states, and dependency composition.

No component-code, token, export, renderer-boundary, dependency-composition, or component-owned proof defect was found.

## Migration and legacy removal

`MIGRATION.md` revision `2026-08-01T12:15:27.037Z` references the current implementation and records a complete audit of all 22 application, shared-UI, and existing development consumers outside the canonical family.

Consumers use the root `@shared/ui/material` entry point and only selected props, slots, emits, refs, classes, or approved contextual tokens. Product pending, disabled, re-entry, status, result, and failure-path ownership remains outside Button. Overlay and menu consumers retain host-ref positioning. Snackbar retains exactly the seven selected inverse-primary overrides.

Navigation Path's undefined `--md-button-horizontal-padding` declaration is removed without replacement. Navigation Path retains its own flex layout, 4 px gap, non-wrapping labels, and horizontal-scroll container. Focused Storybook proof compares rendered segment geometry with an explicit canonical small Button, proves overflow and scrolling, and activates the final segment.

Repository-wide inspection found no raw renderer Button import or tag outside Material, private Button renderer token, deep family import, duplicate wrapper, provisional contextual token name, compatibility alias, or remaining undefined padding declaration.

## Proof and stage verification

The historical implementation record predates the renderer update. The current compatibility record adds focused component-contract and real-browser small-geometry proof; its verifier-selected 214-reference visual run passed with no baseline update.

Migration records passing focused format, representative consumer and impact-registry unit tests, Navigation Path browser behavior, Snackbar rendered-color behavior, and the 219-reference visual lane without baseline updates.

Loading Indicator review revision `2026-08-01T11:50:04.390Z` supplies compliant standalone semantics, geometry, exact-version workaround, motion, accessibility, and visual ownership without duplicated proof.

The outer `pnpm verify` invocation later encountered an unrelated shared-reorder Storybook timeout. That external workspace failure does not invalidate any Button design, architecture, implementation, migration, proof, or dependency contract and is not stored as a family finding. The outer workflow remains responsible for rerunning the verifier-prescribed command and original final command.

## Blockers

None.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None. Renderer-owned motion and accessibility, exact-version Loading Indicator workarounds, strict host-boundary sensitivity, loading-duration applicability, and contextual contrast ownership are explicit constraints with assigned owners and proof, not unresolved compliance gaps.

## Items not required

- No public padding token or prop, upstream artifact rewrite, compatibility alias, generic adapter, private renderer DOM access, or descendant override is required. M3E-006 uses only documented size-specific renderer inputs privately in the Button family until the consumed baseline supplies the selected direct default.
- No expansion to deferred Button variants, sizes, shapes, toggle behavior, links, form-data surface, Button groups, Icon Buttons, or FABs is required.
- No positive operator visual acknowledgement is required in the absence of a reported defect.
- No unrelated shared-reorder correction belongs to the Button family.
- The result of the outer final workflow command is not a Button review field.

## Routing evidence

The independent review's historical revision chain is exact: design contract `2026-08-01T09:54:01.860Z`, architecture `2026-08-01T11:51:42.309Z` recording Loading Indicator review `2026-08-01T11:50:04.390Z`, implementation `2026-08-01T12:02:58.888Z`, and migration `2026-08-01T12:15:27.037Z`. The later renderer compatibility record is `ARCHITECTURE.md`/`IMPLEMENTATION.md` revision `2026-08-14T12:28:07.000Z` and `M3E-006` in `docs/m3e-defects.md`.

The historical complete-family review found no official-fact, demand, ownership, dependency, API, token, renderer, implementation, proof, consumer, scenario, or legacy-removal defect. The `2.7.4` revalidation subsequently found the narrowly scoped M3E-006 renderer-default divergence, corrected it at the family boundary, and did not reopen the independent review stage.

The unrelated shared-reorder timeout is classified as an external workspace blocker. It changes no family review and creates no Material correction route.
