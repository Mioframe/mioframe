# Mioframe Material library

`src/shared/ui/material` is the canonical source boundary for Mioframe's Material implementation and Material-library documentation.

The library contains:

- `docs` — architecture, workflow, source policy, foundation policies, roadmap, inventory, audits, and verification contracts;
- `foundation` — cross-family Material contracts required by approved current work;
- `components` — official public Material component families;
- `patterns` — reusable official Material compositions independent of product domains.

Generic platform utilities, project-specific shared UI, features, widgets, pages, product documentation, and app behavior remain outside.

## Canonical documentation

Start with:

- `docs/workflow.md`;
- `docs/source-of-truth.md`;
- `docs/library-architecture.md`;
- `docs/component-architecture.md`;
- `docs/foundation-architecture.md`;
- `docs/component-testing.md`.

Program state is owned by `docs/library-roadmap.md`, `docs/ui-library-inventory.md`, `docs/foundation-registry.md`, and `docs/audits/<family>.md` according to their documented boundaries.

## Ownership map

```text
material/docs
  Material library architecture, source policy, workflow, program records, and review evidence.

material/foundation
  Cross-family Material tokens, roles, primitives, adapters, and verification helpers required by approved work.

material/components
  Official public component families, approved family contracts, implementations, stories, and focused tests.

material/patterns
  Reusable official Material compositions required by current scenarios.
```

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

## Development process

The required sequence is:

```text
approved architecture and ready family contract
→ material-component-implementation
→ material-component-review
→ operator visual acceptance when required
→ merge
```

A component name alone is not sufficient to start production edits. The family contract must resolve supported surface, ownership, public API, semantics, foundations, consumers, acceptance criteria, and verification, and must record `Readiness: ready`.

The coding agent implements the approved contract. It does not approve architecture, independently review its own work, or claim merge readiness.

## Public API

The intended project-facing entry point is:

```ts
import { MDButton } from '@shared/ui/material';
```

Do not create the root production `index.ts` until at least one real family or foundation artifact can be exported honestly.

After it exists:

- product consumers use the root entry point by default;
- internal library modules use owning family, foundation, or generic entry points;
- private implementation and testing files remain private.

## New implementation

- Create new official Material components under `components/<family>`.
- Create new foundation artifacts under `foundation/<domain>` only when approved current work proves the cross-family need.
- Create patterns under `patterns/<pattern>` only after the pattern conditions pass.
- Treat legacy directories as existing owners, not templates for new ownership.
- Create no placeholder files, empty structural layers, speculative abstractions, manager agents, or execution state machines.

Every new public component includes:

- an architect-approved family contract with `Readiness: ready`;
- colocated component-contract tests;
- one stable canonical visual story when it has visible output;
- browser, pure, consumer, visual-regression, and operator-review layers only when owned by the contract.

## Physical migration map

This table tracks physical ownership only. Material correctness belongs to approved family/foundation contracts and independent audits. Program sequencing belongs to the roadmap.

| Area                              | Current production owner                            | Canonical owner                                                                     | Migration status              |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------- |
| Material documentation            | `src/shared/ui/material/docs`                       | `src/shared/ui/material/docs`                                                       | `migrated`                    |
| Reference/system tokens and theme | `src/shared/lib/md/tokens.css`                      | `material/foundation/tokens` and `material/foundation/theme` as proven by migration | `legacy`                      |
| Typography utilities              | `src/shared/lib/md`                                 | `material/foundation/typography`                                                    | `legacy`                      |
| State layer, ripple, and focus    | `src/shared/ui/State`                               | `material/foundation/interaction`                                                   | `legacy`                      |
| Material Symbols                  | `src/shared/ui/Icon`                                | `material/foundation/icon`                                                          | `legacy`                      |
| Material overlay contract         | `src/shared/ui/Overlay` plus generic dependencies   | `material/foundation/overlay`; generic dependencies remain outside                  | `legacy`                      |
| Existing official `MD*` families  | existing `src/shared/ui/<LegacyFamily>` directories | `material/components/<family>`                                                      | `legacy`                      |
| New official Material family      | none                                                | `material/components/<family>`                                                      | create directly as `migrated` |
| Reusable Material patterns        | scattered or missing compositions                   | `material/patterns/<pattern>` after the pattern gate passes                         | `legacy` or `missing`         |

Do not split a valid cohesive owner merely to match this table. Migration follows confirmed ownership and reviewable boundaries.

## Migration status

- `legacy` — current code remains accepted for existing consumers but is not a template for new work;
- `migrating` — one active approved family or domain migration owns the applicable implementation and consumer changes;
- `migrated` — the canonical owner is active, obsolete paths are removed, proportional proof exists, independent review passes, and required visual acceptance is recorded.

A domain must not have parallel permanent legacy and canonical owners. Temporary compatibility requires exact consumers and a removal target.
