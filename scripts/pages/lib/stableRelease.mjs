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
 * Deterministically render the build-time release-sequence placeholder embedded in the compiled
 * stable service worker (`vite.config.ts`'s `__RELEASE_SEQUENCE__` define) into the real allocated
 * sequence, entirely in memory.
 *
 * `releaseSequence` is only known after this build already exists (it is allocated from the
 * retained-release tree during publication), so the worker bundle is built once with a
 * distinctive placeholder token — `JSON.stringify` of a sentinel string, never a plausible real
 * value — and rendered here, the same way `buildStableReleasePublication` already patches
 * `index.html` with a literal meta-tag injection after the real identity is known.
 *
 * Rendering is strict: the unpatched worker must contain the placeholder exactly once (never
 * silently left unchanged), an already-rendered worker is accepted only when it contains exactly
 * one occurrence of the expected sequence's own literal form and no placeholder, and every other
 * shape — a different or missing embedded sequence, the placeholder alongside an already-rendered
 * value, or more than one occurrence of either — is a publication error rather than a silently
 * accepted worker.
 * @param source - Compiled worker source text, read but never written by this function.
 * @param releaseSequence - The real allocated forward-only sequence for this release.
 * @returns The worker source with the placeholder rendered to `releaseSequence`, or the original
 * source unchanged when it already contains exactly that sequence.
 * @throws {Error} When the worker's embedded release-sequence state does not deterministically
 * resolve to exactly `releaseSequence`.
 */
export const renderWorkerReleaseSequence = (source, releaseSequence) => {
  const placeholderToken = JSON.stringify(RELEASE_SEQUENCE_PLACEHOLDER);
  const expectedToken = JSON.stringify(String(releaseSequence));
  const placeholderCount = source.split(placeholderToken).length - 1;
  const expectedCount = source.split(expectedToken).length - 1;

  if (placeholderCount > 1) {
    throw new Error('Compiled worker contains the release-sequence placeholder more than once.');
  }
  if (placeholderCount === 1) {
    if (expectedCount > 0) {
      throw new Error(
        'Compiled worker contains both the release-sequence placeholder and an already-rendered sequence.',
      );
    }
    return source.split(placeholderToken).join(expectedToken);
  }
  if (expectedCount === 1) return source;
  if (expectedCount > 1) {
    throw new Error('Compiled worker contains the expected release sequence more than once.');
  }
  throw new Error(
    `Compiled worker contains neither the release-sequence placeholder nor the expected sequence ${releaseSequence}.`,
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
 * Write a standalone stable release artifact (no retained-release scanning) directly into
 * `distDir` itself. Used for local/preview artifact builds that publish nothing into a shared
 * retained-release tree, and for release-only fixture builds that need a specific embedded
 * sequence rendered exactly once (the strict renderer rejects re-rendering an already-different
 * value, so a fixture needing a non-default sequence must request it here rather than patch twice).
 * @param distDir - Absolute or relative production build output directory; also the write target
 * for the archived release, descriptor, and latest pointer.
 * @param [releaseSequence] - The sequence to render into the compiled worker and descriptor;
 * defaults to `1` for a standalone/local artifact.
 * @returns The built publication (see {@link buildStableReleasePublication}), after writing its
 * archived index, descriptor, and latest pointer into `distDir`.
 * @throws {Error} When the build output is missing canonical stable deployment metadata, or the
 * compiled worker's embedded release sequence does not deterministically resolve to
 * `releaseSequence`.
 */
export const writeStableReleaseArtifact = (distDir, releaseSequence = 1) => {
  const publication = buildStableReleasePublication(distDir, releaseSequence);
  const workerPath = join(distDir, 'sw.js');
  if (existsSync(workerPath)) {
    const rendered = renderWorkerReleaseSequence(readFileSync(workerPath, 'utf8'), releaseSequence);
    writeFileSync(workerPath, rendered);
  }
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

// Same-origin canonical path form required of every descriptor URL: no query, no hash, no `.`/`..`
// traversal segment, and no percent-encoded traversal or path-separator characters. Mirrors the
// runtime `parseCanonicalPath` check in `src/shared/service/appUpdate/releaseCache.ts` — Node
// publication code cannot import that browser-facing module, so the same rule is reimplemented
// here and proven equivalent against a shared corpus (`releaseDescriptorCorpus.mjs`).
const isCanonicalPath = (value) => {
  if (typeof value !== 'string' || value.length === 0) return false;
  let parsed;
  try {
    parsed = new URL(value, 'https://stable-release.invalid');
  } catch {
    return false;
  }
  return (
    parsed.origin === 'https://stable-release.invalid' &&
    value === parsed.pathname &&
    !parsed.search &&
    !parsed.hash &&
    !/(?:^|\/)\.\.?\//.test(value) &&
    !/%2e|%2f|%5c/i.test(value)
  );
};

const isValidReleaseFile = (value) =>
  typeof value === 'object' &&
  value !== null &&
  isCanonicalPath(value.url) &&
  Number.isSafeInteger(value.byteSize) &&
  value.byteSize >= 0 &&
  /^[0-9a-f]{64}$/.test(value.sha256 ?? '');

/**
 * Validate the complete published release-descriptor contract — the same fields and semantic
 * rules `releaseDescriptorSchema` plus `isSemanticallyValidReleaseDescriptor` validate at runtime
 * (`src/shared/service/appUpdate/releaseCache.ts`), checked structurally here since Node
 * publication code must not import the browser-facing `zod`-based schema module. Proven identical
 * acceptance/rejection against the shared corpus in `releaseDescriptorCorpus.mjs`.
 * @param value - Untrusted parsed descriptor JSON.
 * @returns Whether `value` is a completely valid release descriptor.
 */
export const isValidReleaseDescriptor = (value) => {
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
    !isCanonicalPath(value.indexUrl) ||
    !Array.isArray(value.files) ||
    value.files.length === 0 ||
    !value.files.every(isValidReleaseFile)
  ) {
    return false;
  }
  const canonicalIndex = `/updates/releases/${value.releaseId}/index.html`;
  const urls = value.files.map((file) => file.url);
  if (new Set(urls).size !== urls.length) return false;
  if (urls.filter((url) => url === canonicalIndex).length !== 1) return false;
  return (
    value.indexUrl === canonicalIndex &&
    urls.every((url) => url === canonicalIndex || url.startsWith('/assets/'))
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
 * or file content collides with a different id or different bytes, when the compiled worker's
 * embedded release sequence does not deterministically resolve to the allocated sequence, or when
 * the projected size exceeds `sizeLimitBytes`. `latest.json` is left untouched in every failure
 * case, and the input `distDir` (including its compiled `sw.js`) is never mutated.
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
  // Rendered entirely in memory: the input `distDir`'s own `sw.js` is read but never written here.
  const workerPath = join(distDir, 'sw.js');
  const renderedWorkerSource = existsSync(workerPath)
    ? renderWorkerReleaseSequence(readFileSync(workerPath, 'utf8'), releaseSequence)
    : undefined;
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
      // The rendered worker's size (not the unpatched on-disk placeholder size) is what will
      // actually be written to `workDir`, so the projected-size guard must use it.
      if (entry.name === 'sw.js' && renderedWorkerSource !== undefined) {
        return total + Buffer.byteLength(renderedWorkerSource);
      }
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
    if (entry.name === 'sw.js' && renderedWorkerSource !== undefined) {
      writeFileSync(join(workDir, entry.name), renderedWorkerSource);
      continue;
    }
    cpSync(join(distDir, entry.name), join(workDir, entry.name), { recursive: true });
  }
  writeFileSync(join(workDir, '404.html'), publishedFallback);
  mkdirSync(join(workDir, 'updates'), { recursive: true });
  writeFileSync(latestPath, publication.latestText);
  return { ...publication, projectedSize };
};
