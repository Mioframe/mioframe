import { describe, expect, it } from 'vitest';
import { isStableAppUrl, isStableAppWindowClient } from './stableClients';

const client = (url: string, type: ClientTypes = 'window') => ({ url, type });

describe('stable client filtering', () => {
  it('includes stable app windows and excludes branch, PR, foreign-origin, and non-window clients', () => {
    const origin = 'https://mioframe.example';
    expect(isStableAppWindowClient(client(`${origin}/settings`), origin)).toBe(true);
    expect(isStableAppWindowClient(client(`${origin}/branch/develop/`), origin)).toBe(false);
    expect(isStableAppWindowClient(client(`${origin}/pr/161/`), origin)).toBe(false);
    expect(isStableAppWindowClient(client(`${origin}/external/tool/`), origin)).toBe(false);
    expect(isStableAppWindowClient(client('https://other.example/'), origin)).toBe(false);
    expect(isStableAppWindowClient(client(`${origin}/`, 'worker'), origin)).toBe(false);
  });

  it('uses the same stable route classification for fetches', () => {
    const origin = 'https://mioframe.example';
    expect(isStableAppUrl(`${origin}/settings/app-updates`, origin)).toBe(true);
    expect(isStableAppUrl(`${origin}/assets/app.js`, origin)).toBe(true);
    expect(isStableAppUrl(`${origin}/external/tool/`, origin)).toBe(false);
    expect(isStableAppUrl(`${origin}/updates/latest.json`, origin)).toBe(false);
  });
});
