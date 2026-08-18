# Mioframe Material migration roadmap

This architect-maintained file owns current repository-local Material milestone status, repository-visible technical blockers, and the next Material pipeline action. Coding stages must not mark review/CI/merge completion here. Every recorded state must be derivable from current repository contents.

## Current state

Last updated: 2026-08-18

Current milestone: `M3 — sequential component migration`

Status: `in-progress`

Implemented canonical runtime families include Loading Indicator, Button, Switch, Checkbox, and Floating Action Button. These predate the new three-contract workflow and still retain legacy staged evidence until each family is converted. Extended FAB is the current integration family in PR #207.

## Global component-token cascade correction

Verification of `MDButton → MDLoadingIndicator` composition exposed a library-wide defect in the previous component-token model: family `--md-comp-*` defaults were declared on `.md-<component>`, so a nested component could shadow a contextual/ancestor public-token override and make the result depend on specificity/source order.

Architecture decision:

```text
family tokens.css
  → :root --md-comp-* Material default
  → optional inherited/contextual --md-comp-* override
  → component private renderer bridge
  → rendered result
```

`docs/component-tokens.md` is the detailed authority. Family token contracts own public names/defaults; implementation CSS owns private renderer bridges/contextual overrides; system/reference tokens remain document-wide theme inputs.

The global cascade correction merged through PR #203 and is now part of the `develop` baseline:

- Button and Loading Indicator public defaults live on exact `:root`;
- private `--m3e-*` bridges/workarounds stay in family implementation CSS;
- family token contracts are loaded unscoped;
- Button keeps its Loading Indicator contextual override through normal inheritance;
- browser plus existing visual ownership cover the composed override and standalone fallback scenario;
- compatibility routing rejects local/root-containing selectors and same-file/cross-family duplicate defaults;
- foundation ownership proof no longer hides repeated declarations within the same selector/source.

No active review finding remains for the cascade correction.

## Contract ownership correction

The Extended FAB pilot exposed that its first `BEHAVIOR.md` duplicated token-owned geometry, spacing, typography, elevation, state opacity and focus-indicator values from `tokens.css`.

The workflow baseline merged through PR #203 now defines:

```text
contract.ts
  → public structure/configuration

tokens.css
  → official tokenized visual values

BEHAVIOR.md
  → remaining observable behavior and non-tokenized relationships/constraints
```

Contract order is `API → TOKEN → BEHAVIOR`; behavior may read `tokens.css` only as an exclusion boundary. Extended FAB `BEHAVIOR.md` has been cleaned accordingly. Its size/shape/spacing/typography/state visual values remain exclusively in `tokens.css`; existing browser/visual token proof remains valid and does not need to be removed merely because the prose duplication was removed.

## Resume architecture

The merged Material workflow uses the normal resolver plus one semantic correction marker for current-workflow families. It does not add workflow history, a completion manifest, or token identity metadata.

A small temporary bridge exists only for pre-workflow families. Old staged artifacts identify a family that still needs conversion. Because the old workflow never produced `BEHAVIOR.md` but could already contain a demand-scoped `tokens.css`, the only transition exception is:

```text
legacy staged artifacts remain
+ current contract.ts exists
+ current BEHAVIOR.md does not exist
→ current token-contract is still incomplete
```

After token derivation the ordinary resolver continues to behavior. If execution stops between those owners, token may repeat on resume. Legacy `REVIEW.md` with `Verdict: compliant` is historical evidence, not active current review state.

The bridge is deliberately temporary and must be removed once the last legacy family is converted.

## Legacy family conversion plan

Do not bulk-convert the existing families as part of the Extended FAB integration. After PR #207 completes the pilot integration into `develop`, convert the remaining pre-workflow families one at a time through the normal operator command:

```text
Loading Indicator
→ Button
→ Switch
→ Checkbox
→ Floating Action Button
```

The dependency-first order keeps Button composition on an already-converted Loading Indicator. Each conversion must produce current `contract.ts`, full current `tokens.css`, and `BEHAVIOR.md`, revalidate standalone implementation/proof against those contracts, migrate consumers only when required, and remove the replaced staged workflow artifacts.

When no legacy staged family remains, remove the temporary legacy bridge from `material-component` and its documentation. The steady-state workflow must then contain no legacy compatibility path.

## Extended FAB pilot state

Architect re-review finds no active blocker, major issue, minor issue, or accepted risk for the Extended FAB family and its migration.

The current family state includes:

- canonical API/token/behavior contracts with tokenized visual values owned only by `tokens.css`;
- private `@m3e/web` renderer adaptation with one stable family boundary;
- typed `click` activation, current size/color mappings, host-attribute boundary, RTL and motion behavior;
- owner-local browser/visual proof for accessibility, interaction, token-driven geometry/state appearance, overrides and reduced motion;
- complete migration from legacy `MDExtendedFab` and removal of replaced legacy proof/implementation;
- Repo Explorer Add action composed through the existing shared `MDSymbol` in the canonical Extended FAB `icon` slot, with no hand-written product SVG and no restored legacy `mdSymbol` prop.

The previous migration correction is resolved, `.material-correction.json` is absent, and the clean architect review artifact has been removed. The branch has been normalized onto the merged #203 `develop` tree without changing the reviewed Extended FAB code/test contents. Exact-head CI against `develop` remains the final delivery gate and is not implied by semantic readiness.

## Other known state

The existing Checkbox evidence records an official-source conflict where a keyboard table uses Chips terminology. When Checkbox is next semantically processed, the behavior contract worker must derive the current result from Material3 MCP; if the source remains contradictory, the behavior contract is blocked rather than guessed from legacy evidence.

`RelationValueFieldData.vue` still has the pre-existing accessible-name gap on its standalone relation-selection checkbox.

The Extended FAB SFC is above the repository's 500-line review trigger because the explicit private renderer bridge dominates the file. This is not a correctness blocker by itself; when the family is next edited, prefer a family-local private stylesheet only if it materially improves ownership/readability without adding abstraction.

## Milestones

| ID  | Milestone                            | Status        |
| --- | ------------------------------------ | ------------- |
| M0  | focused Material definition workflow | `complete`    |
| M1a | Loading Indicator dependency family  | `complete`    |
| M1  | Button action family                 | `complete`    |
| M2  | Switch stateful pilot                | `complete`    |
| M3  | sequential component migration       | `in-progress` |

## Next Material pipeline action

Complete the architect-owned exact-head delivery gate for PR #207 against `develop`. If that integration verification is clean, perform final merge-readiness review and merge the Extended FAB migration. Then convert the remaining legacy families in dependency-first order and finally delete the temporary legacy bridge.
