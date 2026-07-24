import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, relative } from 'node:path';
import toolingConfig from '../../../config/tooling.json' with { type: 'json' };
import { buildSpaFallbackHtml } from './spaFallback.mjs';

/** Maximum total byte size the published GitHub Pages tree may reach after a stable publish. */
export const STABLE_PAGES_SIZE_LIMIT_BYTES = 900 * 1024 * 1024;

const RELEASE_SEQUENCE_PLACEHOLDER = toolingConfig.release.releaseSequencePlaceholder;

/**
 * Patch the build-time release-sequence placeholder embedded in the compiled stable service
 * worker (`vite.config.ts`'s `__RELEASE_SEQUENCE__` define) with the real allocated sequence.
 *
 * `releaseSequence` is only known after this build already exists (it is allocated from the
 * retained-release tree during publication), so the worker bundle is built once with a
 * distinctive placeholder token and patched in place here, the same way `buildStableReleasePublication`
 * already patches `index.html` with a literal meta-tag injection after the real identity is known.
 * A `distDir` with no built worker (a disabled-PWA or non-stable-channel build, or a test fixture
 * without a real Vite build), or one whose worker no longer contains the placeholder (already
 * patched by an earlier call, e.g. a retried publish over the same `distDir`), is left untouched.
 * @param distDir - Production build output directory containing the compiled `sw.js`, if any.
 * @param releaseSequence - The real allocated forward-only sequence for this release.
 */
export const patchWorkerReleaseSequence = (distDir, releaseSequence) => {
  const workerPath = join(distDir, 'sw.js');
  if (!existsSync(workerPath)) return;
  const placeholderToken = JSON.stringify(RELEASE_SEQUENCE_PLACEHOLDER);
  const source = readFileSync(workerPath, 'utf8');
  // Absent covers a non-PWA/non-stable-channel build (nothing to patch) and a retried publish
  // over an already-patched `distDir` (the worker was already correctly embedded by an earlier
  // call for this exact release) — both are safe to leave untouched rather than fail.
  if (!source.includes(placeholderToken)) return;
  writeFileSync(
    workerPath,
    source.split(placeholderToken).join(JSON.stringify(String(releaseSequence))),
  );
};

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

const walkFiles = (root, current = root) =>
  readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const path = join(current, entry.name);
    return entry.isDirectory() ? walkFiles(root, path) : [relative(root, path)];
  });

const readDeploymentMetadata = (distDir) => {
  const metadata = JSON.parse(readFileSync(join(distDir, 'deployment.json'), 'utf8'));
  if (
    metadata.channel !== 'stable' ||
    metadata.channelId !== 'main' ||
    !/^[0-9a-f]{40}$/.test(metadata.sha ?? '') ||
    typeof metadata.appVersion !== 'string' ||
    typeof metadata.buildDate !== 'string'
  ) {
    throw new Error('Stable deployment metadata must contain canonical main release facts.');
  }
  return metadata;
};

/**
 * Build the immutable release descriptor, archived index, and latest pointer for one build
 * output, without writing anything to disk.
 * @param distDir - Absolute or relative production build output directory. Must contain
 * `deployment.json`, `index.html`, and `assets/`.
 * @param [releaseSequence] - Publisher-allocated forward-only sequence for this release. Must be a
 * positive safe integer.
 * @returns The complete release identity (`releaseId`, `identity`), descriptor, archived index
 * bytes (`indexBytes`), and serialized descriptor and latest-pointer text (`descriptorText`,
 * `latestText`) ready to write.
 * @throws {Error} When `deployment.json` is missing canonical stable main release facts, or
 * `releaseSequence` is not a positive safe integer.
 */
