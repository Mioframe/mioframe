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
- current and canonical physical owners;
- official source pages, exact token references, and snapshots;
- claimed supported surface;
- required consumer scenarios;
- compliance result;
- operator visual status.

The canonical owner comes from the repository architecture and physical migration map. An existing legacy file does not become canonical merely because it is the only owner.

## Required sections

Each audit contains:

1. official evidence;
2. claimed supported surface and required scenarios;
3. empirical interaction evidence for every applicable visible interaction;
4. confirmed findings with severity, source evidence, implementation evidence, mismatch, and required correction;
5. evidence gaps;
6. project-rule defects;
7. verified compliant areas;
8. recommended next action.

Use explicit `none` values instead of omitting empty sections.

## Empirical interaction evidence

For visible interactive components, the audit records:

- canonical story, preview, or focused product surface;
- browser command and environment;
- real pointer, keyboard, and touch sequence when applicable;
- resting, onset, intermediate, release, interruption or cancellation, and settled observations;
- actual animated property owner;
- official duration, easing, spring, state, or reduced-motion evidence;
- pass, fail, or blocked result.

Forced-state classes, static screenshots, final endpoint equality, CSS declarations, and existing tests do not replace direct real-browser reproduction. For spring-driven motion, a fixed duration/easing approximation requires traceable derivation and empirical trajectory evidence. A visibly incorrect interaction is a confirmed finding even when CI and endpoint tests pass.

## Lifecycle

- `material-component-review` creates or replaces the family audit in its review branch.
- The review is incomplete until the audit file is written and its path is reported.
- The family audit is the only repository file changed by a review-only run; production code, tests, stories, snapshots, registries, family contracts, policy documents, and this directory's README remain unchanged.
- `material-component` and `material-component-authoring` must inspect the current family audit when one exists.
- Confirmed findings remain actionable until resolved or shown to be stale using newer official or implementation evidence.
- After implementation and final verification, rerun `material-component-review` against the final implementation commit and replace the audit.
- A complete component workflow requires the final audit commit metadata to match the implementation being proposed for merge.

An audit status does not become current merely because code changed after the recorded implementation commit. Consumers must compare the audit metadata with the implementation under review.