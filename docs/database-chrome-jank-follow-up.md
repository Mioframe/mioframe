# Database Chrome jank follow-up

Status: **deferred to a separate PR after #217**.

## Goal

Investigate and fix the residual Chromium-only Database switch/vertical-scroll jank without reopening the accepted structural virtualization work.

## Retained evidence from PR #217

Fast sparse all-string control in verifier-managed Chromium:

- S0 median usable: 281.1 ms;
- G1 median usable: 321.5 ms;
- zero Long Tasks;
- bounded mounted work and deep correctness pass.

Heterogeneous attribution:

- scalar-mix switch: 385.6–928.9 ms;
- Number-isolation switch: 631.3 / 635.5 ms;
- Number-isolation: three Long Tasks per switch sample, max 241 / 244 ms;
- vertical wheel scrolling: intermittent 168–210 ms Long Tasks;
- horizontal wheel scrolling: no reported Long Tasks;
- bounded mounted work and deep correctness remain intact.

Operator comparison on the same laptop:

- Chrome shows the residual delay/jank on a heterogeneous real table;
- Firefox does not show the same problem.

`Number` is a reproducing fixture label, not an established production owner. `NumberValueInline` and `StringValueInline` are both trivial renderers and the effective-value/property query path is shared.

## First discriminator for the follow-up PR

Compare String and Number with:

- identical logical shape;
- identical persisted-value density;
- identical populated cell positions;
- identical Short/Full views;
- identical viewport and Chromium verifier environment;
- identical switch and vertical-wheel protocol.

Use that evidence to choose the narrowest production owner before implementation.

Possible owners remain unresolved: value/query subscription work, data-density effects, Vue/component setup, layout/measurement, or another Chromium-specific render path.

## Not part of PR #217 completion

PR #217 does not need to resolve this residual jank before merge once its virtualized table integration is functionally and visually correct, structural boundedness remains intact, the accepted all-string control is not regressed, and exact-head CI is green.

Do not carry speculative Number-specific, geometry, worker/query/storage, or shared virtualization changes back into #217.
