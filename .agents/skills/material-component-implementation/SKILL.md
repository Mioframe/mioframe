---
name: material-component-implementation
description: 'Internal Material stage used only by material-component after an independent contract gate passes. Executes exactly one approved correction unit with locked ownership, token, proof, compatibility, visual, and motion contracts.'
---

# Material component implementation

Internal stage only. Follow `src/shared/ui/material/docs/component-development.md`, `src/shared/ui/material/docs/tokens.md`, and the passed contract package.

Required entry state:

```text
Canonical target status: locked
Assessment status: complete
Contract review status: passed
Current correction unit: <exact unit>
```

## Responsibility

Execute exactly one approved correction unit:

```text
prepare locked proof
→ confirm expected failure when applicable
→ smallest approved owner correction or local replacement
→ focused verification
→ affected browser and representative-consumer validation
→ visual handoff when required
→ README evidence update
```

Do not select another gap or change the objective.

The canonical target, source decisions, classifications, dependency types, correction priority, implementation owner, proof lane, compatibility decision, durable token contract, durable motion contract, and operator requirement remain locked. New invalidating evidence returns the workflow to contract.

## Supporting skills

- Use `material-foundation` when reference/system token ownership or a real cross-family token prerequisite must change.
- Use `vue-component-implementation` for `.vue` or UI-composable changes.
- Use `ui-browser-behavior` whenever computed token behavior, layout, focus, input lifecycle, responsive behavior, transition, animation, WAAPI, or reduced motion is changed or confirmed.
- Use `visual-regression-testing` whenever accepted visible output or motion appearance changes.
- Use the proof skill selected by the locked proof lane.

## Ownership

- Preserve independently confirmed owners unless new evidence invalidates them.
- Correct incrementally when ownership is sound and the defect is local.
- Replace only the smallest owner when repair would preserve wrong ownership or add workaround logic.
- Keep public Vue artifacts thin composition roots.
- Keep official family token declarations in one owner-local `<family>.tokens.css` by default.
- Keep private routing and final rendered declarations in implementation styles.
- Separate deterministic logic, lifecycle, tokens, styles, rendered-property routing, and motion only when ownership or proof becomes clearer.
- Do not add wrappers or DOM nodes merely for separation.
- Keep temporary legacy Material dependencies explicit.

## Token graph audit

Before token/style/motion edits and again before exit, reconstruct the exact graph across the complete family and directly owned dependencies.

For every Material-related custom property verify:

- exact classification: official reference/system/component token, Mioframe extension token, private route, invalid alias, or obsolete;
- declaration owner and allowed location;
- public/private status;
- direct dependencies and allowed direction;
- duplicate declarations, unresolved required references, fallback behavior, and cycles;
- configuration/state selection;
- final rendered property or narrow foundation bridge;
- expected value kind and actual CSS use;
- static, browser, and consumer proof.

Implementation requirements:

- keep exact official names; do not shorten or invent `--md-*` aliases;
- use `--mio-sys-*` or `--mio-comp-<family>-*` only for approved public project extensions;
- use `--md-private-<owner>-*` only for owner-local non-public routing;
- do not add component tokens to foundation or reference/system tokens to a family;
- do not add new canonical tokens to legacy `src/shared/lib/md/tokens.css`;
- remove ambiguous aliases such as `--md-<component>-*` unless they are a documented external compatibility surface with exact consumers and a removal plan;
- keep dependency edges downward and forbid cycles or cross-family component-token references;
- do not use fallbacks to hide missing required declarations;
- every declared component token reaches supported rendered behavior;
- prefer direct token-to-property routing; use one private hop only when configuration/state selection or a foundation bridge requires it;
- a second private hop requires an independently changing owner and explicit contract justification;
- token-driven transition and animation use explicit longhands;
- verify final computed longhands when custom-property substitution can invalidate or reset a shorthand;
- verify the token value kind is valid for the final CSS property.