export const buildStableReleasePublication = (distDir, releaseSequence = 1) => {
  if (!Number.isSafeInteger(releaseSequence) || releaseSequence < 1) {
    throw new Error('Stable release sequence must be a positive safe integer.');
  }
  const metadata = readDeploymentMetadata(distDir);
  const releaseId = metadata.sha;
  const identity = {
    releaseId,
    releaseSequence,
    appVersion: metadata.appVersion,
    buildId: releaseId.slice(0, 7),
    buildDate: metadata.buildDate,
  };
  const indexBytes = Buffer.from(
    readFileSync(join(distDir, 'index.html'), 'utf8').replace(
      '<head>',
      `<head><meta name="mioframe-release-id" content="${releaseId}">`,
    ),
  );
  const files = [
    {
      url: `/updates/releases/${releaseId}/index.html`,
      byteSize: indexBytes.byteLength,
      sha256: sha256(indexBytes),
    },
    ...walkFiles(join(distDir, 'assets')).map((file) => {
      const bytes = readFileSync(join(distDir, 'assets', file));
      return {
        url: `/assets/${file.replaceAll('\\', '/')}`,
        byteSize: bytes.byteLength,
        sha256: sha256(bytes),
      };
    }),
  ].sort((left, right) => left.url.localeCompare(right.url));
  const descriptor = {
    schemaVersion: 2,
    ...identity,
    indexUrl: `/updates/releases/${releaseId}/index.html`,
    files,
  };
  return {
    releaseId,
    identity,
    descriptor,
    indexBytes,
    descriptorText: `${JSON.stringify(descriptor, null, 2)}\n`,
    latestText: `${JSON.stringify(
      {
        schemaVersion: 2,
        release: identity,
        descriptorUrl: `/updates/releases/${releaseId}.json`,
      },
      null,
      2,
    )}\n`,
  };
};

/**
 * Write a standalone stable release artifact (sequence 1, no retained-release scanning) directly
 * into `distDir` itself. Used only for local/preview artifact builds that publish nothing into a
 * shared retained-release tree.
 * @param distDir - Absolute or relative production build output directory; also the write target
 * for the archived release, descriptor, and latest pointer.
 * @returns The built publication (see {@link buildStableReleasePublication}), after writing its
 * archived index, descriptor, and latest pointer into `distDir`.
 * @throws {Error} When the build output is missing canonical stable deployment metadata.
 */
export const writeStableReleaseArtifact = (distDir) => {
  const publication = buildStableReleasePublication(distDir, 1);
  patchWorkerReleaseSequence(distDir, 1);
  const releaseDir = join(distDir, 'updates', 'releases', publication.releaseId);
  mkdirSync(releaseDir, { recursive: true });
  writeFileSync(join(releaseDir, 'index.html'), publication.indexBytes);
  writeFileSync(
    join(distDir, 'updates', 'releases', `${publication.releaseId}.json`),
    publication.descriptorText,
  );
  writeFileSync(join(distDir, 'updates', 'latest.json'), publication.latestText);
  return publication;
};

const assertIdenticalOrMissing = (path, expected) => {
  if (existsSync(path) && !readFileSync(path).equals(expected)) {
    throw new Error('Stable release collision: existing release content differs.');
  }
};

const currentTreeSize = (root) =>
  existsSync(root)
    ? walkFiles(root).reduce((total, file) => total + statSync(join(root, file)).size, 0)
    : 0;

const isValidReleaseFile = (value) =>
  typeof value === 'object' &&
  value !== null &&
  typeof value.url === 'string' &&
  value.url.length > 0 &&
  Number.isSafeInteger(value.byteSize) &&
  value.byteSize >= 0 &&
  /^[0-9a-f]{64}$/.test(value.sha256 ?? '');

/**
 * Validate the complete published release-descriptor contract (schema version, every identity
 * field, the canonical index URL, and a non-empty, well-formed file list with exactly one
 * canonical release index) — the same fields `releaseDescriptorSchema` validates at runtime,
 * checked structurally here since Node publication code must not import the browser-facing
 * `zod`-based schema module.
 * @param value - Untrusted parsed descriptor JSON.
 * @returns Whether `value` is a completely valid release descriptor.
 */
const isValidReleaseDescriptor = (value) => {
  if (
    typeof value !== 'object' ||
    value === null ||
    value.schemaVersion !== 2 ||
    !/^[0-9a-f]{40}$/.test(value.releaseId ?? '') ||
    !Number.isSafeInteger(value.releaseSequence) ||
    value.releaseSequence < 1 ||
    typeof value.appVersion !== 'string' ||
    value.appVersion.length === 0 ||
    typeof value.buildId !== 'string' ||
    value.buildId.length === 0 ||
    typeof value.buildDate !== 'string' ||
    Number.isNaN(Date.parse(value.buildDate)) ||
    typeof value.indexUrl !== 'string' ||
    value.indexUrl.length === 0 ||
    !Array.isArray(value.files) ||
    value.files.length === 0 ||
    !value.files.every(isValidReleaseFile)
  ) {
    return false;
  }
  const canonicalIndex = `/updates/releases/${value.releaseId}/index.html`;
  return (
    value.indexUrl === canonicalIndex &&
    value.files.filter((file) => file.url === canonicalIndex).length === 1
  );
};

