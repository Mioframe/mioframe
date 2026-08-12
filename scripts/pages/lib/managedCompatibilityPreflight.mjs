/**
 * Managed-release data-compatibility publication preflight.
 *
 * Enforces the managed pinned application updates feature's data
 * compatibility invariant (`docs/managed-pinned-updates.md`, "Data
 * compatibility") at publication time, as release/publication
 * infrastructure — not updater runtime behavior, and never inside
 * `publishManagedRelease()` itself:
 *
 *   While a previous managed release A remains a supported pin/rollback
 *   target, data written by newer release B must remain readable by A.
 *
 * This is the single pre-publication orchestration boundary for a managed
 * candidate build: `publishBranch.mjs`/`publishStable.mjs` call only this
 * function (then the real `publishManagedRelease()`), never
 * `validateManagedArtifact()` directly, so the ordering below is enforced in
 * one place.
 *
 * Contract:
 * - resolve the retained publication plan for `buildId`;
 * - candidate `buildId` already equals the current retained latest ->
 *   `'idempotent'` immediately, without ever inspecting `distDir`: no new
 *   compatibility run, no artifact validation, real publication proceeds
 *   immediately (and itself resolves the same zero-write no-op) — preserving
 *   the idempotent publication contract even when `distDir` does not exist;
 * - otherwise validate the candidate artifact (`validateManagedArtifact`)
 *   against the exact requested deployment identity, before any staging or
 *   real write;
 * - no previous managed release for this channel (this is release 1) ->
 *   `'not-applicable'` after validation, real publication proceeds
 *   immediately;
 * - a genuinely new candidate with an existing previous release -> stage the
 *   candidate into a temporary copy of the real published tree via the real
 *   `publishManagedRelease()`, run the real browser compatibility proof
 *   against that staged copy, and only report success when the proof
 *   passes. The real `workDir` (and therefore the real Pages repository) is
 *   never written to by this module.
 *
 * Malformed or unavailable previous-release metadata already fails closed
 * via `resolvePublicationPlan`'s own retained-tree validation, before any
 * artifact validation or staging is attempted.
 *
 * Read-only `dist` invariant: no verification step run by this module may
 * rebuild or otherwise modify the candidate `distDir`. The compatibility
 * proof runs in its own Playwright container (see
 * `playwright.release.config.ts`'s `MANAGED_COMPAT_WORK_DIR` gating), so this
 * module fingerprints the complete candidate `distDir` tree before staging
 * begins — the earliest point real `distDir` reads/copies occur — and
 * verifies it is byte-for-byte unchanged immediately after, failing
 * publication closed on any mutation introduced by staging itself or by the
 * proof.
 */

import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { basename, join } from 'node:path';

import { resolvePublicationPlan } from './retainedReleaseTree.mjs';
import { publishManagedRelease, resolveChannelBase } from './releasePublish.mjs';
import { computeDirectoryFingerprint } from './releaseArtifact.mjs';
import { validateManagedArtifact } from './managedArtifactSemantics.mjs';
import { isUnsupportedCompatTarget } from './unsupportedRetainedReleases.mjs';
import { runManagedReleaseDataCompatibilityProof } from '../../release/runManagedReleaseDataCompatibilityProof.mjs';

const defaultDeps = {
  runCompatibilityProof: runManagedReleaseDataCompatibilityProof,
  validateArtifact: validateManagedArtifact,
};

/** Repository-owned, gitignored scratch root also used for verifier locks and logs. */
const VERIFY_SCRATCH_ROOT = join(process.cwd(), '.verify');

/**
 * Copies `workDir` (the real cloned Pages work directory) into a fresh
 * temporary directory under the repository's own `.verify/` scratch root,
 * excluding `.git` — the staged copy never needs, and must never perform,
 * any git operation.
 *
 * Staged under the repository root (not the OS temp directory) so the
 * staged tree is visible inside the Playwright container the compatibility
 * proof runs in: the container only ever mounts the repository root at
 * `/work` (see `scripts/playwrightContainer.mjs`), never the host OS temp
 * directory.
 * @param workDir The real Pages work directory to copy.
 * @returns The staged copy's root directory. Caller owns removing it.
 */
function stagePublishedTreeCopy(workDir) {
  mkdirSync(VERIFY_SCRATCH_ROOT, { recursive: true });
  const stagedRoot = mkdtempSync(join(VERIFY_SCRATCH_ROOT, 'managed-compat-staged-'));
  cpSync(workDir, stagedRoot, {
    recursive: true,
    filter: (src) => basename(src) !== '.git',
  });
  return stagedRoot;
}

/**
 * Fails closed when `distDir`'s current fingerprint differs from `before` —
 * a path added, removed, or changed. Enforces this module's read-only
 * `dist` invariant (see its own doc comment): no verification step may
 * rebuild or otherwise modify the candidate build.
 * @param distDir Built `dist` directory for the candidate build.
 * @param before The fingerprint captured before running the compatibility proof.
 * @throws {Error} When `distDir`'s current fingerprint differs from `before`.
 */
