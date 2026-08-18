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

Ownership/invariants:

- each family `tokens.css` remains the single owner of its public token names and Material defaults;
- family-owned public defaults are declared on `:root`;
- `.md-<component>` owns component styling/private renderer mapping, not public defaults;
- composing components/consumers may set a nested family's public `--md-comp-*` token contextually;
- Material `--md-ref-*`/`--md-sys-*` are document-wide theme inputs and may later be changed by global user theme settings;
- independent subtree Material system themes are not currently guaranteed;
- no specificity escalation, `!important`, inline token wiring, duplicate renderer fallbacks, or bundle-order dependency.

This architecture is now canonical in `docs/component-tokens.md`, `docs/component-contract.md`, `docs/component-adapter.md`, scoped `AGENTS.md`, and the token/implementation skills.

### Required implementation work before the workflow PR is complete

PR #203 still has code using the superseded model:

- `scripts/materialComponentCompatibility.mjs` currently treats `:root --md-comp-*` as a token-contract violation;
- `scripts/materialComponentCompatibility.test.mjs` fixtures/tests encode the same old rule;
- already-converted family `tokens.css`/renderer bridges must be checked and migrated so the repository does not retain two incompatible cascade models;
- composition proof must cover contextual override inheritance and restoration of the family `:root` fallback, including the Button → Loading Indicator case that exposed the defect.

Do not add a compatibility layer for the old host-default model. Migrate converted families to one model.

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

Complete the global component-token cascade correction in PR #203 (guard/tests plus converted-family migration/proof), then continue/accept Extended FAB under the same model. Do not accept a family that still declares its own public `--md-comp-*` defaults on the component host.
