# Mioframe Material library

`src/shared/ui/material` is the canonical source boundary for Mioframe's Material implementation.

The library contains:

- cross-family Material foundation contracts required by current work;
- official public Material component families;
- reusable official Material compositions independent of product domains.

Canonical architecture:

- `docs/material-3/library-architecture.md`;
- `docs/material-3/foundation-architecture.md`;
- `docs/material-3/component-architecture.md`;
- `docs/material-3/component-testing.md`.

Operational progress and the next ready family are tracked in `docs/material-3/library-roadmap.md` and `ui-library-inventory.md`.

## Ownership map

```text
material/foundation
  Cross-family Material tokens, roles, primitives, adapters, and verification helpers.

material/components
  Official public component families, adaptive contracts, implementations, stories, and focused tests.

material/patterns
  Reusable official Material compositions required by current scenarios.
```

Generic platform utilities, project-specific shared UI, features, widgets, pages, and app behavior remain outside.

## Dependency direction

```text
shared/lib generic infrastructure
  ├─→ material/foundation
  ├─→ material/components
  └─→ material/patterns

material/foundation → material/components → material/patterns
material library → project-specific shared UI and product layers
```

Higher Material layers may use correctly owned generic utilities directly. Do not create foundation wrappers merely to route generic behavior.

Product imports inside the Material library, dependency inversion, and private cross-family imports are forbidden.

## Public API

The project-facing entry point:

```ts
import { MDButton } from '@shared/ui/material';
```

The root `index.ts` exists now that `MDButton` is a real migrated family. Do not add a new export to it until that family or foundation artifact is itself real.

Now that it exists:

- product consumers use the root entry point by default;
- internal library modules use owning family, foundation, or generic entry points;
- private implementation and testing files remain private.

## New implementation

- Create new official Material components under `components/<family>`.
- Create new foundation artifacts under `foundation/<domain>` only when current work proves the cross-family need.
- Create patterns under `patterns/<pattern>` only after the pattern conditions pass.
- Treat legacy directories as existing owners, not templates for new ownership.
- Create no placeholder files, empty structural layers, or speculative abstractions.

Every new public component includes:

- the mandatory adaptive family-contract core;
- only conditional contract sections applicable to the component;
- colocated component-contract tests;
- one stable canonical visual story when it has visible output;
- `StateMatrix` only when multiple distinct visual routes exist;
- browser, pure, consumer, visual-regression, and operator-review layers only when applicable.

## Physical migration map

This table tracks physical ownership only. Material alignment belongs to component and foundation contracts and registries. Program sequencing belongs to the roadmap.

| Area                                   | Current production owner                            | Canonical owner                                                                     | Migration status              |
| -------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------- |
| Reference/system tokens and theme      | `src/shared/lib/md/tokens.css`                      | `material/foundation/tokens` and `material/foundation/theme` as proven by migration | `legacy`                      |
| Typography utilities                   | `src/shared/lib/md`                                 | `material/foundation/typography`                                                    | `legacy`                      |
| State layer, ripple, and focus         | `src/shared/ui/State`                               | `material/foundation/interaction`                                                   | `legacy`                      |
| Material Symbols                       | `src/shared/ui/Icon`                                | `material/foundation/icon`                                                          | `legacy`                      |
| Material overlay contract              | `src/shared/ui/Overlay` plus generic dependencies   | `material/foundation/overlay`; generic dependencies remain outside                  | `legacy`                      |
| Button family (`MDButton`)             | none (migrated)                                     | `material/components/button`                                                        | `migrated`                    |
| Other existing official `MD*` families | existing `src/shared/ui/<LegacyFamily>` directories | `material/components/<family>`                                                      | `legacy`                      |
| New official Material family           | none                                                | `material/components/<family>`                                                      | create directly as `migrated` |
| Reusable Material patterns             | scattered or missing compositions                   | `material/patterns/<pattern>` after the pattern gate passes                         | `legacy` or `missing`         |

Do not split a valid cohesive owner merely to match this table. Migration follows confirmed ownership and reviewable boundaries.

## Migration status

- `legacy` — current code remains accepted for existing consumers but is not a template for new work;
- `migrating` — one active family or domain migration owns the applicable implementation and consumer changes;
- `migrated` — the canonical owner is active, obsolete paths are removed, proportional proof exists, and required agent/operator review is complete.

A domain must not have parallel permanent legacy and canonical owners. Temporary compatibility requires exact consumers and a removal target.

## Migration rules

Use one cohesive end-to-end family migration by default:

1. inspect the current family and consumers;
2. resolve the supported Expressive contract;
3. correct inaccurate applicable rules;
4. change only required foundations;
5. implement the canonical family;
6. migrate consumers and public exports;
7. add proportional proof;
8. remove obsolete ownership;
9. update only records whose owned facts changed;
10. complete agent review and required operator visual acceptance;
11. update the queue and continue to the next ready family.

Split work only when shared blast radius, compatibility, reviewability, or a safer independently valid state justifies it.

The program sequence is `MDButton`, an independent stateful pilot such as `MDSwitch`, then autonomous priority-driven migration. A genuinely new component is added when the product requires it, not as a process gate.
