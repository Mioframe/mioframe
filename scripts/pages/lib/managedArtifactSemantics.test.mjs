import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { validateManagedArtifact } from './managedArtifactSemantics.mjs';

let distDir = '';

beforeEach(() => {
  distDir = mkdtempSync(join(tmpdir(), 'managed-artifact-semantics-'));
});

afterEach(() => {
  rmSync(distDir, { recursive: true, force: true });
});

const REQUEST = {
  appVersion: '1.2.3',
  buildId: 'abc123',
  buildDate: '2026-08-01T00:00:00.000Z',
};

function writeJson(fileName, value) {
  writeFileSync(join(distDir, fileName), JSON.stringify(value));
}

/**
 * Writes a complete, valid managed artifact for `base`/`channel`, matching real vite-plugin-pwa output shape.
 * @param base The channel base path to bake into every generated file.
 * @param deploymentJson The `deployment.json` contents to write.
 */
function writeValidArtifact(base, deploymentJson) {
  writeJson('deployment.json', deploymentJson);
  writeFileSync(
    join(distDir, 'index.html'),
    `<html><head>
<link rel="manifest" href="${base}manifest.webmanifest">
<script id="vite-plugin-pwa:register-sw" src="${base}registerSW.js"></script>
</head><body>
<script type="module" crossorigin src="${base}assets/index-abc123.js"></script>
<link rel="modulepreload" crossorigin href="${base}assets/vendor-def456.js">
<link rel="stylesheet" crossorigin href="${base}assets/index-ghi789.css">
</body></html>`,
  );
  writeJson('manifest.webmanifest', {
    name: 'Mioframe',
    short_name: 'Mioframe',
    scope: base,
    start_url: base,
    id: base,
  });
  writeFileSync(
    join(distDir, 'registerSW.js'),
    `if('serviceWorker' in navigator) {window.addEventListener('load', () => {navigator.serviceWorker.register('${base}sw.js', { scope: '${base}' })})}`,
  );
  writeFileSync(join(distDir, 'sw.js'), '// managed controller worker');
}

const DEVELOP_BASE = '/branch/develop/';
const validDevelopDeployment = () => ({
  channel: 'branch',
  channelId: 'develop',
  slug: 'develop',
  baseUrl: DEVELOP_BASE,
  sha: REQUEST.buildId,
  appVersion: REQUEST.appVersion,
  buildDate: REQUEST.buildDate,
});

const STABLE_BASE = '/';
const validStableDeployment = () => ({
  channel: 'stable',
  channelId: 'main',
  baseUrl: STABLE_BASE,
  sha: REQUEST.buildId,
  appVersion: REQUEST.appVersion,
  buildDate: REQUEST.buildDate,
});

