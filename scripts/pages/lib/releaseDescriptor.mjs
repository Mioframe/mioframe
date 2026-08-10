/**
 * Build release descriptors for the managed pinned application updates
 * feature (stable and develop channels only), validated against the single
 * canonical release-wire-contract schema in
 * `src/shared/service/appUpdate/releaseWireContract.ts` — imported here
 * directly, since Node LTS can execute that module's erasable TypeScript
 * syntax with no loader.
 */

import {
  isPositiveSafeInteger,
  RELEASE_DESCRIPTOR_SCHEMA_VERSION,
  zodReleaseDescriptor,
} from '../../../src/shared/service/appUpdate/releaseWireContract.ts';

export { isPositiveSafeInteger, RELEASE_DESCRIPTOR_SCHEMA_VERSION };

/**
 * Structurally validates one `ReleaseDescriptor` record.
 * @param candidate Value to validate.
 * @returns Whether `candidate` is a valid `ReleaseDescriptor`.
 */
export function isValidReleaseDescriptor(candidate) {
  return zodReleaseDescriptor.safeParse(candidate).success;
}

/**
 * Builds and validates a new `ReleaseDescriptor`.
 * @param params Descriptor fields.
 * @param params.releaseNumber Allocated release identity and ordering value, from {@link resolvePublicationPlan} in `retainedReleaseTree.mjs`.
 * @param params.appVersion `package.json` version this release was built from.
 * @param params.buildId CI build identity (e.g. commit SHA).
 * @param params.buildDate ISO 8601 UTC build timestamp.
 * @param params.indexSha256 Lowercase hex SHA-256 digest of the final archived `index.html` bytes, computed after boot-watchdog injection.
 * @param params.indexByteSize Exact byte size of the final archived `index.html`, computed after boot-watchdog injection.
 * @param params.files This release's file list, from `collectReleaseFiles` in `releaseArtifact.mjs`.
 * @returns The validated `ReleaseDescriptor`.
 */
export function buildReleaseDescriptor({
  releaseNumber,
  appVersion,
  buildId,
  buildDate,
  indexSha256,
  indexByteSize,
  files,
}) {
  const descriptor = {
    schemaVersion: RELEASE_DESCRIPTOR_SCHEMA_VERSION,
    releaseNumber,
    appVersion,
    buildId,
    buildDate,
    indexSha256,
    indexByteSize,
    files,
  };
  if (!isValidReleaseDescriptor(descriptor)) {
    throw new Error(`Built an invalid release descriptor for release ${String(releaseNumber)}`);
  }
  return descriptor;
}
