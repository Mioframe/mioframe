# Material 3 component authoring checklist

Use for every new, migrated, or materially changed public Material component. The canonical family blueprint remains in `component-architecture.md`; this checklist does not add contract fields.

## 1. Authoring and source

- [ ] Recorded `standard-authoring`, `handoff-authoring`, `blocked`, or valid strict-local `Architecture impact: none`.
- [ ] Used `material3` MCP first and cache fallback only when needed.
- [ ] Recorded exact documentation pages and snapshot.
- [ ] Used official Material Design Kit evidence when published docs could not resolve exact visual geometry/state composition.
- [ ] Recorded Design Kit file/version and component-set reference when used.
- [ ] Used `partial`/`blocked` instead of inferring missing visual evidence from an existing baseline.
- [ ] Kept discovery bounded to required scenarios and applicable foundation domains.

## 2. Scope and usage

- [ ] Started from named scenarios and affected consumers.
- [ ] Used canonical Material default usage only when no scenario was supplied.
- [ ] Added optional variants, sizes, shapes, modes, anatomy, or behavior only for current requirements.
- [ ] Included every reachable API, state, accessibility, usage, foundation, and verification contract of the supported surface.
- [ ] Recorded unsupported official capabilities instead of implementing them speculatively.
- [ ] Added no Mioframe extension without an explicit requirement, owner, and deviation record.
- [ ] Product layers retain information architecture, component choice, placement, workflow, and adaptive composition.

## 3. Family and library ownership

- [ ] New official components are under `src/shared/ui/material/components/<family>`.
- [ ] Family ownership basis uses an official relationship and a real current shared contract.
- [ ] Legacy proximity, similar names, repeated CSS, file count, or hypothetical reuse were not used as family evidence.
- [ ] Current path, canonical path, migration status, public export, and complete consumer scope are recorded.
- [ ] Internal library code avoids the root barrel.
- [ ] Product consumers avoid implementation/testing deep imports.
- [ ] Families do not deep-import another family's private files.
- [ ] Project-specific wrappers remain outside official component families.
- [ ] No empty namespace or placeholder production files were added.
- [ ] No new Material ownership was added to a legacy path.

## 4. Canonical blueprint

- [ ] Created/updated the complete family README blueprint before production code.
- [ ] Filled every canonical section from `component-architecture.md` or explicitly recorded `none`/`not applicable`.
- [ ] Recorded `Unresolved: none` and `Readiness: ready` only after source, ownership, dependencies, visual routes, files, and review requirements were resolved.
- [ ] No second document or task text adds hidden mandatory blueprint fields.
- [ ] Implementation contains no decision absent from the ready blueprint or approved handoff.

## 5. Foundation dependencies

- [ ] Every applicable domain has a registry-backed dependency row.
- [ ] Registry status is one of `missing | partial | verified | deviated | blocked`.
- [ ] Change mode is one of `none | library-relocation-only | additive | correction | replacement | refresh`.
- [ ] `missing` or `blocked` prevents component readiness.
- [ ] Every `partial`/`deviated` dependency names the exact relevant gap and why the supported surface remains valid.
- [ ] Current production owner, canonical owner, and migration status are explicit.
- [ ] No component-local substitute was added.
- [ ] A legacy additive extension keeps one active owner and does not create a parallel canonical implementation.
- [ ] A new standalone foundation artifact relocates the cohesive owner first or in the same explicit migration.
- [ ] Corrections/replacements include direct consumers and representative verification.

## 6. Architecture profile and files

- [ ] Selected exactly one smallest profile: `simple`, `configured`, `stateful`, or `configured-stateful`.
- [ ] Required `.vue`, `.routes.css`, `.states.css`, and `.css` files match the selected profile.
- [ ] Component/family token files exist only for declared exact official ownership.
- [ ] No empty token, route, or state files exist.
- [ ] Optional family anatomy, behavior, composable, or context files satisfy objective extraction conditions.
- [ ] Required style order is exact.
- [ ] No unapproved production-file category was introduced.

## 7. API, state, and DOM ownership

- [ ] Public props expose only supported configuration, semantic state, required native behavior, consumer anatomy, and explicit extensions.
- [ ] Native elements and DOM-critical attributes are explicit.
- [ ] Invalid combinations are type/runtime constrained, officially normalized, or blocked.
- [ ] Every supported state has one source of truth and change path.
- [ ] Controlled semantic state has no hidden component copy.
- [ ] Browser/foundation interaction facts are not reimplemented as product state.
- [ ] Component-owned transient state is limited to owned gesture, overlay, animation, or native coordination and defines acquire/release/cancel/disabled/failure/unmount behavior.
- [ ] Every interactive/semantic anatomy part records DOM/native, role, focus, accessible-name, ARIA, disabled/readonly, target-area, state-layer/ripple, focus-indicator, consumer-interactivity, and final-property owners as applicable.
- [ ] Parent and child do not implicitly split action, focus, accessibility, interaction surface, or rendering ownership.
- [ ] No `:deep()` styling of child internals.

