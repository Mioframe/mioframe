import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { readRetainedReleaseDescriptors } from '../../../../scripts/pages/lib/releaseDescriptor.mjs';
import { publishManagedRelease } from '../../../../scripts/pages/lib/releasePublish.mjs';
import {
  materializeManagedRelease,
  mutateControllerWorkerBytes,
} from './managedReleaseFixture.mjs';

const ENTRY_PATH_PATTERN = /src="(\/assets\/entry-[0-9a-f-]+\.js)"/;
const TEMPLATE_ENTRY_CONTENT = 'console.log("app entry");';

/**
 * Builds a minimal synthetic dist directory shaped like a real Vite build's
 * output (an `index.html` with one `<script type="module">` entry under
 * `assets/`), without running a real `vite build` — these tests only need
 * to prove `materializeManagedRelease`'s own file-patching logic, not
 * exercise the build tool itself.
 * @returns The synthetic template directory. Caller owns removing it.
 */
function buildSyntheticTemplate() {
  const templateDir = mkdtempSync(join(tmpdir(), 'fixture-template-'));
  mkdirSync(join(templateDir, 'assets'), { recursive: true });
  writeFileSync(join(templateDir, 'assets', 'index-abc123.js'), TEMPLATE_ENTRY_CONTENT);
  writeFileSync(
    join(templateDir, 'index.html'),
    '<!doctype html><html><head></head><body><div id="app"></div>' +
      '<script type="module" crossorigin src="/assets/index-abc123.js"></script></body></html>',
  );
  return templateDir;
}

