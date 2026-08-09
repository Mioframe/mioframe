import type { PluginOption } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import type { VitePWAOptions } from 'vite-plugin-pwa';
import {
  buildChannelCacheNamespace,
  buildForeignChannelDenylistPattern,
  isForeignChannelPath,
  type ReleaseChannel,
} from '../../src/shared/service/appUpdate/channelContract';

type WorkboxOptions = VitePWAOptions['workbox'];

type GetPwaPluginsParams = {
  base: string;
  isPreview: boolean;
  mode: string;
  disablePwa?: boolean;
  channel?: ReleaseChannel;
  channelId?: string;
};

const daysToSeconds = (days: number) => 24 * 60 * 60 * days;

/**
 * Builds a Workbox `urlPattern` function that matches `url.pathname` against
 * `pattern`, additionally excluding foreign-channel paths when `channel` is
 * `stable` (see {@link isForeignChannelPath}).
 * @param pattern - RegExp tested against `url.pathname`.
 * @param base - The Vite `base` URL for this build.
 * @param channel - Release channel this service worker is built for.
 * @returns A Workbox `urlPattern` function.
 */
export function buildSameOriginMatcher(
  pattern: RegExp,
  base: string,
  channel: ReleaseChannel,
): (context: { url: URL }) => boolean {
  if (channel !== 'stable') {
    return ({ url }: { url: URL }) => pattern.test(url.pathname);
  }
  return ({ url }: { url: URL }) =>
    pattern.test(url.pathname) && !isForeignChannelPath(url.pathname, base);
}

/**
 * Build the manifest `name`/`short_name` identity for a release channel, so
 * an installed branch PWA is visually distinguishable from stable.
 * @param channel - Release channel.
 * @param channelId - Channel identifier (e.g. `develop`, a branch slug).
 * @returns `{ name, short_name }` for the Web App Manifest.
 */
function buildManifestIdentity(channel: ReleaseChannel, channelId?: string) {
  if (channel === 'branch' && channelId) {
    const label = channelId === 'develop' ? 'Develop' : channelId;
    return { name: `Mioframe ${label}`, short_name: `Mioframe ${label}` };
  }
  return { name: 'Mioframe', short_name: 'Mioframe' };
}

/**
 * Build the `workbox` (`generateSW`) options for a release channel's
 * {@link VitePWA} plugin.
 *
 * Sets Workbox's `cacheId` to the same per-channel prefix as the explicit
 * `runtimeCaching` cache names ({@link buildChannelCacheNamespace}). Workbox
 * prepends `cacheId` to any cache name it derives itself — notably its
 * default-named precache cache (normally `workbox-precache-v2-<scope>`,
 * becoming `<cacheId>-precache-v2-<scope>`) — by calling
 * `workbox-core`'s `setCacheNameDetails({ prefix: cacheId })` in the
 * generated service worker. Cache names passed explicitly via `cacheName`
 * above are used as-is and are unaffected by `cacheId`. Without this, a
 * branch's precache cache would keep the shared `workbox-` prefix and a
 * branch tombstone's cache cleanup (`branch-<slug>-*`, see
 * `scripts/pages/lib/tombstoneContent.mjs`) would never remove it.
 * @param params - The Vite `base` URL, release channel, and (for the
 * `branch` channel) channel identifier this service worker is built for.
 * @returns The `workbox` field for {@link VitePWA}'s options.
 */
export function buildWorkboxOptions({
  base,
  channel,
  channelId,
}: {
  base: string;
  channel: ReleaseChannel;
  channelId?: string | undefined;
}): WorkboxOptions {
  const cacheNamespace = buildChannelCacheNamespace(channel, channelId);
  const cacheName = (name: string) => `${cacheNamespace}-${name}`;
  const matcher = (pattern: RegExp) => buildSameOriginMatcher(pattern, base, channel);

  return {
    cacheId: cacheNamespace,
    ...(channel === 'stable'
      ? { navigateFallbackDenylist: [buildForeignChannelDenylistPattern(base)] }
      : {}),
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: cacheName('google-fonts'),
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: daysToSeconds(365),
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: matcher(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i),
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: cacheName('static-font-assets'),
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: daysToSeconds(30),
          },
        },
      },
      {
        urlPattern: matcher(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i),
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: cacheName('static-image-assets'),
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: daysToSeconds(14),
          },
        },
      },
      {
        urlPattern: matcher(/\.(?:json|xml|csv)$/i),
        handler: 'NetworkFirst',
        options: {
          cacheName: cacheName('static-data-assets'),
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: daysToSeconds(7),
          },
        },
      },
      {
        urlPattern: matcher(/\/api\/.*$/i),
        handler: 'NetworkFirst',
        method: 'GET',
        options: {
          cacheName: cacheName('apis'),
          expiration: {
            maxEntries: 16,
            maxAgeSeconds: daysToSeconds(1),
          },
          networkTimeoutSeconds: 10,
        },
      },
      {
        urlPattern:
          channel === 'stable'
            ? ({ url }: { url: URL }) => !isForeignChannelPath(url.pathname, base)
            : () => true,
        handler: 'NetworkFirst',
        options: {
          cacheName: cacheName('others'),
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: daysToSeconds(1),
          },
          networkTimeoutSeconds: 10,
        },
      },
    ],
    maximumFileSizeToCacheInBytes: 10e6,
  };
}

