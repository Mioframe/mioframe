# Mioframe Material migration roadmap

This architect-maintained file owns current repository-local Material milestone status, repository-visible technical blockers, and the next Material pipeline action. Coding stages must not mark review/CI/merge completion here. Every recorded state must be derivable from current repository contents.

## Current state

Last updated: 2026-08-18

Current milestone: `M3 — sequential component migration`

Status: `in-progress`

Implemented canonical runtime families in the current repository tree include Loading Indicator, Button, Switch, Checkbox, and Floating Action Button. These predate the new three-contract workflow and still retain legacy staged evidence until each family is converted. Extended FAB is the active pilot on its dedicated branch.

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

The global cascade correction in PR #203 has passed architect semantic re-review:

- Button and Loading Indicator public defaults live on exact `:root`;
- private `--m3e-*` bridges/workarounds stay in family implementation CSS;
- family token contracts are loaded unscoped;
- Button keeps its Loading Indicator contextual override through normal inheritance;
- browser plus existing visual ownership cover the composed override and standalone fallback scenario;
- compatibility routing rejects local/root-containing selectors and same-file/cross-family duplicate defaults;
- foundation ownership proof no longer hides repeated declarations within the same selector/source.

No active review finding remains for the cascade correction.

## Resume architecture

PR #203 uses the normal resolver plus one semantic correction marker for current-workflow families. It does not add workflow history, a completion manifest, or token identity metadata.

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

Do not bulk-convert the existing families inside PR #203. After the new workflow is accepted and the Extended FAB pilot validates the steady-state path, convert the remaining pre-workflow families one at a time through the normal operator command:

```text
Loading Indicator
→ Button
→ Switch
→ Checkbox
→ Floating Action Button
```

The dependency-first order keeps Button composition on an already-converted Loading Indicator. Each conversion must produce current `contract.ts`, full current `tokens.css`, and `BEHAVIOR.md`, revalidate standalone implementation/proof against those contracts, migrate consumers only when required, and remove the replaced staged workflow artifacts.

When no legacy staged family remains, remove the temporary legacy bridge from `material-component` and its documentation. The steady-state workflow must then contain no legacy compatibility path.

## Other known state

The existing Checkbox evidence records an official-source conflict where a keyboard table uses Chips terminology. The current implementation therefore does not add an Enter workaround. When Checkbox is next processed, the behavior contract worker must derive the current result from Material 3 MCP; if the source remains contradictory, the behavior contract is blocked rather than guessed from legacy evidence.

`RelationValueFieldData.vue` still has the pre-existing accessible-name gap on its standalone relation-selection checkbox; this is unrelated to PR #203 workflow architecture.

## Milestones

| ID  | Milestone                            | Status        |
| --- | ------------------------------------ | ------------- |
| M0  | focused Material definition workflow | `complete`    |
| M1a | Loading Indicator dependency family  | `complete`    |
| M1  | Button action family                 | `complete`    |
| M2  | Switch stateful pilot                | `complete`    |
| M3  | sequential component migration       | `in-progress` |

## Next Material pipeline action

Run/review exact-head GitHub CI for PR #203. If the current head remains green and no new semantic finding appears, accept the workflow PR, synchronize the Extended FAB pilot with the accepted baseline, and resume it through `material-component Extended FAB`. After the pilot is accepted, convert the remaining legacy families in the dependency-first order above and finally delete the temporary legacy bridge.
