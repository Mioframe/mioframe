import { describe, expect, it } from 'vitest';
import { detectBrowserPlatform, selectInstallGuideUrl } from './installGuideUrl';

const CHROME_ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const CHROME_DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const SAFARI_IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const FIREFOX_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0';
const CHROME_IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1';

describe('detectBrowserPlatform', () => {
  it('detects Chrome Android', () => {
    expect(detectBrowserPlatform(CHROME_ANDROID_UA)).toBe('chrome-android');
  });

  it('detects Chrome Desktop', () => {
    expect(detectBrowserPlatform(CHROME_DESKTOP_UA)).toBe('chrome-desktop');
  });

  it('detects Safari iOS', () => {
    expect(detectBrowserPlatform(SAFARI_IOS_UA)).toBe('safari-ios');
  });

  it('returns unknown for Firefox', () => {
    expect(detectBrowserPlatform(FIREFOX_UA)).toBe('unknown');
  });

  it('returns unknown for empty UA', () => {
    expect(detectBrowserPlatform('')).toBe('unknown');
  });

  it('does not classify Chrome for iOS as Safari iOS', () => {
    expect(detectBrowserPlatform(CHROME_IOS_UA)).toBe('unknown');
  });
});

describe('selectInstallGuideUrl', () => {
  it('returns Chrome Android help URL for chrome-android', () => {
    expect(selectInstallGuideUrl('chrome-android')).toContain('google.com/chrome');
    expect(selectInstallGuideUrl('chrome-android')).toContain('Android');
  });

  it('returns Chrome Desktop help URL for chrome-desktop', () => {
    expect(selectInstallGuideUrl('chrome-desktop')).toContain('google.com/chrome');
    expect(selectInstallGuideUrl('chrome-desktop')).toContain('Desktop');
  });

  it('returns Apple Support URL for safari-ios', () => {
    expect(selectInstallGuideUrl('safari-ios')).toContain('apple.com');
  });

  it('returns MDN fallback URL for unknown', () => {
    expect(selectInstallGuideUrl('unknown')).toContain('developer.mozilla.org');
  });
});