/**
 * Returns `true` for the two channels the managed pinned-update controller
 * worker supports: stable, and the `develop` branch channel. Every other
 * branch and PR previews keep the ordinary generated (`generateSW`) worker
 * (or no worker at all for PR previews), per the managed pinned application
 * updates feature's scope decision.
 * @param channel - Release channel.
 * @param channelId - Channel identifier; only meaningful for the `branch` channel.
 * @returns Whether this build should use the managed controller worker.
 */
export function isManagedChannel(channel: ReleaseChannel, channelId?: string): boolean {
  // `channel` is only ever 'stable' or 'branch', so once it isn't 'stable'
  // it is necessarily 'branch' — checking channelId alone is sufficient.
  return channel === 'stable' || channelId === 'develop';
}

/**
 * Resolves this build's managed application-update channel, the value
 * embedded into the `__MANAGED_APP_UPDATE_CHANNEL__` build-time define
 * (see `vite.config.ts` and `src/shared/config.ts`).
 *
 * Reuses exactly the same gating decisions as {@link getPwaPlugins} — PWA
 * enablement ({@link GetPwaPluginsParams.disablePwa}, `mode`, `isPreview`)
 * and {@link isManagedChannel} — so channel classification is never
 * duplicated between the two. `undefined` for an ordinary branch, a PR
 * preview (always passes `disablePwa: true`), a disabled-PWA build, or a
 * development/Storybook build (never calls this at all; see
 * `vite.config.ts`).
 * @param params - The same build parameters passed to {@link getPwaPlugins} (minus `base`, which this decision does not need).
 * @returns `'stable'` or `'develop'` only for an enabled managed-channel build; `undefined` otherwise.
 */
export function resolveManagedAppUpdateChannel({
  mode,
  isPreview,
  disablePwa,
  channel = 'stable',
  channelId,
}: Omit<GetPwaPluginsParams, 'base'>): 'stable' | 'develop' | undefined {
  if (disablePwa || (mode !== 'production' && !isPreview)) return undefined;
  if (!isManagedChannel(channel, channelId)) return undefined;
  return channel === 'stable' ? 'stable' : 'develop';
}

/**
 * Returns the Vite PWA plugin array for the given build parameters.
 *
 * Returns an empty array when PWA is disabled or the mode is not production
 * and not a preview build (PR previews always pass `disablePwa: true`). In
 * all other cases returns a single configured {@link VitePWA} plugin scoped
 * and namespaced to the given release channel:
 * - `scope`/`start_url`/`id` are pinned to `base`, so the manifest never
 *   drifts from the deployment it was built for;
 * - stable and the `develop` branch channel ({@link isManagedChannel}) use
 *   the custom `injectManifest` controller worker (`src/sw.ts`, see the
 *   managed pinned application updates feature) with no precache manifest
 *   of its own — it must never embed this build's application release
 *   identity or asset list;
 * - every other channel keeps the generated (`generateSW`) worker, with
 *   cache names — including Workbox's own precache — namespaced per channel
 *   ({@link buildWorkboxOptions}) so different branches never share Cache
 *   Storage entries;
 * - the stable channel additionally denies `/branch/*` and `/pr/*` from its
 *   navigation fallback and runtime caching, since its scope (`/`) is the
 *   only one wide enough to otherwise intercept them.
 * @param params - Build parameters controlling whether and how PWA is enabled.
 * @returns A `PluginOption[]` — either `[VitePWA(...)]` or `[]`.
 */
export const getPwaPlugins = ({
  base,
  isPreview,
  mode,
  disablePwa,
  channel = 'stable',
  channelId,
}: GetPwaPluginsParams): PluginOption[] => {
  if (disablePwa || (mode !== 'production' && !isPreview)) {
    return [];
  }

  const manifest = {
    ...buildManifestIdentity(channel, channelId),
    scope: base,
    start_url: base,
    id: base,
    theme_color: 'rgb(33, 31, 38)',
    background_color: 'rgb(33, 31, 38)',
  };
  const pwaAssets = { config: true, overrideManifestIcons: true };

  if (isManagedChannel(channel, channelId)) {
    return [
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.js',
        // The controller worker has no precache manifest of its own (it
        // must never embed this build's application release identity or
        // asset list), so there is no `self.__WB_MANIFEST` injection point
        // to find. An empty string is a falsy `injectionPoint`, which is
        // exactly what vite-plugin-pwa itself checks to skip the injection
        // step entirely (see its `injectManifestChunk`); this is preferred
        // over the documented `injectionPoint: undefined` FAQ workaround
        // since it satisfies the declared `injectionPoint?: string` type
        // without a type assertion.
        //
        // `rollupFormat: 'iife'` is required, not cosmetic: the plugin's
        // production registration script always calls
        // `navigator.serviceWorker.register(url, { scope })` with no
        // `type: 'module'`, so the compiled worker is always executed as a
        // classic script regardless of build format. The default `'es'`
        // format only "worked" here because this worker's static import
        // graph happens to bundle into a chunk with no literal `import`/
        // `export` syntax; it would break the moment that stopped being
        // true, and it also forces vite-plugin-pwa to rename the output to
        // `.mjs`. IIFE format matches what is actually registered and keeps
        // the plain `sw.js` filename — the same filename every previously
        // installed legacy `generateSW` worker is already registered
        // against, which is required for that legacy worker's native
        // update check to ever discover this worker at all (see the
        // managed pinned application updates feature, "Worker migration").
        injectManifest: { injectionPoint: '', rollupFormat: 'iife' },
        manifest,
        pwaAssets,
      }),
    ];
  }

  return [
    VitePWA({
      manifest,
      workbox: buildWorkboxOptions({ base, channel, channelId }),
      pwaAssets,
    }),
  ];
};
