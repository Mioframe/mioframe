import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

// TEMPORARY diagnostic only — not part of the permanent managed pinned
// application updates test suite. Determines which navigation facts each
// engine actually exposes to a service worker's `fetch` handler for five
// navigation kinds, so the architect can pick a clean-launch reload-detection
// design from observed facts rather than assumption. Does not touch
// src/sw.ts, any production code, or activation behavior. Deleted after the
// diagnostic finding is reported.

const DIAG_SW_SCRIPT = `
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(handleNavigate(event));
});
async function handleNavigate(event) {
  const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const facts = {
    clientId: event.clientId,
    resultingClientId: event.resultingClientId,
    replacesClientId: 'replacesClientId' in event ? event.replacesClientId : '<absent>',
    isReload: 'isReload' in event ? event.isReload : '<absent>',
    requestIsReloadNavigation:
      'isReloadNavigation' in event.request ? event.request.isReloadNavigation : '<absent>',
    requestCache: event.request.cache,
    matchAllClients: clientsList.map((c) => ({ id: c.id, url: c.url })),
  };
  const html =
    '<!doctype html><html><body>diag<script>window.__diagFacts = ' +
    JSON.stringify(facts) +
    ';</script></body></html>';
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
`;

const INDEX_HTML = `<!doctype html><html><body>
<script>
  navigator.serviceWorker.register('/diag-sw.js', { scope: '/' })
    .then(() => navigator.serviceWorker.ready)
    .then(() => { window.__swReady = true; });
</script>
</body></html>`;

function startDiagServer(): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      if (req.url === '/diag-sw.js') {
        res.writeHead(200, {
          'content-type': 'application/javascript; charset=utf-8',
          'service-worker-allowed': '/',
        });
        res.end(DIAG_SW_SCRIPT);
        return;
      }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(INDEX_HTML);
    });
    server.listen(0, '127.0.0.1', () => {
      const address = server.address() as AddressInfo;
      resolve({
        url: `http://127.0.0.1:${address.port}/`,
        close: () => new Promise<void>((res) => server.close(() => res())),
      });
    });
  });
}

async function readDiagFacts(page: Page): Promise<unknown> {
  return page.evaluate(() => (window as unknown as { __diagFacts?: unknown }).__diagFacts);
}

async function readNavigationType(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    return entries[0]?.type;
  });
}

test('reload navigation diagnostic matrix', async ({ browser }, testInfo) => {
  testInfo.setTimeout(120_000);
  const server = await startDiagServer();
  const results: Record<string, { facts: unknown; navType: unknown }> = {};

  try {
    const context = await browser.newContext({ baseURL: server.url });

    // Bootstrap: register the SW via a throwaway page, then close it, so
    // "fresh" below opens as the only window against an already active
    // worker — matching the real app's own architecture (no clients.claim()
    // reliance for the very first page).
    const bootstrapPage = await context.newPage();
    await bootstrapPage.goto(server.url);
    await bootstrapPage.waitForFunction(
      () => (window as unknown as { __swReady?: boolean }).__swReady === true,
    );
    await bootstrapPage.close();

    // 1. Fresh navigation, no existing window.
    const page = await context.newPage();
    await page.goto(server.url);
    results.fresh = { facts: await readDiagFacts(page), navType: await readNavigationType(page) };

    // 2. page.reload() (Playwright API), still the only window.
    await page.reload();
    results.pageReload = {
      facts: await readDiagFacts(page),
      navType: await readNavigationType(page),
    };

    // 3. location.reload() (in-page call), still the only window.
    await page.evaluate(() => {
      location.reload();
    });
    await page.waitForLoadState('load');
    results.locationReload = {
      facts: await readDiagFacts(page),
      navType: await readNavigationType(page),
    };

    // 4. Same-tab non-reload navigation, still the only window.
    await page.goto(`${server.url}?nav=1`);
    results.sameTabNavigation = {
      facts: await readDiagFacts(page),
      navType: await readNavigationType(page),
    };

    // 5. Second window opened while the first remains live.
    const secondPage = await context.newPage();
    await secondPage.goto(server.url);
    results.secondWindow = {
      facts: await readDiagFacts(secondPage),
      navType: await readNavigationType(secondPage),
    };

    await secondPage.close();
    await page.close();
    await context.close();
  } finally {
    await server.close();
  }

  writeFileSync(
    `reload-diagnostic-${testInfo.project.name}.json`,
    JSON.stringify(results, null, 2),
  );
  expect(results.fresh).toBeTruthy();
});
