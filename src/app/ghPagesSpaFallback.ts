export const GH_PAGES_SPA_FALLBACK_KEY = 'ghPagesSpaFallback';

const GH_PAGES_PREVIEW_SEGMENT_RE = /^pr-\d+$/;
const GH_PAGES_DUMMY_ORIGIN = 'https://mioframe.invalid';

function getValidatedFallbackPath(value: string, base: string): string | null {
  if (!value.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(value, GH_PAGES_DUMMY_ORIGIN);
  } catch {
    return null;
  }

  if (url.origin !== GH_PAGES_DUMMY_ORIGIN || !url.pathname.startsWith(base)) {
    return null;
  }

  const previewBaseMatch = base.match(/^(.*\/)(pr-\d+)\/$/);
  if (previewBaseMatch) {
    return url.pathname.startsWith(base) ? `${url.pathname}${url.search}${url.hash}` : null;
  }

  const firstSegment = url.pathname.slice(base.length).split('/', 1)[0] ?? '';
  if (GH_PAGES_PREVIEW_SEGMENT_RE.test(firstSegment)) {
    return null;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Restores a GitHub Pages deep link captured by the root SPA fallback before
 * router creation for the current deployment base.
 * @param base - Current deployment base path, for example `/mioframe/` or
 *   `/mioframe/pr-86/`.
 * @returns The restored relative URL when applied, otherwise `null`.
 */
export function restoreGhPagesSpaFallbackPath(base: string): string | null {
  let storedValue: string | null = null;

  try {
    storedValue = window.sessionStorage.getItem(GH_PAGES_SPA_FALLBACK_KEY);
  } catch {
    return null;
  }

  if (!storedValue) {
    return null;
  }

  try {
    window.sessionStorage.removeItem(GH_PAGES_SPA_FALLBACK_KEY);
  } catch {
    // Best-effort cleanup only.
  }

  const restoredPath = getValidatedFallbackPath(storedValue, base);
  if (!restoredPath) {
    return null;
  }

  window.history.replaceState(null, '', restoredPath);
  return restoredPath;
}
