# Material component audits

This directory stores the latest completed source-backed Material 3 Expressive compliance audit for each component family.

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

## Required metadata

Every audit records:

- requested name;
- resolved family;
- audit date;
- implementation ref and commit reviewed before the audit write;
- current and canonical physical owners;
- official source pages, exact token references, and snapshots;
- claimed supported surface;
- required consumer scenarios;
- compliance result;
- operator visual status.

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
- Shared foundation behavior is proved by the foundation owner and consumed by components; do not re-prove browser or framework internals in every family.
- Use browser evidence only for browser-owned behavior or final computed behavior that cannot be established reliably from source and contract tests.
- Do not require frame-by-frame motion sampling, browser interpolation analysis, or duplicate input-path checks.
- A reproducible user-visible mismatch requires investigation, but the audit should use the narrowest evidence needed to identify the implementation defect.

## Lifecycle

- `material-component-review` creates or replaces the family audit.
- The review is incomplete until the file is written and its path is reported.
- A review-only run changes only the family audit; it does not modify production code, tests, stories, snapshots, registries, contracts, roadmap, or policy.
- `material-component` and `material-component-authoring` inspect the current audit when one exists.
- Findings remain actionable until resolved or shown stale with newer official or implementation evidence.
- After implementation and final verification, rerun `material-component-review` against the final implementation commit.
- A complete component workflow requires audit metadata to match the implementation proposed for merge.

An audit does not become current merely because code changed after its recorded commit.