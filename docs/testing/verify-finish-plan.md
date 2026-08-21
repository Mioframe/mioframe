# Verify modernization finish plan

Status: implementation-ready execution plan for the remaining verifier modernization work.

This document owns **implementation packaging and pass order only**. It does not redefine proof ownership or planner semantics.

Authoritative contracts remain:

- `docs/testing/architecture.md` — project-wide testing policy;
- `docs/testing/verify-target-architecture.md` — verifier impact/planning target architecture;
- `docs/testing/verify-agent-output.md` — default agent-facing progress and diagnostics contract;
- `docs/testing/verify-change-classification.md` — repository metadata/change-classification contract;
- `.agents/skills/verification/SKILL.md` — coding-agent verification workflow;
- `.agents/skills/test-first/SKILL.md` and `.agents/skills/test-authoring/SKILL.md` — independent proof-authoring workflow.

Any older `PR 0`, `PR 1`, `PR 2A`, `PR 2B`, or `PR 2C` wording in verifier design documents names a logical implementation slice. Those slices are no longer separate merge units. The remaining modernization is implemented in **one branch and one pull request** using the bounded passes below.

## Goal

Finish the resolved verifier architecture without creating five separate PR/merge/CI cycles and without turning the work into one unstructured coding pass.

The final PR must deliver one coherent end state:

```text
bounded agent-facing verify output
        +
precise repository metadata classification
        +
status-safe unit impact
        +
explicit mutation ownership
        +
source-impact release planning
        +
parallel release CI placement
        +
representative benchmark
```

The PR is reviewed and accepted as the complete resulting system, not as a sequence of independently accepted partial architectures.

## Branch, Git, and PR ownership

Use one implementation branch for all remaining work and publish one final PR against the intended integration base.

The **architect/integration owner**, not a coding or test-author agent, owns Git and GitHub lifecycle operations for this work:

- create, select, switch, merge, rebase, or delete branches/worktrees;
- stage, commit, amend, stash, reset, revert, cherry-pick, or otherwise mutate repository history/index state;
- push/publish branch state;
- create/update the PR and inspect exact-head CI;
- choose commit boundaries used for review/history.

Coding and test-author agents work only in the already-prepared workspace and own file edits plus task-relevant project commands. They must not run direct `git ...` commands, including read-only status/diff/log commands, to manage or inspect repository state. Project-owned commands such as `pnpm verify ...` may use Git internally as an implementation detail; that does not transfer Git ownership to the agent.

Within the prepared workspace:

- keep each pass bounded and independently understandable;
- leave pass results in the working tree and report them clearly for architect handoff;
- do not require a pass commit as a completion condition;
- do not create a separate PR per pass;
- do not merge partial states into `develop` merely to begin the next pass;
- do not redesign later passes because they share a PR with earlier ones.

The architect may create logical commits between passes when useful, but commit structure is not part of the coding-agent task.

A single PR does not mean a single agent context. Keep proof-author and implementation contexts separate according to `test-first`.

## Pass order

### Pass A — bounded agent-facing verifier output

Contract: `docs/testing/verify-agent-output.md`.

Required result:

- normal mode does not stream routine child stdout/stderr;
- runnable-check progress uses compact index/total status;
- long-running checks emit bounded liveness heartbeat;
- heartbeat does not echo arbitrary child output;
- failures expose a bounded actionable reason, exact log path, and focused rerun command;
- normal success summary omits routine skipped/trigger/environment inventory;
- `--verbose` remains an explicit diagnostic presentation mode only;
- lock/status/resume/timeout semantics remain unchanged.

Implement this first so subsequent passes use the bounded feedback surface themselves.

### Pass B — repository change-classification precision

Contract: `docs/testing/verify-change-classification.md`.

Required result:

- add the narrow positive repository-metadata predicate;
- apply it only where broad E2E/Storybook-behavior/visual ownership currently misclassifies metadata;
- remove the unsafe global Markdown visual exclusion;
- preserve runtime ownership of `PRIVACY.md` and `docs/user/**`;
- map Help runtime docs to the existing Help E2E owner;
- keep unknown source-adjacent runtime-relevant content fail-closed;
- Storybook build remains unchanged after explicit audit.

### Pass C — durable unit impact

Contract: `docs/testing/verify-target-architecture.md`, unit-impact section.

Required result:

- create `scripts/lib/unitRisk.ts` as the unit-impact owner;
- consume status-aware changed-path input for removal/move safety;
- direct changed Vitest tests select themselves;
- ordinary current-tree source/test-support uses supported Vitest related resolution;
- exact file-as-data mappings exist only for verified direct repository-file consumers;
- seed `PRIVACY.md -> src/pages/DataStoragePrivacyPane/DataStoragePrivacyPane.test.ts` and only confirmed workflow/config file-as-data relations found by the required bounded audit;
- unit infrastructure and unresolved deleted/moved unit-relevant relations fall back to full unit;
- zero related tests is reportable and does not force full unit or suppress other lanes;
- remove the legacy sibling-basename `getVitestScope()` behavior only after replacement is complete;
- Playwright specs remain outside Vitest ownership.

Do not build a custom/persistent module graph.

### Pass D — explicit mutation ownership

Contract: `docs/testing/verify-target-architecture.md`, mutation section.

Required result:

