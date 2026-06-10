/** Identifier for the browser platform used for install guide selection. */
export type BrowserPlatform = 'chrome-android' | 'chrome-desktop' | 'safari-ios' | 'unknown';

/**
 * Detects the current browser platform from a user-agent string.
 * Pure function — pass `navigator.userAgent` at the call site.
 * @param userAgent - The user-agent string to inspect.
 * @returns The detected browser platform identifier.
 */
export const detectBrowserPlatform = (userAgent: string): BrowserPlatform => {
  const isSafariIos =
    /iPhone|iPad|iPod/.test(userAgent) &&
    /WebKit/.test(userAgent) &&
    !/CriOS|FxiOS/.test(userAgent);
  if (isSafariIos) return 'safari-ios';

  const isChrome = /Chrome\//.test(userAgent) && !/Chromium\/|Edg\/|OPR\//.test(userAgent);
  if (!isChrome) return 'unknown';

  return /Android/.test(userAgent) ? 'chrome-android' : 'chrome-desktop';
};

const GUIDE_URLS: Record<BrowserPlatform, string> = {
  'safari-ios':
    'https://support.apple.com/guide/iphone/bookmark-favorite-webpages-iph42ab2f3a7/ios',
  'chrome-android': 'https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid',
  'chrome-desktop': 'https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DDesktop',
  unknown: 'https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing',
};

/**
 * Returns the external install guide URL for the given browser platform.
 * The selection is capability-based — no product-level platform special-casing.
 * @param platform - The browser platform to select a guide URL for.
 * @returns The external URL for the install guide.
 */
export const selectInstallGuideUrl = (platform: BrowserPlatform): string => GUIDE_URLS[platform];