describe('materializeManagedRelease', () => {
  let templateDir = '';
  let distDir = '';

  beforeEach(() => {
    templateDir = buildSyntheticTemplate();
  });

  afterEach(() => {
    rmSync(templateDir, { recursive: true, force: true });
    if (distDir) rmSync(distDir, { recursive: true, force: true });
    distDir = '';
  });

  it('creates a unique entry path distinct from the template original, and index.html references it', () => {
    distDir = materializeManagedRelease({ templateDir, basePath: '/', buildId: 'build-a' });

    expect(existsSync(join(distDir, 'assets', 'index-abc123.js'))).toBe(false);
    const html = readFileSync(join(distDir, 'index.html'), 'utf8');
    const match = ENTRY_PATH_PATTERN.exec(html);
    expect(match).not.toBeNull();
    expect(existsSync(join(distDir, match[1].replace(/^\//, '')))).toBe(true);
  });

  it('carries the original content plus a deterministic build-identity marker for a normal release', () => {
    distDir = materializeManagedRelease({ templateDir, basePath: '/', buildId: 'build-marker' });

    const html = readFileSync(join(distDir, 'index.html'), 'utf8');
    const match = ENTRY_PATH_PATTERN.exec(html);
    const content = readFileSync(join(distDir, match[1].replace(/^\//, '')), 'utf8');
    expect(content).toContain(TEMPLATE_ENTRY_CONTENT);
    expect(content).toContain('build-marker');
  });

  it('creates a unique throwing entry path for a broken release', () => {
    distDir = materializeManagedRelease({
      templateDir,
      basePath: '/',
      buildId: 'build-broken',
      broken: true,
    });

    const html = readFileSync(join(distDir, 'index.html'), 'utf8');
    const match = ENTRY_PATH_PATTERN.exec(html);
    expect(match).not.toBeNull();
    const content = readFileSync(join(distDir, match[1].replace(/^\//, '')), 'utf8');
    expect(content).toBe('throw new Error("simulated boot failure");');
  });

  it('produces distinct entry paths across two materializations of the same template', () => {
    distDir = materializeManagedRelease({ templateDir, basePath: '/', buildId: 'build-x' });
    const otherDistDir = materializeManagedRelease({
      templateDir,
      basePath: '/',
      buildId: 'build-y',
    });
    try {
      const pathA = ENTRY_PATH_PATTERN.exec(readFileSync(join(distDir, 'index.html'), 'utf8'))[1];
      const pathB = ENTRY_PATH_PATTERN.exec(
        readFileSync(join(otherDistDir, 'index.html'), 'utf8'),
      )[1];
      expect(pathA).not.toBe(pathB);
    } finally {
      rmSync(otherDistDir, { recursive: true, force: true });
    }
  });

  it('never mutates the source template', () => {
    const beforeHtml = readFileSync(join(templateDir, 'index.html'), 'utf8');
    distDir = materializeManagedRelease({ templateDir, basePath: '/', buildId: 'build-b' });

    expect(readFileSync(join(templateDir, 'index.html'), 'utf8')).toBe(beforeHtml);
    expect(existsSync(join(templateDir, 'assets', 'index-abc123.js'))).toBe(true);
    expect(readFileSync(join(templateDir, 'assets', 'index-abc123.js'), 'utf8')).toBe(
      TEMPLATE_ENTRY_CONTENT,
    );
  });
});

describe('materialized releases publish through the real publisher without collisions', () => {
  let templateDir = '';
  let workDir = '';

  beforeEach(() => {
    templateDir = buildSyntheticTemplate();
    workDir = mkdtempSync(join(tmpdir(), 'fixture-workdir-'));
  });

  afterEach(() => {
    rmSync(templateDir, { recursive: true, force: true });
    rmSync(workDir, { recursive: true, force: true });
  });

  function publishFromTemplate({ buildId, appVersion, broken = false }) {
    const distDir = materializeManagedRelease({ templateDir, basePath: '/', buildId, broken });
    try {
      return publishManagedRelease({
        workDir,
        distDir,
        channel: 'stable',
        appVersion,
        buildId,
        buildDate: '2026-07-24T00:00:00.000Z',
      });
    } finally {
      rmSync(distDir, { recursive: true, force: true });
    }
  }

  it('publishes two logical releases from one template without an immutable collision', () => {
    const descriptorA = publishFromTemplate({ buildId: 'release-a', appVersion: '1.0.0' });
    const descriptorB = publishFromTemplate({ buildId: 'release-b', appVersion: '1.1.0' });

    expect(descriptorA.releaseNumber).not.toBe(descriptorB.releaseNumber);
    const retained = readRetainedReleaseDescriptors(join(workDir, 'updates', 'releases'));
    const compareNumbers = (a, b) => a - b;
    expect(retained.map((descriptor) => descriptor.releaseNumber).sort(compareNumbers)).toEqual(
      [descriptorA.releaseNumber, descriptorB.releaseNumber].sort(compareNumbers),
    );
  });

  it('keeps an earlier published release restorable after a later broken release is published', () => {
    const descriptorA = publishFromTemplate({ buildId: 'release-a', appVersion: '1.0.0' });
    publishFromTemplate({ buildId: 'release-broken', appVersion: '1.1.0', broken: true });

    for (const file of descriptorA.files) {
      const bytes = readFileSync(join(workDir, file.path));
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(file.sha256);
    }
  });
});

describe('mutateControllerWorkerBytes', () => {
  let templateDir = '';
  let workDir = '';

  beforeEach(() => {
    templateDir = buildSyntheticTemplate();
    workDir = mkdtempSync(join(tmpdir(), 'fixture-mutate-workdir-'));
  });

  afterEach(() => {
    rmSync(templateDir, { recursive: true, force: true });
    rmSync(workDir, { recursive: true, force: true });
  });

  function publishWithWorker({ channel, buildId, appVersion }) {
    const basePath = channel === 'stable' ? '/' : '/branch/develop/';
    const distDir = materializeManagedRelease({ templateDir, basePath, buildId });
    try {
      writeFileSync(join(distDir, 'sw.js'), 'self.addEventListener("install", () => {});');
      return publishManagedRelease({
        workDir,
        distDir,
        channel,
        appVersion,
        buildId,
        buildDate: '2026-07-24T00:00:00.000Z',
      });
    } finally {
      rmSync(distDir, { recursive: true, force: true });
    }
  }

  it('changes sw.js bytes and returns a revision embedded in the appended code, for the stable channel', () => {
    publishWithWorker({ channel: 'stable', buildId: 'mutate-stable-a', appVersion: '1.0.0' });
    const swPath = join(workDir, 'sw.js');
    const before = readFileSync(swPath, 'utf8');

    const revision = mutateControllerWorkerBytes(workDir, 'stable');

    const after = readFileSync(swPath, 'utf8');
    expect(after).not.toBe(before);
    expect(after).toContain(revision);
    expect(after).toContain('globalThis.__MIOFRAME_TEST_CONTROLLER_REVISION__');
  });

  it('changes sw.js bytes for the develop channel at its branch slot', () => {
    publishWithWorker({ channel: 'develop', buildId: 'mutate-develop-a', appVersion: '1.0.0' });
    const swPath = join(workDir, 'branch', 'develop', 'sw.js');
    const before = readFileSync(swPath, 'utf8');

    const revision = mutateControllerWorkerBytes(workDir, 'develop');

    const after = readFileSync(swPath, 'utf8');
    expect(after).not.toBe(before);
    expect(after).toContain(revision);
  });

  it('returns a distinct revision on every call', () => {
    publishWithWorker({ channel: 'stable', buildId: 'mutate-stable-b', appVersion: '1.0.0' });

    const revisionOne = mutateControllerWorkerBytes(workDir, 'stable');
    const revisionTwo = mutateControllerWorkerBytes(workDir, 'stable');

    expect(revisionOne).not.toBe(revisionTwo);
  });

  it('does not modify any application release file, descriptor, or the latest.json pointer', () => {
    const descriptor = publishWithWorker({
      channel: 'stable',
      buildId: 'mutate-stable-c',
      appVersion: '1.0.0',
    });
    const descriptorPath = join(workDir, 'updates', 'releases', `${descriptor.releaseNumber}.json`);
    const latestPath = join(workDir, 'updates', 'latest.json');
    const descriptorBefore = readFileSync(descriptorPath, 'utf8');
    const latestBefore = readFileSync(latestPath, 'utf8');

    mutateControllerWorkerBytes(workDir, 'stable');

    expect(readFileSync(descriptorPath, 'utf8')).toBe(descriptorBefore);
    expect(readFileSync(latestPath, 'utf8')).toBe(latestBefore);
    for (const file of descriptor.files) {
      const bytes = readFileSync(join(workDir, file.path));
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(file.sha256);
    }
  });
});
