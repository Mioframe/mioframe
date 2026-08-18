# Mioframe Material migration roadmap

This architect-maintained file owns current repository-local Material milestone status, repository-visible technical blockers, and the next Material pipeline action. Coding stages must not mark review/CI/merge completion here. Every recorded state must be derivable from current repository contents.

## Current state

Last updated: 2026-08-18

Current milestone: `M3 — sequential component migration`

Status: `in-progress`

Implemented canonical runtime families in the current repository tree include Loading Indicator, Button, Switch, Checkbox, and Floating Action Button. Extended FAB is the active pilot on its dedicated branch.

## Global component-token cascade correction

Verification of `MDButton → MDLoadingIndicator` composition exposed a library-wide defect in the previous component-token model: family `--md-comp-*` defaults were declared on `.md-<component>`, so a nested component could shadow a contextual/ancestor public-token override and make the result depend on specificity/source order.

Architecture decision:

```text
family tokens.css
  → :root --md-comp-* Material defaults
  → optional inherited/contextual --md-comp-* override
  → .md-<component> private renderer bridge
  → rendered result
```

`docs/component-tokens.md` is the detailed authority. Family token contracts own public names/defaults; implementation CSS owns private renderer bridges/contextual overrides; system/reference tokens remain document-wide theme inputs.

### Current implementation status

The mechanical family migration has been applied for the current three-contract families in PR #203:

- Button and Loading Indicator public defaults now live in family `tokens.css` on `:root`;
- private `--m3e-*` bridges/workarounds were moved back to family implementation CSS;
- family token contracts are loaded unscoped;
- Button keeps its Loading Indicator contextual override through normal inheritance;
- browser plus existing visual ownership cover the composed override and standalone fallback scenario;
- compatibility fixtures were inverted to the root-default model.

Architect review remains `blocked` by the shared guard recorded in `../REVIEW.md`: the resolver currently deduplicates declarations by token/family and treats any selector block containing `:root` as root ownership, so it does not yet prove the required invariant of exactly one actual root default declaration. The related foundation ownership check also collapses same-file duplicates.

The global correction is complete only after that mechanical guard closes and exact-head CI is reviewed.

## Other known state

The existing Checkbox evidence records an official-source conflict where a keyboard table uses Chips terminology. The current implementation therefore does not add an Enter workaround. When Checkbox is next processed, the behavior contract worker must derive the current result from Material 3 MCP; if the source remains contradictory, the behavior contract is blocked rather than guessed from legacy evidence.

`RelationValueFieldData.vue` still has the pre-existing accessible-name gap on its standalone relation-selection checkbox; this is unrelated to the token-cascade correction.

## Milestones

| ID  | Milestone                            | Status        |
| --- | ------------------------------------ | ------------- |
| M0  | focused Material definition workflow | `complete`    |
| M1a | Loading Indicator dependency family  | `complete`    |
| M1  | Button action family                 | `complete`    |
| M2  | Switch stateful pilot                | `complete`    |
| M3  | sequential component migration       | `in-progress` |

## Next Material pipeline action

Close the remaining global compatibility-guard finding in PR #203, re-review the correction, then run exact-head CI. Only after the global cascade correction is accepted should the Extended FAB pilot be synchronized and resumed with `material-component Extended FAB`.
