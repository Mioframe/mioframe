import * as z from 'zod/v4-mini';

/** The two channels the managed pinned-update controller supports. */
export const zodManagedChannel = z.enum(['stable', 'develop']);
/** A {@link zodManagedChannel}-validated managed channel. */
export type ManagedChannel = z.infer<typeof zodManagedChannel>;

/**
 * Wire-format version for published release descriptors and the `latest.json`
 * pointer. Bump when the on-disk shape of either changes incompatibly.
 */
export const RELEASE_DESCRIPTOR_SCHEMA_VERSION = 1;

/**
 * Returns `true` when `value` is a positive safe integer — the sole identity
 * and ordering value for a release. Mirrors `isPositiveSafeInteger` in
 * `scripts/pages/lib/releaseDescriptor.mjs`.
 * @param value - Candidate value.
 * @returns Whether `value` is a positive safe integer.
 */
export const isPositiveSafeInteger = (value: number): boolean =>
  Number.isSafeInteger(value) && value > 0;

/** A release identifier: one positive safe-integer, both identity and ordering value. */
const zodReleaseNumber = z.number().check(z.refine(isPositiveSafeInteger));

/** Channel-root-relative path prefix reserved for controller metadata (`latest.json`, descriptors, archived indexes) — never a valid ordinary release file. */
const RESERVED_UPDATES_PREFIX = 'updates/';

/**
 * A fixed, arbitrary base URL used only to resolve a candidate path through
 * the platform `URL` parser for the canonicalization round-trip check in
 * {@link isCanonicalReleasePath}. Never a real network origin.
 */
const CANONICAL_PATH_BASE = 'https://mioframe.internal/';

/**
 * Returns `true` when `path` is the single canonical channel-root-relative
 * representation of a release file — never merely a path that *resolves* to
 * one. Rejects: an empty path; a leading or trailing `/`; any `\`; any `%`
 * (no percent-encoding at all, valid or not); a query (`?`) or fragment
 * (`#`); an empty, `.`, or `..` path segment (which also rejects a doubled
 * `//` separator); and the reserved `updates/` metadata prefix (which also
 * excludes every release's own archived index, always published under
 * `updates/releases/<releaseNumber>/`, from ever being listed as one of its
 * own ordinary release files). As a final catch-all, resolves `path` against
 * a fixed base through the platform `URL` parser and requires its resulting
 * pathname (with the leading `/` stripped) to equal `path` exactly — this is
 * what additionally rejects a URL-normalizable alias such as a raw space,
 * which would otherwise pass every explicit character check above. Mirrors
 * `isCanonicalReleasePath` in `scripts/pages/lib/releaseDescriptor.mjs`,
 * proven equivalent against the shared corpus in
 * `releaseDescriptorCorpus.mjs`.
 * @param path - Candidate release file path.
 * @returns Whether `path` is canonical.
 */
export const isCanonicalReleasePath = (path: string): boolean => {
  if (path.length === 0) return false;
  if (path.startsWith('/') || path.endsWith('/')) return false;
  if (path.includes('\\')) return false;
  if (path.includes('%')) return false;
  if (path.includes('?') || path.includes('#')) return false;
  if (path === 'updates' || path.startsWith(RESERVED_UPDATES_PREFIX)) return false;
  if (
    path.split('/').some((segment) => segment.length === 0 || segment === '.' || segment === '..')
  ) {
    return false;
  }
  let normalizedPathname: string;
  try {
    normalizedPathname = new URL(path, CANONICAL_PATH_BASE).pathname;
  } catch {
    return false;
  }
  return normalizedPathname.slice(1) === path;
};

/** Matches a lowercase hex SHA-256 digest exactly; mirrors the Node publisher's `SHA256_HEX_PATTERN`. */
const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;

/**
 * One immutable, content-addressed file belonging to a release, as recorded
 * in its {@link ReleaseDescriptor}.
 */
export const zodReleaseFile = z.object({
  /** Canonical channel-root-relative path, e.g. `assets/app-3f2a1c.js`. */
  path: z.string().check(z.minLength(1), z.refine(isCanonicalReleasePath)),
  /** Lowercase hex SHA-256 digest only — an uppercase or mixed-case digest is rejected, not normalized. */
  sha256: z.string().check(z.refine((value) => SHA256_HEX_PATTERN.test(value))),
  byteSize: z.number().check(z.int(), z.nonnegative()),
});
/** A {@link zodReleaseFile}-validated release file record. */
export type ReleaseFile = z.infer<typeof zodReleaseFile>;

/**
 * Returns `true` when no two files in `files` share the same `path`.
 * @param files
 */
const hasUniqueFilePaths = (files: readonly ReleaseFile[]): boolean =>
  new Set(files.map((file) => file.path)).size === files.length;

/**
 * Published descriptor for one immutable application release: identity,
 * display/diagnostics metadata, and the exact file set required to serve it
 * offline. Validated at both publication and runtime boundaries.
 */
export const zodReleaseDescriptor = z.object({
  schemaVersion: z.literal(RELEASE_DESCRIPTOR_SCHEMA_VERSION),
  releaseNumber: zodReleaseNumber,
  appVersion: z.string().check(z.minLength(1)),
  buildId: z.string().check(z.minLength(1)),
  buildDate: z.iso.datetime(),
  /** Lowercase hex SHA-256 digest of the final archived `index.html` bytes, computed after boot-watchdog injection. */
  indexSha256: z.string().check(z.refine((value) => SHA256_HEX_PATTERN.test(value))),
  /** Exact byte size of the final archived `index.html`, computed after boot-watchdog injection. */
  indexByteSize: z.number().check(z.int(), z.nonnegative()),
  files: z.array(zodReleaseFile).check(z.minLength(1), z.refine(hasUniqueFilePaths)),
});
/** A {@link zodReleaseDescriptor}-validated release descriptor. */
export type ReleaseDescriptor = z.infer<typeof zodReleaseDescriptor>;

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
 * The `latest.json` pointer published last during release publication.
 * Deliberately just the release number: a worker must fetch and validate the
 * exact descriptor separately before trusting this pointer.
 */
export const zodLatestReleasePointer = z.object({ releaseNumber: zodReleaseNumber });
/** A {@link zodLatestReleasePointer}-validated `latest.json` pointer. */
export type LatestReleasePointer = z.infer<typeof zodLatestReleasePointer>;

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
export const zodUpdateControllerState = z
  .strictObject({
    schemaVersion: z.literal(CONTROLLER_STATE_SCHEMA_VERSION),
    mode: zodUpdateMode,
    activeRelease: zodPersistedReleaseSummary,
    candidate: z.optional(zodPersistedUpdateCandidate),
    lastSuccessfulCheckAt: z.optional(z.iso.datetime()),
  })
  .check(
    z.refine(
      (state) =>
        !state.candidate ||
        state.candidate.release.releaseNumber > state.activeRelease.releaseNumber,
      'candidate.release must be strictly newer than activeRelease',
    ),
  );
/** A {@link zodUpdateControllerState}-validated persisted controller state. */
export type UpdateControllerState = z.infer<typeof zodUpdateControllerState>;
