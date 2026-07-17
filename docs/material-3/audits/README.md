# Material component audits

This directory stores the latest completed source-backed Material 3 Expressive compliance audit for each component family.

## Ownership

- `docs/material-3/audits/<family-slug>.md` owns the latest completed compliance evaluation for one resolved family.
- The family `README.md` remains the owner of the accepted implementation contract.
- The component registry remains the owner of program-level alignment status.
- An audit records evidence and findings; it does not silently change the accepted contract or registry state.

## Naming

Use one stable kebab-case filename per resolved owning family:

```text
button.md
switch.md
navigation-rail.md
```

Do not create dated copies or one file per run. A later review replaces the same family audit file; Git history preserves prior audits.

When a requested child component belongs to a larger official family, use the resolved owning family slug rather than the user-entered spelling.

## Required metadata

Every audit records:

- requested name;
- resolved family;
- audit date;
- implementation ref and commit reviewed before the audit-file write;
- current and canonical owners;
- official source pages and snapshots;
- claimed supported surface;
- required consumer scenarios;
- compliance result;
- operator visual status.

## Required sections

Each audit contains:

1. official evidence;
2. claimed supported surface and required scenarios;
3. confirmed findings with severity, source evidence, implementation evidence, mismatch, and required correction;
4. evidence gaps;
5. project-rule defects;
6. verified compliant areas;
7. recommended next action.

Use explicit `none` values instead of omitting empty sections.

## Lifecycle

- `material-component-review` creates or replaces the family audit in its review branch.
- The review is incomplete until the audit file is written and its path is reported.
- Review-only work may change this audit file and this directory's documentation, but not production code, tests, stories, snapshots, registries, family contracts, or rules.
- `material-component` and `material-component-authoring` must inspect the current family audit when one exists.
- Confirmed findings remain actionable until resolved or shown to be stale using newer official or implementation evidence.
- After fixes, rerun `material-component-review` to replace the audit with a current result.

An audit status does not become current merely because code changed after the recorded implementation commit. Consumers must compare the audit metadata with the implementation under review.
