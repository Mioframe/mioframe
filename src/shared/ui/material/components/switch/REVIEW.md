# Switch review

Artifact revision: 2026-08-11T06:04:00.000Z
DESIGN.md contract revision: 2026-08-10T19:28:25.068Z
ARCHITECTURE.md revision: 2026-08-11T02:00:00.000Z
IMPLEMENTATION.md revision: 2026-08-11T05:00:00.000Z
MIGRATION.md revision: 2026-08-11T05:15:00.000Z
Verdict: blocked
Required return family: self
Required return stage: architecture
Completion status: blocked
Final workflow verification readiness: blocked
Operator visual status: no-reported-defect
Blockers: controlled-state contract permits renderer drift; browser-proof ownership is stale against current develop
Major issues: global ElementInternals Vitest shim is broader than the Switch owner; presentation proof does not yet prove owner-action pass-through
Minor issues: none
Accepted risks: none

## Goal and scenarios reviewed

Reviewed the complete Switch family and migrated consumers against current repository rules and the latest `develop` testing architecture.

The selected product direction remains correct: a thin Mioframe `MDSwitch` Vue adapter over private `m3e-switch`, plus the bounded `presentation` extension used by `SettingsSwitchListItem` and `AppUpdateSettings` where the containing `MDListItem` owns the actual `role="switch"`, accessible name, `aria-checked`, and action.

The legacy custom Switch owner has been removed and the product consumers use the canonical Material boundary. The findings below require an architecture correction and a fresh downstream implementation/migration/review pass before merge.

## Official design compliance

`DESIGN.md` remains current for the selected Material Switch surface. No design-stage correction is required.

The findings are not changes to Material requirements. They concern controlled-state ownership, repository browser-proof ownership, and test-environment scope.

## Architecture compliance

### Blocker: the current controlled-state mapping is not actually controlled

The current architecture says `selected` is the sole source of truth but maps user interaction by waiting for renderer `change`, reading the already-mutated `checked` value, and emitting `update:selected`.

That allows hidden renderer drift. Example:

1. public `selected` is `false`;
2. user activates `m3e-switch`;
3. renderer changes its internal `checked` to `true`;
4. wrapper emits `update:selected(true)` from `change`;
5. consumer rejects the intent and leaves public `selected=false`;
6. because the Vue prop did not change, there is no guaranteed write that restores renderer `checked=false`.

The installed `@m3e/web@2.6.3` renderer exposes the correct intent boundary. Its Switch click handler dispatches a bubbling, cancelable `beforeinput` **before** changing `checked`; it mutates `checked` and emits `input`/`change` only when that event is not cancelled.

Required architecture correction:

- keep `selected` bound to renderer `checked` as a typed Boolean property;
- listen to renderer `beforeinput` as user-toggle intent;
- for the normal interactive adapter path, call `preventDefault()` on that renderer event;
- emit `update:selected(!currentRendererChecked)`;
- do not derive the public state event from renderer `change`;
- do not add wrapper-owned selection state;
- after intent, renderer `checked` changes only when the consumer changes public `selected`.

This is the minimum complete solution and uses a public renderer event specifically designed to precede the mutation. A post-change restoration watcher or duplicated internal state would be more complex and less reliable.

### Blocker: browser-proof ownership is stale against current `develop`

The branch was created before Storybook S2 completed. Current `develop` now uses owner-local `src/**/*.browser.spec.ts` for ordinary component/family-owned Storybook behavior and forbids duplicate central registry metadata where local ownership expresses the relation.

Switch behavior is an ordinary Material-family-owned contract. The final owner must therefore be:

```text
src/shared/ui/material/components/switch/MDSwitch.browser.spec.ts
```

The branch-added `tests/e2e/storybook/md-switch-family.spec.ts` and the `switch family behavior` entry in `scripts/lib/storybookBehaviorRisk.mjs` must be removed after synchronization with current `develop`.

The shared cross-owner central specs already present on `develop` remain untouched.

## Implementation compliance

