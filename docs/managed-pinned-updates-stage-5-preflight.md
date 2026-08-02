# Managed pinned updates Stage 5 — implementation preflight

**Status:** ready. Stage 4 current-head verification passed at `9d973d52e70ca8d1dd68107ce823a16f5eb5944e`.

- Authoring source: `docs/managed-pinned-updates.md` and the user-provided Stage 5 contract form the deterministic ready handoff.
- Owners: `cleanLaunch.ts` filters/counts clients; `workerFetch.ts` selects and transitions navigation/releases; `src/sw.ts` owns FetchEvent identity and lifetime wiring; existing message/transition/broadcast/cache owners remain unchanged.
- Public entry points: `handleNavigationFetch()` accepts only navigation identity plus explicit worker dependencies; `handleAssetFetch()` selects from persisted state. No `FetchEvent` crosses into shared service code.
- Reuse: `startActivation`, `rollbackActivation`, `isActivationExpired`, `shouldStartActivation`, `BOOT_CONFIRMATION_TIMEOUT_MS`, `OperationQueue`, `PreparationCoordinator`, broadcast helpers, and exact `serveRelease()` restoration.
- Minimum design: one navigation result record and one small dependency record. A manager, registry, scheduler, second state machine, or reload classifier adds ownership without satisfying another requirement and is rejected.
- Acceptance: ready/clean starts activation; ready/blocked serves active; activating/unexpired serves candidate; activating/expired persists failed then serves active; assets select only activating; concurrent navigation writes once.
- Failure/recovery: enumeration, state, persistence, cache, restoration, and transition failures resolve controlled `503`; deferred broadcasts start after response resolution and remain event-lifetime tracked; rollback never cleans the failed cache.
- Risks: old/new navigation identity exclusion, uncontrolled clients, stale fresh-state races, expiration boundary, response/lifetime ordering, and exact-release restoration.
- Passes: deterministic fetch red/green; worker wiring/order proof; existing browser lifecycle updates; static/unit/mutation/E2E proof; single release gate.

## TEST IMPACT

Changed contracts: navigation activation/expiration result, activating release selection for navigation/assets, and fetch-event response/lifetime wiring.

Risks: duplicate activation writes, counting the evaluated navigation, serving the wrong release, cleanup on rollback, rejected owned fetches, or response blocked by reconciliation/broadcast.

Proof owners: `cleanLaunch.test.ts`, `workerFetch.test.ts`, `workerMessages.test.ts`, `src/sw.test.ts`, and `src/sw.rollbackOrdering.test.ts`; complete browser behavior in the three existing managed-update lifecycle specs.

Existing proof: Stage 1–4 transition, restoration, preparation, watchdog parity, and boot-report tests remain authoritative.

New or changed tests: extend only the named existing unit and E2E files; concurrency uses the real `OperationQueue`.

Repository impact metadata updates: none; no Playwright spec is added, moved, renamed, or removed, and existing release mappings retain ownership.

Task-specific measurements: controlled clock proves the exact 30-second deadline; no performance claim is introduced.
