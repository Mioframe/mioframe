import { expect, test } from '@playwright/test';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { buildManagedStableArtifact } from './fixtures/controllerArtifactIdentityFixture.mjs';

// Proof that the managed controller worker artifact (dist/sw.js) never
// embeds application release identity: two otherwise equivalent managed
// production builds — differing only in VITE_BUILD_ID/VITE_BUILD_DATE, the
// application's own release identity inputs (see src/shared/config.ts's
// APP_BUILD_ID/APP_BUILD_DATE) — must produce byte-identical dist/sw.js. See
// src/sw.ts's own "must never identify itself as, or embed, a particular
// application release" invariant.

test('the managed controller worker artifact is byte-identical across builds with different application release identity', async () => {
  test.setTimeout(180_000);

  const distA = await buildManagedStableArtifact({
    viteBuildId: 'controller-artifact-identity-a',
    viteBuildDate: '2020-01-01T00:00:00.000Z',
  });
  const distB = await buildManagedStableArtifact({
    viteBuildId: 'controller-artifact-identity-b',
    viteBuildDate: '2030-06-15T12:00:00.000Z',
  });

  try {
    const swBytesA = readFileSync(join(distA, 'sw.js'));
    const swBytesB = readFileSync(join(distB, 'sw.js'));

    // A primary byte-equality assertion, not a check for known strings: any
    // future accidental reintroduction of application-release-specific bytes
    // — under any name — fails this, without needing to predict its shape.
    expect(swBytesA.equals(swBytesB)).toBe(true);
  } finally {
    rmSync(distA, { recursive: true, force: true });
    rmSync(distB, { recursive: true, force: true });
  }
});
