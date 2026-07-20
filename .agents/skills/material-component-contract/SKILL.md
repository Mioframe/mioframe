---
name: material-component-contract
description: 'Internal-only Material stage. Never use directly for a user request. Use exclusively when material-component delegates independent canonical-target resolution, current implementation assessment, alignment classification, correction-unit planning, decomposition, and proof ownership for one family.'
---

# Material component contract

Internal stage only. `material-component` must lock the family, mode, correction objective, required scenarios, and non-goals before invoking it.

## Inputs

Read:

- root and applicable nested `AGENTS.md` files;
- `src/shared/ui/material/docs/architecture.md`;
- `src/shared/ui/material/docs/sources.md`;
- the contract, assessment, and correction-blueprint phase of `src/shared/ui/material/docs/component-development.md`;
- current official Material 3 Expressive sources for the required scenarios;
- current implementation, exports, consumers, stories, tests, snapshots, known defects, and legacy contract when present.

## Responsibility

Execute the contract stage in two independent passes.

### Canonical target

Resolve and record the current applicable official Material contract before using legacy behavior to decide Material semantics, API, anatomy, state, tokens, styles, motion, or proof.

Record exact unresolved source conflicts. Narrow optional surface when required scenarios remain complete; otherwise return an exact blocker. Do not choose the existing implementation merely because official evidence is incomplete.

### Current implementation assessment

After the target is recorded, inspect current code and proof. Classify each relevant concern as:

- `confirmed-compliant`;
- `project-extension`;
- `misaligned`;
- `unresolved`;
- `obsolete`.

Classify existing tests, stories, snapshots, and fixtures as canonical proof, compatibility proof, implementation-detail proof, legacy-defect preservation, or obsolete. Passing legacy proof never establishes Material correctness by itself.

Write the single durable family owner at `components/<family>/README.md`, or at the permitted temporary legacy location while the active implementation remains outside the canonical boundary.

The README must contain the canonical target, current implementation assessment, alignment map, implementation decomposition, style and motion ownership, proof map, compatibility impact, representative consumers, correction units, implementation order, remaining known gaps, and every required foundation dependency.

Select the smallest complete correction units required by the current objective. Do not require full-family rewrite when smaller owner corrections produce a complete valid result. Permit a local owner replacement only when incremental correction would preserve wrong ownership or add more workaround logic.

Return any missing cross-family foundation capability as exact required work. Do not create a family-local substitute or invoke another stage.

## Exit gate

Pass only when:

```text
Current objective readiness: ready
Family alignment status: aligned | converging
```

and:

- the canonical target is independently resolved for the current objective;
- source conflicts affecting the objective are resolved, narrowed, or reported as blockers;
- current implementation and proof are classified honestly;
- every correction unit has one owner, dependency set, proof, compatibility impact, and completion condition;
- decomposition and style or motion ownership are explicit;
- representative consumers and foundation requirements are named;
- remaining gaps are explicit and do not make the current correction objective or merged state invalid.

`Family alignment status: converging` is allowed for a bounded correction objective. It is not permission to merge a broken intermediate mechanism or hide required gaps.

## Result

```text
MATERIAL STAGE RESULT

Family:
Stage: contract
Status: complete | blocked
Exit gate: passed | failed
Current objective result:
Family alignment status: aligned | converging | blocked
Evidence:
Canonical target:
Current implementation assessment:
Alignment classifications:
Implementation decomposition:
Style and motion ownership:
Proof map and existing-proof classification:
Current correction units:
Implementation order:
Required foundation work: none | <exact work>
Representative consumers:
Remaining known gaps:
Next correction unit: none | <exact unit>
Blocker: none | <exact blocker>
```

## Forbidden

- direct user invocation;
- production component edits, executable proof implementation, or consumer migration;
- inspecting legacy behavior first and deriving the canonical target from it;
- blanket `preserve behavior`, `relocation only`, `verbatim copy`, or `no redesign` decisions before assessment;
- treating existing tests, stories, snapshots, token names, or consumer dependence as Material authority;
- unresolved placeholders or speculative surface, APIs, files, foundations, or abstractions;
- requiring a full-family rewrite when smaller complete correction units are sufficient;
- roadmap updates or starting another stage;
- a universal file template or artifact count;
- another family contract, durable audit, separate checklist, registry, or progress record.
