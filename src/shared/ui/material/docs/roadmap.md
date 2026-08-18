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

The global cascade correction in PR #203 has passed architect semantic re-review:

- Button and Loading Indicator public defaults live in family `tokens.css` on exact `:root`;
- private `--m3e-*` bridges/workarounds stay in family implementation CSS;
- family token contracts are loaded unscoped;
- Button keeps its Loading Indicator contextual override through normal inheritance;
- browser plus existing visual ownership cover the composed override and standalone fallback scenario;
- compatibility routing accepts only exact `:root` family defaults, rejects local/root-containing selectors, detects same-file and cross-family duplicate defaults, preserves contextual implementation overrides, and keeps scoped-load detection;
- foundation ownership proof no longer hides repeated declarations within the same selector/source.

No active review finding remains for the global cascade correction. Exact-head GitHub CI and final review of the complete PR #203 are still required before merge readiness can be decided.

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

Run exact-head GitHub CI and complete final review of PR #203. Only after PR #203 is accepted should the Extended FAB pilot be synchronized and resumed with `material-component Extended FAB`.
