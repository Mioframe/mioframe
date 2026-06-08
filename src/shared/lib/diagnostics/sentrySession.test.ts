import { describe, expect, it } from 'vitest';
import { getOrCreateSentrySessionId, isSessionSentryUserId } from './sentrySession';

describe('isSessionSentryUserId', () => {
  it('accepts a valid session:<uuid> value', () => {
    expect(isSessionSentryUserId('session:a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true);
  });

  it('accepts the format produced by getOrCreateSentrySessionId', () => {
    const id = getOrCreateSentrySessionId();
    expect(isSessionSentryUserId(id)).toBe(true);
  });

  it('rejects the session: prefix without a UUID', () => {
    expect(isSessionSentryUserId('session:')).toBe(false);
    expect(isSessionSentryUserId('session:plain-text')).toBe(false);
    expect(isSessionSentryUserId('session:someidentifier')).toBe(false);
  });

  it('rejects a plain user ID', () => {
    expect(isSessionSentryUserId('user-1')).toBe(false);
    expect(isSessionSentryUserId('install-abc')).toBe(false);
  });

  it('rejects an email address', () => {
    expect(isSessionSentryUserId('user@example.com')).toBe(false);
  });

  it('rejects an account or installation ID', () => {
    expect(isSessionSentryUserId('account:abc123')).toBe(false);
    expect(isSessionSentryUserId('install:a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(false);
  });

  it('rejects a session: prefix with UUID-like but wrong casing or extra chars', () => {
    // uppercase UUID segments are not accepted
    expect(isSessionSentryUserId('session:A1B2C3D4-E5F6-7890-ABCD-EF1234567890')).toBe(false);
    // trailing content after uuid
    expect(isSessionSentryUserId('session:a1b2c3d4-e5f6-7890-abcd-ef1234567890-extra')).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isSessionSentryUserId(null)).toBe(false);
    expect(isSessionSentryUserId(undefined)).toBe(false);
    expect(isSessionSentryUserId(42)).toBe(false);
    expect(isSessionSentryUserId({})).toBe(false);
  });
});

describe('getOrCreateSentrySessionId', () => {
  it('returns a string matching session:<uuid> format', () => {
    const id = getOrCreateSentrySessionId();
    expect(id).toMatch(/^session:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('returns the same value on every call within a session', () => {
    const first = getOrCreateSentrySessionId();
    const second = getOrCreateSentrySessionId();
    expect(first).toBe(second);
  });
});
