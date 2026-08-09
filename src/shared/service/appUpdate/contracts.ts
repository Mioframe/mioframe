import * as z from 'zod/v4-mini';
import { MANAGED_CHANNELS, type ManagedChannel } from './channelContract';
import { zodReleaseNumber, type ReleaseDescriptor } from './releaseWireContract';

export {
  isCanonicalReleasePath,
  isPositiveSafeInteger,
  RELEASE_DESCRIPTOR_SCHEMA_VERSION,
  zodLatestReleasePointer,
  zodReleaseDescriptor,
  zodReleaseFile,
} from './releaseWireContract';
export type { LatestReleasePointer, ReleaseDescriptor, ReleaseFile } from './releaseWireContract';

/** A {@link MANAGED_CHANNELS}-validated managed channel. */
export const zodManagedChannel = z.enum(MANAGED_CHANNELS);
export type { ManagedChannel };

/**
 * Builds the channel-root-relative path of a release's published descriptor.
 * @param channelBasePath - The worker's own channel base path, e.g. `/` or `/branch/develop/`.
 * @param releaseNumber - The release's identity.
 * @returns The descriptor's fetch path.
 */
export const buildReleaseDescriptorPath = (
  channelBasePath: string,
  releaseNumber: number,
): string => `${channelBasePath}updates/releases/${releaseNumber}.json`;

/**
 * Builds the channel-root-relative path of a release's archived index
 * document.
 * @param channelBasePath - The worker's own channel base path, e.g. `/` or `/branch/develop/`.
 * @param releaseNumber - The release's identity.
 * @returns The archived index's fetch path.
 */
export const buildArchivedIndexPath = (channelBasePath: string, releaseNumber: number): string =>
  `${channelBasePath}updates/releases/${releaseNumber}/index.html`;

/**
 * Builds the channel-root-relative path of the published `latest.json`
 * pointer.
 * @param channelBasePath - The worker's own channel base path, e.g. `/` or `/branch/develop/`.
 * @returns The pointer's fetch path.
 */
export const buildLatestPointerPath = (channelBasePath: string): string =>
  `${channelBasePath}updates/latest.json`;

/**
 * Field shape shared by every release-summary schema, so the additive
 * protocol schema and the strict persisted schema (see
 * {@link zodPersistedReleaseSummary}) can never independently drift into two
 * different meanings of "release summary".
 */
const releaseSummaryShape = {
  releaseNumber: zodReleaseNumber,
  appVersion: z.string().check(z.minLength(1)),
  buildId: z.string().check(z.minLength(1)),
  buildDate: z.iso.datetime(),
};

/**
 * Release identity plus the display metadata a UI needs to show a release
 * without reading worker cache internals: exact `appVersion`, `buildId`, and
 * `buildDate` from a successfully validated {@link ReleaseDescriptor}. Never
 * derived from a bare `latest.json` pointer or guessed — only from a
 * descriptor that has already passed {@link zodReleaseDescriptor} validation.
 *
 * Additive: this is also the private worker protocol's release-summary
 * shape, which must remain able to gain optional fields for a pinned v1
 * consumer. The persisted controller-state schema uses the strict
 * {@link zodPersistedReleaseSummary} instead.
 */
export const zodReleaseSummary = z.object(releaseSummaryShape);
/** A {@link zodReleaseSummary}-validated release identity with display metadata. */
export type ReleaseSummary = z.infer<typeof zodReleaseSummary>;

/**
 * Persisted-only strict composition of {@link releaseSummaryShape}: rejects
 * any field beyond the four canonical ones, so a stale or foreign field on a
 * durably persisted release summary fails closed instead of being silently
 * stripped.
 */
const zodPersistedReleaseSummary = z.strictObject(releaseSummaryShape);

/**
 * Extracts the {@link ReleaseSummary} — identity plus display metadata —
 * carried by a validated {@link ReleaseDescriptor}.
 * @param descriptor - A validated release descriptor.
 * @returns The release's identity and display metadata.
 */
export const toReleaseSummary = (descriptor: ReleaseDescriptor): ReleaseSummary => ({
  releaseNumber: descriptor.releaseNumber,
  appVersion: descriptor.appVersion,
  buildId: descriptor.buildId,
  buildDate: descriptor.buildDate,
});

/**
 * The single owner of exact release-identity comparison: `true` only when
 * every one of `releaseNumber`, `appVersion`, `buildId`, and `buildDate`
 * matches. A shared `releaseNumber` alone never proves identity — a cache
 * marker or restoration descriptor that matches by number but diverges on
 * any other field must be treated as unavailable/rejected, never served or
 * silently accepted. Every cache-availability and restoration-identity check
 * reuses this comparator instead of duplicating a four-field comparison.
 * @param a - A release summary.
 * @param b - The release summary to compare it against.
 * @returns Whether `a` and `b` identify the exact same release.
 */
export const releaseSummariesMatch = (a: ReleaseSummary, b: ReleaseSummary): boolean =>
  a.releaseNumber === b.releaseNumber &&
  a.appVersion === b.appVersion &&
  a.buildId === b.buildId &&
  a.buildDate === b.buildDate;

