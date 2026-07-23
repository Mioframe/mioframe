# Material component design skill evaluations

Run these evaluations with every coding-agent model intended to use the skill. Use a clean checkout or discard generated artifacts between cases.

The skill is not stable until all required cases pass on real runs.

## Evaluation 1: exact official name

Prompt:

```text
Use material-component-design for Switch.
```

Expected:

- resolves one current official Material component through the configured `material3` MCP;
- changes only `src/shared/ui/material/components/<official-slug>/DESIGN.md`;
- does not attempt direct `m3.material.io` browsing or scraping;
- records the MCP cache snapshot identity/capture timestamp and original official route URLs;
- accounts for every applicable MCP component record as inspected or not applicable;
- does not inspect Mioframe component source, tests, stories, consumers, tokens, README, or audits;
- follows `DESIGN-TEMPLATE.md`;
- assigns requirement IDs and source IDs to normative content;
- returns `review-ready` or an evidence-backed `blocked`, never newly sets `approved`.

## Evaluation 2: harmless alias

Prompt:

```text
Use material-component-design for Button.
```

Expected:

- normalizes the singular/plural difference only when the MCP catalogue target is unambiguous;
- uses the canonical official title and route slug in the artifact;
- preserves the family boundary represented by the MCP graph;
- does not create a project-specific family name or merge separately documented components;
- changes exactly one artifact file.

## Evaluation 3: ambiguous or non-catalogue term

Prompt:

```text
Use material-component-design for Menu button.
```

Expected:

- does not guess from Mioframe code, direct web search, or general knowledge;
- reports official candidates returned by the MCP catalogue or that no exact target exists;
- creates no `DESIGN.md` under a guessed path;
- makes no repository changes.

## Evaluation 4: incomplete MCP guidance

Prompt:

```text
Use material-component-design for a current official component whose MCP records omit at least one visual or interaction detail.
```

Expected:

- records `Not specified by the inspected Material MCP records`;
- does not import Figma, Material Web, MDN, WAI-ARIA, blogs, memory, direct-site scraping, or screenshot inference;
- records unavailable cache provenance as a source gap instead of inventing it;
- uses `blocked` only when the gap prevents a coherent design contract;
- otherwise remains `review-ready` with a visible source gap.

## Evaluation 5: rerun with an existing artifact

Setup:

- an existing `DESIGN.md` has `approval: approved`;
- MCP snapshot identity and normative records are unchanged in one run and materially changed in another.

Expected:

- reads the existing artifact only as prior artifact state, never as Material authority;
- preserves `approval: approved` only when normative content, requirement IDs, source evidence, and snapshot identity are unchanged;
- resets approval to `pending` when any normative content, source snapshot, source conflict, or source gap changes;
- never silently discards unresolved conflicts or prior source gaps.

## Evaluation 6: cross-section conflict

Prompt:

```text
Use material-component-design for Buttons and reconcile all content and accessibility conditions before selecting status.
```

Expected:

- compares label wrapping guidance with text-scaling accessibility guidance;
- expresses conditional exceptions explicitly when the MCP records support them;
- records an unresolved source conflict when they cannot be reconciled;
- does not check the consistency acceptance item while the contradiction remains;
- does not use `review-ready` when a contradiction prevents an unambiguous contract.

## Evaluation 7: spring motion source

Prompt:

```text
Use material-component-design for an official component whose MCP token tables define spring damping and stiffness.
```

Expected:

- records `spring` as the motion model;
- places damping and stiffness in published parameters;
- does not invent duration or easing;
- keeps table columns valid;
- links the motion requirement to source and token records.

## Observed pilot

PR 163 was generated from the pre-fix skill using `Buttons`.

Passed:

- exact target resolution;
- single-artifact write boundary;
- Material-only content boundary;
- no Mioframe implementation or architecture leakage;
- broad component surface and token capture.

Failed or not proven:

- MCP snapshot provenance was not distinguished from artifact generation metadata;
- applicable MCP record coverage was not explicitly accounted for;
- requirements had no stable IDs;
- conformance cases could introduce facts not defined elsewhere;
- cross-section consistency did not detect label wrapping vs 200% text-scale tension;
- the duration/easing-shaped motion table did not represent spring parameters cleanly;
- `status: review-ready` was selected without these gates passing.

Treat this pilot as a failed evaluation of the previous skill version, not as evidence that the updated skill passes.

## Cross-model results

Record actual results; do not prefill passes.

| Model               | Eval 1  | Eval 2  | Eval 3  | Eval 4  | Eval 5  | Eval 6  | Eval 7  | Notes |
| ------------------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ----- |
| Claude Haiku        | not run | not run | not run | not run | not run | not run | not run |       |
| Claude Sonnet       | not run | not run | not run | not run | not run | not run | not run |       |
| Claude Opus         | not run | not run | not run | not run | not run | not run | not run |       |
| OpenAI coding model | not run | not run | not run | not run | not run | not run | not run |       |

Update the skill only from concrete failures observed during these runs. Document review and repository CI verify structure and compatibility, not task effectiveness.
