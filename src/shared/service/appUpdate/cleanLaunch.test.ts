import { describe, expect, it } from 'vitest';
import {
  countSameChannelWindowClients,
  isSameChannelPath,
  isSameChannelWindowClient,
} from './cleanLaunch';

const ORIGIN = 'https://mioframe.example';

describe('isSameChannelPath (stable, base path "/")', () => {
  it('accepts an ordinary stable window', () => {
    expect(isSameChannelPath('https://mioframe.example/settings', '/', ORIGIN)).toBe(true);
  });

  it('rejects a branch window', () => {
    expect(isSameChannelPath('https://mioframe.example/branch/develop/', '/', ORIGIN)).toBe(false);
  });

  it('rejects a PR preview window', () => {
    expect(isSameChannelPath('https://mioframe.example/pr/42/', '/', ORIGIN)).toBe(false);
  });

  it('rejects a cross-origin URL whose pathname would otherwise match', () => {
    expect(isSameChannelPath('https://evil.example/settings', '/', ORIGIN)).toBe(false);
  });
});

describe('isSameChannelPath (develop, base path "/branch/develop/")', () => {
  it('accepts a develop window', () => {
    expect(
      isSameChannelPath(
        'https://mioframe.example/branch/develop/settings',
        '/branch/develop/',
        ORIGIN,
      ),
    ).toBe(true);
  });

  it('rejects a stable window', () => {
    expect(isSameChannelPath('https://mioframe.example/settings', '/branch/develop/', ORIGIN)).toBe(
      false,
    );
  });

  it('rejects a different branch window', () => {
    expect(
      isSameChannelPath('https://mioframe.example/branch/other/', '/branch/develop/', ORIGIN),
    ).toBe(false);
  });

  it('rejects a cross-origin URL whose pathname would otherwise match', () => {
    expect(
      isSameChannelPath('https://evil.example/branch/develop/settings', '/branch/develop/', ORIGIN),
    ).toBe(false);
  });
});

describe('countSameChannelWindowClients', () => {
  it('counts only same-channel windows, excluding branch/pr/foreign', () => {
    const clients = [
      { id: 'a', url: 'https://mioframe.example/' },
      { id: 'b', url: 'https://mioframe.example/settings' },
      { id: 'c', url: 'https://mioframe.example/branch/develop/' },
      { id: 'd', url: 'https://mioframe.example/pr/1/' },
      { id: 'e', url: 'https://evil.example/' },
    ];
    expect(countSameChannelWindowClients(clients, new Set(), '/', ORIGIN)).toBe(2);
  });

  it('returns 0 when no windows are live', () => {
    expect(countSameChannelWindowClients([], new Set(), '/', ORIGIN)).toBe(0);
  });

  it('counts an uncontrolled same-channel window exactly like a controlled one', () => {
    // The function itself has no notion of "controlled": that distinction
    // only matters to the caller's `clients.matchAll({ includeUncontrolled:
    // true })` query. A fresh registration's still-uncontrolled first page
    // must count here exactly like any other live same-channel window.
    const uncontrolledFirstPage = { id: 'uncontrolled-a', url: 'https://mioframe.example/' };
    expect(countSameChannelWindowClients([uncontrolledFirstPage], new Set(), '/', ORIGIN)).toBe(1);
  });

  it('excludes the current navigation client ids, by identity', () => {
    const clients = [
      { id: 'replaced', url: 'https://mioframe.example/' },
      { id: 'other', url: 'https://mioframe.example/settings' },
    ];
    expect(countSameChannelWindowClients(clients, new Set(['replaced']), '/', ORIGIN)).toBe(1);
  });

  it('still counts another window with the exact same URL as the current navigation', () => {
    const clients = [
      { id: 'this-navigation', url: 'https://mioframe.example/' },
      { id: 'another-window', url: 'https://mioframe.example/' },
    ];
    expect(countSameChannelWindowClients(clients, new Set(['this-navigation']), '/', ORIGIN)).toBe(
      1,
    );
  });
});

describe('isSameChannelWindowClient', () => {
  it('accepts a same-channel window client', () => {
    expect(
      isSameChannelWindowClient(
        { type: 'window', url: 'https://mioframe.example/settings' },
        '/',
        ORIGIN,
      ),
    ).toBe(true);
  });

  it('rejects a foreign-channel window client', () => {
    expect(
      isSameChannelWindowClient(
        { type: 'window', url: 'https://mioframe.example/branch/develop/' },
        '/',
        ORIGIN,
      ),
    ).toBe(false);
  });

  it('rejects a cross-origin window client', () => {
    expect(
      isSameChannelWindowClient({ type: 'window', url: 'https://evil.example/' }, '/', ORIGIN),
    ).toBe(false);
  });

  it('rejects a non-window client (worker or shared worker)', () => {
    expect(
      isSameChannelWindowClient({ type: 'worker', url: 'https://mioframe.example/' }, '/', ORIGIN),
    ).toBe(false);
  });

  it('rejects a ServiceWorker or MessagePort source (no "type" field)', () => {
    const { port1 } = new MessageChannel();
    expect(isSameChannelWindowClient(port1, '/', ORIGIN)).toBe(false);
  });

  it('rejects a null source', () => {
    expect(isSameChannelWindowClient(null, '/', ORIGIN)).toBe(false);
  });
});