describe('validateManagedArtifact', () => {
  it('passes for a complete, correctly based develop artifact', () => {
    writeValidArtifact(DEVELOP_BASE, validDevelopDeployment());

    expect(() =>
      validateManagedArtifact({ distDir, channel: 'develop', ...REQUEST }),
    ).not.toThrow();
  });

  it('passes for a complete, correctly based stable artifact', () => {
    writeValidArtifact(STABLE_BASE, validStableDeployment());

    expect(() => validateManagedArtifact({ distDir, channel: 'stable', ...REQUEST })).not.toThrow();
  });

  it('rejects a missing deployment.json', () => {
    writeValidArtifact(DEVELOP_BASE, validDevelopDeployment());
    rmSync(join(distDir, 'deployment.json'));

    expect(() => validateManagedArtifact({ distDir, channel: 'develop', ...REQUEST })).toThrow(
      'missing',
    );
  });

  it('rejects malformed deployment.json', () => {
    writeValidArtifact(DEVELOP_BASE, validDevelopDeployment());
    writeFileSync(join(distDir, 'deployment.json'), 'not json');

    expect(() => validateManagedArtifact({ distDir, channel: 'develop', ...REQUEST })).toThrow(
      'not valid JSON',
    );
  });

  it('rejects a stable-shaped deployment.json (wrong baseUrl "/") requested as develop, before any write', () => {
    // Exactly the reported bug: a develop build accidentally produced with
    // the generic "/" base instead of "/branch/develop/".
    writeValidArtifact(STABLE_BASE, {
      channel: 'stable',
      channelId: 'main',
      baseUrl: STABLE_BASE,
      sha: REQUEST.buildId,
      appVersion: REQUEST.appVersion,
      buildDate: REQUEST.buildDate,
    });

    expect(() => validateManagedArtifact({ distDir, channel: 'develop', ...REQUEST })).toThrow(
      'does not match the requested "develop" publication',
    );
  });

  it('rejects a mismatched buildId (sha)', () => {
    writeValidArtifact(DEVELOP_BASE, validDevelopDeployment());

    expect(() =>
      validateManagedArtifact({
        distDir,
        channel: 'develop',
        ...REQUEST,
        buildId: 'different-sha',
      }),
    ).toThrow('sha: expected "different-sha"');
  });

  it('rejects a mismatched appVersion', () => {
    writeValidArtifact(DEVELOP_BASE, validDevelopDeployment());

    expect(() =>
      validateManagedArtifact({ distDir, channel: 'develop', ...REQUEST, appVersion: '9.9.9' }),
    ).toThrow('appVersion: expected "9.9.9"');
  });

  it('rejects a mismatched buildDate', () => {
    writeValidArtifact(DEVELOP_BASE, validDevelopDeployment());

    expect(() =>
      validateManagedArtifact({
        distDir,
        channel: 'develop',
        ...REQUEST,
        buildDate: '2099-01-01T00:00:00.000Z',
      }),
    ).toThrow('buildDate: expected "2099-01-01T00:00:00.000Z"');
  });

  it('rejects index.html resource URLs still using the generic "/" base for a develop artifact', () => {
    writeValidArtifact(DEVELOP_BASE, validDevelopDeployment());
    // Simulate the webServer rebuild bug: index.html rebuilt with the wrong base.
    writeFileSync(
      join(distDir, 'index.html'),
      '<html><body><script type="module" src="/assets/index-abc123.js"></script></body></html>',
    );

    expect(() => validateManagedArtifact({ distDir, channel: 'develop', ...REQUEST })).toThrow(
      'does not use the expected base',
    );
  });

  it('rejects a stable index.html that leaks into a foreign /branch/* namespace', () => {
    writeValidArtifact(STABLE_BASE, validStableDeployment());
    writeFileSync(
      join(distDir, 'index.html'),
      '<html><body><script type="module" src="/branch/develop/assets/index-abc123.js"></script></body></html>',
    );

    expect(() => validateManagedArtifact({ distDir, channel: 'stable', ...REQUEST })).toThrow(
      'does not use the expected base',
    );
  });

  it('rejects a manifest.webmanifest scope/start_url/id still using the wrong base', () => {
    writeValidArtifact(DEVELOP_BASE, validDevelopDeployment());
    writeJson('manifest.webmanifest', {
      name: 'Mioframe',
      scope: '/',
      start_url: '/',
      id: '/',
    });

    expect(() => validateManagedArtifact({ distDir, channel: 'develop', ...REQUEST })).toThrow(
      'manifest.webmanifest "scope"',
    );
  });

  // These values would all pass a merely-prefix-based base check (each one
  // literally starts with the expected base), but none of them IS the
  // expected base: each identifies a different, narrower PWA root than the
  // managed channel's own. scope/start_url/id must equal the expected base
  // exactly.
  it('rejects a manifest.webmanifest "scope" that is a sub-path under the expected develop base, not the base itself', () => {
    writeValidArtifact(DEVELOP_BASE, validDevelopDeployment());
    writeJson('manifest.webmanifest', {
      name: 'Mioframe',
      scope: '/branch/develop/foo/',
      start_url: DEVELOP_BASE,
      id: DEVELOP_BASE,
    });

    expect(() => validateManagedArtifact({ distDir, channel: 'develop', ...REQUEST })).toThrow(
      'manifest.webmanifest "scope" "/branch/develop/foo/" must exactly equal the expected base',
    );
  });

  it('rejects a manifest.webmanifest "start_url" that is a sub-path under the expected develop base, not the base itself', () => {
    writeValidArtifact(DEVELOP_BASE, validDevelopDeployment());
    writeJson('manifest.webmanifest', {
      name: 'Mioframe',
      scope: DEVELOP_BASE,
      start_url: '/branch/develop/app',
      id: DEVELOP_BASE,
    });

    expect(() => validateManagedArtifact({ distDir, channel: 'develop', ...REQUEST })).toThrow(
      'manifest.webmanifest "start_url" "/branch/develop/app" must exactly equal the expected base',
    );
  });

  it('rejects a manifest.webmanifest "id" that is a sub-path under the expected stable base, not the base itself', () => {
    writeValidArtifact(STABLE_BASE, validStableDeployment());
    writeJson('manifest.webmanifest', {
      name: 'Mioframe',
      scope: STABLE_BASE,
      start_url: STABLE_BASE,
      id: '/foo/',
    });

    expect(() => validateManagedArtifact({ distDir, channel: 'stable', ...REQUEST })).toThrow(
      'manifest.webmanifest "id" "/foo/" must exactly equal the expected base',
    );
  });

  it('rejects a missing manifest.webmanifest', () => {
    writeValidArtifact(DEVELOP_BASE, validDevelopDeployment());
    rmSync(join(distDir, 'manifest.webmanifest'));

    expect(() => validateManagedArtifact({ distDir, channel: 'develop', ...REQUEST })).toThrow(
      'missing',
    );
  });

  it('rejects registerSW.js registering the wrong worker URL', () => {
    writeValidArtifact(DEVELOP_BASE, validDevelopDeployment());
    writeFileSync(
      join(distDir, 'registerSW.js'),
      `navigator.serviceWorker.register('/sw.js', { scope: '${DEVELOP_BASE}' })`,
    );

    expect(() => validateManagedArtifact({ distDir, channel: 'develop', ...REQUEST })).toThrow(
      'does not register the expected worker URL',
    );
  });

  it('rejects registerSW.js registering the wrong scope', () => {
    writeValidArtifact(DEVELOP_BASE, validDevelopDeployment());
    writeFileSync(
      join(distDir, 'registerSW.js'),
      `navigator.serviceWorker.register('${DEVELOP_BASE}sw.js', { scope: '/' })`,
    );

    expect(() => validateManagedArtifact({ distDir, channel: 'develop', ...REQUEST })).toThrow(
      'does not register the expected scope',
    );
  });

  it('rejects a missing registerSW.js', () => {
    writeValidArtifact(DEVELOP_BASE, validDevelopDeployment());
    rmSync(join(distDir, 'registerSW.js'));

    expect(() => validateManagedArtifact({ distDir, channel: 'develop', ...REQUEST })).toThrow(
      'missing',
    );
  });

  it('rejects a missing sw.js', () => {
    writeValidArtifact(DEVELOP_BASE, validDevelopDeployment());
    rmSync(join(distDir, 'sw.js'));

    expect(() => validateManagedArtifact({ distDir, channel: 'develop', ...REQUEST })).toThrow(
      'missing dist/sw.js',
    );
  });
});
