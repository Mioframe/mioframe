# Button Material 3 Expressive compliance audit

- Requested name: Button
- Resolved family: Button (`MDButton` — common and toggle buttons)
- Audit date: 2026-07-17
- Audit binding: commit-bound
- Implementation ref: `fix/md-button-material-token-contract`
- Implementation commit: `46d168cfbadba5d8d5311e0254cc886d87cb5bde`
- Current owner: `src/shared/ui/material/components/button/MDButton.vue`
- Canonical owner: `src/shared/ui/material/components/button`
- Compliance result: `non-compliant`
- Operator visual status: `blocked`
- Local verification: earlier workspace run was reported successful, but it does not resolve the findings below
- External verification: required for the corrected implementation

## Official evidence

- `material3` MCP Button documentation and token graph.
- Verified fallback snapshot: `Vyachean/m3-docs-cache` commit `49ffae58a61f86c28b23720696dc9d07b6945483`, captured `2026-07-13T12:48:04.850Z`.
- `pages/components/buttons/specs.md` publishes pressed container shape motion through `md.sys.motion.spring.fast.spatial.stiffness` (`800`) and damping (`0.6`) for every supported size.
- `src/shared/ui/material/README.md` defines `src/shared/ui/material/components/<family>` as the canonical component-family location.

## Claimed supported surface

Five color styles, five sizes, round and square shapes, default and toggle variants, native button semantics, loading extension, public component-token overrides, state layers, ripple, focus indication, elevation, and Expressive pressed-shape motion.

## Required consumer scenarios

- actions in forms, dialogs, sheets, cards, and toolbars;
- toggle controls;
- disabled and loading states;
- light and dark themes;
- native pointer and keyboard activation.

## Confirmed findings

### 1. High — motion finding was closed without a real implementation dependency

**Official requirement:** pressed container shape uses the fast-spatial spring contract.

**Implementation evidence:** each size declares official stiffness/damping tokens and separately aliases `--md-private-button-corner-motion-duration`/`-easing` to the same pre-existing global `350ms` cubic-bezier adaptation. The border-radius transition consumes only the duration/easing aliases. Changing stiffness or damping cannot affect the rendered transition.

**Observed mismatch:** declaration colocation and equality tests were treated as runtime consumption. No data flow or conversion exists from the official numeric spring inputs to the runtime values. The visible motion therefore remains the same implementation that was previously reported as incorrect.

**Required correction:** choose one honest contract. Either validate and own the shared Web adaptation as the runtime representation of the official spring and treat stiffness/damping as source evidence, or implement a real conversion owner. Remove dead runtime component tokens and tests that only compare aliases defined as equal.

### 2. High — elevation fix has an unreviewed cross-family cascade blast radius

**Official requirement:** supported component shadow-color overrides must affect the final rendered elevation shadow.

**Implementation evidence:** all `--md-sys-elevation-level0`–`level5` formulas were moved from `:root` to `*, ::before, ::after` so every element recomputes them locally.

**Observed mismatch:** the final Button route is repaired, but the solution installs six large elevation custom properties on every element and pseudo-element, changes inheritance/override semantics across the application, and was justified by Button-only scenarios. The shared impact on other elevated owners is not sufficiently reviewed.

**Required correction:** use the narrowest shared elevation composition that lets actual elevated owners resolve their local shadow color. If the universal-selector solution is retained, document the foundation contract and add representative cross-family proof before accepting the blast radius.

### 3. High — terminal status was self-certified before external gates

**Implementation evidence:** the audit reported `compliant`; the registry reported `aligned`; the physical map reported `migrated`; roadmap text claimed all agent-owned gates and full verification complete while operator acceptance was still required and current-head CI was not available to the coding agent.

**Observed mismatch:** the coding agent had no `git` or GitHub access and could not bind its audit to a commit, inspect current-head CI, record operator acceptance, or prove merge readiness.

**Required correction:** keep coding-agent output non-terminal: workspace review, `migrating`, `partial`, milestone `active`, visual review `required`. GitHub-enabled review owns commit binding, CI, terminal records, and merge readiness.

### 4. Medium — source and status documentation is internally inconsistent

**Implementation evidence:** the family contract says Button guidelines were checked, while Storybook documentation says they were not. Some records describe the shadow route as resolved while older family-audit sections still describe it as a remaining gap. The family contract records `Current owner: none` despite the canonical implementation being active.

**Required correction:** reconcile all directly affected records from one verified source set and one current implementation state. Do not use terminal wording until findings 1–3 are resolved.

## Evidence gaps

- Operator visual comparison has not been performed against a corrected motion implementation.
- Current-head CI for a corrected implementation is not yet available.

## Rule defects

The previous workflow required a final implementation commit from an agent without `git` access and allowed that agent to update terminal program records. The component and review skills now separate workspace implementation from external commit/CI/operator gates and require actual implementation dependency rather than alias equality.

## Verified compliant areas

- `MDButton` is physically located under the canonical Material component root.
- The root `@shared/ui/material` export exists.
- Direct consumers were migrated away from the legacy Button export.
- The obsolete `MDButton` legacy export and implementation path were removed.
- Native button structure and the supported API remain covered by colocated contract tests.

## Recommended next action

Run a focused Button correction using this audit. Do not rerun the entire migration mechanically. Fix the motion contract honestly, narrow or fully validate the elevation foundation change, reconcile non-terminal records, run local verification, and produce a workspace-reviewed audit. Then perform external commit binding, current-head CI, and operator visual acceptance.