Run the static token architecture guard for any token declaration, name, dependency, or route change. Static success does not replace official-source or rendered proof.

Report exact graph evidence in the stage result; do not mirror every declaration or edge into the family README.

## Motion code audit

Before motion edits and again before exit, reconstruct the exact code inventory across the complete family and directly owned dependencies:

- transition and animation shorthand/longhands;
- keyframe definitions and references;
- WAAPI or JS routes;
- frames, timers, animation classes, and completion listeners;
- `will-change`;
- motion custom properties and uses;
- reduced-motion overrides.

Compare actual routes with the locked durable motion contract. Requirements:

- enumerate transition/animation longhands; `transition: all` is forbidden;
- declared motion tokens drive actual rendered behavior or are removed/classified unsupported;
- keyframes are reachable from supported states;
- declarations live on the rendered-property owner and are not shadowed or reset accidentally;
- initial and final values are stable;
- easing output is compatible with the animated property's valid domain;
- rapid input, retargeting, reversal, interruption, cancellation, disable, and unmount follow the contract;
- runtime animations, frames, timers, classes, and listeners are cleaned up;
- reduced motion preserves final semantic and visible state;
- expensive layout/paint animation has a required visual reason and bounded performance analysis;
- `will-change` is narrow and temporary unless a persistent need is proven;
- synchronous layout read/write loops and per-frame reactive churn are avoided;
- declaration existence, keyframe text, snapshots, framework behavior, or browser internals are not accepted as lifecycle proof.

Static proof may verify exact token-to-declaration routing. User-visible animation lifecycle requires browser proof through public input.

## Visible and consumer impact

When visible output changes, prepare the canonical Storybook surface, official comparison, baseline handling, and operator handoff. Never report operator acceptance without an explicit result.

Validate every materially affected consumer category when API, native behavior, propagation, layout interaction, token inheritance/override behavior, visible output, motion, or extension behavior changes. Do not patch consumers around a wrong library contract.

## State update

Update implementation evidence and alignment classifications in the family README without changing locked contract decisions.

Set:

```text
Current stage: adoption | final-review
Implementation status: complete | blocked
Operator visual status: not-required | required | accepted | rejected
Next gate: conditional adoption | independent final review
```

The implementation stage does not update the roadmap or invoke another stage.

## Exit gate

Pass only when the approved unit meets its completion condition, proof passes in the locked lane, ownership and dependency boundaries hold, the final token graph matches the durable token contract, the static token guard passes when applicable, the final motion audit matches the durable motion contract, affected consumers work without workarounds, visible evidence is honest, and the repository remains valid even when the family is still `converging`.

## Result

```text
MATERIAL STAGE RESULT
Family:
Stage: implementation
Status: complete | blocked
Exit gate: passed | failed
Correction unit result:
Family alignment status: aligned | converging | blocked
Preserved owners:
Replaced owners:
Dependency result:
Proof result:
Token graph audit: passed | failed
Token route findings:
Static token guard: passed | failed | not-applicable
Motion code audit: passed | failed
Motion route findings:
Consumer result:
Visual/operator result:
README evidence changes:
Remaining known gaps:
Blocker: none | <exact blocker>
```

## Forbidden

- direct user invocation;
- edits before a passed contract gate;
- changing locked contract decisions in place;
- implementing another or lower-priority gap;
- exact code-route or token-graph ledgers in documentation;
- invented token namespaces, upward/cyclic token graphs, dead component tokens, fallback-masked required references, or unnecessary alias chains;
- tests protecting implementation details or known defects as canonical behavior;
- browser assertions in visual specs;
- `transition: all`, dead motion tokens, unused keyframes, conflicting or shadowed motion routes, stale runtime resources, or broad persistent `will-change`;
- visible changes without required operator handoff;
- consumer migration or obsolete-owner removal unless adoption owns it;
- roadmap updates or another stage invocation;
- speculative abstractions, token managers, registries, generators, or unnecessary DOM.
