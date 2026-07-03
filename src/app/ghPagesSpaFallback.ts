export const GH_PAGES_SPA_FALLBACK_KEY = 'ghPagesSpaFallback';

const CHANNEL_SCOPED_BASE_RE = /^\/(?:branch\/[^/]+|pr\/\d+)\/$/;
const FOREIGN_CHANNEL_SEGMENT_RE = /^(?:branch|pr)$/;
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

  // When this deployment's own base is already a channel-scoped base (a
  // branch or PR preview), any deep path under it is fine — the browser's
  // service worker scope (and the base-prefix check above) already
  // guarantee a value stored for this base can only belong to this exact
  // channel.
  if (CHANNEL_SCOPED_BASE_RE.test(base)) {
    return `${url.pathname}${url.search}${url.hash}`;
  }

  // Otherwise (the stable base `/`), reject a stored path whose first
  // segment is a foreign channel root (`branch` or `pr`): the org-root
  // 404.html is shared by every channel, so a value captured for a branch
  // or PR preview must not be restored into the stable deployment.
  const firstSegment = url.pathname.slice(base.length).split('/', 1)[0] ?? '';
  if (FOREIGN_CHANNEL_SEGMENT_RE.test(firstSegment)) {
    return null;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Restores a GitHub Pages deep link captured by the root SPA fallback before
 * router creation for the current deployment base.
 * @param base - Current deployment base path, for example `/`,
 *   `/branch/develop/`, or `/pr/86/`.
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