// Reads every retained release descriptor directly from disk, independent of `latest.json`.
// `latest.json` is only a pointer and can be rolled back to an older release while newer
// descriptors remain retained; allocation must be based on what is actually retained so a
// republish after such a rollback cannot collide with or duplicate an existing sequence.
//
// Every `updates/releases/*.json` file is treated as a release descriptor namespace entry, not as
// possibly-unrelated content: malformed JSON, an invalid schema, a filename that does not match
// its own `releaseId`, or two files claiming the same `releaseId` all fail publication instead of
// being silently skipped, since sequence reuse can become unsafe if any of them were ignored.
const readRetainedReleaseDescriptors = (workDir) => {
  const releasesDir = join(workDir, 'updates', 'releases');
  if (!existsSync(releasesDir)) return [];
  const seenReleaseIds = new Map();
  return readdirSync(releasesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => {
      let parsed;
      try {
        parsed = JSON.parse(readFileSync(join(releasesDir, entry.name), 'utf8'));
      } catch {
        throw new Error(`Retained release descriptor ${entry.name} is not valid JSON.`);
      }
      if (!isValidReleaseDescriptor(parsed)) {
        throw new Error(`Retained release descriptor ${entry.name} has an invalid schema.`);
      }
      const expectedName = `${parsed.releaseId}.json`;
      if (entry.name !== expectedName) {
        throw new Error(
          `Retained release descriptor ${entry.name} does not match its release id filename ${expectedName}.`,
        );
      }
      const owner = seenReleaseIds.get(parsed.releaseId);
      if (owner) {
        throw new Error(
          `Retained release id ${parsed.releaseId} is claimed by both ${owner} and ${entry.name}.`,
        );
      }
      seenReleaseIds.set(parsed.releaseId, entry.name);
      return parsed;
    });
};

const allocateReleaseSequence = (workDir, releaseId) => {
  const retained = readRetainedReleaseDescriptors(workDir);
  const sequenceOwners = new Map();
  for (const descriptor of retained) {
    const owner = sequenceOwners.get(descriptor.releaseSequence);
    if (owner && owner !== descriptor.releaseId) {
      throw new Error(
        `Stable release sequence collision: sequence ${descriptor.releaseSequence} is owned by multiple release ids.`,
      );
    }
    sequenceOwners.set(descriptor.releaseSequence, descriptor.releaseId);
  }
  const existing = retained.find((descriptor) => descriptor.releaseId === releaseId);
  if (existing) return existing.releaseSequence;
  const maxSequence = retained.reduce(
    (max, descriptor) => Math.max(max, descriptor.releaseSequence),
    0,
  );
  return maxSequence + 1;
};

/**
 * Publish one build's stable release into the retained Pages work tree: allocate its forward-only
 * sequence, reject size-limit or content-collision violations, archive its immutable content, and
 * write the `latest.json` pointer last.
 * @param workDir - Retained Pages publication tree (mutated in place).
 * @param distDir - Production build output directory being published.
 * @param [options] - `sizeLimitBytes` overrides the projected-size guard, mainly for tests;
 * defaults to {@link STABLE_PAGES_SIZE_LIMIT_BYTES}.
 * @returns The built publication (see {@link buildStableReleasePublication}) plus the projected
 * total Pages tree size after publication (`projectedSize`).
 * @throws {Error} When retained descriptor state is invalid (malformed JSON, invalid schema, a
 * filename/release-id mismatch, or a duplicate release id), when an existing retained release id
 * or file content collides with a different id or different bytes, or when the projected size
 * exceeds `sizeLimitBytes`. `latest.json` is left untouched in every failure case.
 */