The wrapper is otherwise appropriately small: it uses one `m3e-switch` host, does not recreate renderer DOM/state layer/ripple/motion, keeps renderer-specific surface private, and implements an explicit host-attribute allow-list.

Implementation must change the interaction mapping from `change` to cancelable `beforeinput` intent as specified above. Private custom-element typing must expose only the event/property surface required by that mapping.

### Major issue: global Vitest capability shim

The branch adds `HTMLElement.prototype.attachInternals` in shared `src/setupVitest.ts` solely so the m3e Switch can be instantiated in happy-dom. This changes browser-capability detection for every Vitest test in the repository.

Unless another current owner demonstrably requires the same seam, the compatibility shim must be Switch-local (for example setup/restore in `MDSwitch.test.ts` or a narrowly owned Material test helper). It must remain minimal and must not pretend to prove real form association, validity, or accessibility behavior.

## Migration and legacy removal

The consumer migration direction is correct:

- `SettingsSwitchListItem` uses canonical `MDSwitch presentation`;
- `AppUpdateSettings` uses canonical `MDSwitch presentation`;
- legacy `src/shared/ui/Switch` is removed;
- no compatibility alias is retained.

### Major issue: incomplete proof of the confirmed presentation scenario

Current browser proof verifies that `presentation` is hidden from the accessibility tree, skipped by Tab, and does not toggle the renderer when clicked.

The confirmed product contract additionally requires that pointer input on the visible decorative Switch region remains part of the owning row action. Add proof that clicking that visual region reaches the composition owner action and that the resulting consumer-owned state is then reflected back through `selected` into renderer `checked`.

This can be proved with a truthful Switch-owned composition fixture: the parent owns the action and state, while the `presentation` Switch only reflects state. Do not duplicate product business logic in Storybook.

## Proof and stage verification

The previous focused checks are useful evidence for the initial implementation but do not close this revision because the architecture mapping and executable Storybook ownership have changed.

Required risk-specific proof after correction:

- unit: `beforeinput` is cancelled and emits exactly the intended next `selected` value;
- unit/browser: rejected intent leaves renderer `checked` equal to the unchanged public prop;
- browser: click, Space, and Enter continue to produce one public intent through the corrected controlled path;
- browser: disabled and `presentation` paths do not emit intent;
- browser: `presentation` visual click reaches the owning composition action;
- browser: host-attribute boundary remains intact, including rejection of consumer `beforeinput`/`change` listeners;
- existing visual proof remains stable;
- consumer tests continue to prove row-level action ownership.

The branch must also be synchronized with current `develop` before the final verification, because current `develop` completed Storybook S2 after this branch diverged.

## Blockers

1. Correct controlled-state architecture to use cancelable renderer `beforeinput` intent and keep `selected` as the sole source of truth.
2. Synchronize with current `develop` and move Switch browser proof to owner-local `MDSwitch.browser.spec.ts`, removing the obsolete central mapping.

## Major issues

1. Localize the Switch-only `ElementInternals` Vitest compatibility shim instead of altering the shared test capability surface.
2. Add proof that `presentation` pointer input reaches the owning composition action and state flows back into the renderer.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Do not change shared Playwright container infrastructure in this PR based only on the earlier agent-session wrong-worktree observation. Re-evaluate after running from the correct synchronized checkout; investigate separately only if independently reproducible from the correct cwd.
- Do not reintroduce drag-to-toggle, icons, form participation, component-specific token surface, or legacy compatibility APIs.
- Do not create a generic m3e adapter/state framework.

## Routing evidence

Route: `self/architecture`.

Reason: the primary blocker is an incorrect public controlled-state mapping in the current `ARCHITECTURE.md`. The installed renderer already supplies a smaller and correct public mechanism (`beforeinput` before mutation), so architecture must select that mechanism before implementation changes.

After architecture is corrected, normal revision invalidation requires fresh implementation, migration revalidation, and independent review. Final `pnpm verify` runs only after that chain is current.
