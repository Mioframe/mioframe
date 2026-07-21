# Button

Canonical owner of the official Material 3 Expressive **Buttons** family (`components/buttons/*`
on `m3.material.io`): elevated, filled, filled tonal, outlined, and text buttons, including the
`toggle` (selection) variant.

Canonical library rules:

- [`../../docs/architecture.md`](../../docs/architecture.md)
- [`../../docs/sources.md`](../../docs/sources.md)
- [`../../docs/component-development.md`](../../docs/component-development.md)
- [`../../docs/tokens.md`](../../docs/tokens.md)

```text
MATERIAL WORKFLOW STATE
Family: Button
Mode: align-existing
Current objective: Continue Button's correction backlog one bounded unit at a time. Unit 1
  (token architecture — ambiguous private-route naming, missing component-token file placement,
  dead spring tokens), Unit 2 (click-propagation `@click.stop` rationale + ancestor-listener
  proof), Unit 3 (dangling `--md-state-outline-color` reference removed from `MDButton.css`),
  Unit 4 (Web label-text wrapping reverted to the official single-line rule), Unit 5 (RTL
  leading-icon-mirroring browser proof), and Unit 6 (loading-state opacity-fade transition-timing
  browser proof) are all complete. Units 2-6 each closed what was, at the time, backlog item 1.
  This pass also corrected `docs/roadmap.md`, found stale after a merge (`a4b6defd`) overwrote its
  already-current `converging` state with an older, pre-Unit-1 `blocked` description from a
  parallel branch — verified directly via `git show`/`git diff` against commit `a81a9759`, not
  inferred.
Current stage: verification
Canonical target status: locked (unchanged by Units 2-4 — no target/token/API surface affected;
  Unit 4 corrected rendered behavior toward the already-locked target, not the target itself)
Assessment status: complete
Contract review status: Unit 1 passed (revision 6, sixth independent isolated review round; see
  "Contract-gate review history" below). Unit 2 passed (revision 2, after revision 1 was rejected
  for inaccurate comment wording — see "Correction units" below). Unit 3 passed (single review
  round). Unit 4 passed (single contract-gate round; correction-final review's one finding —
  README/backlog documentation lagging the already-correct implementation — closed in this
  revision). Unit 5 passed (single correction-final round, additive test/story-only change, no
  contract-gate needed — no ownership, export, or dependency change to canonicalize). Unit 6
  passed (single correction-final round, additive test-only change, no contract-gate needed).
Current correction unit: none in flight — all six completed units are independently final-gate
  reviewed and merged into this working tree.
Implementation status: complete for Units 1-6
Final review status: Unit 1 passed, with required follow-up applied (see "Final-gate review"
  below). Unit 2 passed correction-final review — independent reviewer confirmed citation
  accuracy, DOM-connected test methodology, button-family suite 23/23, unchanged token guard
  output, and zero eslint warnings. Unit 3 passed contract-gate review — independent reviewer
  confirmed `outline-style` is never set for `.md-button` (so the removed `outline-color` had zero
  rendered effect under any state/browser), no test asserted on it, and the full 224-spec visual
  suite passed with zero diffs after removal. Unit 4 passed correction-final review after this
  revision closed the documentation-lag gap it found; the implementation, story/test replacement,
  full-suite zero-diff proof, and consumer-safety claim it also checked were all confirmed sound
  on the first pass. Unit 5 passed correction-final review (independent isolated context) —
  reviewer traced the actual CSS (`flex-direction` never set, no `direction`/`margin-left`/
  `margin-right` override anywhere in `MDButton.css`) and confirmed the new test's two assertions
  are genuinely direction-dependent (would fail against `row-reverse`, a hardcoded `direction`, or
  a manual icon-swap), the story ID matches sibling naming convention, and the diff is purely
  additive with zero rename/removal risk. Unit 6 passed correction-final review (isolated
  context) — reviewer traced the actual CSS (`&__icon`/`&__label-text` both declare
  `transition: opacity var(--md-private-motion-expressive-fast-effects-duration) ...`
  unconditionally, not gated behind `.md-button_loading &`) and the token source
  (`--md-private-motion-expressive-fast-effects-duration: 150ms` in
  `src/shared/lib/md/tokens.css`), confirmed the new test's comma-separated transition-list
  parsing genuinely fails if the opacity duration changed or `transition` were removed, and
  confirmed the diff is a single additive test block with no other change.
Operator visual status: not-required for Units 1-3, 5, and 6 (none changed rendered output;
  Units 5-6 are new browser-lane assertions over already-rendered behavior). Unit 4 intentionally
  changed rendered output (label no longer wraps) — proof is the full 224-spec visual suite
  passing with zero diffs anywhere outside the intentional `md-button.spec.ts` change, i.e. no
  other Button visual state moved; no separate operator screenshot comparison was requested for
  this bounded CSS-property-level revert given that complete automated proof.
Family alignment status: converging
Next gate: none in flight. Backlog item 2 (pre-existing, out-of-scope ambient-styling
  token-taxonomy gap) requires a `material-foundation`-level or repository-wide decision before
  the family can reach `aligned`; the remaining Button-owned backlog item (spring-to-CSS motion
  mapping) requires its own future `material-component Button` pass, likely via a
  `material-foundation` prerequisite for the shared spring-token contract.
Blocker: none for any completed unit. Family completion (`aligned`) remains blocked on: final
  `pnpm verify` failing on the 3 pre-existing, out-of-Button-scope residual errors documented in
  "New evidence found during implementation" (backlog item 2); and the 1 other open backlog item.
  None of these implicate or reopen any completed correction unit.
```

### Final-gate review

An independent `material-component-review` (scope: final-gate), in a context separate from every
contract-gate reviewer above, reconstructed the token graph and motion inventory from the actual
files (not this document's account) and confirmed: `button.tokens.css` and `MDButton.css` exactly
match what revision 6's contract approved (ten renamed private routes, ~200 relocated component
tokens, ten removed dead spring tokens, the one removed test); zero references to any removed or
renamed name remain anywhere in the repository outside this document's own history text; the
three-route motion inventory (shape morph, color/background/border effects, loading opacity fade)
matches exactly with no `transition: all`, no dead motion tokens, no unreachable keyframes; all 22
real consumers are unaffected, confirmed via representative consumer `DialogForm.vue` needing no
change.

On family alignment, the reviewer independently argued for `converging` over this document's
prior `blocked` self-assessment, reasoning from `docs/component-development.md`'s own two-tier
completion rule: full `aligned` status explicitly requires "a passed token architecture guard,"
but a bounded correction may merge while the family remains `converging` "only when the repository
is independently valid and remaining gaps are explicit, non-blocking, and outside the objective" —
a materially weaker condition that would be redundant with the `aligned` rule if it required every
guard to pass. The three residual guard errors are independently confirmed explicit (documented
above, not hidden), non-blocking (the correction unit's own complete proof suite passes; format,
lint, and type-check pass; nothing is newly broken), and outside the objective (a different
component family's public contract, not Button's). The orchestrator accepts this reasoning and
sets `Family alignment status: converging` accordingly — a currently-failing repository-wide
`pnpm verify` does not by itself force `blocked` when the failure is undisputed pre-existing,
out-of-family-scope, and does not implicate the correction unit's own proof; it would force
`blocked` only if newly introduced, Button-owned, or hidden, none of which apply here.

The reviewer flagged two accuracy issues, both corrected in this revision: (1) `docs/roadmap.md`
had not been updated since the contract-gate passed and implementation completed — it still read
as pre-implementation and listed only 6 backlog items, omitting item 7; corrected below. (2) this
document's "roughly 40 other files" figure for the ambient-styling convention (see "New evidence
found during implementation") overstated the reviewer's own independently re-derived count
(~30-32); corrected to "roughly 30" above. The reviewer could not execute `git diff` or
`git show origin/develop:...` in its own isolated session (no Bash access) to directly confirm two
claims in that section; the orchestrator had already independently verified both directly and
recorded the exact commands and results in that section this revision, closing both gaps.

### Contract-gate review history

Revision 1 of this contract was independently reviewed and **failed**. The reviewer, working in
an isolated context that re-verified claims against live official sources and the actual code
rather than trusting this document, found two real problems and this revision (2) corrects both:

1. **Blocking: the correction unit was not actually behavior-preserving as claimed.** Removing
   the ten dead spring stiffness/damping component tokens breaks an existing passing test
   (`tests/e2e/visual/shared-ui/md-button.spec.ts`, "MDButton per-size spring component tokens
   resolve to the fast-spatial system tokens") that reads those exact custom properties directly.
   That test asserts only that the raw computed custom-property values equal the spring constants
   — it does not check any rendered property those tokens drive, because none exists (that is the
   entire reason they classify as dead). It is proof of the dead declaration's own existence, not
   proof of real motion behavior — legacy-defect-preservation proof, not canonical proof.
   Resolution (this revision): the correction unit now explicitly includes removing that test
   alongside the tokens it exists only to prove, with this rationale stated openly rather than
   silently dropping coverage. See Correction units below.
2. **Factual error in the original Source Decision 1.** This document's revision 1 claimed
   `foundations/designing/structure.md` "contains no touch-target language at all" and that the
   prior README's citation to it was wrong. That claim was itself wrong: re-fetching the full page
   (the earlier check was truncated before reaching it) shows a dedicated "Target sizes" section
   with a "Touch and pointer target sizes" subsection: "For most platforms, consider making touch
   targets at least 48 x 48dp." The prior README's citation was correct all along. Resolution
   (this revision): Source Decision 1 and the `__target` concern below are corrected to state
   this plainly; no code or citation change follows.

The reviewer also flagged a real, previously unclassified token-graph gap
(`--md-state-outline-color` at `MDButton.css:69`, referenced but never declared anywhere in the
repository) that the static guard does not catch. This revision records it as a new `unresolved`
concern in the backlog (see below); it is not folded into the current correction unit because it
needs its own investigation into whether the native focus outline it targets has any current
visible effect before a fix can be scoped safely.

Revision 2 was independently re-reviewed by a different isolated context and again **failed**,
this time on documentation-completeness grounds only (no new correctness problem in the
correction unit itself): the "Motion routes" section omitted a real, Button-owned motion route
(the loading-state opacity fade on `__icon`/`__label-text`), and the consumer count was stated as
23 when the actual independently-verified count is 22. Revision 3 added the missing motion route
as its own documented entry and corrected the consumer count, and restated the backlog's priority
categories explicitly instead of asserting a claimed strict order (also flagged as inaccurate).

Revision 3 was independently re-reviewed by a third, different isolated context and **failed**
again — this time on a substantive current-state misclassification that had survived all prior
revisions undetected: the "Disabled container opacity/tint — `color="text"`" concern was
classified `misaligned` based on the unverified assumption that Text, like Outlined, renders no
container fill at rest and therefore should not gain one when disabled. The reviewer fetched the
live official per-state token table and found `md.comp.button.text.disabled.container.color`
(on-surface) and `.disabled.container.opacity` (0.1) are both real, published tokens for Text —
the current implementation was already `confirmed-compliant`, and the backlog item describing it
as a defect was itself the error; implementing that "fix" would have made Button _less_
Material-compliant, not more. Independently re-verified this pass directly against the cached
live token table (`md.comp.button.text.disabled.container.color`/`.opacity` both confirmed
present with exactly those values; `md.comp.button.outlined.disabled.container.opacity` exists
but has no matching `.color` token, confirming the `outlined` exclusion remains correct).
Revision 4 (this one) corrects the concern's classification to `confirmed-compliant`, corrects
the matching "Disabled" bullet under State model in Canonical target, and removes the phantom
backlog item rather than merely reclassifying it.

This is the second factual-error correction across four revisions (the first was the
`foundations/designing/structure.md` citation in revision 1/2). Both were caught by independent
review, not by the isolated target/audit passes that originally produced the claim, and both
involved trusting an inference (page truncation in the first case; a same-style-family analogy in
the second) instead of re-deriving the specific fact directly from complete source data.

Revision 4 was independently re-reviewed by a fourth, different isolated context and **failed**
again, on the exact same failure pattern named in revision 4's own text above: the "State model"
elevation bullet and the matching "Elevation state model per color style" concern claimed
"tonal/outlined/text = level0 throughout," a sibling-style generalization written without
re-deriving tonal's own token set. The live table shows
`md.comp.button.tonal.hovered.container.elevation` is a real published token aliased to
`md.sys.elevation.level1` — tonal's true shape is level0 base/focused/pressed/disabled, level1
hovered, identical to filled, not flat. `MDButton.css:544` and the repository's own existing
Playwright fixture (`md-button.spec.ts:438`, `Tonal: { ..., elevations: ['level1','level0',
'level0'] }`) already implemented this correctly — only this document's target-and-assessment
prose was wrong. No code or test changed. Revision 5 (this one) corrects the elevation bullet and
concern, fixes a stale "backlog item 4" cross-reference that should have read "item 5" after an
earlier renumbering, and — per this revision's own reviewer's explicit recommendation — this pass
also independently re-verified the document's other cross-style blanket claims directly against
the live token table before resubmitting, rather than waiting for a fifth review to find the next
one: disabled label/icon opacity (0.38) and hover/focus/pressed state-layer opacity (0.08/0.10/
0.10) were confirmed to hold exactly across all five current-namespace color styles (filled,
elevated, tonal, outlined, text); the "no `dragged` state" claim was confirmed correctly scoped —
a `dragged.state-layer.opacity` token (0.16) does exist, but only in the deprecated legacy
`md.comp.filled-button.*` namespace, which this contract already explicitly excludes, not in the
current `md.comp.button.<style>.*` namespace this contract targets. No further errors were found
in that sweep.

This is now the third factual-error correction across five revisions, and the second in a row
following the same sibling-style-generalization pattern. Future Button passes — and future
Material families generally — should treat any prose that groups multiple color styles or sizes
under one blanket value ("X for every style," "Y throughout") as requiring direct re-verification
of each named style's own token subset before being written, not after a reviewer catches the
exception.

Revision 5 was independently re-reviewed by a fifth, different isolated context, which
independently re-derived the elevation fix, re-verified every element of the proactive sweep
per-style rather than trusting the sweep was done correctly, and additionally broadened the check
into geometry, typography, padding, and the text+toggle exclusion — all confirmed exact matches
against live official data. It found **no further Material-fact or token error**. It failed the
gate only on two mechanical documentation-consistency defects: a stale "(item 7)" cross-reference
in "Motion routes" (the backlog has 6 items; the correct reference is item 6), and this roadmap's
"Next action" paragraph still listing the removed `color="text"` disabled-container-tint item as
open and omitting two items that are genuinely still open. Revision 6 (this one) fixes both — the
cross-reference and this document's own paragraph above — and makes no other content change,
consistent with that reviewer's explicit assessment that the underlying Material-fact/token
surface is now independently confirmed clean across five rounds and does not need further
re-derivation.

The approved correction unit (rename, relocation, dead-token/test removal) was then implemented.
Running `scripts/materialTokenArchitecture.test.mjs` after implementation confirms all three
originally-approved defect classes are resolved (zero `invalid-md` naming errors for the ten
renamed variables, zero misplaced-declaration errors, zero dead-component-token errors for the
spring tokens), but the guard still reports 3 residual errors — see "New evidence found during
implementation" immediately below. These are pre-existing, were never touched by this correction
unit, and are out of Button's scope; they do not reopen or invalidate the completed unit.

## New evidence found during implementation

Running the static token architecture guard after implementing the approved unit surfaced 3
residual errors, all in `MDButton.css`, none introduced by this correction unit. Independently
confirmed by the orchestrator via direct `git diff` inspection (not by static-content inference):
`git diff -- .../MDButton.css | grep -n "content-color\|symbol-size\|circular-progress-color"`
shows exactly one hit — `--md-symbol-size`'s own _value_ changed (from
`var(--md-button-icon-size, 1lh)` to `var(--md-private-button-icon-size, 1lh)`, tracking the
approved rename of a different variable it references) — and zero hits for `--md-content-color`
or `--md-circular-progress-color`. None of the three custom properties' own declared _names_ were
touched by this correction unit. Separately confirmed via `git show origin/develop:src/shared/ui/
material/components/button/MDButton.css`, which reports the path does not exist on `origin/develop`
at all — this file, and therefore this exact residual, has never been part of mainline; it is
pre-existing, unmerged-branch-only technical debt from before this session's work began. (The
independent final-gate reviewer below re-derived the same conclusion through static-content
consistency, having no Bash access to run these two commands itself in its isolated session; both
gaps it flagged as unverified are closed by the orchestrator's direct verification above.)

```text
MDButton.css:122: '--md-content-color' is not an allowed official, Mioframe, or private namespace
MDButton.css:128: '--md-symbol-size' is not an allowed official, Mioframe, or private namespace
MDButton.css:157: '--md-circular-progress-color' is not an allowed official, Mioframe, or private namespace
```

