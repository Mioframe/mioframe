# Material component audits

This directory stores the latest completed source-backed Material 3 Expressive compliance audit for each component family.

## Ownership

- `src/shared/ui/material/docs/audits/<family-slug>.md` owns the latest completed independent compliance evaluation for one resolved family.
- The family `README.md` owns the accepted implementation contract.
- `../component-registry.md` owns program-level alignment status.
- An audit records evidence and findings; it does not silently change the family contract, registry, inventory, roadmap, implementation, or operator acceptance.

Audits are Material-library artifacts and must not be stored outside `src/shared/ui/material`.

## Naming

Use one stable kebab-case filename per resolved owning family:

```text
button.md
switch.md
navigation-rail.md
```

Do not create dated copies or one file per run. A later review replaces the same file; Git history preserves earlier audits.

When a requested child component belongs to a larger official family, use the resolved owning-family slug rather than the user-entered spelling.

## Required metadata

Every audit records:

- requested name;
- resolved family;
- audit date;
- implementation ref and commit reviewed before the audit write;
- current and canonical owners;
- official source pages and snapshots;
- claimed supported surface;
- required external compatibility scenarios, when any;
- compliance result;
- operator visual status.

## Required sections

Each audit contains:

1. official evidence;
2. claimed supported surface;
3. confirmed findings with severity, source evidence, implementation evidence, mismatch, and required correction;
4. evidence gaps;
5. library-rule defects or agent non-compliance;
6. verified compliant areas;
7. recommended next action.

Use explicit `none` values instead of omitting empty sections.

## Lifecycle

- `material-component-review` creates or replaces the family audit in its review branch.
- The review is incomplete until the audit file is written under this directory and its path is reported.
- The family audit is the only repository file changed by a review-only run; production code, tests, stories, snapshots, registries, family contracts, policy documents, and this README remain unchanged.
- `material-component` and `material-component-authoring` inspect the current family audit when one exists.
- Confirmed findings remain actionable until resolved or shown stale using newer official or implementation evidence.
- After fixes, rerun `material-component-review` to replace the audit with a current result.

An audit status does not become current merely because code changed after its recorded implementation commit.
