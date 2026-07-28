import { describe, expect, it } from 'vitest';
import {
  countSameChannelWindowClients,
  isSameChannelPath,
  isSameChannelWindowClient,
} from './cleanLaunch';

describe('isSameChannelPath (stable, base path "/")', () => {
  it('accepts an ordinary stable window', () => {
    expect(isSameChannelPath('https://mioframe.example/settings', '/')).toBe(true);
  });

  it('rejects a branch window', () => {
    expect(isSameChannelPath('https://mioframe.example/branch/develop/', '/')).toBe(false);
  });

  it('rejects a PR preview window', () => {
    expect(isSameChannelPath('https://mioframe.example/pr/42/', '/')).toBe(false);
  });
});

describe('isSameChannelPath (develop, base path "/branch/develop/")', () => {
  it('accepts a develop window', () => {
    expect(
      isSameChannelPath('https://mioframe.example/branch/develop/settings', '/branch/develop/'),
    ).toBe(true);
  });

  it('rejects a stable window', () => {
    expect(isSameChannelPath('https://mioframe.example/settings', '/branch/develop/')).toBe(false);
  });

  it('rejects a different branch window', () => {
    expect(isSameChannelPath('https://mioframe.example/branch/other/', '/branch/develop/')).toBe(
      false,
    );
  });
});

describe('countSameChannelWindowClients', () => {
  it('counts only same-channel windows, excluding branch/pr/foreign', () => {
    const urls = [
      'https://mioframe.example/',
      'https://mioframe.example/settings',
      'https://mioframe.example/branch/develop/',
      'https://mioframe.example/pr/1/',
    ];
    expect(countSameChannelWindowClients(urls, '/')).toBe(2);
  });

  it('returns 0 when no windows are live', () => {
    expect(countSameChannelWindowClients([], '/')).toBe(0);
  });
});

describe('isSameChannelWindowClient', () => {
  it('accepts a same-channel window client', () => {
    expect(
      isSameChannelWindowClient({ type: 'window', url: 'https://mioframe.example/settings' }, '/'),
    ).toBe(true);
  });

  it('rejects a foreign-channel window client', () => {
    expect(
      isSameChannelWindowClient(
        { type: 'window', url: 'https://mioframe.example/branch/develop/' },
        '/',
      ),
    ).toBe(false);
  });

  it('rejects a non-window client (worker or shared worker)', () => {
    expect(
      isSameChannelWindowClient({ type: 'worker', url: 'https://mioframe.example/' }, '/'),
    ).toBe(false);
  });

  it('rejects a ServiceWorker or MessagePort source (no "type" field)', () => {
    const { port1 } = new MessageChannel();
    expect(isSameChannelWindowClient(port1, '/')).toBe(false);
  });

  it('rejects a null source', () => {
    expect(isSameChannelWindowClient(null, '/')).toBe(false);
  });
});