/**
 * Persisted controller-state wire-format version. Bump when the persisted
 * shape changes incompatibly; an unreadable or unsupported version must fail
 * closed rather than silently reset to a default state (see
 * `parseControllerState` in `controllerState.ts`).
 */
export const CONTROLLER_STATE_SCHEMA_VERSION = 1;

/** Whether the controller downloads and approves updates automatically or only on explicit user approval. */
export const zodUpdateMode = z.enum(['automatic', 'manual']);
/** A {@link zodUpdateMode}-validated update mode. */
export type UpdateMode = z.infer<typeof zodUpdateMode>;

/** Every phase a persisted future-release candidate may be in. */
export const UPDATE_CANDIDATE_PHASES = ['available', 'ready', 'activating', 'failed'] as const;
/** One of {@link UPDATE_CANDIDATE_PHASES}. */
export type UpdateCandidatePhase = (typeof UPDATE_CANDIDATE_PHASES)[number];

/**
 * The persisted controller's at-most-one future release candidate, as a
 * discriminated union by `phase` so only one phase can ever be represented at
 * once:
 *
 * - `available`: discovered, not yet prepared;
 * - `ready`: fully prepared, waiting for a qualifying clean launch;
 * - `activating`: currently being served for the active clean-launch attempt,
 *   pending `BOOT_OK`/`BOOT_FAILED` or `deadlineAt` expiry — the only phase
 *   carrying a boot-confirmation deadline;
 * - `failed`: the most recent activation of this exact release rolled back.
 */
export const zodUpdateCandidate = z.discriminatedUnion('phase', [
  z.object({ phase: z.literal('available'), release: zodReleaseSummary }),
  z.object({ phase: z.literal('ready'), release: zodReleaseSummary }),
  z.object({
    phase: z.literal('activating'),
    release: zodReleaseSummary,
    deadlineAt: z.iso.datetime(),
  }),
  z.object({ phase: z.literal('failed'), release: zodReleaseSummary }),
]);
/** A {@link zodUpdateCandidate}-validated future release candidate. */
export type UpdateCandidate = z.infer<typeof zodUpdateCandidate>;

/**
 * Persisted-only strict composition of {@link zodUpdateCandidate}'s phase
 * variants: every variant rejects any field beyond its own canonical set —
 * in particular, `deadlineAt` is only ever accepted on `activating`, never
 * silently stripped from `available`, `ready`, or `failed`.
 */
const zodPersistedUpdateCandidate = z.discriminatedUnion('phase', [
  z.strictObject({ phase: z.literal('available'), release: zodPersistedReleaseSummary }),
  z.strictObject({ phase: z.literal('ready'), release: zodPersistedReleaseSummary }),
  z.strictObject({
    phase: z.literal('activating'),
    release: zodPersistedReleaseSummary,
    deadlineAt: z.iso.datetime(),
  }),
  z.strictObject({ phase: z.literal('failed'), release: zodPersistedReleaseSummary }),
]);

/**
 * The service worker's complete persisted update-controller state: the only
 * source of truth for `activeRelease` and the at-most-one future release
 * `candidate`. Deliberately excludes any client-specific, operation-token, or
 * transient check/preparation state (see the managed pinned application
 * updates feature's architecture decision).
 *
 * Strict at every level (root, `activeRelease`, `candidate`, and the
 * candidate's `release`): an unknown, obsolete, or foreign field on a
 * durably persisted record must fail closed rather than being silently
 * stripped, normalized, or migrated. This is deliberately narrower than the
 * additive private worker protocol schemas (see {@link zodReleaseSummary},
 * {@link zodUpdateCandidate}), which must stay able to gain optional fields
 * for a pinned v1 consumer.
 */
/**
 * The complete persisted controller-state structural shape, without the
 * cross-field invariant check (see {@link zodUpdateControllerState}). Exists
 * so `controllerState.ts`'s two-phase classification (unsupported schema
 * version → structurally malformed → invariant violation → valid) can
 * validate structure and invariants as two distinct phases without
 * duplicating this shape between the two schemas.
 */
export const zodUpdateControllerStateShape = z.strictObject({
  schemaVersion: z.literal(CONTROLLER_STATE_SCHEMA_VERSION),
  mode: zodUpdateMode,
  activeRelease: zodPersistedReleaseSummary,
  candidate: z.optional(zodPersistedUpdateCandidate),
  lastSuccessfulCheckAt: z.optional(z.iso.datetime()),
});

export const zodUpdateControllerState = zodUpdateControllerStateShape.check(
  z.refine(
    (state) =>
      !state.candidate || state.candidate.release.releaseNumber > state.activeRelease.releaseNumber,
    'candidate.release must be strictly newer than activeRelease',
  ),
);
/** A {@link zodUpdateControllerState}-validated persisted controller state. */
export type UpdateControllerState = z.infer<typeof zodUpdateControllerState>;
