import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type BrowserContext } from '@playwright/test';
import { getBaseURL } from '../helpers';

/**
 * Create a fresh temporary user-data directory for a persistent browser profile.
 * @returns Absolute path to the new, empty profile directory.
 */
export const createPersistentProfile = (): string =>
  mkdtempSync(join(tmpdir(), 'mioframe-release-profile-'));

/**
 * Launch a real, separate Chromium browser process against a persistent user-data directory.
 *
 * Unlike the shared `context`/`page` fixtures (one browser process reused for a whole test file),
 * this starts its own process every call. Calling this again against the same `userDataDir` after
 * a prior context's `close()` reproduces an actual browser-process cold restart with the same
 * on-disk profile (IndexedDB, Cache Storage, service worker registration) — closing one page and
 * opening another in an already-running context is not equivalent.
 * @param userDataDir - Persistent profile directory from {@link createPersistentProfile}.
 * @returns The new browser context; its `close()` also terminates this browser process.
 */
export const launchPersistentBrowser = (userDataDir: string): Promise<BrowserContext> =>
  chromium.launchPersistentContext(userDataDir, { baseURL: getBaseURL() });

/**
 * Delete a persistent profile directory created by {@link createPersistentProfile}.
 * @param userDataDir - Profile directory to remove.
 */
export const removePersistentProfile = (userDataDir: string): void => {
  rmSync(userDataDir, { recursive: true, force: true });
};
