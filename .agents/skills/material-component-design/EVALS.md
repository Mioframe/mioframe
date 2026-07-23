# Material component design skill evaluations

Run these evaluations with every coding-agent model intended to use the skill. Use a clean checkout or discard generated artifacts between cases.

The skill is not stable until all required cases pass on real runs.

## Evaluation 1: exact official name

Prompt:

```text
Use material-component-design for Switch.
```

Expected:

- resolves one current official Material component;
- changes only `src/shared/ui/material/components/<official-slug>/DESIGN.md`;
- uses only inspected `m3.material.io` pages as normative evidence;
- does not inspect Mioframe component source, tests, stories, consumers, tokens, README, or audits;
- follows `DESIGN-TEMPLATE.md`;
- records source IDs on every requirement group or table row;
- returns `review-ready` or an evidence-backed `blocked`, never newly sets `approved`.

## Evaluation 2: harmless alias

Prompt:

```text
Use material-component-design for Button.
```

Expected:

- normalizes the singular/plural difference only when the official target is unambiguous;
- uses the canonical official title and URL slug in the artifact;
- does not create a project-specific family name or merge separately documented components;
- changes exactly one artifact file.

## Evaluation 3: ambiguous or non-catalogue term

Prompt:

```text
Use material-component-design for Menu button.
```

Expected:

- does not guess from Mioframe code or general web results;
- reports official candidate names or that no exact target exists;
- creates no `DESIGN.md` under a guessed path;
- makes no repository changes.

## Evaluation 4: incomplete official guidance

Prompt:

```text
Use material-component-design for a current official component whose published pages omit at least one visual or interaction detail.
```

Expected:

- records `Not specified by the inspected Material sources`;
- does not import Figma, Material Web, MDN, WAI-ARIA, blogs, memory, or screenshot inference;
- uses `blocked` only when the gap prevents a coherent design contract;
- otherwise remains `review-ready` with a visible source gap.

## Evaluation 5: rerun with an existing artifact

Setup:

- an existing `DESIGN.md` has `approval: approved`;
- official source content is unchanged in one run and materially changed in another.

Expected:

- reads the existing artifact only as prior artifact state, never as Material authority;
- preserves `approval: approved` only when normative content and source evidence are unchanged;
- resets approval to `pending` when any normative content, source snapshot, source conflict, or source gap changes;
- never silently discards unresolved conflicts or prior source gaps.

## Cross-model results

Record actual results; do not prefill passes.

| Model | Eval 1 | Eval 2 | Eval 3 | Eval 4 | Eval 5 | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Claude Haiku | not run | not run | not run | not run | not run | |
| Claude Sonnet | not run | not run | not run | not run | not run | |
| Claude Opus | not run | not run | not run | not run | not run | |
| OpenAI coding model | not run | not run | not run | not run | not run | |

Update the skill only from concrete failures observed during these runs. Document review and repository CI verify structure and compatibility, not task effectiveness.
