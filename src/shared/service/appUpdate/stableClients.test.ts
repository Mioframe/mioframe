import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createStableClientRegistry,
  isStableAppUrl,
  isStableAppWindowClient,
} from './stableClients';

const client = (url: string, type: ClientTypes = 'window') => ({ url, type, id: url });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('stable client filtering', () => {
  it('includes stable app windows and excludes branch, PR, updates, and non-window clients', () => {
    const origin = 'https://mioframe.example';
    expect(isStableAppWindowClient(client(`${origin}/settings`), origin)).toBe(true);
    expect(isStableAppWindowClient(client(`${origin}/branch/develop/`), origin)).toBe(false);
    expect(isStableAppWindowClient(client(`${origin}/pr/161/`), origin)).toBe(false);
    expect(isStableAppWindowClient(client(`${origin}/updates/latest.json`), origin)).toBe(false);
    expect(isStableAppWindowClient(client(`${origin}/storybook/`), origin)).toBe(false);
    expect(isStableAppWindowClient(client('https://other.example/'), origin)).toBe(false);
    expect(isStableAppWindowClient(client(`${origin}/`, 'worker'), origin)).toBe(false);
  });

  it('uses the same stable route classification for fetches', () => {
    const origin = 'https://mioframe.example';
    expect(isStableAppUrl(`${origin}/settings/app-updates`, origin)).toBe(true);
    expect(isStableAppUrl(`${origin}/assets/app.js`, origin)).toBe(true);
    expect(isStableAppUrl(`${origin}/storybook/`, origin)).toBe(false);
    expect(isStableAppUrl(`${origin}/updates/latest.json`, origin)).toBe(false);
  });
});

describe('stable client registry', () => {
  it('counts only windows that both registered and are still live', async () => {
    const origin = 'https://mioframe.example';
    let live = [client(`${origin}/a`), client(`${origin}/b`)];
    vi.stubGlobal('self', {
      location: { origin },
      clients: { matchAll: () => Promise.resolve(live) },
    });

    const registry = createStableClientRegistry();
    expect(await registry.getRegisteredStableWindowClients()).toEqual([]);

    registry.register(`${origin}/a`);
    expect((await registry.getRegisteredStableWindowClients()).map(({ id }) => id)).toEqual([
      `${origin}/a`,
    ]);

    registry.register(`${origin}/b`);
    expect(await registry.getRegisteredStableWindowClients()).toHaveLength(2);

    live = [client(`${origin}/b`)];
    expect((await registry.getRegisteredStableWindowClients()).map(({ id }) => id)).toEqual([
      `${origin}/b`,
    ]);
  });
});