function assertDistFingerprintUnchanged(distDir, before) {
  const after = computeDirectoryFingerprint(distDir);
  const beforeByPath = new Map(before.map((entry) => [entry.path, entry]));
  const afterByPath = new Map(after.map((entry) => [entry.path, entry]));

  const changedPaths = new Set();
  for (const [path, beforeEntry] of beforeByPath) {
    const afterEntry = afterByPath.get(path);
    if (
      afterEntry === undefined ||
      afterEntry.sha256 !== beforeEntry.sha256 ||
      afterEntry.byteSize !== beforeEntry.byteSize
    ) {
      changedPaths.add(path);
    }
  }
  for (const path of afterByPath.keys()) {
    if (!beforeByPath.has(path)) {
      changedPaths.add(path);
    }
  }

  if (changedPaths.size > 0) {
    throw new Error(
      `Candidate dist "${distDir}" was mutated during the managed release data-compatibility proof: ` +
        `${[...changedPaths].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)).join(', ')}. No verification step may rebuild or modify the candidate build. Publication blocked.`,
    );
  }
}

/**
 * Runs the managed-release data-compatibility publication preflight for one
 * candidate build, before any real publication write. Must be called, and
 * must resolve or reject, before {@link publishManagedRelease} is called
 * against the real `workDir`.
 * @param options Preflight inputs — the same inputs the real publication
 * (`publishManagedRelease`) will be called with immediately afterward.
 * @param options.workDir The real, already-cloned Pages staging work directory root.
 * @param options.distDir Built `dist` directory for the candidate build.
 * @param options.channel Managed channel: `'stable'` or `'develop'`.
 * @param options.appVersion `package.json` version the candidate build was produced from.
 * @param options.buildId Exact source commit SHA the candidate build was produced from.
 * @param options.buildDate Canonical UTC ISO 8601 committer timestamp of `buildId`.
 * @param [deps] Test seams for artifact validation and the compatibility proof runner.
 * @returns The resolved preflight decision.
 * @throws {Error} When the retained tree is malformed or its content is not
 * physically restorable (via {@link resolvePublicationPlan}), when the
 * candidate artifact does not match the requested managed deployment
 * identity (via {@link validateManagedArtifact}), when staging the candidate
 * into a temporary copy fails, or when the compatibility proof fails or
 * reports non-pass.
 */
export async function runManagedPublicationPreflight(
  { workDir, distDir, channel, appVersion, buildId, buildDate },
  deps = defaultDeps,
) {
  const channelBase = resolveChannelBase(workDir, channel);
  const updatesDir = join(channelBase, 'updates');
  const releasesDir = join(updatesDir, 'releases');

  // Read-only: validates the complete retained tree and resolves the
  // idempotent publication decision, exactly as the real publisher will,
  // without inspecting distDir or writing anything.
  const plan = resolvePublicationPlan(releasesDir, updatesDir, buildId, channelBase);

  if (plan.kind === 'no-op') {
    return { decision: 'idempotent', descriptor: plan.descriptor };
  }

  // Only a genuinely new candidate reaches artifact-semantic validation:
  // validating (and therefore reading) distDir before the idempotent no-op
  // check above would require a well-formed dist even to republish an
  // already-retained buildId, breaking the zero-write no-op contract.
  deps.validateArtifact({ distDir, channel, appVersion, buildId, buildDate });

  if (plan.nextReleaseNumber === 1) {
    return { decision: 'not-applicable' };
  }

  // Every retained previous release remains a possible active pin/rollback
  // target under the current append-only/no-pruning retained-tree
  // architecture — never only the immediately preceding one — except a
  // release statically classified as an unsupported compat target (see
  // unsupportedRetainedReleases.mjs): it stays retained and was already
  // fully integrity-validated above by resolvePublicationPlan, but is never
  // a real pin/rollback target and so is excluded from what the new
  // candidate's compatibility proof must cover.
  const previousReleaseNumbers = plan.descriptors
    .map((descriptor) => descriptor.releaseNumber)
    .filter((releaseNumber) => !isUnsupportedCompatTarget(channel, releaseNumber));

  // Fingerprinted before staging begins: publishManagedRelease() below reads
  // distDir/index.html and copies distDir/assets into the staged copy, so
  // this is the earliest point any real read/copy of the candidate dist
  // occurs — capturing the baseline any later, e.g. after staging, would
  // miss a mutation introduced by staging itself.
  const distFingerprintBeforeStaging = computeDirectoryFingerprint(distDir);
  const stagedWorkDir = stagePublishedTreeCopy(workDir);

  try {
    let stagedDescriptor;
    let proof;
    try {
      try {
        stagedDescriptor = publishManagedRelease({
          workDir: stagedWorkDir,
          distDir,
          channel,
          appVersion,
          buildId,
          buildDate,
        });
      } catch (error) {
        throw new Error(
          'Failed to stage the candidate managed release for the data-compatibility proof',
          { cause: error },
        );
      }

      proof = await deps.runCompatibilityProof({
        stagedWorkDir,
        channel,
        previousReleaseNumbers,
        candidateReleaseNumber: stagedDescriptor.releaseNumber,
      });
    } finally {
      // Runs on every path below the fingerprint baseline above — staging
      // failure and proof failure included, not only proof success: a
      // masked dist mutation is a worse outcome than losing the original
      // failure message, so a mutation detected here is reported instead of
      // it.
      assertDistFingerprintUnchanged(distDir, distFingerprintBeforeStaging);
    }
    if (!proof.passed) {
      throw new Error(
        `Managed release data-compatibility proof failed for channel "${channel}": ` +
          `one or more of retained releases [${previousReleaseNumbers.join(', ')}] could not prove they can read data written by candidate release ${stagedDescriptor.releaseNumber}. Publication blocked.`,
      );
    }

    return { decision: 'proved', descriptor: stagedDescriptor, previousReleaseNumbers };
  } finally {
    rmSync(stagedWorkDir, { recursive: true, force: true });
  }
}
