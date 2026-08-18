# Review

Verdict: blocked

## Scope reviewed

- Global component-token cascade correction in PR #203.
- Family public-token ownership and private renderer bridge split for Button and Loading Indicator.
- `materialComponentCompatibility` root/default/duplicate/scoped-load rules and tests.
- Button → Loading Indicator contextual override and standalone fallback proof.

## Blockers

### B1 — Mechanical guard does not enforce exactly one root default declaration

Owner: `scripts/materialComponentCompatibility.mjs`

Problem: The new compatibility guard enforces duplicate ownership only across different family names and recognizes any declaration block containing the substring `:root` as a root default. It therefore does not enforce the documented invariant that one public `--md-comp-*` default has exactly one declaration on the owning family's `:root`.

Evidence:
- [`materialComponentCompatibility.mjs`](../../../../scripts/materialComponentCompatibility.mjs) — `findRootDeclaredComponentTokenNames()` deduplicates names into a `Set`; `findDuplicatePublicDefaults()` reports only when the same name appears in more than one family; two declarations of the same token in one family are accepted.
- [`materialComponentCompatibility.mjs`](../../../../scripts/materialComponentCompatibility.mjs) — `findRootBlocks()` searches for the `:root` substring and `removeRootBlocks()` removes the matching block without validating the selector, so selectors such as `:root .child` or a selector list that also targets a component can be treated as valid root ownership.
- [`foundation/tokens.test.ts`](foundation/tokens.test.ts) — the cross-file ownership test also converts each stylesheet's declarations to a `Set`, so it cannot detect duplicate declarations of one public token inside a single owner file.

Basis:
- [`docs/component-tokens.md`](docs/component-tokens.md) — single default ownership requires one public `--md-comp-*` name to have exactly one family-default declaration, on `:root`, and explicitly forbids correctness that depends on stylesheet/source order.
- [`AGENTS.md`](AGENTS.md) — the Material hard invariant requires family defaults on `:root` and forbids bundle/source-order dependence.

Risk: A malformed family token contract can pass the new mechanical verification while still containing two competing defaults or a declaration attached to a non-root/local selector. That can reintroduce source-order or local-shadowing behavior under a resolver result that incorrectly reports the token contract as compatible.

Required final state: Mechanical verification must accept the canonical family default only when the public token has exactly one owning declaration in the family token contracts and that default is actually rooted at the canonical root selector. Repeated declarations within one family and root-containing selectors that also/local-only target component descendants must not be accepted as a valid family default. The foundation ownership proof must not silently collapse repeated declarations before checking ownership.

Verification: Add table-driven resolver coverage for a duplicate declaration in one `tokens.css`, a non-root/local selector containing `:root`, and a selector list that also targets a local component; each must route to `token-contract`. Preserve the valid plain `:root` case and contextual implementation overrides. Add/adjust the foundation ownership test so repeated public declarations in one owner are observable to the check.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- The pre-existing dynamic Loading Indicator geometry bridge (`--m3e-loading-indicator-size` in runtime style computation) is a separate implementation-route concern and is not part of this selector/default migration.
- No additional token registry, parser framework, workflow stage, or Material semantic re-derivation is required for B1.

## Unresolved questions

None.
