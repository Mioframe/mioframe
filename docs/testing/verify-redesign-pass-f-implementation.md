# Verify redesign — Pass F implementation

## Status

Architecture resolved. Implementation has not started.

Pass F is the final verify-redesign pass. It is a bounded public-command / compatibility cleanup; it is not another verifier architecture pass.

Current reviewed branch state before Pass F implementation:

- PR #218: `refactor(testing): redesign verification ownership`;
- current pre-Pass-F head inspected: `514acb6d46d41e3fe8de3f6493a7c91c9032fef9`;
- exact-head GitHub Actions run `32962324169` / run number `4398`: success;
- Pass A-E: architect-accepted;
- canonical public verification types and full-mode semantics are already executable and frozen.

## Goal

Finish the migration from transitional release/public verification compatibility to the canonical public contract already defined by `docs/testing/architecture.md`:

```text
pnpm verify
pnpm verify --only <type>
pnpm verify --files <paths...>
pnpm verify --only <type> --files <paths...>
pnpm verify --full
pnpm verify:status
pnpm verify:resume
pnpm verify --fix-only
```

`pnpm verify --full` is the only release-grade full verification entry point. It runs all eight verification types, including the complete registered mutation inventory, with no affected narrowing. `--full` remains incompatible with `--only` and `--files`.

## Non-goals

Pass F must not:

- redesign affected selection, verification ownership, or the eight public types;
- add a `release` or `managed-updates` public type;
- make `--full --only ...` valid;
- change product behavior or test meaning;
- change lock ownership, container boundaries, timeouts, logging, status/resume, profile/base handling, or fix semantics;
- rename internal release/artifact runners or labels merely to remove the word `release`;
- remove `e2e:release` or other internal commands that still own real built-artifact, service-worker, fresh-container, or cross-engine execution constraints;
- rewrite historical release notes solely to erase old command names.

## Confirmed consumer inventory

### Executable public compatibility

`package.json`

- still exposes `verify:release` as `node scripts/verify.ts --full`;
- this is now redundant compatibility, not a distinct contract.

`.github/workflows/release.yml`

- is the remaining required workflow consumer of `pnpm verify:release`;
- its full release step must invoke literal `pnpm verify --full --verbose`;
- surrounding comments must describe the canonical command, not the alias.

After this workflow migration and active-current documentation cleanup, no required repository consumer justifies keeping the `verify:release` package alias. Remove the alias rather than retaining two names for the same public contract.

### Already canonical workflow consumers

`.github/workflows/verify.yml`

- already invokes public verification types (`static`, `unit`, `mutation`, `e2e`, `behavior`, `visual`);
- its lane topology is not Pass F scope;
- private leaf labels mentioned as internal implementation detail are not public compatibility and do not require renaming.

`.github/workflows/release-tag.yml`

- remains a lightweight tag/version validation workflow;
- its behavior must not change;
- only stale commentary referring to `pnpm verify:release` needs correction.

### Active CLI/help compatibility

`scripts/verify.ts`

- full-mode implementation is already canonical and accepted;
- help text still advertises `pnpm verify:release` as equivalent to `--full` and lists the alias as an example;
- remove those public-help references without changing full-mode planning or execution.

### Active current documentation / instructions

These current sources still describe removed compatibility as executable/public and must be aligned with the accepted target:

- `AGENTS.md`;
- `.agents/skills/verification/SKILL.md`;
- `DEVELOPMENT.md`;
- `docs/release.md`;
- `docs/release-checklist.md`;
- `docs/managed-pinned-updates.md`;
- active comments in `.github/workflows/release.yml`, `.github/workflows/release-tag.yml`, and `scripts/release/buildArtifact.mjs`.

Required corrections include:

- replace `pnpm verify:release` current guidance with `pnpm verify --full`;
- stop presenting low-level verifier labels as valid `--only` values;
- remove current guidance such as `pnpm verify --full --only managed-updates`, `pnpm verify --full --only artifact`, or `pnpm verify --full --only publisher-node-import`;
- correct stale release documentation claiming mutation is outside full verification: accepted full mode includes every registered mutation target;
- describe managed-update release proof through its owning canonical types (`static`, `browser-integration`, `e2e`) plus the complete `pnpm verify --full` gate, not through a public `managed-updates` label;
- describe `publisher-node-import`, artifact, release-smoke, and managed-update leaf names only as internal proof labels/runners when the implementation detail is materially useful.

Historical release notes and historical design records may retain old command names when they clearly document an earlier repository state and are not current instructions or executable consumers.

## Ownership decision

The public source of truth is the canonical verifier CLI and eight verification types in `docs/testing/architecture.md`.

Internal release-named execution remains owned by the concrete constraint it implements:

