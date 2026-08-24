# Review

Verdict: accepted; the shared `surfaceOffset` production contract is proved for the failing deep-state lifecycle.

## Scope reviewed

- `useVirtualCollection.ts` surface-offset forwarding and surface-relative public geometry.
- `VirtualCollectionCapability.browser.spec.ts` through proof commit `e52d6c7bf2397a62c6669078043f874025a0fdc0`.
- Existing `DynamicSurfaceOffset` story/fixture.
- Exact-head PR #217 product failure on desktop Chromium.

## Resolved — deep-state same-root surface movement

The browser capability now proves the exact lifecycle omitted by the previous test:

`deep -> change physical pre-surface extent + reactive surfaceOffset while still deep -> top -> deep`.

It retains the same physical viewport and list DOM identities, changes the extent from approximately 240px to 96px while still deeply scrolled, reaches logical tail `9999` before and after the change, recovers item `0` at top, keeps mounted work bounded, and verifies leading/trailing/total geometry plus physical scroll extent.

The coding agent reports the focused proof and a bounded repeat of 3 both passed. `useVirtualCollection.ts` and shared production code remain unchanged.

## Architecture consequence

Shared virtualization is no longer the current owner candidate for the top-level moving-surface defect. Do not add `virtualizer.measure()`, cache reset, virtualizer exposure, or another geometry/range owner.

The next diagnosis belongs to the top-level consumer that produces the numeric root-to-layout offsets:

`docs/database-virtualization-widget-surface-offset-diagnosis-handoff.md`.

## Remaining PR dependency

The product E2E must still be corrected at its actual owner after consumer numeric evidence is collected. Shared virtualization has no implementation blocker at this stage.

## Forbidden

- shared production changes without new contrary evidence;
- unconditional `virtualizer.measure()` or cache reset;
- public TanStack virtualizer exposure;
- second geometry/range/measurement cache;
- Database-specific behavior in shared virtualization.