- replace adjacency-derived mutation applicability with one mutation-specific explicit registry;
- the registry is shared by verifier planning and Stryker configuration;
- every entry has one exact source, exact owning tests, and a concrete high-risk reason;
- perform one bounded audit of current mutation candidates and retain only justified targets;
- changed registered source or registered owning test selects the exact source;
- unregistered adjacent source skips mutation;
- invalid/missing/conflicting registry facts fail closed;
- full/release verification does not automatically add mutation;
- remove obsolete adjacency scanning once replacement is complete.

Do not preserve historical mutation count as a requirement.

### Pass E — release impact planning

Contract: `docs/testing/verify-target-architecture.md`, release section.

Required result:

- create `scripts/lib/releaseRisk.ts` as the source-impact owner for the six existing release contracts:
  - `release-config`;
  - `build`;
  - `publisher-node-import`;
  - `artifact`;
  - `release-smoke`;
  - `managed-updates`;
- keep `release-version` separate as branch/label/version policy;
- known exact source ownership selects only required release checks;
- unknown significant impact inside a confirmed release-sensitive boundary selects all six source-impact checks;
- version-only `package.json` does not create source-impact release work;
- runtime dependency/lockfile impact remains conservative;
- direct release proof files select their owning check;
- shared release helpers select all consumers or conservative full source-impact release proof;
- add specialized `release-impact` orchestration for one selected source-impact invocation;
- preserve artifact reuse inside that invocation;
- keep individual source-impact labels available as focused diagnostics outside `--full`.

Do not duplicate source-impact classification in workflow YAML.

### Pass F — exact-head CI integration

Contract: `docs/testing/verify-target-architecture.md`, CI section.

Required result:

```text
autofix
   ├─ verification-static
   ├─ verification-browser-e2e
   ├─ verification-storybook-browser / storybook-behavior
   ├─ verification-storybook-browser / visual
   ├─ verification-release
   └─ release-version
```

`verification-release`:

- starts directly after `autofix`;
- runs the specialized `release-impact` verifier invocation;
- remains independent of static/E2E/Storybook jobs;
- is required by the aggregate verification gate;
- may remain internally sequential initially;
- does not introduce workflow `paths` impact logic;
- does not introduce cross-job artifact transfer.

Preserve `deploy-preview` dependency on the aggregate gate.

### Pass G — representative benchmark and finish validation

After A–F are implemented, benchmark representative change classes from `docs/testing/verify-modernization.md`.

Record at minimum:

- selected checks;
- skipped checks;
- trigger reasons;
- duration;
- false positives;
- potential false negatives;
- CI critical-path / merge latency;
- aggregate expensive compute;
- default verifier output boundedness and progress behavior.

The benchmark is evidence for the stop decision, not permission to begin speculative optimization automatically.

## Test-author / implementer sequencing

For every pass that adds or materially changes behavioral proof:

1. resolve the pass-specific `TEST IMPACT` from the accepted repository contracts;
2. use a fresh dedicated test-author agent/session following `test-first`, `test-authoring`, and the relevant proof-type skill;
3. establish an independent oracle and `Must reject` outcome;
4. demonstrate meaningful RED when applicable;
5. hand accepted proof to a separate implementation context;
6. implementation treats accepted expectations/assertions as read-only;
7. if implementation disputes proof, return the conflict to the test owner/architect instead of changing acceptance criteria opportunistically.

No separate test-author pass is required where existing proof remains faithful and unchanged.

Neither test-author nor implementation contexts create commits or use direct Git commands as pass boundaries. Pass state is handed off through the prepared workspace plus the required report; Git integration remains architect-owned.

## Pass discipline

Before moving from one pass to the next:

- the current pass has no known in-scope architecture or correctness blocker;
- focused verifier-owned proof required for that pass is green;
- replaced logic belonging to that pass is removed;
- later-pass architecture has not been pulled forward merely to make the current pass convenient.

A later pass may fix an integration defect exposed by the combined implementation, but it must not reopen an already resolved ownership decision without concrete contradictory repository evidence.

## Final review boundary

The architect reviews the **complete resulting PR**, including all passes together.

Green focused checks or green CI do not replace semantic review of:

- planner ownership and dependency direction;
- fail-closed behavior;
- deletion/rename handling;
- proof quality and independent oracle;
- agent-facing output boundedness;
- release-policy separation;
- CI critical-path topology;
- complete removal of replaced legacy inference.

## Completion criteria

The one finish PR is implementation-complete only when:

- Passes A–F are complete;
- Pass G benchmark is recorded;
- no known required proof can silently be missed;
- default agent output remains bounded and progress-visible;
- unit impact no longer relies on sibling-basename guesses;
- mutation applicability no longer relies on adjacency;
- release-sensitive develop changes select source-impact release proof;
- `release-version` remains independent;
- release proof runs in its own parallel CI lane;
- no known flake is accepted as green;
- no obsolete replaced planner/inference path remains active.

Final merge readiness still requires architect review and required exact-head CI on the published PR head.

## Deferred after the finish PR

Unless the benchmark proves a real remaining bottleneck, do not continue with:

- additional verifier infrastructure modernization;
- more CI jobs/workers/sharding;
- split release jobs;
- cross-job Storybook/release artifacts;
- generic dependency graphs;
- Nx/Turbo or another task runner;
- universal path/test registries;
- broad legacy suite cleanup;
- speculative E2E/test-suite optimization.
