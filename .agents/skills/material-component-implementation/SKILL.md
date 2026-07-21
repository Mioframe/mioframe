---
name: material-component-implementation
description: 'Internal Material stage used only by material-component after an independent contract gate passes. Executes exactly one approved correction unit and only the concern lanes, owners, proof, compatibility, visual, token, and motion contracts locked for that unit.'
---

# Material component implementation

Internal stage only. Follow the canonical component workflow, token architecture, and passed correction contract.

Required entry state:

```text
Canonical target status: locked
Assessment status: complete
Contract review status: passed
Current correction unit: <exact unit>
Required concern lanes: <exact lanes>
```

## Responsibility

Execute exactly one approved correction unit:

```text
prepare locked proof
→ confirm expected failure when applicable
→ smallest approved owner correction or local replacement
→ focused verification
→ affected browser/consumer/visual validation
→ concise README evidence update
```

Do not select another gap, broaden the concern plan, or repair an unrelated finding.

The target slices, classifications, dependency types, correction priority, owner, proof lane, compatibility decision, durable token/style/motion contract, and operator requirement remain locked. New invalidating evidence returns to the orchestrator with the exact owning lane.

## Supporting skills

- `material-foundation` for an approved reference/system or cross-family prerequisite;
- `vue-component-implementation` for `.vue` or UI-composable changes;
- `ui-browser-behavior` for changed computed styles, DOM/layout, interaction, transition, animation, WAAPI, or reduced motion;
- `visual-regression-testing` for accepted visible changes;
- the proof skill selected by the contract.

## Ownership

- Preserve independently confirmed owners outside the correction unit.
- Correct incrementally when ownership is sound; replace only the smallest wrong owner.
- Keep public Vue artifacts thin.
- Keep official family tokens in the owner-local token file and private routing/final declarations in implementation styles.
- Do not move state selectors, layout, transitions, or rendered properties into token files.
- Do not add wrappers or DOM nodes merely for separation.
- Keep temporary legacy Material dependencies explicit.

## Selected-lane execution

Run only audits required by the concern plan:

- semantics lane: verify the changed API/native/accessibility/state/extension/consumer contract;
- token lane: reconstruct the bounded changed graph slice and run the static token guard;
- Web lane: reconstruct changed DOM/style/motion routes and prove affected browser behavior.

Do not repeat a complete family audit before and after implementation. Confirm unchanged dependencies only where the correction can affect them.

### Token lane requirements

When selected:

- exact official/project/private namespace and owner;
- allowed dependency direction, no cycles/cross-family component edges;
- no unresolved required reference, dead component token, hidden fallback, or unnecessary private hop;
- token files contain declarations/scoping only;
- final value kind and rendered property are valid;
- token-driven transition/animation parsing is proved through computed longhands when applicable.

### Web lane requirements

When selected:

- correct DOM/style owner, cascade, layout, stacking, clipping, RTL/responsive behavior;
- explicit transition/animation routes with stable endpoints;
- easing compatible with the animated property's domain;
- defined rapid input, interruption, reversal, cancellation, cleanup, and reduced motion;
- no `transition: all`, dead motion route, stale runtime resource, broad permanent `will-change`, or unjustified expensive animation;
- browser proof through public input for changed observable lifecycle.

If required browser evidence cannot be produced or inspected, return blocked rather than inferring success from declarations or screenshots.

## Visible and consumer impact

Prepare official comparison, baselines, and operator handoff only when visible output changes. Validate only materially affected consumer categories. Do not patch consumers around a wrong library contract.

## Documentation

Update current contract evidence and classifications only. Do not add review history, shell transcripts, exact route inventories, file counts, or superseded reasoning.

Set next stage to conditional adoption or `correction-review`. The implementation stage does not update the roadmap or invoke another stage.

## Exit gate

Pass only when the approved unit meets its completion condition, selected-lane proof passes, changed ownership/dependencies are valid, applicable guards pass, affected consumers work, visible evidence is honest, and no newly discovered blocker within the correction unit remains.

A finding outside the correction unit returns to the orchestrator for PR review or a future unit; it does not get silently fixed or mislabeled as outside the PR.

## Result

```text
MATERIAL STAGE RESULT
Family:
Stage: implementation
Correction unit:
Status: complete | blocked
Selected lanes:
Changed owners:
Proof result:
Static token guard: passed | failed | not-applicable
Browser evidence: sufficient | insufficient | not-applicable
Consumer result:
Visual/operator result:
External findings returned to orchestrator:
Blocker: none | <exact blocker>
```

## Forbidden

- direct user invocation or edits before contract approval;
- changing locked decisions or implementing another gap;
- complete-family re-audit for a bounded unit;
- state/layout/motion declarations inside token files;
- invented namespaces, invalid graph edges, dead tokens, hidden required fallbacks, or unnecessary alias chains;
- declaration-only motion proof, `transition: all`, conflicting/shadowed routes, stale runtime resources, or broad permanent `will-change`;
- tests preserving known defects or framework/browser internals;
- consumer migration/cleanup unless adoption owns it;
- roadmap updates, stage invocation, review history, or speculative infrastructure.