## 8. Tokens and property routing

- [ ] Every public `--md-comp-*` maps mechanically to an exact official path.
- [ ] Every canonical token has one owner.
- [ ] Token files are independent of active configuration/state and contain no routing, state selectors, private/app tokens, or rendering properties.
- [ ] Routes exist only for configuration selection.
- [ ] State files resolve property-specific semantic/interaction output only.
- [ ] Rendering CSS applies final values to actual DOM owners.
- [ ] Every varying property has a rendered-property row.
- [ ] Grouped rows have identical owner, pipeline, state inputs, winner/coexistence rule, and bridge.
- [ ] Static/configured values use the shortest path without convenience aliases.
- [ ] Family-private variables do not escape and generic foundations read only generic bridges.
- [ ] No available component token is bypassed by a system token.

## 9. Standard testing

- [ ] Added colocated Vue Test Utils component-contract tests.
- [ ] Contract tests cover API, defaults, native owner, ARIA, slots, emits, controlled state, invalid combinations, and non-browser wiring as applicable.
- [ ] Contract tests do not assert appearance, layout, focus-visible, pointer, ripple, or overlay lifecycle.
- [ ] Added exactly one canonical Storybook export named `StateMatrix`.
- [ ] Matrix root and checkerboard contract are correct.
- [ ] Visible row/column/section labels identify every case.
- [ ] Matrix covers every distinct supported component-owned visible route and simultaneous visual result.
- [ ] Non-visual states remain in contract/browser tests rather than duplicate cells.
- [ ] Equivalent sizes, labels, icons, content, and configurations are not multiplied.
- [ ] Coverage table maps every distinct visible route/group to a visible matrix location.
- [ ] Transient appearance uses accepted foundation adapters or minimal real browser setup.
- [ ] Added bounded Playwright visual regression; no one-snapshot-per-cell design.
- [ ] Added real-input Storybook browser tests for focus, keyboard, pointer/touch, drag, overlay, responsive, lifecycle, or motion behavior as applicable.
- [ ] Added focused pure tests when helpers/composables exist.
- [ ] Added changed-consumer preservation checks.
- [ ] Automated agent reports human visual review as `required`, not `passed`.
- [ ] Accepted human review PR/date and source snapshot are persisted after approval.

## 10. Validation and review

### Static/structured

- [ ] Location, dependency direction, imports, exports, profile files, style order, token syntax, required blueprint sections, registry/map references, story identity, tests, snapshots, and risk registration pass enforceable checks.
- [ ] `verified` foundation records have a concrete snapshot and named verification.
- [ ] No automation claims to prove free-form architecture reasoning or visual correctness.

### Review blocking

- [ ] Family and foundation ownership are justified.
- [ ] Supported surface is minimum complete for required scenarios.
- [ ] Official source interpretation and deviations are correct.
- [ ] State/property routes and grouping equivalence are correct.
- [ ] Matrix distinct-route completeness and readability are confirmed.
- [ ] Initial/changed visual baseline is compared with official docs and Design Kit when required.
- [ ] Verification is proportionate and does not duplicate framework/browser/foundation ownership.

## 11. Simplicity and migration

- [ ] Reused native semantics, accepted foundation contracts, generic infrastructure, and existing test infrastructure.
- [ ] Added no universal base, runtime registry, generic resolver, CSS DSL, cross-family state machine, duplicate theme/overlay system, production matrix component, generic test DSL, package, or publication infrastructure without a current requirement.
- [ ] Added no compatibility alias without exact consumers and removal target.
- [ ] Updated all consumers, exports, stories, tests, snapshots, risk registrations, registries, and migration map atomically.
- [ ] Removed obsolete paths and parallel logic.

## 12. Completion

- [ ] Blueprint, library map, registries, owner contracts, code, exports, Storybook, tests, snapshots, risk registration, and consumers agree.
- [ ] Unsupported capabilities and deviations are explicit.
- [ ] No unresolved source, ownership, dependency, visual-route, or verification decision is hidden as a workaround.
- [ ] Required human review is passed or remains an explicit merge blocker.
- [ ] Final repository verification follows `AGENTS.md`.

Do not mark a component aligned, migrated, verified, or architecture-complete while an applicable blocking item remains unresolved.
