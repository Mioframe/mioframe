---
name: project-review
description: 'Use for independent project, PR, architecture, implementation, or scoped code review. Persist active evidence-backed findings in owner-local REVIEW.md files.'
---

# Project review

Perform an independent semantic review of the requested current repository scope. This is a reviewer protocol, not an implementation stage and not an automatic part of any component or coding workflow.

The goal is to protect user scenarios, repository architecture, ownership, correctness, proof quality, and code health without inventing requirements or turning review into speculative redesign.

## Boundary

Review only. Do not fix production code while acting under this skill.

You may create, update, move, or delete review artifacts and other review-only Markdown when needed to keep review state accurate. Production corrections happen in a separate implementation/correction pass.

A PR diff is a discovery aid, not the review boundary. Review the complete current affected scope needed to judge the change correctly, including relevant contracts, implementation, tests, consumers, and failure paths.

This skill does not decide final merge readiness by itself. Exact-head CI and the final merge decision remain architect-owned.

## Inputs and authority

Before judging the scope:

1. read the root and applicable nested `AGENTS.md` files;
2. read the relevant project skills and canonical project documentation;
3. inspect the complete current implementation and tests needed to understand the reviewed behavior;
4. inspect consumers and adjacent owners when blast radius or dependency direction requires it;
5. verify uncertain third-party/platform behavior from authoritative documentation or exact-version artifacts when material to a finding.

Repository rules and explicit project contracts are binding and outrank generic external guidance.

