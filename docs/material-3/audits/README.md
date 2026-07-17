# Material component audits

This directory stores the latest completed source-backed Material 3 Expressive compliance review for each component family.

An audit may review either an exact commit or the current coding workspace. The binding must be explicit; never invent commit metadata.

## Ownership

- `docs/material-3/audits/<family-slug>.md` owns the latest completed compliance evaluation for one resolved family.
- The family `README.md` owns the accepted implementation contract.
- The component registry owns program-level alignment status.
- An audit records evidence and findings; it does not silently change the accepted contract or registry state.

## Naming

Use one stable kebab-case filename per resolved family:

```text
button.md
switch.md
navigation-rail.md
```

Do not create dated copies. A later review replaces the same file; Git history preserves earlier audits.

When a requested child component belongs to a larger official family, use the resolved family slug rather than the raw user input.

## Audit binding

Use exactly one:

- `commit-bound` — the reviewer directly verified the exact implementation commit;
- `workspace-reviewed` — the reviewer inspected the current workspace but had no trustworthy commit identity.

A workspace-reviewed audit is useful implementation evidence but is provisional for merge. It cannot by itself certify green CI, terminal migration/alignment status, operator acceptance, or merge readiness.

Do not describe an audit as fresh or final merely because it was written after implementation edits.

## Required metadata

Every audit records:

- requested name;
- resolved family;
- audit date;
- audit binding;
- implementation ref and commit when directly verified, otherwise `unavailable to this agent`;
- current and canonical physical owners;
- official source pages, exact token references, and snapshots;
- claimed supported surface;
- required consumer scenarios;
- compliance result;
- operator visual status;
- local verification actually run;
- external verification status.

The canonical owner comes from repository architecture and the physical migration map. A legacy file does not become canonical merely because it is the only implementation.

## Required sections

Each audit contains:

1. official evidence;
2. claimed supported surface;
3. required consumer scenarios;
4. confirmed findings with severity, source evidence, implementation evidence, mismatch, and required correction;
5. evidence gaps;
6. project-rule defects;
7. verified compliant areas;
8. recommended next action.

Use explicit `none` values instead of omitting empty sections.

## Evidence boundary

Audit implementation correctness at the owning layer.

- Code, token routes, selectors, DOM ownership, foundation contracts, and focused tests are valid implementation evidence.
- A declared token or intermediate variable is insufficient when it is not consumed by the final owned contract.
- A route exists only when changing the source input can affect the final output through a real dependency.
- Colocation, aliases to unchanged constants, equality assertions, and explanatory comments do not create a dependency.
- Shared foundation behavior is proved by the foundation owner and consumed by components; do not re-prove browser or framework internals in every family.
- Use browser evidence only for browser-owned behavior or final computed behavior that cannot be established reliably from source and contract tests.
- Do not require frame-by-frame motion sampling, browser interpolation analysis, or duplicate input-path checks.
- A reproducible user-visible mismatch requires investigation, but use the narrowest evidence needed to identify the implementation defect.
- A global `:root`, universal-selector, pseudo-element, or system-token change requires explicit cross-family blast-radius evidence.

## Compliance and terminal state

`compliant` requires all of:

- technically correct implementation;
- commit-bound audit;
- applicable external verification;
- operator visual acceptance when required.

A workspace-reviewed implementation that passes all agent-owned checks uses `technically-compliant-visual-review-required`, with external verification marked `required`.

The coding agent must not update terminal program records solely from its own workspace review:

- physical migration remains `migrating`;
- component status remains non-terminal such as `partial`;
- roadmap milestone remains `active`;
- operator status remains `required` or `blocked`.

A GitHub-enabled reviewer updates `migrated`, `aligned`, milestone `done`, and merge readiness only after verifying the current PR head, CI, audit binding, and operator result.

## Lifecycle

- `material-component-review` creates or replaces the family audit.
- The review is incomplete until the file is written and its path is reported.
- A review-only run changes only the family audit; it does not modify production code, tests, stories, snapshots, registries, contracts, roadmap, or policy.
- `material-component` and `material-component-authoring` inspect the current audit when one exists.
- Findings remain actionable until resolved or shown stale with newer official or implementation evidence.
- After implementation and local verification, rerun `material-component-review` against the current workspace.
- External GitHub-enabled review binds the result to the actual PR head and current CI.

An audit does not become commit-bound merely because code was committed after it was written.
