# Mioframe Material migration roadmap

This architect-maintained file owns current repository-local Material milestone status, repository-visible technical blockers, and the next Material pipeline action. Coding stages must not mark review/CI/merge completion here. Every recorded state must be derivable from current repository contents.

## Current state

Last updated: 2026-08-18

Current milestone: `M3 — sequential component migration`

Status: `in-progress`

Implemented canonical runtime families in the current repository tree include Loading Indicator, Button, Switch, Checkbox, and Floating Action Button. Extended FAB is the active pilot on its dedicated branch.

## Global component-token cascade correction

Verification of `MDButton → MDLoadingIndicator` composition exposed a library-wide defect in the previous component-token model: family `--md-comp-*` defaults were declared on `.md-<component>`, so a nested component could shadow a contextual/ancestor public-token override and make the result depend on specificity/source order.

Canonical architecture is defined in `docs/component-tokens.md`:

```text
family tokens.css
  → :root --md-comp-* Material defaults
  → optional inherited/contextual --md-comp-* override
  → .md-<component> private renderer bridge
  → rendered result
```

Key invariants:

- each public `--md-comp-*` default has exactly one owning family `tokens.css` declaration;
- family defaults are declared on `:root`;
- implementation CSS owns private renderer mapping and intentional contextual overrides, not family defaults;
- Material `--md-ref-*` / `--md-sys-*` remain document-wide theme inputs and may later be changed by global user theme settings;
- no specificity escalation, `!important`, inline token wiring, duplicate renderer fallbacks, or bundle-order dependency.

### Execution model

This is a one-time cross-family **mechanical repository architecture migration**, not a new `material-component` stage.

For already-known tokens whose names/defaults/aliases/current Material semantics do not change, migrate their existing declarations from the family host selector to `:root` directly as one scoped repository correction. Do not force every converted family through a fresh Material3 MCP derivation merely to move the selector.

If the migration exposes uncertainty about a token's semantic facts or ownership, route only that family/question through the normal contract owner.

### Required implementation work before PR #203 is complete

- change `scripts/materialComponentCompatibility.mjs` so `:root` family defaults are valid and host/local family defaults are invalid;
- mechanically enforce that the same public default is not declared by more than one family `tokens.css`, without treating implementation/consumer contextual overrides as duplicate ownership;
- invert/update `scripts/materialComponentCompatibility.test.mjs` fixtures and expectations;
- migrate all already-converted families to the single root-default model without changing established Material token facts;
- preserve private renderer bridges and intentional contextual overrides;
- add/retain observable composition proof for contextual override inheritance and restoration of the family default, including Button → Loading Indicator.

Do not add a compatibility layer for the old host-default model and do not add a permanent batch/migration stage to `material-component`.

## Other known state

The existing Checkbox evidence records an official-source conflict where a keyboard table uses Chips terminology. The current implementation therefore does not add an Enter workaround. When Checkbox is next semantically processed, the behavior contract worker must derive the current result from Material3 MCP; if the source remains contradictory, the behavior contract is blocked rather than guessed from legacy evidence.

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

Complete the global component-token cascade repository correction in PR #203 (guard/tests + converted-family migration/proof), then continue/accept Extended FAB under the same model.
