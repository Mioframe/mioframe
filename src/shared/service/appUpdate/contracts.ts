import * as z from 'zod/v4-mini';

/** The two channels the managed pinned-update controller supports. */
export type ManagedChannel = 'stable' | 'develop';

/**
 * Wire-format version for published release descriptors and the `latest.json`
 * pointer. Bump when the on-disk shape of either changes incompatibly.
 */
export const RELEASE_DESCRIPTOR_SCHEMA_VERSION = 1;

/**
 * Matches the canonical lowercase-hyphenated UUID shape produced by
 * `crypto.randomUUID()` (the Node publisher's only source of `releaseId`).
 * Shared by every schema that carries a release identity, so a malformed
 * `latest.json` pointer or descriptor is rejected at the same boundary
 * rather than only at whichever consumer happens to compare strings later.
 */
const CANONICAL_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** A release identifier in the exact canonical UUID format the publisher produces. */
const zodReleaseId = z.string().check(z.refine((value) => CANONICAL_UUID_PATTERN.test(value)));

/**
 * Forward-ordering identity for one immutable application release.
 *
 * `releaseId` is the immutable release identifier; `releaseSequence` is used
 * only to order releases relative to each other, never to look up historical
 * releases.
 */
export const zodReleaseRef = z.object({
  releaseId: zodReleaseId,
  releaseSequence: z.number().check(z.int(), z.positive()),
});
/** A {@link zodReleaseRef}-validated release identity. */
export type ReleaseRef = z.infer<typeof zodReleaseRef>;

/** Channel-root-relative path prefix reserved for controller metadata (`latest.json`, descriptors, archived indexes) — never a valid ordinary release file. */
const RESERVED_UPDATES_PREFIX = 'updates/';

/**
 * Returns `true` when `path` is a canonical channel-root-relative release
 * file path: no leading slash, no `..` traversal segment, no query/hash
 * suffix, no percent-encoded path separator, and not under the reserved
 * `updates/` metadata prefix (which also excludes every release's own
 * archived index, always published under `updates/releases/<id>/`, from
 * ever being listed as one of its own ordinary release files).
 * @param path - Candidate release file path.
 * @returns Whether `path` is canonical.
 */
export const isCanonicalReleasePath = (path: string): boolean => {
  if (path.length === 0 || path.startsWith('/')) return false;
  if (path.includes('?') || path.includes('#')) return false;
  if (/%2e|%2f/i.test(path)) return false;
  if (path === 'updates' || path.startsWith(RESERVED_UPDATES_PREFIX)) return false;
  return !path.split('/').includes('..');
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
  releaseId: zodReleaseId,
  releaseSequence: z.number().check(z.int(), z.positive()),
  appVersion: z.string().check(z.minLength(1)),
  buildId: z.string().check(z.minLength(1)),
  buildDate: z.iso.datetime(),
  indexUrl: z.string().check(z.minLength(1)),
  /** Lowercase hex SHA-256 digest of the final archived `index.html` bytes, computed after boot-watchdog injection. */
  indexSha256: z.string().check(z.refine((value) => SHA256_HEX_PATTERN.test(value))),
  /** Exact byte size of the final archived `index.html`, computed after boot-watchdog injection. */
  indexByteSize: z.number().check(z.int(), z.nonnegative()),
  files: z.array(zodReleaseFile).check(z.minLength(1), z.refine(hasUniqueFilePaths)),
});
/** A {@link zodReleaseDescriptor}-validated release descriptor. */
export type ReleaseDescriptor = z.infer<typeof zodReleaseDescriptor>;

/**
 * Builds the exact `indexUrl` a valid descriptor for `releaseId` must carry
 * within `channelBasePath`. A descriptor is only usable within the channel
 * that published it — this is what makes a channel-root-relative
 * `indexUrl` from a different channel (or a hand-crafted absolute URL
 * pointing elsewhere) rejected rather than silently followed.
 * @param channelBasePath - The worker's own channel base path, e.g. `/` or `/branch/develop/`.
 * @param releaseId - The release's immutable identifier.
 * @returns The exact expected `indexUrl`.
 */