Use external best practices only where the repository does not already decide the issue, or as supporting evidence for an existing project principle. Prefer primary/official sources: language/framework/library documentation, standards, vendor documentation, W3C/WAI/MDN/OWASP where applicable, or established engineering guidance such as [Google Engineering Practices — Code Review](https://google.github.io/eng-practices/review/).

Do not use a generic best-practice link to manufacture a project requirement.

## Independent proof review

When production code and assertion-bearing tests/specs or accepted visual baselines changed in the same work, treat them as potentially correlated implementations of the same mistaken assumption. Agreement between changed code and changed proof is not independent evidence by itself.

Before using changed assertion-bearing proof as correctness evidence:

1. reconstruct the expected observable behavior from the accepted architecture/product/public contract, reproducible defect, persisted/protocol contract, authoritative platform/dependency contract, or independently accepted visual contract;
2. identify the truthful primary proof owner and faithful environment under `docs/testing/architecture.md`;
3. inspect the test/spec/baseline oracle independently from the changed production implementation;
4. identify at least one plausible incorrect observable result that the assertions must reject;
5. only then compare the implementation with both the independent contract and the proof.

When `TEST IMPACT` required a meaningful red phase for new/materially changed non-visual proof, review the test-author RED evidence. A setup error, timeout, missing fixture, wrong environment, unrelated exception, or infrastructure failure is not evidence that the proof detected the behavioral defect.

For an intentional visual-baseline change, do not require impossible pre-implementation target pixels. Instead verify that the visible contract and visual-spec intent were established independently before implementation, and that baseline creation/inspection/acceptance happened afterward in a fresh test-author context following `visual-regression-testing`. A baseline created or approved by the production implementation context is not independent proof.

Treat changed assertion-bearing proof as defective when applicable if:

- expected values are computed by the production helper/algorithm being tested or by a copied implementation algorithm;
- mocks/fixtures are programmed so the assertion merely confirms the value injected by the test rather than an independent boundary contract;
- assertions observe an internal proxy that can remain correct while the required public result is wrong;
- an existing assertion/scenario/baseline was weakened, deleted, or regenerated only because the changed implementation otherwise failed;
- a changed test/spec no longer rejects a realistic incorrect result relevant to its claimed contract;
- an intentional changed visual baseline was inferred from production output without an independent visible contract or independently accepted by the same implementation context;
- test-only production APIs or architecture-boundary violations were introduced solely to make proof convenient.

When an existing expectation changes, require independent evidence that the accepted contract changed or the old proof was invalid. The new implementation's observed output is not sufficient basis for changing the expected result.

A separate `test-authoring` pass is required when the architecture says a new assertion-bearing test/spec is added, an existing oracle materially changes, or an intentional visual baseline requires independent acceptance. Do not manufacture an extra pass for static verifier/check implementation, mutation-target registration, ownership/applicability metadata, mechanical proof moves/renames, formatting, comments, or unchanged assertions.

Test authorship is an execution-context boundary, not proof ownership. Review must still use the verification type, placement, owner, and affected-selection rules from `docs/testing/architecture.md`.

## Review standard

Start from confirmed scenarios and required final behavior. Check only concerns that are relevant to the scope, but do not omit a relevant concern merely because the changed diff is small.

Review, as applicable:

- goal, non-goals, user scenarios, edge cases, and failure paths;
- repository rules and explicit architecture decisions;
- ownership, dependency direction, source of truth, and state shape;
- public APIs, contracts, compatibility, and error semantics;
- correctness of implementation against the required behavior;
- consumer impact and shared/blast-radius effects;
- browser, mobile, accessibility, performance, concurrency, privacy/security, persistence, diagnostics, or offline behavior when the scope makes them relevant;
- proof ownership, independent oracle quality, failure sensitivity, test fidelity, missing scenarios, and whether automated checks actually prove the claimed contract;
- documentation affected by the change;
- obsolete/replaced logic that should have been removed;
- complexity, readability, and whether a simpler complete solution exists.

Compare non-trivial design with the simplest viable alternative. Additional abstraction, state, mapping, compatibility path, or infrastructure is a finding when it is not required by a current verified need and increases total complexity or weakens ownership.

Green verification proves only that the executed assertions passed. It is not evidence that the assertions were derived independently, that they would catch the relevant implementation error, or that architecture/semantics are correct.

## Finding quality

Every `Blocker`, `Major issue`, or `Minor issue` must be independently actionable and evidence-backed.

Each finding must contain:

- **Owner** — the narrowest repository owner responsible for the root cause;
- **Problem** — the concrete current defect, not a preferred rewrite;
- **Evidence** — Markdown links to the relevant current code, test, contract, or documentation plus the exact symbol/section/behavior when useful;
- **Basis** — at least one Markdown link that justifies why this is a problem;
- **Risk** — the concrete user, correctness, architecture, maintenance, or proof consequence;
- **Required final state** — observable/architectural state that resolves the problem without prescribing unnecessary implementation detail;
- **Verification** — how the correction should be proven.

### Basis rules

Use the strongest applicable basis in this order:

1. binding project rule (`AGENTS.md`, applicable skill, canonical project documentation);
2. explicit feature/domain/public contract or required scenario;
3. official technology/library/platform documentation or standard;
4. authoritative, widely accepted engineering guidance when no stronger source decides the issue.

Prefer repository-relative Markdown links that resolve from the `REVIEW.md` location for project sources. Link external claims directly to the authoritative source.

A basis link must support the exact requirement being asserted. Do not cite a broad style guide, best-practices article, or unrelated rule merely to make a subjective preference look mandatory.

If a material fact cannot be verified, do not invent it. Record it as an unresolved question. Treat the missing fact as a blocker only when the project requires that fact to be known before the reviewed work can safely be accepted.

Project rules outrank external guidance. Existing code is evidence of current behavior, not automatically evidence that the behavior is correct.

## Severity

Consolidate one root cause into one finding. Do not scatter symptoms across multiple entries.

- **Blocker** — must be fixed before merge/acceptance: required scenario missing or broken, unsafe ownership/source-of-truth/public contract, data/security/correctness risk, required proof absent or materially untrustworthy, or another condition that makes acceptance unsafe.
- **Major issue** — material architecture/correctness/maintenance problem that belongs to the current change and should normally be corrected before acceptance. If the architect explicitly accepts it, move it to `Accepted risks`; do not leave an accepted issue classified as unresolved major.
- **Minor issue** — evidence-backed, non-blocking local quality problem. Do not use `Minor` for taste, optional refactoring, or speculative improvement.
- **Accepted risk** — explicit bounded deviation accepted by the architect. State why it is acceptable and what remains true. Missing mandatory work or unknown required behavior cannot be an accepted risk.
- **Item not required** — worthwhile but outside the current required scope. Keep it separate so it does not inflate the correction task.

Two correction rounds that still expose ownership drift, mixed responsibilities, missing scenarios, unreliable proof, or accumulating workaround logic are a signal to return to architecture rather than continue patching symptoms.

## Correction handoff

A blocked review must not end with only a list of findings when at least one finding is actionable through an existing repository owner.

Before returning a `blocked` verdict:

1. determine which unresolved blocker/major owner must act next from dependency direction, ownership, and any repository-defined owner order;
2. consolidate all currently known unresolved findings for that same owner that can be corrected safely in one pass without depending on a later owner's unresolved change;
3. return one concise `NEXT CORRECTION` containing only:
   - `owner` — the next repository owner;
   - `finding` — the consolidated current defect(s), stated as required final-state problem rather than an implementation recipe;
   - `affected scope` — the smallest code/contract/proof/consumer scope that must be reconsidered;
4. leave findings owned by later/downstream owners in `REVIEW.md` for re-review after the first correction.

This is a handoff, not implementation. Do not edit production code, invoke a coding workflow, create workflow-specific state, or prescribe unnecessary implementation detail while reviewing.

If no safe next owner can be selected because ownership/order itself is unresolved, say so explicitly instead of manufacturing a correction handoff; architecture must be resolved before coding resumes.

For `ready` or `ready-with-listed-risks`, `NEXT CORRECTION` is `none`.

## Review artifact ownership

`REVIEW.md` is durable working state for an active review, not permanent product documentation.

Place each review artifact in the directory that owns the reviewed subject/root cause:

```text
<owner-directory>/REVIEW.md
```

Examples:

```text
src/shared/ui/material/components/button/REVIEW.md
src/features/createDocument/REVIEW.md
src/entities/database/REVIEW.md
src/shared/ui/material/REVIEW.md
```

Rules:

- A focused review of one component/feature/entity/service writes or updates that owner's `REVIEW.md` when active findings or accepted risks exist.
- Architecture or implementation findings for a component still belong in that component directory when the component owns the problem.
- A problem discovered through a consumer belongs to the dependency/owner that causes the defect, not automatically to the consumer file that exposed it.
- A broad PR review may create/update multiple `REVIEW.md` files only when findings genuinely belong to different owners.
- Never duplicate one finding across multiple review documents. Cross-reference the owning review when another scope needs context.
- Cross-cutting findings belong to the narrowest directory that actually owns the shared invariant.
- Do not create a clean `REVIEW.md` merely to record that no problems were found.

When re-reviewing, read any existing owner-local `REVIEW.md`, inspect the complete current scope, remove resolved findings, update evidence for remaining findings, and add newly discovered root causes. Do not preserve a finding just because an older review contained it.

When a review is closed and no active review state needs to survive, delete the `REVIEW.md`. Move any decision/risk that must remain authoritative after the review into the appropriate canonical project documentation or backlog before deleting the review artifact.

## REVIEW.md format

Keep the document concise. Use this shape:

```markdown
# Review

Verdict: blocked | ready-with-listed-risks | ready

## Scope reviewed

- <current scope and relevant scenarios/contracts>

## Blockers

### B1 — <short title>

Owner: `<owner>`

Problem: <concrete defect>

Evidence:

- [<source>](link) — <symbol/section/observed fact>

Basis:

- [<project rule / contract / official documentation>](link) — <exact requirement supported by the source>

Risk: <concrete consequence>

Required final state: <required outcome>

Verification: <faithful proof>

## Major issues

<same finding shape, or `None.`>

## Minor issues

<same finding shape, or `None.`>

## Accepted risks

- <risk + rationale + basis>, or `None.`

## Items not required

- <separate non-required improvement>, or `None.`

## Unresolved questions

- <only material facts that could not be verified>, or `None.`
```

Do not add timestamps, review counters, workflow history, author biographies, generated scorecards, or large checklists to the artifact.

## Verdict

- `blocked` — one or more blockers or unresolved major issues prevent acceptance, or a required fact/proof is still unknown or materially untrustworthy.
- `ready-with-listed-risks` — no blockers or unresolved major issues remain; only explicit bounded accepted risks remain.
- `ready` — no blockers, unresolved major issues, or accepted risks remain. Minor non-blocking observations may still be listed.

A review verdict is semantic review state, not a claim that exact-head CI passed and not a merge command.

## Verification during review

Use repository verification only when it materially strengthens or resolves review evidence. Prefer the smallest faithful verifier-managed check. Do not rerun broad verification simply because a review exists.

Missing or self-confirming proof is itself a finding when the project requires reliable proof. Do not replace missing browser/E2E/visual/mutation or other risk-specific proof with green unit tests or CI.

When assertion-bearing tests/specs/baselines changed with production code, a green run is only execution evidence. Review the proof oracle, failure sensitivity, environment fidelity, authoring boundary, and any weakened/deleted previous proof before accepting it as contract evidence.

## Report

Return a concise summary:

```text
PROJECT REVIEW RESULT
scope: <reviewed scope>
review documents: <paths changed, or none>
verdict: blocked | ready-with-listed-risks | ready
blockers: <count>
major issues: <count>
minor issues: <count>
accepted risks: <count>

NEXT CORRECTION
owner: <next owner> | none | unresolved
finding: <consolidated actionable finding> | none | <why owner/order is unresolved>
affected scope: <smallest correction scope> | none
```

Then list only the findings that need the user's/implementer's attention. The `REVIEW.md` files are the durable source for full finding details.

## Forbidden

- Fixing production code while performing the review.
- Reviewing only the latest patch when the verdict depends on surrounding/current behavior.
- Treating agreement between changed tests/specs/baselines and changed production code as independent evidence without checking the contract/oracle.
- Accepting an intentional changed visual baseline that was generated or approved by the production implementation context instead of an independent test-author/visual pass.
- Inventing project requirements from personal preference or generic style advice.
- Creating a finding without linked evidence and linked basis.
- Using external best practices to override an explicit Mioframe rule or contract.
- Citing a source that does not support the claimed requirement.
- Duplicating one root cause across multiple severities or owner documents.
- Writing a component-owned defect into a pane/consumer review merely because that is where it was observed.
- Treating green automated checks as semantic, proof-quality, or architecture approval.
- Leaving stale resolved findings in `REVIEW.md`.
- Returning `blocked` with actionable findings but no next-owner correction handoff.
- Turning `REVIEW.md` into permanent architecture/product documentation.
- Creating workflow-specific correction state from this generic review skill.
- Automatically inserting this skill into `material-component` or another implementation workflow without a separate architecture decision.