- built production artifact preparation;
- service-worker/runtime proof;
- fresh Playwright container execution;
- cross-engine managed-update proof;
- release publication/version/config tooling.

Public compatibility and internal execution naming are separate concerns. Pass F removes the former and preserves the latter.

## Minimum implementation design

The simplest complete solution is direct consumer migration and stale-guidance removal:

1. change the `main` release workflow to literal `pnpm verify --full --verbose`;
2. remove the now-unneeded `verify:release` package script;
3. remove the alias from verifier help;
4. update active current docs/instructions/comments to the canonical command/type model;
5. leave accepted verifier algorithms and internal release runners unchanged.

A compatibility deprecation layer, second alias, command redirect, or additional abstraction is unnecessary because the repository controls the known consumers and the canonical replacement already exists.

## Required removal / preservation

Remove:

- the `verify:release` package alias after its required workflow consumer is migrated;
- active current instructions advertising that alias;
- active current instructions advertising private low-level `--only` labels;
- stale claims that mutation is excluded from `pnpm verify --full`.

Preserve:

- canonical eight public types;
- `pnpm verify --full` semantics and rejection of narrowing flags;
- private verifier leaf labels used for planning/logs/locks/timeouts;
- `e2e:release` and release/artifact scripts where they own real execution boundaries;
- production-artifact routing and managed-update proof matrix;
- Pass A-E accepted behavior.

## TEST IMPACT

### Public full/release command contract

- Contract/scenario: the stable `main` release workflow invokes the canonical full verifier entry point and no repository workflow depends on the removed alias.
- Primary proof owner: workflow/config inspection plus existing verifier CLI/full-mode tests.
- Additional proof: exact-head GitHub CI after Pass F publication.
- Existing proof: `scripts/verify.test.ts` / invocation tests already prove canonical public types, full-mode behavior, complete mutation participation, and invalid narrowing combinations.
- New/updated proof: update tests only if a current assertion explicitly depends on removed help/alias text; do not add a second compatibility test surface.
- Risk/platform matrix: GitHub Actions release workflow plus Node CLI; no product/browser behavior change.
- Durable ownership/impact updates: `package.json`, release workflow, active current verification/release documentation.

### Managed-update / release documentation contract

- Contract/scenario: current docs describe the already-accepted canonical type ownership and full gate without executable private-label examples.
- Primary proof owner: source/documentation inspection and static repository verification.
- Additional proof: none beyond exact-head CI unless a changed script/help test requires focused unit proof.
- Existing proof: accepted Pass C-E type ownership and full-mode tests.
- New/updated proof: none expected unless current tests assert stale text.
- Risk/platform matrix: documentation/tooling only; managed-update runtime/browser matrix remains unchanged.
- Durable ownership/impact updates: active release/development/verification guidance only.

## Acceptance criteria

Pass F implementation is complete when all are true:

1. `.github/workflows/release.yml` runs `pnpm verify --full --verbose` for the full `main` release gate.
2. `package.json` no longer defines `verify:release`.
3. `scripts/verify.ts --help` no longer advertises the removed alias.
4. No repository workflow invokes a removed/private low-level public `--only` label.
5. No active current instruction tells users/agents to run `pnpm verify:release`.
6. No active current instruction presents `--full --only ...` as valid.
7. No active current instruction presents `managed-updates`, `artifact`, `publisher-node-import`, or another private leaf as a public verification type.
8. Current release documentation states that `pnpm verify --full` includes mutation and all current verification inventories.
9. Internal release/artifact runners and accepted Pass A-E semantics are unchanged except for comments/help necessary to describe the public contract accurately.
10. Historical documents are not mechanically rewritten solely to remove old strings.
11. Full resulting PR review finds no blocker/major issue and no architectural drift.
12. Exact-head GitHub CI is green on the final resulting PR head.

## Verification

Implementation feedback should be the smallest faithful verifier-managed proof for files actually changed. Do not require a broad local full run solely to duplicate CI.

Before Pass F acceptance, architect review must inspect:

- current repository consumers of `verify:release` and distinguish active-current use from historical text;
- current repository occurrences of invalid/public low-level command examples such as `--full --only`;
- workflow commands in `.github/workflows/verify.yml`, `.github/workflows/release.yml`, and `.github/workflows/release-tag.yml`;
- `package.json` public scripts;
- verifier help/public CLI contract;
- full resulting PR relative to `develop`;
- exact-head GitHub CI.

## Stop condition

If implementation discovers a required external/repository consumer that genuinely still depends on `verify:release`, do not add another compatibility mechanism or silently keep the alias. Report the concrete consumer so the architecture decision can be revisited. Otherwise remove the alias in this pass.