export const buildExpectedIndexUrl = (channelBasePath: string, releaseId: string): string =>
  `${channelBasePath}updates/releases/${releaseId}/index.html`;

/**
 * Returns `true` when `descriptor.indexUrl` is exactly the archived index
 * this channel and release id must resolve to.
 * @param descriptor - A structurally validated release descriptor.
 * @param channelBasePath - The worker's own channel base path.
 * @returns Whether `descriptor.indexUrl` is valid for this channel and release.
 */
export const isValidDescriptorIndexUrl = (
  descriptor: Pick<ReleaseDescriptor, 'indexUrl' | 'releaseId'>,
  channelBasePath: string,
): boolean => descriptor.indexUrl === buildExpectedIndexUrl(channelBasePath, descriptor.releaseId);

/**
 * The `latest.json` pointer published last during release publication.
 * Deliberately just a {@link ReleaseRef}: a worker must fetch and validate
 * the exact descriptor separately before trusting this pointer.
 */
export const zodLatestReleasePointer = zodReleaseRef;
/** A {@link zodLatestReleasePointer}-validated `latest.json` pointer. */
export type LatestReleasePointer = z.infer<typeof zodLatestReleasePointer>;

/**
 * Extracts the {@link ReleaseRef} identity carried by a validated
 * {@link ReleaseDescriptor}.
 * @param descriptor - A validated release descriptor.
 * @returns The release's `{ releaseId, releaseSequence }` identity.
 */
export const toReleaseRef = (descriptor: ReleaseDescriptor): ReleaseRef => ({
  releaseId: descriptor.releaseId,
  releaseSequence: descriptor.releaseSequence,
});

/**
 * Release identity plus the display metadata a UI needs to show a candidate
 * release without reading worker cache internals: exact `appVersion`,
 * `buildId`, and `buildDate` from a successfully validated
 * {@link ReleaseDescriptor}. Never derived from a bare `latest.json` pointer
 * or guessed — only from a descriptor that has already passed
 * {@link zodReleaseDescriptor} and identity validation.
 */
export const zodReleaseSummary = z.object({
  releaseId: zodReleaseId,
  releaseSequence: z.number().check(z.int(), z.positive()),
  appVersion: z.string().check(z.minLength(1)),
  buildId: z.string().check(z.minLength(1)),
  buildDate: z.iso.datetime(),
});
/** A {@link zodReleaseSummary}-validated release identity with display metadata. */
export type ReleaseSummary = z.infer<typeof zodReleaseSummary>;

/**
 * Extracts the {@link ReleaseSummary} — identity plus display metadata —
 * carried by a validated {@link ReleaseDescriptor}.
 * @param descriptor - A validated release descriptor.
 * @returns The release's identity and display metadata.
 */
export const toReleaseSummary = (descriptor: ReleaseDescriptor): ReleaseSummary => ({
  releaseId: descriptor.releaseId,
  releaseSequence: descriptor.releaseSequence,
  appVersion: descriptor.appVersion,
  buildId: descriptor.buildId,
  buildDate: descriptor.buildDate,
});

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

/**
 * An in-progress clean-launch activation: `targetRelease` is being served to
 * every same-channel window, pending `BOOT_OK`/`BOOT_FAILED` or the
 * `deadlineAt` boot-confirmation timeout. `activeRelease` is never changed by
 * starting an activation, so there is nothing to record here to reconstruct
 * a rollback target — that identity always remains `activeRelease` itself.
 */
export const zodActivation = z.object({
  targetRelease: zodReleaseSummary,
  deadlineAt: z.iso.datetime(),
});
/** A {@link zodActivation}-validated in-progress activation. */
export type Activation = z.infer<typeof zodActivation>;

/**
 * Returns `true` when two release identities violate the one-to-one
 * `releaseId`/`releaseSequence` invariant: the same `releaseSequence` with a
 * different `releaseId`, or the same `releaseId` with a different
 * `releaseSequence`. Two references with identical fields are not a
 * conflict.
 * @param a - First release identity.
 * @param b - Second release identity.
 * @returns Whether `a` and `b` conflict.
 */