export const applyManagedStablePublish = (
  workDir,
  distDir,
  { sizeLimitBytes = STABLE_PAGES_SIZE_LIMIT_BYTES } = {},
) => {
  const latestPath = join(workDir, 'updates', 'latest.json');
  const releaseId = readDeploymentMetadata(distDir).sha;
  const releaseSequence = allocateReleaseSequence(workDir, releaseId);
  const publication = buildStableReleasePublication(distDir, releaseSequence);
  patchWorkerReleaseSequence(distDir, releaseSequence);
  const releaseDir = join(workDir, 'updates', 'releases', publication.releaseId);
  const descriptorPath = join(workDir, 'updates', 'releases', `${publication.releaseId}.json`);
  const archivedIndexPath = join(releaseDir, 'index.html');
  const descriptorBytes = Buffer.from(publication.descriptorText);
  const indexBytes = publication.indexBytes;

  assertIdenticalOrMissing(descriptorPath, descriptorBytes);
  assertIdenticalOrMissing(archivedIndexPath, indexBytes);
  for (const file of publication.descriptor.files.filter(({ url }) => url.startsWith('/assets/'))) {
    const relativePath = file.url.slice('/assets/'.length);
    assertIdenticalOrMissing(
      join(workDir, 'assets', relativePath),
      readFileSync(join(distDir, 'assets', relativePath)),
    );
  }

  const existingSize = currentTreeSize(workDir);
  const additions = publication.descriptor.files.reduce(
    (total, file) => {
      const target = join(workDir, file.url.slice(1));
      return total + (existsSync(target) ? 0 : file.byteSize);
    },
    existsSync(descriptorPath) ? 0 : descriptorBytes.byteLength,
  );
  const preservedRootEntries = new Set(['.git', 'assets', 'updates', 'branch', 'pr']);
  const replaceableRootBytes = readdirSync(workDir, { withFileTypes: true })
    .filter(({ name }) => !preservedRootEntries.has(name))
    .reduce((total, entry) => {
      const path = join(workDir, entry.name);
      return total + (entry.isDirectory() ? currentTreeSize(path) : statSync(path).size);
    }, 0);
  const newRootBytes = readdirSync(distDir, { withFileTypes: true })
    .filter(({ name }) => !['assets', 'updates'].includes(name))
    .reduce((total, entry) => {
      const path = join(distDir, entry.name);
      return total + (entry.isDirectory() ? currentTreeSize(path) : statSync(path).size);
    }, 0);
  const latestBytes = Buffer.byteLength(publication.latestText);
  const distFallbackBytes = existsSync(join(distDir, '404.html'))
    ? statSync(join(distDir, '404.html')).size
    : 0;
  const publishedFallback = buildSpaFallbackHtml();
  const publishedFallbackBytes = Buffer.byteLength(publishedFallback);
  const oldLatestBytes = existsSync(latestPath) ? statSync(latestPath).size : 0;
  const projectedSize =
    existingSize +
    additions -
    replaceableRootBytes +
    newRootBytes -
    distFallbackBytes +
    publishedFallbackBytes -
    oldLatestBytes +
    latestBytes;
  if (projectedSize > sizeLimitBytes) {
    throw new Error(
      `Pages artifact size ${projectedSize} exceeds the ${sizeLimitBytes} byte limit.`,
    );
  }

  mkdirSync(releaseDir, { recursive: true });
  mkdirSync(join(workDir, 'assets'), { recursive: true });
  cpSync(join(distDir, 'assets'), join(workDir, 'assets'), { recursive: true, force: false });
  writeFileSync(archivedIndexPath, indexBytes);
  writeFileSync(descriptorPath, descriptorBytes);

  for (const entry of readdirSync(workDir, { withFileTypes: true })) {
    if (entry.name === '.git' || ['assets', 'updates', 'branch', 'pr'].includes(entry.name))
      continue;
    rmSync(join(workDir, entry.name), { recursive: true, force: true });
  }
  for (const entry of readdirSync(distDir, { withFileTypes: true })) {
    if (['assets', 'updates'].includes(entry.name)) continue;
    cpSync(join(distDir, entry.name), join(workDir, entry.name), { recursive: true });
  }
  writeFileSync(join(workDir, '404.html'), publishedFallback);
  mkdirSync(join(workDir, 'updates'), { recursive: true });
  writeFileSync(latestPath, publication.latestText);
  return { ...publication, projectedSize };
};