These are not Button-owned tokens or private routes. `--md-content-color` and `--md-symbol-size`
are the public input contract of `MDSymbol` (`src/shared/ui/Icon/MDSymbol.vue`, which registers
`--md-symbol-size` via `@property` and reads both); `--md-circular-progress-color` is the public
input contract of `MDCircularProgressIndicator` (`src/shared/ui/ProgressIndicators/
MDCircularProgressIndicator.vue`, which declares and reads it directly). `MDButton.css` sets these
three variables on its `__icon`/`__progress-indicator` wrapper elements so that a consumer-slotted
icon or the composed progress indicator inherits Button's resolved color/size automatically — this
is intentional, working cross-component integration, not a Button-local defect. Renaming them
would break that integration, not fix anything.

This is a pre-existing, established, repository-wide generic "ambient content color / icon size"
contract, independently verified this pass (and re-confirmed by the independent final-gate
reviewer, whose own count — 30-32 distinct non-Button files — corrected this section's earlier
"roughly 40" estimate) to be used identically (same three names) in roughly 30 other files across
`src/shared/ui` — `MDCard`, `MDChipBase`, `MDSnackbar`, `MDMenuItemBase`,
`MDCheckbox`, `MDSwitch`, `MDTable`, `MDAppBar`, navigation rail/bar buttons, tooltips, dialogs,
and more — predating `docs/tokens.md`'s `--md-ref-*`/`--md-sys-*`/`--md-comp-*`/`--md-private-*`/
`--mio-*` taxonomy, which has no category for a legitimate generic cross-component styling contract
that isn't owned by one family. The static guard's naming check only runs against files under
`src/shared/ui/material/` (`MATERIAL_PREFIX` in `scripts/materialTokenArchitecture.test.mjs`), so
none of those ~40 other files are checked — `MDButton.css` is independently confirmed (via grep)
to be the _only_ file currently under `src/shared/ui/material/` using this pattern, because Button
is so far the only official family that has been fully relocated into the Material root. This
guard failure is not new; it existed identically before this pass's correction unit and before
this whole workflow began — it was simply never surfaced, because no prior audit or review round
(across the isolated target lock, the isolated current-state audit, or any of the six contract-gate
reviews) actually executed the guard against a version of `MDButton.css` that had gotten past the
three already-known error classes to reveal this fourth, orthogonal one. The current-state auditor
explicitly had no Bash/execution access and traced the guard's logic manually against only the
already-hypothesized defects; none of the six contract-gate reviewers who did have execution access
happened to run it after this specific set of lines was left unchanged, since their attention was
correctly focused on the naming/location/dead-token classes actually in scope.

Classification: `not-applicable` to Button-family ownership (the contract belongs to a shared,
cross-component convention, not to Button), `unresolved` for the repository as a whole (the
taxonomy has no accepted category for it yet). Required correction: none within Button's scope.
Recorded as a new backlog item (see Correction units) requiring a `material-foundation`-level or
repository-wide decision — likely either formally accepting `--md-content-color`/`--md-symbol-size`/
`--md-circular-progress-color` (and any sibling ambient-styling variables) as documented `--mio-sys-*`
extensions, or adding an explicit, documented guard allowance for consuming (not declaring new)
established pre-Material generic contracts. This is the first time an official Material family's
own file has been checked against this guard, so it is also the first time this gap became visible
inside `src/shared/ui/material/` at all — every future family relocation will hit the same three
names (or others like them, e.g. any generic ripple/state-layer bridge) unless this is resolved
first.

## Why this contract replaces the prior one

The previous version of this README (commits on this branch, 2026-07-20) was authored,
implemented, and reviewed inside one non-isolated context and claimed `Family alignment status:
converging` with zero open correction units. `docs/roadmap.md`'s recorded blocker is exactly this
failure mode: a single context confirming its own legacy assumptions and reviewing its own
result. This pass re-ran the canonical workflow from a fresh orchestrator session with the target
and current-state stages executed in separate, isolated, read-only contexts that did not read
each other's conclusions or the prior README, per `docs/component-development.md`.

Two of the prior README's `confirmed-compliant` claims did not survive independent
re-verification:

1. **Token architecture.** Running `scripts/materialTokenArchitecture.test.mjs` directly this
   pass (not inferred — executed) fails with three classes of errors localized entirely to
   `MDButton.css`: ambiguous `--md-button-*` implementation variables that match
   `docs/tokens.md`'s own listed anti-pattern examples almost verbatim; ~200 official
   `--md-comp-button-*` declarations living directly in `MDButton.css` instead of a dedicated
   `button.tokens.css` file; and 10 declared-but-unconsumed
   `--md-comp-button-<size>-pressed-container-corner-size-motion-spring-stiffness/-damping`
   tokens flagged as dead component tokens.