const isReleaseIdentityConflict = (a: ReleaseRef, b: ReleaseRef): boolean =>
  (a.releaseSequence === b.releaseSequence && a.releaseId !== b.releaseId) ||
  (a.releaseId === b.releaseId && a.releaseSequence !== b.releaseSequence);

/**
 * Returns `true` when any pair in `refs` violates the one-to-one release
 * identity invariant (see {@link isReleaseIdentityConflict}).
 * @param refs - Release identities to check pairwise.
 * @returns Whether any pair conflicts.
 */
export const hasReleaseIdentityConflict = (refs: readonly ReleaseRef[]): boolean =>
  refs.some((ref, index) =>
    refs.slice(index + 1).some((other) => isReleaseIdentityConflict(ref, other)),
  );

/**
 * Collects every release reference currently present in persisted controller
 * state — `activeRelease`, `latestRelease`, `approvedRelease`,
 * `activation.targetRelease`, and `failedActivationRelease` — omitting
 * unset optional references. The single place both the persisted-state
 * schema and release discovery use to enforce the release identity
 * invariant across every reference.
 * @param state - Release references to collect from.
 * @returns Every present release reference.
 */
export const collectReleaseReferences = (state: {
  activeRelease: ReleaseRef;
  latestRelease?: ReleaseRef | undefined;
  approvedRelease?: ReleaseRef | undefined;
  activation?: { targetRelease: ReleaseRef } | undefined;
  failedActivationRelease?: ReleaseRef | undefined;
}): ReleaseRef[] =>
  [
    state.activeRelease,
    state.latestRelease,
    state.approvedRelease,
    state.activation?.targetRelease,
    state.failedActivationRelease,
  ].filter((ref): ref is ReleaseRef => ref !== undefined);

/**
 * The service worker's complete persisted update-controller state: the only
 * source of truth for `activeRelease`, `approvedRelease`, and `activation`.
 * Deliberately excludes any client-specific, operation-token, or transient
 * check/preparation state (see the managed pinned application updates
 * feature's architecture decision).
 *
 * `approvedRelease` and `activation` are mutually exclusive ownership
 * states — a release is either prepared and waiting for a clean launch
 * (`approvedRelease`), or already selected for the current clean-launch
 * attempt (`activation`), never both at once.
 */
export const zodUpdateControllerState = z
  .object({
    schemaVersion: z.literal(CONTROLLER_STATE_SCHEMA_VERSION),
    mode: zodUpdateMode,
    activeRelease: zodReleaseRef,
    latestRelease: z.optional(zodReleaseSummary),
    approvedRelease: z.optional(zodReleaseSummary),
    activation: z.optional(zodActivation),
    /** The single most recent release that failed clean-launch activation, if any. Only ever one record — not an unbounded history. */
    failedActivationRelease: z.optional(zodReleaseSummary),
    lastSuccessfulCheckAt: z.optional(z.iso.datetime()),
  })
  .check(
    z.refine(
      (state) => !(state.approvedRelease && state.activation),
      'approvedRelease and activation must not coexist',
    ),
    z.refine(
      (state) =>
        !state.approvedRelease ||
        state.approvedRelease.releaseSequence > state.activeRelease.releaseSequence,
      'approvedRelease must be strictly newer than activeRelease',
    ),
    z.refine(
      (state) =>
        !state.activation ||
        state.activation.targetRelease.releaseSequence > state.activeRelease.releaseSequence,
      'activation.targetRelease must be strictly newer than activeRelease',
    ),
    z.refine(
      (state) => !hasReleaseIdentityConflict(collectReleaseReferences(state)),
      'every release reference must obey the one-to-one releaseId/releaseSequence invariant',
    ),
  );
/** A {@link zodUpdateControllerState}-validated persisted controller state. */
export type UpdateControllerState = z.infer<typeof zodUpdateControllerState>;
