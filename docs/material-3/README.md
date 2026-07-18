# Material 3 Expressive policies

This directory contains durable policy for building `src/shared/ui/material` against official Material 3 Expressive sources.

## Library model

```text
src/shared/ui/material/
  foundations/
  styles/
  components/
```

Official component families use official documentation slugs. Example:

```text
m3.material.io/components/buttons
→ src/shared/ui/material/components/buttons
```

## Core policies

### Program and ownership

- [Adoption plan](./adoption-plan.md)
- [Library roadmap](./library-roadmap.md)
- [Library architecture](./library-architecture.md)
- [Shared UI inventory](./ui-library-inventory.md)
- [`src/shared/ui/material` navigation](../../src/shared/ui/material/README.md)

### Sources, foundations, and styles

- [Source of truth](./source-of-truth.md)
- [Foundations and styles architecture](./foundation-architecture.md)
- [Foundation registry](./foundation-registry.md)
- [Units](./units.md)
- [Tokens](./tokens.md)
- [Accessibility](./accessibility.md)
- [Interaction states](./interaction-states.md)
- [Layout and adaptive behavior](./layout-adaptive.md)
- [Icons](./icons.md)

### Components and proof

- [Component architecture](./component-architecture.md)
- [Component testing](./component-testing.md)
- [Autonomous review](./autonomous-review.md)
- [Component registry](./component-registry.md)
- [Component tokens](./component-tokens.md)
- [Authoring checklist](./component-conversion-checklist.md)
- [Storybook](./storybook.md)
- [Verification](./verification.md)
- [Deviations](./deviations.md)

## Fact ownership

- Architecture documents own durable boundaries and workflow rules.
- `library-roadmap.md` owns the active milestone and next action.
- `ui-library-inventory.md` owns classification, priority, and queue state.
- `source-of-truth.md` owns official source hierarchy and source-status rules.
- Family `README.md` owns current implementation documentation and persistent operator feedback.
- Family `AUDIT.md` owns the latest independent two-stage review.
- Registries are summaries and do not override family-local documents.

## Workflow evidence boundary

Material component authoring and review use the current user task, current workspace files, official Material sources, and local project verification.

They do not run, inspect, or cite `git`, `gh`, GitHub, branches, commits, pull requests, diffs, blame, logs, tags, merge state, or repository history.

## Source and inventory status

Every family records:

```text
Canonical source status:
  current-complete
  snapshot-complete-stale
  partial
  conflicting
  unavailable

Official capability inventory:
  complete
  snapshot-complete (<snapshot>; currentness unverified)
  incomplete (<exact gap>)
  blocked (<exact reason>)

Official coverage:
  full
  partial
  unresolved
```

`complete` requires current-complete evidence. A stale snapshot may be snapshot-complete. Partial, truncated, suspicious, missing, or spot-check-only evidence cannot certify complete current inventory.

## Capability classification

Each official item is exactly one of:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- officially unsupported or an invalid combination;
- unresolved because canonical evidence is incomplete or conflicting;
- outside the resolved family boundary.

`Not implemented` means a real official capability exists but is absent.

Officially unsupported combinations are constraints, not missing capability, and do not reduce coverage.

Optional or non-normative guidance is recorded as a choice, deviation, or follow-up. It does not reduce coverage unless required for the implemented surface.

## Family documentation

Each implemented or actively migrated family contains:

```text
src/shared/ui/material/components/<official-docs-slug>/README.md
src/shared/ui/material/components/<official-docs-slug>/AUDIT.md
```

### README

Authoring-owned implementation documentation. It records source status, inventory, coverage, implemented/partial/absent/invalid/unresolved capability, known issues, operator feedback, API, semantics, tokens, states, dependencies, consumers, verification, and review status.

Operator feedback is supplied directly in user messages and persisted in README:

```text
## Operator feedback and visual status
Status: not reviewed | required | rejected | awaiting re-review | accepted
Latest operator feedback: none | <summary>
Implementation response: none | <summary>
```

A reported visual defect means `rejected`. After a production behavior change, authoring may use `awaiting re-review`. Only an explicit user acceptance message may set `accepted`.

Authoring never edits AUDIT.

### AUDIT

Reviewer-owned independent review. It:

1. compares current implementation with project documentation;
2. compares project documentation with canonical Material evidence;
3. independently records source status and classification;
4. verifies that README preserves explicit operator feedback accurately.

Review changes only AUDIT.

## Motion and visual acceptance

Verify a shared motion foundation deeply once.

At component level, use proportional evidence:

- real input activates the intended rendered property;
- one meaningful intermediate state when needed;
- correct endpoint;
- safe interruption or cancellation;
- consumption of the documented shared contract.

Do not require frame-by-frame component analysis or duplicate equivalent input paths. Forced state proves appearance, not motion.

Technical routing or green tests cannot close a rejected visual result. Only a production behavior change followed by explicit user acceptance can do so.

## Shared routes

Root/system tokens, universal selectors, pseudo-elements, and shared formulas require:

- current affected-family analysis;
- the narrowest valid owner;
- representative tests that actually exercise the route;
- explicit current ownership and blast radius.

Unchanged tests that never exercise the route are not proof.

## Entrypoints

### Implement or migrate one family

```text
material-component <component-or-family-name>
```

The same message may include operator feedback. Authoring updates implementation and README, leaves AUDIT unchanged, and runs local verification.

### Review one family

```text
material-component-review <component-or-family-name>
```

Changes only AUDIT and verifies implementation, README, Material evidence, and current operator feedback.

### Continue the program

```text
material-library-next
```

Selects exactly one family and never advances past an active rejected or blocked visual result.

### Read program status

```text
material-library-status
```

Reads roadmap, inventory, registries, README, and AUDIT without changing files.

## Required behavior

- Implement the current applicable Material 3 Expressive contract for the selected surface.
- Use official documentation slugs for canonical ownership.
- Keep implementation scope incremental and classification honest.
- Separate real absent capability from invalid combinations and optional guidance.
- Never certify complete inventory from partial, stale-only, truncated, suspicious, or spot-check-only evidence.
- Never infer implementation from declarations, aliases, stories, or tests when the final route does not work.
- Require representative proof for shared routes.
- Keep component motion proof proportional.
- Preserve operator rejection until corrected and explicitly accepted.
- Remove obsolete ownership during migration.
- Do not create placeholder structures, universal validators, fixed file profiles, or a second metadata database.

A family is fully implemented only with current-complete evidence, independent `Official coverage: full`, and explicit user acceptance when visual review is required.