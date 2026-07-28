import * as z from 'zod/v4-mini';

/** The two channels the managed pinned-update controller supports. */
export type ManagedChannel = 'stable' | 'develop';

/**
 * Wire-format version for published release descriptors and the `latest.json`
 * pointer. Bump when the on-disk shape of either changes incompatibly.
 */
export const RELEASE_DESCRIPTOR_SCHEMA_VERSION = 1;

/**
 * Forward-ordering identity for one immutable application release.
 *
 * `releaseId` is the immutable release identifier; `releaseSequence` is used
 * only to order releases relative to each other, never to look up historical
 * releases.
 */
export const zodReleaseRef = z.object({
  releaseId: z.string().check(z.minLength(1)),
  releaseSequence: z.number().check(z.int(), z.positive()),
});
/** A {@link zodReleaseRef}-validated release identity. */
export type ReleaseRef = z.infer<typeof zodReleaseRef>;

/**
 * Returns `true` when `path` is a canonical channel-root-relative release
 * file path: no leading slash, no `..` traversal segment, no query/hash
 * suffix, and no percent-encoded path separator.
 * @param path - Candidate release file path.
 * @returns Whether `path` is canonical.
 */
export const isCanonicalReleasePath = (path: string): boolean => {
  if (path.length === 0 || path.startsWith('/')) return false;
  if (path.includes('?') || path.includes('#')) return false;
  if (/%2e|%2f/i.test(path)) return false;
  return !path.split('/').includes('..');
};

/**
 * One immutable, content-addressed file belonging to a release, as recorded
 * in its {@link ReleaseDescriptor}.
 */
export const zodReleaseFile = z.object({
  /** Canonical channel-root-relative path, e.g. `assets/app-3f2a1c.js`. */
  path: z.string().check(z.minLength(1), z.refine(isCanonicalReleasePath)),
  sha256: z.hash('sha256'),
  byteSize: z.number().check(z.int(), z.nonnegative()),
});
/** A {@link zodReleaseFile}-validated release file record. */
export type ReleaseFile = z.infer<typeof zodReleaseFile>;

/**
 * Published descriptor for one immutable application release: identity,
 * display/diagnostics metadata, and the exact file set required to serve it
 * offline. Validated at both publication and runtime boundaries.
 */
export const zodReleaseDescriptor = z.object({
  schemaVersion: z.literal(RELEASE_DESCRIPTOR_SCHEMA_VERSION),
  releaseId: z.string().check(z.minLength(1)),
  releaseSequence: z.number().check(z.int(), z.positive()),
  appVersion: z.string().check(z.minLength(1)),
  buildId: z.string().check(z.minLength(1)),
  buildDate: z.iso.datetime(),
  indexUrl: z.string().check(z.minLength(1)),
  files: z.array(zodReleaseFile).check(z.minLength(1)),
});
/** A {@link zodReleaseDescriptor}-validated release descriptor. */
export type ReleaseDescriptor = z.infer<typeof zodReleaseDescriptor>;

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
 * every same-channel window since `startedAt`, pending `BOOT_OK`/`BOOT_FAILED`
 * or the `deadlineAt` boot-confirmation timeout.
 */
export const zodActivation = z.object({
  targetRelease: zodReleaseRef,
  previousRelease: zodReleaseRef,
  startedAt: z.iso.datetime(),
  deadlineAt: z.iso.datetime(),
});
/** A {@link zodActivation}-validated in-progress activation. */
export type Activation = z.infer<typeof zodActivation>;

/**
 * The service worker's complete persisted update-controller state: the only
 * source of truth for `activeRelease`, `approvedRelease`, and `activation`.
 * Deliberately excludes any client-specific, operation-token, or transient
 * check/preparation state (see the managed pinned application updates
 * feature's architecture decision).
 */
export const zodUpdateControllerState = z.object({
  schemaVersion: z.literal(CONTROLLER_STATE_SCHEMA_VERSION),
  mode: zodUpdateMode,
  activeRelease: zodReleaseRef,
  latestRelease: z.optional(zodReleaseRef),
  approvedRelease: z.optional(zodReleaseRef),
  activation: z.optional(zodActivation),
  failedReleaseIds: z.array(z.string().check(z.minLength(1))),
  lastSuccessfulCheckAt: z.optional(z.iso.datetime()),
});
/** A {@link zodUpdateControllerState}-validated persisted controller state. */
export type UpdateControllerState = z.infer<typeof zodUpdateControllerState>;