2. **Label-text wrapping.** The prior pass added a "label reflow" behavior (`.md-button` uses
   `min-height` instead of fixed `height`; `__label-text` uses `white-space: normal;
overflow-wrap: anywhere`) and cited "labels should fit within two lines after 200% text
   scaling" as its authority. An independent re-read of the official Buttons Accessibility page
   found that statement is explicitly scoped to Android only ("On Android, button labels should
   be kept concise enough to fit within two lines..."). The Guidelines page's label-text rule for
   all platforms is unqualified and states the opposite: "Don't truncate or wrap label text. It
   should always be fully visible on a single line." This is recorded below as a misalignment,
   not fixed in this pass (see Correction units backlog) — token architecture is corrected first,
   per `docs/tokens.md`'s "Token architecture is corrected before styling or motion built on top
   of the invalid route" and this family's own recorded next-action priority.

Repository code, physical ownership, and consumer migration are treated as current-state
evidence, not reset. The legacy `src/shared/ui/Button/MDButton.*` files are independently
reconfirmed absent this pass (`Glob`); nothing in that removal is undone.

## Canonical target (independently locked, isolated `material-canonical-target` pass)

Scope: common buttons only. Non-goals (separate official families): Icon Button
(`md.comp.icon-button`), Button Groups / segmented buttons, FAB / Extended FAB — legacy under
`src/shared/ui/Button` (`MDIconButton.vue`, `MDSegmentedButtons.vue`, `MDFab.vue`,
`MDExtendedFab.vue`, `FabContainer.vue`), each requiring its own future `material-component` run.
`src/shared/ui/ButtonGrid`, `ButtonGroup`, `ButtonsBar` are generic non-Material layout wrappers,
out of scope.

Applicable platform: Web. The design/token specification on m3.material.io is platform-agnostic
and fully covers Expressive Buttons; the official per-platform availability table lists Web
Expressive as `Unavailable` (only a non-Expressive baseline Web package exists) — there is no
official Web reference implementation to cross-check against, which matters for the motion gap
below.

Supported surface:

- Colors (5): elevated, filled, tonal, outlined, text.
- Sizes (5): extra-small, small (default), medium, large, extra-large.
- Shapes (2): round (default, fully rounded/stadium), square (per-size corner radius).
- Variants: `default` and `toggle` (selection; toggle supported for elevated/filled/tonal/outlined
  only — official Specs page: "There is no toggle text button").
- Optional single leading icon (RTL mirrors to the right; not an independent trailing-icon
  feature). Two icons, trailing-only icon placement, and underlined text-button labels are
  explicit official "Don't"s.
- Small-size padding: 16dp is current/recommended (Expressive update); 24dp is legacy/"no longer
  recommended".
- Pressed-shape morph (all variants) and selected-shape morph (toggle only), per size. Corner
  sizes (dp) — round(rest): full/stadium at every size; square(rest): XS=12, S=12, M=16, L=28,
  XL=28; pressed morph: XS=8, S=8, M=12, L=16, XL=16.
- Official motion model for the shape morph is spring physics (damping 0.6, stiffness 800,
  aliased to `md.sys.motion.spring.fast.spatial.*`), identical across all five sizes — not a
  duration/easing pair. No official CSS `transition-timing-function`/duration equivalent exists in
  the source data, and no official Web Expressive reference implementation exists to validate a
  spring-approximation technique against (unresolved, see Source decisions below).

Unsupported / invalid combinations: `color="text"` + `variant="toggle"` (explicit official
absence — confirmed independently against the token table this pass: 0 of 20 `text` tokens are
`selected`/`unselected`, vs. 24-52 for the other four styles); fixed container width narrower
than the label; truncated or wrapped label text on Web (see "Why this contract replaces the prior
one" above); the deprecated pre-Expressive single-height (40dp), round-only token namespace
(`md.comp.<color>-button.*`, distinct from the current `md.comp.button.<color>.*` — explicitly
labeled `[Deprecated]` in the source token data).

Anatomy (official, exactly 3 named parts): Container, Label text (required, 1-3 words, sentence
case, never truncated/wrapped on Web), Icon (optional, leading only). No formal "state layer"
anatomy part is named, though every color style publishes hover/focus/pressed state-layer tokens.

State model: Enabled/Disabled/Hovered/Focused/Pressed for all default-variant styles; toggle adds
Unselected/Selected crossed with the same states (elevated/filled/tonal/outlined only). No
`dragged` state exists for Buttons (confirmed absent from the official states enumeration and the
token state axis). Elevation: elevated = level1 enabled/focused/pressed, level2 hovered, level0
disabled; filled = level0 base/focused/pressed/disabled, level1 hovered; tonal has the identical
shape to filled — level0 base/focused/pressed/disabled, level1 hovered (independently re-verified
this pass directly against the live per-state token table: `md.comp.button.tonal.hovered.
container.elevation` is a real published token aliased to `md.sys.elevation.level1`; an earlier
revision of this document wrongly grouped tonal with outlined/text as "level0 throughout" — see
"Contract-gate review history"); `outlined` and `text` publish zero `container.elevation` tokens
in any state (not an official "level0" claim — elevation is simply not part of their token set;
functionally flat either way since no shadow is rendered). Disabled container tint: independently
re-verified this pass directly against
the live per-state token table (not just the base-state tokens), correcting an error in an
earlier revision of this document (see "Contract-gate review history") — `elevated`/`filled`/
`tonal` publish a complete `disabled.container.color`+`.opacity` (0.1) pair; `text` also publishes
a complete pair (`disabled.container.color` aliased to `md.sys.color.on-surface`,
`disabled.container.opacity` = 0.1) despite having no container fill at any other state — this is
official, intentional behavior, not an inconsistency; `outlined` publishes only
`disabled.container.opacity` (0.1) with no matching `.color` token in its base (non-toggle) set,
so there is no official color for that opacity to apply to, consistent with `outlined` rendering
no disabled container tint at rest. Label/icon opacity 0.38 for every style. State-layer
opacities: hover 0.08, focus 0.10, pressed 0.10.

Accessibility (cited per exact source page, independently re-verified this pass):

- Color contrast: 3:1 vs. background (container for elevated/filled/tonal; label text for
  outlined/text).
- Keyboard: Tab to reach, Space/Enter to activate — the entire official keyboard table; no other
  bindings.
- Accessible name must match the visible label text.
- No ARIA attribute is named by M3 itself for the toggle state; `aria-pressed` is the correct
  external (WAI-ARIA APG) technique for a two-state toggle button on the web — an inferred
  technical mapping, not an m3.material.io-sourced fact, but the correct decision (resolved
  Source decision, see below).
- Touch/target size: **the standalone Buttons Accessibility page has zero touch-target language**
  (independently re-verified by reading the full page this pass). The only Buttons-family-page
  touch-target sentence is on the Specs page's "Target areas" section, and it is
  verbatim-identical to the Icon Buttons page's target-size text, literally naming "icon
  buttons" — not common/labeled buttons. This reads as template reuse targeting a different,
  out-of-scope family, not a deliberate common-Buttons rule (unresolved Source decision, see
  below). Two general, platform-wide foundation pages independently carry the same ~48dp
  guidance and both are valid citations: `foundations/designing/structure.md`, "Target sizes ->
  Touch and pointer target sizes" ("For most platforms, consider making touch targets at least
  48 x 48dp") — this is the page the prior README already cited, and re-fetching it in full this
  pass confirms that citation was correct — and `foundations/layout/grids-spacing/density.md`
  ("The default target size should be at least 48x48 CSS pixels"). Both are general
  cross-component guidance, neither is Buttons-specific.

### Source decisions

```text
SOURCE DECISION
Concern: Whether common (labeled) Buttons require a documented 48x48dp/CSS-px minimum touch
  target, especially at XS (32dp)/S (40dp) container heights.
Applicable platform: Web
Source A and statement: Buttons Accessibility page — no touch-target language.
Source B and statement: Buttons Specs page "Target areas" — verbatim-identical to Icon Buttons'
  target-size text, names "icon buttons" literally.
Source C and statement: two general, platform-wide foundation pages both carry equivalent
  guidance: `foundations/designing/structure.md` ("consider making touch targets at least 48 x
  48dp") and `foundations/layout/grids-spacing/density.md` ("default target size should be at
  least 48x48 CSS pixels") — neither is Buttons-specific.
Conflict or missing evidence: the only Buttons-family-page touch-target sentence literally names
  a different, excluded family; no Buttons-specific `--md-comp-button-*` touch-target token
  exists to confirm or deny family-specific applicability either way.
Narrower applicable authority: none inside the Buttons pages; general foundation guidance (Source
  C) is the applicable authority, and both of its pages independently agree on ~48dp.
Decision: apply the general 48x48 CSS-px minimum as system-wide guidance reconciled with XS/S
  button heights via hit-area, not as a Buttons-family component token (none exists to route
  from). The prior README's citation to `foundations/designing/structure.md` is correct and is
  retained.
Rationale: token/statement presence does not prove family-specific support; the literal wording
  of the Buttons-page sentence contradicts family scope, but the general foundation guidance
  applies regardless and was correctly cited from the start.
Status: unresolved (whether common Buttons specifically, as opposed to only generic UI elements,
  require this minimum remains unproven by a Buttons-specific source; the current `__target`
  hit-area implementation is a reasonable application of the general rule either way — no
  behavior or citation change follows from this decision)
```

```text
SOURCE DECISION
Concern: 200% text-size / label-wrapping guidance is stated only for Android.
Applicable platform: Web
Source A: Accessibility page, "200% text size" — explicitly "On Android, ...".
Source B: Guidelines page, "Label text" — "Don't truncate or wrap label text... always fully
  visible on a single line" (unqualified by platform).
Decision: Web follows the unqualified single-line rule; the Android two-line-at-200% allowance
  does not apply to Web.
Rationale: platform-scoped guidance is not interchangeable without an explicit decision; the
  source is explicit about the platform.
Status: resolved
```

```text
SOURCE DECISION
Concern: Spring-physics pressed/selected shape-morph motion (damping 0.6, stiffness 800) has no
  official CSS timing-function equivalent, and no official Web Expressive reference exists.
Applicable platform: Web
Decision: record the spring parameters as the official motion contract; the CSS/Web
  spring-approximation technique is an open dependency for a future motion correction unit, not
  invented here.
Status: unresolved
```

```text
SOURCE DECISION
Concern: `aria-pressed` for the toggle variant — M3 names no ARIA attribute at all.
Decision: use the standard WAI-ARIA APG toggle-button technique (`aria-pressed`) as the required
  technical mapping for the officially-documented two-state toggle behavior.
Rationale: M3 defines the design/interaction contract, not the DOM/ARIA implementation; a
  required accessible-state mechanism must still be resolvable.
Status: resolved
```

Official token namespace (current Expressive only — the deprecated pre-Expressive namespace is
intentionally out of scope): `md.comp.button.<color>.*` (elevated/filled/tonal/outlined/text) and
`md.comp.button.<size>.*` (xsmall/small/medium/large/xlarge), all decomposed per state/part except
the composite `<size>.label-text` typescale reference (label-large XS/S, title-medium M,
headline-small L, headline-large XL). Container heights/icon sizes/outline widths were
independently re-verified this pass directly against the live token table and match the current
implementation exactly: heights 32/40/56/96/136dp, icon sizes 20/20/24/32/40dp, outline widths
1/1/1/2/3dp for XS/S/M/L/XL respectively.

Required foundation dependencies (unchanged, correctly owned): `md.sys.color.*` roles,
`md.sys.elevation.level0/1/2` + shadow-color, `md.sys.shape.corner.full/small/medium/large/
extra-large`, `md.sys.state.hover/focus/pressed.state-layer-opacity`,
`md.sys.motion.spring.fast.spatial.damping/stiffness`, `md.sys.typescale.label-large/
title-medium/headline-small/headline-large`. `useStateLayer`/`useRipple`/`MDStateLayer` (from
`@shared/ui/State`), `MDCircularProgressIndicator` (from `@shared/ui/ProgressIndicators`),
`MD_TYPESCALE` (from `@shared/lib/md`) remain correctly-owned generic shared infrastructure.

Canonical public API (unchanged; independently re-checked against current `MDButton.vue` this
pass and matches — no API change in scope for this correction unit): Props — `label: string`
(required); `color?: 'elevated'|'filled'|'tonal'|'outlined'|'text'` (default `filled`); `size?:
'extra-small'|'small'|'medium'|'large'|'extra-large'` (default `small`); `shape?:
'round'|'square'` (default `round`); `variant?: 'default'|'toggle'` (default `default`);
`selected?: boolean`; `disabled?: boolean`; `nativeType?: 'button'|'submit'|'reset'` (default
`button`); `loading?: number|boolean` (project extension). Emits — `click: [event: MouseEvent]`.
Slots — `icon()`.

Current owner: `src/shared/ui/material/components/button/` — independently reconfirmed sole
owner this pass (`Glob`: no `MDButton.*` remain under `src/shared/ui/Button`). Public export:
`MDButton` from `@shared/ui/material` and the family-local `index.ts`. Affected consumers:
independently re-verified by grep this pass (distinct pass from the prior README's list, and
recounted again after revision-2's contract-gate review flagged the first count as inaccurate)
— 22 real `import { MDButton } from ...` sites resolve to `@shared/ui/material`; none deep-import
the family path or a legacy alias.

## Current implementation assessment (independent isolated `material-current-state-audit` pass)

Concern: Physical ownership, exports, consumers, aliases
Canonical target: one canonical owner; consumers use the curated public entry point.
Current behavior: confirmed by independent `Glob`/`Grep` this pass (not the README's prior list).
Classification: confirmed-compliant
Required correction: none

Concern: Color/size/shape/variant matrix and invalid `text`+`toggle` combination
Canonical target: 5 colors x 5 sizes x 2 shapes; toggle unsupported for `text`.
Current behavior: `MDButton.vue` props match exactly; `resolveButtonPresentation.ts` normalizes
`text`+`toggle` to `default` with a dev warning, independently re-verified against the token
table (0/20 text tokens are selected/unselected vs. 24-52 for the other four styles).
Classification: confirmed-compliant
Primary proof: `resolveButtonPresentation.test.ts`, `MDButton.test.ts` (opened and content-checked
this pass, not assumed from test names)
Required correction: none

Concern: Icon anatomy (single leading slot), native DOM/anatomy, no nested interactive elements
Canonical target: 3 anatomy parts + optional leading icon only.
Current behavior: single `icon` slot rendered before label; DOM is `button` -> non-layout
`__target` span -> `MDStateLayer` -> `__content` (optional `__icon`, `__label-text`, optional
loading indicator); no nested interactive elements or extra wrappers.
Classification: confirmed-compliant
Primary proof: `MDButton.test.ts`
Required correction: none

Concern: Native keyboard/disabled/click semantics
Canonical target: native Tab/Space/Enter only; `disabled` blocks activation.
Current behavior: plain native `<button :type :disabled>`; no synthesized key handling added by
`MDButton.vue` (the shared `useRipple` keyboard debounce only re-triggers the ripple visual on
key-repeat, it does not add an activation path).
Classification: confirmed-compliant
Primary proof: `MDButton.test.ts`
Required correction: none

Concern: Click event propagation (`@click.stop` in `MDButton.vue`)
Canonical target: not addressed by the official Buttons pages; a repository-audit concern.
Current behavior: `MDButton.vue` stops native click propagation via `onButtonClick`, now
documented by a TSDoc comment above the handler (script-side, not a template HTML comment — an
earlier attempt placed the comment directly in `<template>` and broke Vue's single-root-node
detection, causing `wrapper.classes()` to return `[]` for several existing tests; moved to
script). The comment cites the real source (`components/cards/accessibility.md`: "An action
shouldn't be placed on an actionable surface") and correctly scopes which sibling primitives
share the exact unconditional convention (`MDIconButton`, `MDFab`, `MDExtendedFab`, `MDChipBase`)
versus which only stop propagation in a narrower disabled-link case (`MDCard`, `MDListItem`).
`MDButton.test.ts` now has a dedicated test ("stops the native click from bubbling to an ancestor
listener") that mounts the button DOM-attached with a real ancestor click listener and proves the
listener never fires while the button's own `click` still emits.
Classification: confirmed-compliant
Primary proof: `MDButton.test.ts` ("stops the native click from bubbling to an ancestor
listener"); independently reviewed by a correction-final `material-component-review` pass, which
confirmed the citation accuracy, the DOM-connected test methodology, zero eslint warnings, the
button-family suite (23/23) passing, and the token architecture guard unchanged (still exactly
the 3 pre-existing, out-of-Button-scope residual errors).
Required correction: none — completed this pass. No public API, prop, emit, slot, CSS, or token
changed; `.stop` itself is unchanged, only documented and tested.

Concern: `aria-label` / accessible name; `aria-pressed` for toggle
Canonical target: accessible name matches visible label; `aria-pressed` per Source decision above.
Current behavior: `:aria-label="props.label"` always set; `:aria-pressed` present only when the
applied variant is `toggle`, mirrors `selected`.
Classification: confirmed-compliant
Primary proof: `MDButton.test.ts`
Required correction: none

Concern: State model — hover/focus/pressed/disabled, no `dragged`, `selected` ownership
Canonical target: Enabled/Disabled/Hovered/Focused/Pressed (+Selected for toggle); no `dragged`
state exists for Buttons; `selected` is fully consumer-controlled.
Current behavior: `useStateLayer` wires exactly hover/focused/pressed(+disabled) into
`MDStateLayer`; `dragged` is never passed (nothing to wire — correctly absent, not omitted);
`appliedSelected` is a pure computed, no hidden local copy.
Classification: confirmed-compliant
Primary proof: `MDButton.test.ts`
Required correction: none

Concern: Elevation state model per color style
Canonical target: independently re-verified this pass directly against the live per-state token
table for every style, correcting an earlier revision's inaccurate "tonal/outlined/text = level0
throughout" generalization (see "Contract-gate review history") — elevated: level1 enabled/
focused/pressed, level2 hovered, level0 disabled; filled: level0 base/focused/pressed/disabled,
level1 hovered; tonal: identical shape to filled — level0 base/focused/pressed/disabled, level1
hovered (`md.comp.button.tonal.hovered.container.elevation` -> `md.sys.elevation.level1` is a
real published token, not absent); outlined/text: zero `container.elevation` tokens published in
any state (elevation is not part of their official token set at all, not an official "level0"
value).
Current behavior: `MDButton.css:544` declares `--md-comp-button-tonal-hovered-container-elevation:
  var(--md-sys-elevation-level1)`, matching the live token exactly; every other style's elevation
routing matches its corrected target above. The repository's own existing test already asserted
this correctly (see Primary proof) — only this document's stated target text was wrong.
Classification: confirmed-compliant
Primary proof: `tests/e2e/visual/shared-ui/md-button.spec.ts` (browser lane, reads real computed
`box-shadow`/elevation values, not literals; its `Tonal: { ..., elevations: ['level1', 'level0',
  'level0'] }` fixture for hover/focus/pressed already matches the corrected target and was never
itself wrong — only this document's prose target was)
Required correction: none

Concern: Disabled label/icon opacity (0.38) and hover/focus/pressed state-layer opacity routing
Canonical target: 0.38 for all styles; 0.08/0.10/0.10 state-layer opacities.
Current behavior: every color block routes these correctly to `--md-sys-state-*` roles.
Classification: confirmed-compliant (Button's own routing; the underlying `--md-sys-state-*`
numeric values are foundation-owned, out of this family's file scope)
Primary proof: `md-button.spec.ts`
Required correction: none

Concern: Disabled container opacity/tint — `color="text"` specifically
Canonical target: independently re-verified this pass directly against the live per-state token
table — `md.comp.button.text.disabled.container.color` (aliased to `md.sys.color.on-surface`)
and `md.comp.button.text.disabled.container.opacity` (0.1) are both real, published official
tokens for the plain (non-toggle) Text style, despite Text having no `container.color` token in
any other state. `outlined` publishes only `disabled.container.opacity` (0.1) with no matching
base `.color` token, so it has no official color to render a disabled tint with.
Current behavior: `text`'s disabled branch declares
`--md-comp-button-text-disabled-container-color: var(--md-sys-color-on-surface)` and
`-opacity: 0.1`, routed into the rendered container color — a disabled text button renders a
faint on-surface-tinted background. `outlined`'s default (non-toggle) branch has no
disabled-container-color route, staying transparent.
Classification: confirmed-compliant
Primary proof: `md-button.spec.ts` "disabled defaults cover every materially distinct style
route" correctly proves this official per-style distinction (text tinted, outlined transparent),
not a locked-in deviation.
Required correction: none. An earlier revision of this document misclassified this concern as
`misaligned` based on an unverified assumption that "outlined and text both render no container
fill at rest, so neither should gain one when disabled" — that assumption did not hold up
against the live per-state token data and has been corrected; see "Contract-gate review
history."

Concern: Corner geometry — round/square rest, pressed morph, per size
Canonical target: square(rest) XS/S=12, M=16, L/XL=28dp; pressed XS/S=8, M=12, L/XL=16dp.
Current behavior: matches exactly.
Classification: confirmed-compliant
Primary proof: `md-button.spec.ts` "exact geometry per size"
Required correction: none

Concern: Container heights, icon sizes, outlined outline widths (exact numeric values)
Canonical target: independently re-verified this pass directly against the live official token
table (see Canonical target above).
Current behavior: 32/40/56/96/136dp heights, 20/20/24/32/40dp icon sizes, 1/1/1/2/3dp outline
widths for XS/S/M/L/XL — matches exactly.
Classification: confirmed-compliant
Primary proof: `md-button.spec.ts` "exact geometry per size" (now corroborated by direct official
source re-verification this pass, not only internal self-consistency)
Required correction: none

Concern: Small-size padding (16dp current vs. 24dp legacy)
Canonical target: 16dp is current/recommended.
Current behavior: `--md-comp-button-small-leading-space/-trailing-space: 16dp` (medium correctly
uses a different, larger 24dp token).
Classification: confirmed-compliant
Primary proof: `md-button.spec.ts`
Required correction: none

Concern: Label typescale mapping
Canonical target: label-large XS/S, title-medium M, headline-small L, headline-large XL.
Current behavior: matches exactly via `MD_TYPESCALE`.
Classification: confirmed-compliant
Primary proof: `resolveButtonPresentation.test.ts`, `md-button.spec.ts`
Required correction: none

Concern: Label-text wrapping on Web
Canonical target: labels must never truncate or wrap on Web — always a single line (see "Why
this contract replaces the prior one").
Current behavior: resolved this pass (Unit 4, see Correction units). `.md-button` reverted from
`min-height` back to fixed `height`; `__label-text` reverted from `white-space: normal;
  overflow-wrap: anywhere; text-align: center;` back to `white-space: nowrap;` only (`text-align`
was redundant for single-line text — the flex parent `.md-button__content` already centers via
`justify-content`/`align-items`). The `LabelReflow` story/test, which only proved the wrapping
deviation, were replaced with `LabelNoWrap` (`MDButton.stories.ts`) and a rewritten Playwright
test (`md-button.spec.ts`, "keeps a long label on a single line and grows wider instead of
wrapping or truncating it") proving the corrected contract: under a narrow containing block, the
label stays single-line (computed `white-space: nowrap`), the button's height stays fixed at the
single-line value for its size, and the full label text renders with no `text-overflow: ellipsis`
— the button is allowed to render wider than its container rather than wrap or truncate,
consistent with the official Guidelines page's "A button container's width shouldn't be narrower
than its label text" guidance.
Classification: confirmed-compliant
Primary proof: `md-button.spec.ts` "MDButton keeps a long label on a single line and grows wider
instead of wrapping or truncating it" — independently confirmed to genuinely fail against the
prior reflow CSS and pass against the reverted CSS, not a superficial rewrite. Full 224-spec
visual suite passed with zero diffs elsewhere; 23/23 unit and component-contract tests passed
unchanged; eslint clean.
Required correction: none — completed this pass. No consumer regression: independently verified
all real (non-story/non-test) `MDButton` usages under `src/pages`/`src/widgets`/`src/features`/
`src/entities` use short static labels except one dynamic database-column-name label
(`DatabaseFilterAddButton.vue`), which renders inside a `flex-wrap: wrap` container — a wider
button wraps to a new row, it does not clip or overflow.

Concern: RTL icon mirroring
Canonical target: leading icon mirrors to the right in RTL.
Current behavior: icon-then-label in a flex row with symmetric padding/radius; default flexbox
`row` direction is writing-mode-relative, so RTL mirrors without extra code. Resolved this pass
(Unit 5, see Correction units): a new `RtlIconMirroring` story (`MDButton.stories.ts`) renders the
same button under `dir="ltr"` and `dir="rtl"` wrappers, and a new Playwright test
(`md-button.spec.ts`, "mirrors the leading icon to the right of the label under dir=\"rtl\"")
reads both fixtures' icon/label bounding-box x-positions, proving `iconLeft < labelLeft` under LTR
and `iconLeft > labelLeft` under RTL — a genuinely direction-dependent assertion, independently
confirmed (correction-final review) to fail against `row-reverse`, a hardcoded `direction`, or a
manual icon-swap.
Classification: confirmed-compliant
Primary proof: `md-button.spec.ts` "MDButton mirrors the leading icon to the right of the label
under dir=\"rtl\""
Required correction: none — completed this pass. No production code changed (test/story-only
addition); no consumer regression possible.

Concern: `__target` hit-area span and its cited authority
Canonical target: see Source decision (SD1) above — general foundation guidance; both
`designing/structure.md` (the prior README's citation) and `grids-spacing/density.md`
independently support the same ~48dp minimum.
Current behavior: unchanged non-layout 48dp `aria-hidden` span for XS/S sizes; a reasonable
application of the general rule. The prior README's citation was correct; this document's
revision-1 claim that it was wrong has been corrected (see "Contract-gate review history").
Classification: confirmed-compliant
Required correction: none

Concern: `loading?: number | boolean` project extension
Canonical target: no official Material Button counterpart.
Current behavior: composes `MDCircularProgressIndicator`; four loading-state cases proven; does
not disable the control or change the accessible name.
Classification: project-extension
Primary proof: `MDButton.test.ts`
Required correction: none — preserve unchanged

Concern: Foundation/generic dependency direction
Canonical target: components may depend on correctly-owned generic shared/lib infrastructure;
must not import product layers.
Current behavior: only `@shared/ui/State`, `@shared/ui/ProgressIndicators`, `@shared/lib/md`
imported; no product-layer imports.
Classification: confirmed-compliant
Required correction: none

### Token architecture correction (this pass's correction unit)

Independently reconstructed this pass by reading `MDButton.css` directly (not by trusting the
prior README's routing prose), then confirmed by directly executing
`scripts/materialTokenArchitecture.test.mjs`, which fails today with three error classes, all
localized to `MDButton.css`:

1. **Ambiguous private-route naming.** `--md-button-border-radius`, `--md-button-icon-size`,
   `--md-button-height`, `--md-button-padding-left`, `--md-button-padding-right`,
   `--md-button-icon-gap`, `--md-button-border-width`, `--md-button-border-style`,
   `--md-button-box-sizing`, `--md-button-target-size` — ten implementation variables that match
   `docs/tokens.md`'s own listed anti-pattern examples (`--md-button-border-radius`,
   `--md-button-height`) almost verbatim. They are not exact official tokens and are not
   namespaced as private routes (`--md-private-button-*`).
2. **Component-token location.** All ~200 `--md-comp-button-<color>-*` /
   `--md-comp-button-<size>-*` declarations live directly in `MDButton.css`, interleaved with
   layout/state/transition rules, instead of a dedicated `components/button/button.tokens.css`
   file per `docs/tokens.md`'s ownership-and-location rule (token files are default; split only
   for independent loading/ownership/proof — Button's ~200-declaration set is exactly the
   "non-trivial" case the rule targets).
3. **Dead component tokens.** The ten per-size
   `--md-comp-button-<size>-pressed-container-corner-size-motion-spring-stiffness/-damping`
   declarations (aliased correctly to the official `md.sys.motion.spring.fast.spatial.*` spring
   constants) are never consumed by any rendered CSS property — the actual pressed/selected shape
   morph is driven by a separately hand-authored `cubic-bezier` transition in `.md-button`'s
   `transition` shorthand, with no shown derivation from the spring parameters. This is the
   Source-decision-3 (spring-to-CSS mapping) gap surfacing as a concrete static-guard failure:
   declared-but-unreachable tokens, not a missing rendered behavior.

Classification: misaligned (token naming, location, and two dead declarations); token dependency
direction, cross-family references, and cycles were independently traced this pass and are clean
(no correction needed there).

Required correction (this pass's correction unit — behavior-preserving, no rendered value
changes):

- Create `components/button/button.tokens.css` owning every `--md-comp-button-<color>-*` and
  `--md-comp-button-<size>-*` declaration, moved verbatim (same selectors, same values) out of
  `MDButton.css`.
- Rename the ten `--md-button-*` variables to `--md-private-button-*` throughout `MDButton.css`,
  preserving exact current values and cascade behavior.
- Remove the ten dead spring stiffness/damping component-token declarations. This does not change
  the pressed/selected shape-morph's rendered motion (already driven by the existing
  `cubic-bezier` transition, unchanged) — it only stops declaring official-token-shaped tokens
  that reach no rendered behavior, per `docs/tokens.md`: "Every declared `--md-comp-*` token must
  route to supported rendered behavior or be removed until that behavior is implemented." The
  spring-to-CSS mapping itself (Source decision, unresolved) remains an open motion-category gap
  for a future correction unit, not resolved by this removal.
- Remove `tests/e2e/visual/shared-ui/md-button.spec.ts`'s "MDButton per-size spring component
  tokens resolve to the fast-spatial system tokens" test in the same change. This test reads only
  the raw computed value of the ten tokens being removed; it asserts no rendered CSS property, so
  it is proof of the dead declaration's existence, not of any real motion behavior — a
  legacy-defect-preservation test whose subject is being removed, not a coverage regression.
  Flagged and required by revision-1's independent contract-gate review, which found the
  correction unit was not actually behavior-preserving as originally scoped without this step.
- Proof: `scripts/materialTokenArchitecture.test.mjs` passes with zero errors for Button; the
  complete existing visual/Playwright/unit/component-contract suite, minus the one removed test,
  passes with zero diffs (proving the rename/relocation/removal changed no rendered output).

## Token graph (independently reconstructed this pass)

`--md-comp-button-<color>-*` / `--md-comp-button-<size>-*` — `md-comp`, currently declared inline
in `MDButton.css` (misaligned location, corrected by this pass's unit); dependencies are
`md-sys-color-*`/`md-sys-elevation-*`/`md-sys-state-*`/`md-sys-shape-*` or another same-family
`md-comp-button-*` token — valid direction, no cycles, no cross-family references found by manual
trace.

`--md-button-*` (ten names listed above) — `invalid-md` per the repository's own static-guard
taxonomy (misaligned naming, corrected by this pass's unit); rendered-property routing itself is
otherwise the shortest valid route once the naming issue is corrected.

`--md-private-button-*` (container/label/icon/outline/elevation/state-layer base + hover/focus/
pressed + disabled variants + final `rendered-*` selection) — `private`, correctly scoped to
`MDButton.css`, correct three-stage route (configuration selects base -> state selector overrides
`rendered-*` -> template/CSS reads only `rendered-*`); no unjustified second private hop found.

`--md-sys-motion-spring-fast-spatial-stiffness/-damping` (owner: `src/shared/lib/md/tokens.css`,
temporary legacy foundation location per `docs/tokens.md`) — `md-sys`, correctly referenced today
by the per-size spring component tokens this pass's correction unit removes; not itself dead
regardless — it is still a valid system token used elsewhere (e.g. `MDIconButton.vue` references
the same system-level tokens directly, independent of Button's own now-removed per-size wrappers).

`--md-private-motion-expressive-fast-spatial-duration/-easing`,
`-fast-effects-duration/-easing` (owner: `src/shared/lib/md/tokens.css`) — `private` at a
foundation location; these, not the spring tokens, actually drive `.md-button`'s `transition`
shorthand. No duplicate declarations found.

`--md-state-outline-color` — resolved this pass (Unit 3, see Correction units): the line
(`outline-color: var(--md-state-outline-color);`, formerly `MDButton.css:69`) was removed
entirely rather than defining the token, after independently confirming it was genuinely dead —
`.md-button` never sets `outline-style` or the `outline` shorthand anywhere (`outline-style`'s
CSS initial value is `none`, so a lone `outline-color` has zero rendered effect regardless of
whether the referenced custom property resolves), and Button's visible focus feedback is owned
entirely by `MDStateLayer`'s background-opacity change, reinforced by a repository-wide global
`*:focus-visible { outline: none; }` reset in `src/shared/ui/State/md-focus-indicator.css`
(unrelated to Button specifically). Classification: was `unresolved` (found by revision-1's
independent contract-gate review, not this family's own original audit), now `confirmed-compliant`
— dangling reference removed, not merely documented.

## Motion routes (independently reconstructed this pass)

Pressed/selected shape morph: `.md-button` `transition` on `border-radius`/`box-shadow`, 350ms
`cubic-bezier(0.42, 1.67, 0.21, 0.9)` (foundation "fast-spatial" pair) — unresolved per Source
decision above; the official spring parameters exist as documentation only after this pass's
correction (dead declarations removed), not as a driving token. No `prefers-reduced-motion`
override.

Color/background/border "effects" transition: `.md-button` `transition` on `color`/
`background-color`/`border-color`, 150ms `cubic-bezier(0.31, 0.94, 0.34, 1)` (foundation
"fast-effects" pair) — not addressed by the locked canonical target; no `prefers-reduced-motion`
override.

Loading-state icon/label opacity fade: `__icon` (`MDButton.css:127-128`) and `__label-text`
(`:144-145`) each declare `transition: opacity` using the same 150ms fast-effects duration/easing
pair as the color transition above; trigger is the `.md-button_loading &` selector setting
`opacity: 0` on both when the `loading` prop is active (project extension, not official Material
surface). Owner: `MDButton.css`. Initial/final values: opacity 1 <-> 0. Interruption/reversal:
standard CSS transition reverses on class removal (loading toggling off mid-fade reverses
smoothly, no explicit cancellation logic needed). No `prefers-reduced-motion` override exists for
this route either. Resolved this pass (Unit 6, see Correction units): `MDButton.test.ts`'s four
loading-state cases still only assert the DOM/class result of toggling `loading`; a new Playwright
test (`md-button.spec.ts`, "loading-state icon and label opacity fade uses the documented
fast-effects duration") now reads `.md-button__icon`/`.md-button__label-text`'s computed
`transition-property`/`-duration`/`-timing-function` directly (parsing the comma-separated
multi-property shorthand to locate the `opacity` entry specifically, not a hardcoded index),
confirming both resolve to the same 150ms fast-effects pair already proven for the color/
background transitions above.

`MDStateLayer` background transition, ripple (WAAPI), and the loading indicator's SVG
`<animate>`/`<animateTransform>` are foundation-owned (`@shared/ui/State`,
`@shared/ui/ProgressIndicators`), correctly mapped/composed by Button, out of Button's own file
scope for correction. No `@keyframes`, `will-change`, or `transition: all` exist anywhere in
Button-owned CSS.

## Correction units

**Unit 1 (complete): Token ownership, naming, and dead-declaration cleanup.** See "Token
architecture correction" above for the full defect and required correction. Behavior-preserving;
proof is the static guard plus a zero-diff full suite run. Status: implemented — `button.tokens.css`
created, the ten `--md-button-*` names renamed to `--md-private-button-*`, the ten dead spring
component tokens and their sole proving test removed. Proof: static guard now shows zero errors
for all three originally-approved defect classes (3 unrelated pre-existing residual errors remain
— see "New evidence found during implementation"); 22/22 unit and component-contract tests passed
unchanged; full 224-spec visual suite (223 after the one intentional removal) passed with zero
diffs. Independent final-gate review passed (see "Final-gate review" above).

**Unit 2 (complete): Click-propagation `@click.stop` rationale and ancestor-listener proof.**
Backlog item 1 (now removed from the backlog list, see below). Behavior-preserving — `.stop`
itself unchanged, no public API/CSS/token change. Implemented: a TSDoc rationale comment above
`onButtonClick` in `MDButton.vue` citing `components/cards/accessibility.md` ("An action
shouldn't be placed on an actionable surface") and correctly scoping which sibling primitives
share the exact unconditional stop-propagation convention; a new `MDButton.test.ts` test
("stops the native click from bubbling to an ancestor listener") proving the behavior with a
real DOM-attached ancestor listener. Proof: button-family suite 23/23 passed; token architecture
guard unchanged (still exactly the same 3 pre-existing out-of-scope errors); eslint clean.
Independent contract-gate review (revision 1 failed on inaccurate comment wording — the proposed
text wrongly claimed `MDCard`/`MDListItem` shared the exact same unconditional convention and cited
an unattributed "Material prohibition" instead of the real Cards-accessibility source; corrected
before implementation) and independent correction-final review (passed) both complete.

**Unit 3 (complete): Removed the dangling `--md-state-outline-color` reference.** Formerly
backlog item 1 (after Unit 2). Behavior-preserving — `outline-color: var(--md-state-outline-color);`
(formerly `MDButton.css:69`) deleted outright rather than defining the token, after independently
confirming it was genuinely dead: `.md-button` never sets `outline-style`/the `outline` shorthand
anywhere, so a lone `outline-color` has zero rendered effect regardless of what the (never
declared) custom property would resolve to; Button's visible focus feedback is owned entirely by
`MDStateLayer`. Proof: full 224-spec visual suite passed with zero diffs (`pnpm verify --only
visual`); button-family suite 23/23 passed; token architecture guard unchanged (still exactly the
same 3 pre-existing out-of-scope errors, only shifted by the removed line). Independent
contract-gate review passed (single round).

**Unit 4 (complete): Reverted Web label-text wrapping to the official single-line rule.**
Formerly backlog item 1 (after Unit 3). Genuine rendered-behavior change, not
behavior-preserving — this is the intentional correction of a real `misaligned` defect (see "Why
this contract replaces the prior one" and the resolved "200% text-size / label-wrapping guidance
is stated only for Android" Source Decision). Implemented: `.md-button` reverted from
`min-height` back to fixed `height`; `__label-text` reverted from `white-space: normal;
overflow-wrap: anywhere; text-align: center;` back to `white-space: nowrap;` only. The
`LabelReflow` story/test (which only proved the wrapping deviation) were replaced with
`LabelNoWrap` (`MDButton.stories.ts`) and a rewritten Playwright test (`md-button.spec.ts`)
proving the corrected contract — see the "Label-text wrapping on Web" concern above for full
detail. Proof: full 224-spec visual suite passed with zero diffs anywhere outside the intentional
button-spec change; button-family suite 23/23 passed unchanged; eslint clean; independently
confirmed the new test genuinely fails against the old reflow CSS and passes against the reverted
CSS (not a superficial rewrite). No real consumer regression (see concern above). Independent
contract-gate review passed (single round, including independent re-verification of both official
source quotes and a consumer-safety spot check) and independent correction-final review passed
(after this README/backlog update closed the one gap it found — documentation lagging the
already-correct implementation).

**Unit 5 (complete): RTL leading-icon-mirroring browser proof.** Formerly backlog item 1 (after
Unit 4). Pure evidence-gap closure, not a defect fix — the existing implementation already
satisfied the canonical target (`.md-button__content`'s unset, writing-mode-relative
`flex-direction: row` mirrors icon-then-label DOM order under `dir="rtl"` with no RTL-specific
code), but no story or browser assertion proved it. Implemented: a new `RtlIconMirroring` export
in `MDButton.stories.ts` rendering the same button under `dir="ltr"` and `dir="rtl"` wrapper
`<div>`s, and a new Playwright test in `md-button.spec.ts` ("mirrors the leading icon to the right
of the label under dir=\"rtl\"") reading both fixtures' `.md-button__icon`/`.md-button__label-text`
bounding-box x-positions and asserting `iconLeft < labelLeft` under LTR, `iconLeft > labelLeft`
under RTL. No production code changed (test/story-only addition). Proof: full visual suite passed
225/225 (224 + this new test) with zero diffs (`pnpm verify --only visual --files
MDButton.stories.ts md-button.spec.ts`). Independent correction-final review (isolated context,
no contract-gate needed since there is no ownership/export/dependency change to canonicalize)
confirmed: the two assertions are genuinely direction-dependent (traced against the actual CSS —
no `flex-direction`, `direction`, `margin-left`, or `margin-right` override anywhere in
`MDButton.css` — and would fail against `row-reverse`, a hardcoded `direction`, or a manual
icon-swap); the story ID matches sibling naming convention; the diff is purely additive (31 + 28
lines, zero renames/removals). The reviewer also flagged an off-by-one in this document's backlog
priority-category numbers (see Backlog below), corrected in this revision.

**Unit 6 (complete): Loading-state opacity-fade transition-timing browser proof.** Formerly
backlog item 2 (after Unit 5's removal). Pure evidence-gap closure, not a defect fix — see the
"Loading-state icon/label opacity fade" entry under Motion routes above for the full claim and
implementation detail. Implemented: one new Playwright test in `md-button.spec.ts`
("loading-state icon and label opacity fade uses the documented fast-effects duration") reusing
the existing `LoadingColorRouting` story fixture (no story change) to read
`.md-button__icon`/`.md-button__label-text`'s computed transition longhands. No production code
changed (test-only addition). Proof: full visual suite passed 226/226 (225 + this new test) with
zero diffs (`pnpm verify --only visual --files tests/e2e/visual/shared-ui/md-button.spec.ts`).
Independent correction-final review (isolated context, no contract-gate needed) confirmed: the
comma-separated transition-list parsing correctly locates the `opacity` entry rather than
assuming a fixed index (so it would genuinely fail if the duration changed or `transition` were
removed); the `transition` declaration on `&__icon`/`&__label-text` is unconditional, not gated
behind `.md-button_loading &`, so reading it from the already-loading fixture is equivalent to the
general (always-present) contract; `--md-private-motion-expressive-fast-effects-duration` traces
to `150ms` in `src/shared/lib/md/tokens.css`, matching the `0.15s` literal already asserted for the
sibling color/background transitions; the diff is a single additive test block.

**Backlog (not started, not approved for implementation — each requires its own contract-gate
pass through this same sequence before any production edit). Listed by finding order, not strict
priority rank; each entry states its own `component-development.md` priority category so the next
orchestrator pass can sequence them correctly instead of trusting a claimed ordering here
(revision-2's contract-gate review found the priority-order claim in an earlier draft of this list
inaccurate — categories were not actually monotonic — so this revision states categories
explicitly instead of asserting an order. This revision also corrects an off-by-one in the
category numbers themselves, flagged by Unit 5's independent reviewer: `component-development.md`
lists category 7 as "layout, typography, RTL, and scaling" and category 8 as "motion and browser
lifecycle" — the prior revision had misnumbered these 8 and 9 respectively):**

1. Spring-to-CSS motion mapping for the pressed/selected shape morph (Source decision, unresolved)
   — likely a `material-foundation` prerequisite since the same system spring tokens are shared
   with `MDIconButton.vue` (priority category 8: motion implementation).
2. Pre-existing, repository-wide `--md-content-color`/`--md-symbol-size`/`--md-circular-progress-
color` generic ambient-styling contract has no accepted category in `docs/tokens.md`'s taxonomy
   and fails the static guard for `MDButton.css` (see "New evidence found during implementation"
   above). Not Button-owned; requires a `material-foundation`-level or repository-wide decision,
   not a Button-family correction unit (priority category 2: wrong/undecided foundation ownership
   — this is the highest-priority open backlog item by category, but is explicitly a foundation
   concern, not a Button correction, so it does not block Button's own family completion the way
   an unresolved Button-owned category-2 gap would). Found during the token-ownership pass's
   implementation, after that correction unit itself was already approved and executed.

The RTL icon-mirroring browser-proof item (formerly backlog item 1: evidence gap, no RTL story or
browser assertion) is complete — see the "RTL icon mirroring" concern above (`confirmed-compliant`,
independently correction-final reviewed) and "Correction units" below, Unit 5. Removed from this
list, not merely reclassified.

The loading-state opacity-fade transition-timing browser-proof item (formerly backlog item 2,
after the RTL item's removal) is complete — see the "Loading-state icon/label opacity fade" entry
under Motion routes above (proof now exists) and "Correction units" below, Unit 6. Removed from
this list, not merely reclassified.

A "disabled container opacity/tint for `color="text"`" item previously appeared here as backlog
item 2 in revision 3. Revision 4's independent contract-gate review found, against the live
per-state token table, that this was not a real defect — see "Contract-gate review history" and
the corrected "Disabled container opacity/tint" concern above. The item has been removed, not
merely reclassified.

The click-propagation `@click.stop` item (formerly backlog item 1: undocumented rationale, no
ancestor-listener test) is complete — see the "Click event propagation" concern above
(`confirmed-compliant`, independently correction-final reviewed) and "Correction units" below.
Removed from this list, not merely reclassified.

The dangling `--md-state-outline-color` reference item (formerly backlog item 1 after the above
removal) is complete — the dead `outline-color` declaration was removed from `MDButton.css`
(see the token graph entry above and "Correction units" below, Unit 3). Removed from this list,
not merely reclassified.

The Web label-text wrapping item (formerly backlog item 1 after the above two removals) is
complete — the `LabelReflow` behavior was reverted to the official single-line rule (see the
"Label-text wrapping on Web" concern above and "Correction units" below, Unit 4). Removed from
this list, not merely reclassified.

Extensions preserved unchanged: `loading?: number | boolean`.

Required unresolved decisions blocking only their own dependent work (do not block a Button
correction unit): SD1 (family-specific touch-target citation — resolved to a documentation
correction only, no code impact), SD3 (spring-to-CSS mapping — blocks backlog item 1 only).

Do not select a second family until Button reaches a terminal `aligned` state (per
`docs/roadmap.md`).

```

```
